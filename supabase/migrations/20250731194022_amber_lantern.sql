/*
  # Funções para avanço de etapas em massa

  1. Funções
    - `advance_leads_to_next_stage()` - Avança leads para próxima etapa
    - `get_leads_ready_for_advancement()` - Busca leads prontos para avanço
    - `update_lead_stage()` - Atualiza etapa individual

  2. Lógica
    - Exclui leads em etapas que exigem pagamento (5=alfândega, 6+=entrega)
    - Avança apenas leads em etapas automáticas
    - Registra histórico de mudanças
*/

-- Função para obter leads prontos para avanço (excluindo etapas de pagamento)
CREATE OR REPLACE FUNCTION get_leads_ready_for_advancement()
RETURNS TABLE (
  id uuid,
  nome_completo text,
  cpf text,
  etapa_atual integer,
  status_pagamento text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_completo,
    l.cpf,
    l.etapa_atual,
    l.status_pagamento,
    l.created_at
  FROM leads l
  WHERE 
    -- Excluir etapas que exigem pagamento
    l.etapa_atual NOT IN (5, 6, 7, 8, 9, 10) -- 5=alfândega, 6+=tentativas de entrega
    AND l.status_pagamento != 'cancelado'
    AND l.etapa_atual < 11 -- Não avançar além da última etapa automática
  ORDER BY l.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Função para avançar um lead para próxima etapa
CREATE OR REPLACE FUNCTION advance_lead_stage(lead_id uuid)
RETURNS TABLE (
  success boolean,
  old_stage integer,
  new_stage integer,
  message text
) AS $$
DECLARE
  current_stage integer;
  next_stage integer;
  lead_cpf text;
BEGIN
  -- Buscar etapa atual
  SELECT etapa_atual, cpf INTO current_stage, lead_cpf
  FROM leads 
  WHERE id = lead_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 'Lead não encontrado';
    RETURN;
  END IF;
  
  -- Verificar se pode avançar
  IF current_stage IN (5, 6, 7, 8, 9, 10) THEN
    RETURN QUERY SELECT false, current_stage, current_stage, 'Lead em etapa que exige pagamento';
    RETURN;
  END IF;
  
  IF current_stage >= 11 THEN
    RETURN QUERY SELECT false, current_stage, current_stage, 'Lead já na etapa final';
    RETURN;
  END IF;
  
  -- Calcular próxima etapa
  next_stage := current_stage + 1;
  
  -- Atualizar lead
  UPDATE leads 
  SET 
    etapa_atual = next_stage,
    updated_at = now()
  WHERE id = lead_id;
  
  -- Log da operação
  INSERT INTO lead_stage_history (lead_id, lead_cpf, old_stage, new_stage, changed_by, changed_at)
  VALUES (lead_id, lead_cpf, current_stage, next_stage, 'system_auto', now());
  
  RETURN QUERY SELECT true, current_stage, next_stage, 'Etapa avançada com sucesso';
END;
$$ LANGUAGE plpgsql;

-- Função para avanço em massa
CREATE OR REPLACE FUNCTION advance_all_eligible_leads()
RETURNS TABLE (
  total_processed integer,
  total_advanced integer,
  total_skipped integer,
  details jsonb
) AS $$
DECLARE
  lead_record RECORD;
  processed_count integer := 0;
  advanced_count integer := 0;
  skipped_count integer := 0;
  result_details jsonb := '[]'::jsonb;
  advancement_result RECORD;
BEGIN
  -- Processar cada lead elegível
  FOR lead_record IN 
    SELECT * FROM get_leads_ready_for_advancement()
  LOOP
    processed_count := processed_count + 1;
    
    -- Tentar avançar o lead
    SELECT * INTO advancement_result 
    FROM advance_lead_stage(lead_record.id);
    
    IF advancement_result.success THEN
      advanced_count := advanced_count + 1;
      
      -- Adicionar aos detalhes
      result_details := result_details || jsonb_build_object(
        'id', lead_record.id,
        'nome', lead_record.nome_completo,
        'cpf', lead_record.cpf,
        'old_stage', advancement_result.old_stage,
        'new_stage', advancement_result.new_stage,
        'status', 'advanced'
      );
    ELSE
      skipped_count := skipped_count + 1;
      
      -- Adicionar aos detalhes
      result_details := result_details || jsonb_build_object(
        'id', lead_record.id,
        'nome', lead_record.nome_completo,
        'cpf', lead_record.cpf,
        'stage', lead_record.etapa_atual,
        'reason', advancement_result.message,
        'status', 'skipped'
      );
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT 
    processed_count,
    advanced_count, 
    skipped_count,
    result_details;
END;
$$ LANGUAGE plpgsql;

-- Tabela para histórico de mudanças de etapa
CREATE TABLE IF NOT EXISTS lead_stage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  lead_cpf text NOT NULL,
  old_stage integer NOT NULL,
  new_stage integer NOT NULL,
  changed_by text NOT NULL, -- 'system_auto', 'admin_manual', 'payment_webhook'
  changed_at timestamptz DEFAULT now(),
  notes text
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_lead_id ON lead_stage_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_cpf ON lead_stage_history(lead_cpf);
CREATE INDEX IF NOT EXISTS idx_lead_stage_history_changed_at ON lead_stage_history(changed_at);

-- RLS para histórico
ALTER TABLE lead_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas as operações no histórico"
  ON lead_stage_history
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Função para obter estatísticas de etapas
CREATE OR REPLACE FUNCTION get_stage_statistics()
RETURNS TABLE (
  etapa integer,
  total_leads bigint,
  can_advance boolean,
  stage_name text
) AS $$
BEGIN
  RETURN QUERY
  WITH stage_names AS (
    SELECT 1 as stage_num, 'Pedido criado' as name, true as can_advance
    UNION ALL SELECT 2, 'Preparando envio', true
    UNION ALL SELECT 3, 'Enviado da China', true  
    UNION ALL SELECT 4, 'Centro de triagem', true
    UNION ALL SELECT 5, 'Alfândega (PAGAMENTO)', false
    UNION ALL SELECT 6, '1ª Tentativa entrega (PAGAMENTO)', false
    UNION ALL SELECT 7, '2ª Tentativa entrega (PAGAMENTO)', false
    UNION ALL SELECT 8, '3ª Tentativa entrega (PAGAMENTO)', false
    UNION ALL SELECT 9, 'Loop infinito (PAGAMENTO)', false
    UNION ALL SELECT 10, 'Processando entrega', true
    UNION ALL SELECT 11, 'Entregue', false
  )
  SELECT 
    sn.stage_num,
    COALESCE(COUNT(l.id), 0) as total_leads,
    sn.can_advance,
    sn.name
  FROM stage_names sn
  LEFT JOIN leads l ON l.etapa_atual = sn.stage_num
  GROUP BY sn.stage_num, sn.can_advance, sn.name
  ORDER BY sn.stage_num;
END;
$$ LANGUAGE plpgsql;