# 📋 SISTEMA DE IMPORTAÇÃO EM MASSA - COMPONENTES REUTILIZÁVEIS

## 🎯 VISÃO GERAL
Este documento contém todos os componentes necessários para implementar um sistema completo de importação em massa com pré-visualização em projetos Bolt.

## 📁 ARQUIVOS PRINCIPAIS

### 1. **src/pages/admin-panel.jsx** (CORE DO SISTEMA)
- Contém toda a lógica de importação em massa
- Parse inteligente de dados da planilha
- Pré-visualização com validação
- Integração com banco de dados

### 2. **painelk7.html** (INTERFACE ADMINISTRATIVA)
- Interface completa do painel administrativo
- Formulários de importação
- Tabelas de visualização
- Modais e controles

### 3. **src/services/database.js** (PERSISTÊNCIA)
- Serviço de banco de dados (localStorage/Supabase)
- CRUD operations para leads
- Validações de duplicatas

### 4. **src/utils/cpf-validator.js** (VALIDAÇÕES)
- Validação e formatação de CPF
- Máscaras de entrada
- Verificação de dígitos

## 🔧 FUNÇÕES PRINCIPAIS REUTILIZÁVEIS

### **parseRawBulkData(rawData)** - CORE DA IMPORTAÇÃO
```javascript
// Localização: src/pages/admin-panel.jsx (linha ~200)
// Função que faz o parse inteligente dos dados colados
// Detecta separadores automaticamente (TAB → espaços múltiplos → espaço simples)
// Valida campos obrigatórios
// Remove duplicatas
// Retorna dados estruturados para importação
```

### **displayBulkPreview(parsedData)** - PRÉ-VISUALIZAÇÃO
```javascript
// Localização: src/pages/admin-panel.jsx (linha ~400)
// Gera tabela HTML responsiva com dados parseados
// Mostra erros e duplicatas
// Permite confirmação antes da importação
```

### **confirmBulkImport()** - IMPORTAÇÃO FINAL
```javascript
// Localização: src/pages/admin-panel.jsx (linha ~600)
// Salva dados no banco (localStorage/Supabase)
// Mostra progresso em tempo real
// Gera relatório de resultados
```

## 📊 ESTRUTURA DE DADOS ESPERADA

### **Formato da Planilha (14 colunas):**
```
Nome	Email	Telefone	CPF	Produto	Valor	Endereço	Número	Complemento	Bairro	CEP	Cidade	Estado	País
```

### **Objeto Lead Gerado:**
```javascript
{
  nome_completo: string,
  email: string,
  telefone: string,
  cpf: string (11 dígitos),
  produto: string,
  valor_total: number,
  endereco: string (completo),
  meio_pagamento: 'PIX',
  origem: 'direto',
  etapa_atual: 1,
  status_pagamento: 'pendente',
  order_bumps: [],
  produtos: [{ nome, preco }],
  id: string (gerado),
  created_at: ISO string,
  updated_at: ISO string
}
```

## 🎨 ESTILOS CSS NECESSÁRIOS

### **Estilos para Importação em Massa:**
```css
.bulk-textarea {
  min-height: 200px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.4;
  resize: vertical;
}

.bulk-import-instructions {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #345C7A;
}

.control-button {
  background: #345C7A;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}
```

## 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS

### **Estrutura da Tabela (Supabase):**
```sql
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  cpf text UNIQUE NOT NULL,
  email text,
  telefone text,
  endereco text,
  produtos jsonb DEFAULT '[]'::jsonb,
  valor_total decimal(10,2),
  meio_pagamento text,
  data_compra timestamptz DEFAULT now(),
  origem text DEFAULT 'direto',
  etapa_atual integer DEFAULT 1,
  status_pagamento text DEFAULT 'pendente',
  order_bumps jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### **Para localStorage (alternativa):**
```javascript
// Array de objetos no localStorage com chave 'leads'
localStorage.setItem('leads', JSON.stringify(leadsArray));
```

## 🚀 IMPLEMENTAÇÃO EM NOVO PROJETO

### **Passo 1: Copiar Arquivos Base**
1. `src/pages/admin-panel.jsx` (completo)
2. `src/services/database.js` (completo)
3. `src/utils/cpf-validator.js` (completo)
4. `painelk7.html` (interface)

### **Passo 2: Configurar HTML**
```html
<!-- Textarea para colagem -->
<textarea id="bulkDataTextarea" class="bulk-textarea" 
          placeholder="Cole os dados da planilha aqui..."></textarea>

<!-- Botões de controle -->
<button id="previewBulkDataButton">Análise Inteligente</button>
<button id="confirmBulkImportButton">Confirmar Importação</button>

<!-- Containers para resultados -->
<div id="bulkPreviewSection"></div>
<div id="bulkResultsSection"></div>
```

### **Passo 3: Inicializar JavaScript**
```javascript
// No final do HTML
<script type="module">
  import { AdminPanel } from './src/pages/admin-panel.jsx';
  
  document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
  });
</script>
```

### **Passo 4: Configurar Banco**
- **Supabase**: Executar migration SQL
- **localStorage**: Automático (sem configuração)

## 🔄 INTEGRAÇÃO COM RASTREAMENTO

### **Busca por CPF:**
```javascript
// src/components/tracking-system.js
async getLeadFromDatabase(cpf) {
  const result = await this.dbService.getLeadByCPF(cpf);
  if (result.success && result.data) {
    return result.data; // Lead encontrado
  }
  return null; // CPF não encontrado
}
```

### **Exibição de Dados:**
```javascript
// Usar dados do lead para preencher interface
this.updateElement('customerName', lead.nome_completo);
this.updateElement('customerCPF', CPFValidator.formatCPF(lead.cpf));
this.updateElement('customerProduct', lead.produto);
```

## 📱 FUNCIONALIDADES INCLUÍDAS

✅ **Parse inteligente** de dados da planilha
✅ **Detecção automática** de separadores
✅ **Validação** de campos obrigatórios
✅ **Remoção** de duplicatas
✅ **Pré-visualização** em tabela responsiva
✅ **Importação** com barra de progresso
✅ **Relatório** de resultados
✅ **Integração** com sistema de rastreamento
✅ **Filtros** no painel administrativo
✅ **Responsividade** mobile

## 🎯 PERSONALIZAÇÃO

### **Adaptar Campos:**
Modificar o array de mapeamento em `parseRawBulkData()`:
```javascript
const [
  nomeCompleto,     // Campo 1
  email,           // Campo 2
  telefone,        // Campo 3
  documento,       // Campo 4
  // ... adicionar/remover campos conforme necessário
] = fields;
```

### **Adaptar Validações:**
Modificar as validações em `parseRawBulkData()`:
```javascript
// Adicionar novas validações
if (!campoPersonalizado || campoPersonalizado.length < 3) {
  errors.push({
    line: lineNumber,
    error: 'Campo personalizado é obrigatório',
    data: line
  });
  continue;
}
```

### **Adaptar Banco:**
Modificar `DatabaseService` para sua estrutura:
```javascript
// src/services/database.js
async createLead(leadData) {
  // Adaptar para sua estrutura de banco
  // Supabase, Firebase, API REST, etc.
}
```

## 🔧 DEPENDÊNCIAS NECESSÁRIAS

### **JavaScript Modules:**
- ES6+ support
- Import/Export syntax
- Async/Await

### **CSS Framework:**
- Font Awesome (ícones)
- CSS Grid/Flexbox
- Responsive design

### **Banco de Dados:**
- Supabase (recomendado) OU
- localStorage (desenvolvimento) OU
- Qualquer API REST

## 📞 SUPORTE E MANUTENÇÃO

### **Logs de Debug:**
O sistema inclui logs detalhados no console:
```javascript
console.log('📊 Dados parseados:', parsedData);
console.log('✅ Lead criado:', leadData);
console.log('❌ Erro encontrado:', error);
```

### **Tratamento de Erros:**
Todos os erros são capturados e exibidos na interface:
- Erros de parse
- Duplicatas
- Falhas de validação
- Problemas de banco

---

## 🎉 RESULTADO FINAL

Com estes componentes, você terá um sistema completo de importação em massa que:

1. **Aceita** dados colados diretamente da planilha
2. **Analisa** e valida automaticamente
3. **Mostra** pré-visualização detalhada
4. **Importa** com progresso em tempo real
5. **Integra** com sistema de rastreamento
6. **Funciona** em qualquer projeto Bolt

**Este é um sistema plug-and-play pronto para reutilização!** 🚀