/**
 * 📋 FUNÇÕES CORE DO SISTEMA DE IMPORTAÇÃO EM MASSA
 * Arquivo reutilizável para implementação em qualquer projeto Bolt
 */

// ===== FUNÇÃO PRINCIPAL DE PARSE =====
export function parseRawBulkData(rawData) {
    console.log('📊 Iniciando análise inteligente dos dados...');
    
    // Verificação de dados vazios
    if (!rawData || !rawData.trim()) {
        return {
            success: false,
            error: 'Nenhuma linha válida encontrada nos dados colados.'
        };
    }
    
    const lines = rawData.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        return {
            success: false,
            error: 'Nenhuma linha válida encontrada nos dados colados.'
        };
    }
    
    const leads = [];
    const duplicatesInList = new Set(); // Duplicados na mesma lista (silenciosos)
    const duplicatesRemoved = []; // Para log interno
    const databaseDuplicates = []; // Duplicados no banco (mostrar como erro)
    const parseErrors = [];
    
    console.log(`📋 Total de linhas para processar: ${lines.length}`);
    
    // Obter leads existentes no banco
    const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
    const existingKeys = new Set(existingLeads.map(lead => {
        const cleanCPF = lead.cpf ? lead.cpf.replace(/[^\d]/g, '') : '';
        const cleanName = (lead.nome_completo || '').toLowerCase().trim();
        return `${cleanName}_${cleanCPF}`;
    }));
    
    console.log(`🗄️ Leads existentes no banco: ${existingLeads.length}`);

    for (let i = 0; i < lines.length; i++) {
        try {
            const line = lines[i].trim();
            if (!line) continue;

            // DETECÇÃO INTELIGENTE DE SEPARADORES
            let fields = [];
            
            // Tentar TAB primeiro (formato de planilha)
            if (line.includes('\t')) {
                fields = line.split('\t');
                console.log(`🔍 Linha ${i + 1}: Detectado separador TAB, ${fields.length} campos`);
            }
            // Tentar espaços múltiplos
            else if (line.includes('  ')) {
                fields = line.split(/\s{2,}/); // 2 ou mais espaços
                console.log(`🔍 Linha ${i + 1}: Detectado espaços múltiplos, ${fields.length} campos`);
            }
            // Tentar espaço simples
            else {
                fields = line.split(/\s+/); // Um ou mais espaços
                console.log(`🔍 Linha ${i + 1}: Detectado espaço simples, ${fields.length} campos`);
            }

            // Limpar campos
            fields = fields.map(field => field.trim()).filter(field => field.length > 0);

            console.log(`📊 Linha ${i + 1}: ${fields.length} campos após limpeza:`, fields);

            // Verificar número mínimo de campos
            if (fields.length < 4) {
                parseErrors.push({
                    line: i + 1,
                    error: `Poucos campos encontrados: ${fields.length}. Mínimo necessário: 4 (Nome, Email, Telefone, CPF)`,
                    data: line
                });
                continue;
            }

            // MAPEAMENTO DOS CAMPOS (ordem esperada)
            const [
                nomeCompleto,
                email,
                telefone,
                documento,
                produto = 'Kit 262 Cores Canetinhas Coloridas Edição Especial Com Ponta Dupla',
                valorTotal = '47.39',
                endereco = '',
                numero = '',
                complemento = '',
                bairro = '',
                cep = '',
                cidade = '',
                estado = '',
                pais = 'BR'
            ] = fields;
            
            console.log(`👤 Linha ${i + 1} - Dados extraídos:`, {
                nome: nomeCompleto,
                email: email,
                telefone: telefone,
                cpf: documento
            });

            // VALIDAÇÕES OBRIGATÓRIAS
            if (!nomeCompleto || nomeCompleto.length < 2) {
                parseErrors.push({
                    line: i + 1,
                    error: 'Nome do cliente é obrigatório e deve ter pelo menos 2 caracteres',
                    data: line
                });
                continue;
            }

            if (!email || !email.includes('@')) {
                parseErrors.push({
                    line: i + 1,
                    error: 'Email é obrigatório e deve ser válido',
                    data: line
                });
                continue;
            }

            if (!telefone || telefone.replace(/[^\d]/g, '').length < 10) {
                parseErrors.push({
                    line: i + 1,
                    error: 'Telefone é obrigatório e deve ter pelo menos 10 dígitos',
                    data: line
                });
                continue;
            }

            const cleanCPF = documento ? documento.replace(/[^\d]/g, '') : '';
            if (!cleanCPF || cleanCPF.length !== 11) {
                parseErrors.push({
                    line: i + 1,
                    error: 'CPF é obrigatório e deve ter exatamente 11 dígitos',
                    data: line
                });
                continue;
            }

            // Verificar duplicatas na lista atual
            const cleanName = nomeCompleto.toLowerCase().trim();
            const duplicateKey = `${cleanName}_${cleanCPF}`;
            
            if (duplicatesInList.has(duplicateKey)) {
                duplicatesRemoved.push({ 
                    nome: nomeCompleto, 
                    cpf: cleanCPF,
                    linha: i + 1
                });
                continue;
            }
            duplicatesInList.add(duplicateKey);

            // Verificar duplicatas no banco
            if (existingKeys.has(duplicateKey)) {
                databaseDuplicates.push({
                    line: i + 1,
                    cpf: cleanCPF,
                    nome: nomeCompleto,
                    error: 'Já existente no sistema'
                });
                continue;
            }

            // Processar valor
            const valorProcessado = parseValue(valorTotal);

            // Construir endereço completo
            const enderecoCompleto = buildFullAddress({
                endereco, numero, complemento, bairro, cep, cidade, estado, pais
            });

            // Criar objeto do lead
            const leadData = {
                nome_completo: nomeCompleto,
                email: email,
                telefone: telefone,
                cpf: cleanCPF,
                produto: produto,
                valor_total: valorProcessado,
                endereco: enderecoCompleto,
                meio_pagamento: 'PIX',
                origem: 'direto',
                etapa_atual: 1,
                status_pagamento: 'pendente',
                order_bumps: [],
                produtos: [{
                    nome: produto,
                    preco: valorProcessado
                }],
                lineNumber: i + 1
            };

            leads.push(leadData);
            console.log(`✅ Linha ${i + 1}: Lead criado com sucesso para ${nomeCompleto}`);

        } catch (lineError) {
            console.error(`❌ Erro na linha ${i + 1}:`, lineError);
            parseErrors.push({
                line: i + 1,
                error: `Erro ao processar linha: ${lineError.message}`,
                data: lines[i]
            });
        }
    }

    console.log('📊 Resultado final do parse:', {
        leadsValidos: leads.length,
        erros: parseErrors.length,
        duplicatas: duplicatesRemoved.length + databaseDuplicates.length
    });

    // Adicionar duplicados do banco aos erros para exibição
    const allErrors = [...parseErrors, ...databaseDuplicates];

    return {
        success: true,
        leads: leads,
        errors: allErrors,
        duplicates: duplicatesRemoved,
        totalProcessed: lines.length
    };
}

// ===== FUNÇÕES AUXILIARES =====
function parseValue(value) {
    if (!value) return 47.39;
    
    // Converter vírgula para ponto e remover espaços
    const cleanValue = value.toString().replace(',', '.').trim();
    const parsed = parseFloat(cleanValue);
    
    return isNaN(parsed) ? 47.39 : parsed;
}

function buildFullAddress({ endereco, numero, complemento, bairro, cep, cidade, estado, pais }) {
    const parts = [];
    
    if (endereco) parts.push(endereco);
    if (numero) parts.push(numero);
    if (complemento) parts.push(`- ${complemento}`);
    if (bairro) parts.push(`- ${bairro}`);
    if (cidade && estado) parts.push(`- ${cidade}/${estado}`);
    if (cep) parts.push(`- CEP: ${cep}`);
    if (pais && pais !== 'BR') parts.push(`- ${pais}`);
    
    return parts.join(' ') || 'Endereço não informado';
}

// ===== FUNÇÃO DE PRÉ-VISUALIZAÇÃO =====
export function displayBulkPreview(parsedData, containerId = 'bulkPreviewContainer') {
    console.log('🖥️ Exibindo pré-visualização...');

    const previewContainer = document.getElementById(containerId);
    if (!previewContainer) {
        console.error('❌ Container de pré-visualização não encontrado');
        return;
    }

    // Criar tabela de pré-visualização
    let tableHTML = `
        <div style="max-height: 400px; overflow: auto; border: 1px solid #ddd;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead style="background: #345C7A; color: white; position: sticky; top: 0;">
                    <tr>
                        <th style="padding: 8px; border: 1px solid #ddd; min-width: 40px;">#</th>
                        <th style="padding: 8px; border: 1px solid #ddd; min-width: 150px;">Nome</th>
                        <th style="padding: 8px; border: 1px solid #ddd; min-width: 180px;">Email</th>
                        <th style="padding: 8px; border: 1px solid #ddd; min-width: 120px;">Telefone</th>
                        <th style="padding: 8px; border: 1px solid #ddd; min-width: 100px;">CPF</th>
                        <th style="padding: 8px; border: 1px solid #ddd; min-width: 200px;">Produto</th>
                        <th style="padding: 8px; border: 1px solid #ddd; min-width: 80px;">Valor</th>
                        <th style="padding: 8px; border: 1px solid #ddd; min-width: 250px;">Endereço</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Adicionar leads válidos
    parsedData.leads.forEach((lead, index) => {
        const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
        tableHTML += `
            <tr style="background: ${rowColor};">
                <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${lead.lineNumber}</td>
                <td style="padding: 6px; border: 1px solid #ddd;" title="${lead.nome_completo}">
                    ${truncateText(lead.nome_completo, 20)}
                </td>
                <td style="padding: 6px; border: 1px solid #ddd;" title="${lead.email}">
                    ${truncateText(lead.email, 25)}
                </td>
                <td style="padding: 6px; border: 1px solid #ddd;">${lead.telefone}</td>
                <td style="padding: 6px; border: 1px solid #ddd;">${formatCPF(lead.cpf)}</td>
                <td style="padding: 6px; border: 1px solid #ddd;" title="${lead.produto}">
                    ${truncateText(lead.produto, 30)}
                </td>
                <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">
                    R$ ${lead.valor_total.toFixed(2)}
                </td>
                <td style="padding: 6px; border: 1px solid #ddd;" title="${lead.endereco}">
                    ${truncateText(lead.endereco, 35)}
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table></div>`;

    // Adicionar seção de erros se houver
    if (parsedData.errors.length > 0) {
        tableHTML += `
            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
                <h5 style="color: #856404; margin-bottom: 10px;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Problemas Encontrados (${parsedData.errors.length})
                </h5>
                <div style="max-height: 150px; overflow-y: auto;">
        `;

        parsedData.errors.slice(0, 10).forEach(error => {
            tableHTML += `
                <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #dc3545;">
                    <strong>Linha ${error.line}:</strong> ${error.error}
                </div>
            `;
        });

        if (parsedData.errors.length > 10) {
            tableHTML += `
                <div style="text-align: center; color: #666; font-style: italic; margin-top: 10px;">
                    ... e mais ${parsedData.errors.length - 10} problemas
                </div>
            `;
        }

        tableHTML += `</div></div>`;
    }

    previewContainer.innerHTML = tableHTML;
    console.log('✅ Pré-visualização exibida com sucesso');
}

// ===== FUNÇÃO DE IMPORTAÇÃO =====
export async function confirmBulkImport(bulkData, progressCallback) {
    console.log(`🚀 Iniciando importação de ${bulkData.length} leads...`);

    const results = {
        success: 0,
        errors: 0,
        total: bulkData.length
    };

    // Importar leads um por um
    for (let i = 0; i < bulkData.length; i++) {
        const lead = bulkData[i];
        
        try {
            // Adicionar timestamps
            lead.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            lead.created_at = new Date().toISOString();
            lead.updated_at = new Date().toISOString();

            // Salvar no localStorage
            const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            existingLeads.push(lead);
            localStorage.setItem('leads', JSON.stringify(existingLeads));

            results.success++;
            console.log(`✅ Lead ${i + 1}/${bulkData.length} importado: ${lead.nome_completo}`);

        } catch (error) {
            console.error(`❌ Erro ao importar lead ${i + 1}:`, error);
            results.errors++;
        }

        // Callback de progresso
        if (progressCallback) {
            progressCallback(i + 1, bulkData.length);
        }
        
        // Pequeno delay para não travar a interface
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return results;
}

// ===== FUNÇÕES UTILITÁRIAS =====
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatCPF(cpf) {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// ===== CONFIGURAÇÃO DE EVENTOS =====
export function setupBulkImportEvents() {
    console.log('🔧 Configurando eventos de importação em massa...');

    // Botão de pré-visualização
    const previewButton = document.getElementById('previewBulkDataButton');
    if (previewButton) {
        previewButton.addEventListener('click', () => {
            const textarea = document.getElementById('bulkDataTextarea');
            if (!textarea) return;

            const rawData = textarea.value;
            if (!rawData || rawData.trim().length === 0) {
                alert('Por favor, cole os dados da planilha no campo de texto.');
                return;
            }

            const parsedData = parseRawBulkData(rawData);
            if (!parsedData.success) {
                alert(parsedData.error);
                return;
            }

            displayBulkPreview(parsedData);
            
            // Mostrar seção de pré-visualização
            const previewSection = document.getElementById('bulkPreviewSection');
            if (previewSection) {
                previewSection.style.display = 'block';
            }

            // Mostrar botão de confirmação se há dados válidos
            const confirmButton = document.getElementById('confirmBulkImportButton');
            if (confirmButton && parsedData.leads.length > 0) {
                confirmButton.style.display = 'inline-block';
                confirmButton.textContent = `Importar ${parsedData.leads.length} Registros`;
                
                // Armazenar dados para importação
                window.bulkImportData = parsedData.leads;
            }
        });
    }

    // Botão de confirmação
    const confirmButton = document.getElementById('confirmBulkImportButton');
    if (confirmButton) {
        confirmButton.addEventListener('click', async () => {
            if (!window.bulkImportData || window.bulkImportData.length === 0) {
                alert('Nenhum dado válido para importar');
                return;
            }

            // Mostrar progresso
            showImportProgress();

            // Importar dados
            const results = await confirmBulkImport(window.bulkImportData, updateImportProgress);
            
            // Mostrar resultados
            showImportResults(results);
            
            // Limpar dados
            clearBulkData();
        });
    }

    // Botão de limpar
    const clearButton = document.getElementById('clearBulkDataButton');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            clearBulkData();
        });
    }

    console.log('✅ Eventos de importação em massa configurados');
}

function showImportProgress() {
    const resultsSection = document.getElementById('bulkResultsSection');
    const resultsContainer = document.getElementById('bulkResultsContainer');

    if (!resultsSection || !resultsContainer) return;

    resultsSection.style.display = 'block';
    resultsContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="margin-bottom: 15px;">
                <i class="fas fa-upload" style="font-size: 2rem; color: #345C7A; animation: pulse 1s infinite;"></i>
            </div>
            <h4 style="color: #345C7A; margin-bottom: 15px;">Importando Leads...</h4>
            <div id="importProgressBar" style="
                width: 100%; 
                height: 20px; 
                background: #e9ecef; 
                border-radius: 10px; 
                overflow: hidden;
                margin-bottom: 10px;
            ">
                <div id="importProgressFill" style="
                    width: 0%; 
                    height: 100%; 
                    background: linear-gradient(45deg, #345C7A, #2c4a63); 
                    transition: width 0.3s ease;
                "></div>
            </div>
            <div id="importProgressText">0 / ${window.bulkImportData.length} leads processados</div>
        </div>
    `;
}

function updateImportProgress(current, total) {
    const progressFill = document.getElementById('importProgressFill');
    const progressText = document.getElementById('importProgressText');

    if (progressFill && progressText) {
        const percentage = (current / total) * 100;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${current} / ${total} leads processados`;
    }
}

function showImportResults(results) {
    const resultsContainer = document.getElementById('bulkResultsContainer');
    
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="margin-bottom: 15px;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: #27ae60;"></i>
                </div>
                <h4 style="color: #27ae60; margin-bottom: 15px;">Importação Concluída!</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div style="padding: 15px; background: #d4edda; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #155724;">${results.success}</div>
                        <div style="color: #155724;">Sucessos</div>
                    </div>
                    <div style="padding: 15px; background: #f8d7da; border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #721c24;">${results.errors}</div>
                        <div style="color: #721c24;">Erros</div>
                    </div>
                </div>
            </div>
        `;
    }
}

function clearBulkData() {
    const textarea = document.getElementById('bulkDataTextarea');
    const previewSection = document.getElementById('bulkPreviewSection');
    const resultsSection = document.getElementById('bulkResultsSection');

    if (textarea) textarea.value = '';
    if (previewSection) previewSection.style.display = 'none';
    if (resultsSection) resultsSection.style.display = 'none';

    window.bulkImportData = [];
    console.log('🧹 Dados de importação limpos');
}

// ===== EXPORTAR TODAS AS FUNÇÕES =====
export default {
    parseRawBulkData,
    displayBulkPreview,
    confirmBulkImport,
    setupBulkImportEvents,
    truncateText,
    formatCPF
};