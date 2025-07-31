/**
 * Painel Administrativo - Sistema de Gerenciamento de Leads
 */
import { DatabaseService } from '../services/database.js';
import { CPFValidator } from '../utils/cpf-validator.js';

class AdminPanel {
    constructor() {
        this.dbService = new DatabaseService();
        this.currentView = 'leadsView';
        this.leads = [];
        this.filteredLeads = [];
        this.currentPage = 1;
        this.leadsPerPage = 20;
        this.selectedLeads = new Set();
        
        // Sistema de Debug
        this.debugLogs = [];
        this.maxDebugLogs = 100;
        this.debugVisible = false;
        this.systemMode = 'auto';
        this.autoUpdateInterval = null;
        this.bulkImportData = [];
        this.isImporting = false;
        
        // Mapeamento ordenado das etapas para lógica automatizada
        this.stageOrder = [
            { id: 1, name: "Pedido criado" },
            { id: 2, name: "Preparando para envio" },
            { id: 3, name: "Vendedor enviou pedido" },
            { id: 4, name: "Centro triagem Shenzhen" },
            { id: 5, name: "Centro logístico Shenzhen" },
            { id: 6, name: "Trânsito internacional" },
            { id: 7, name: "Liberado exportação" },
            { id: 8, name: "Saiu origem Shenzhen" },
            { id: 9, name: "Chegou no Brasil" },
            { id: 10, name: "Trânsito Curitiba/PR" },
            { id: 11, name: "Alfândega importação" },
            { id: 12, name: "Liberado alfândega" },
            { id: 13, name: "Sairá para entrega" },
            { id: 14, name: "Em trânsito entrega" },
            { id: 15, name: "Rota de entrega" },
            { id: 16, name: "Tentativa entrega" },
            { id: 17, name: "1ª Tentativa entrega" },
            { id: 18, name: "Reagendamento solicitado" },
            { id: 19, name: "Em rota de entrega" },
            { id: 20, name: "Saindo para entrega" },
            { id: 21, name: "2ª Tentativa entrega" },
            { id: 22, name: "Reagendamento solicitado" },
            { id: 23, name: "Em rota de entrega" },
            { id: 24, name: "Saindo para entrega" },
            { id: 25, name: "3ª Tentativa entrega" },
            { id: 26, name: "Reagendamento solicitado" },
            { id: 27, name: "Em rota de entrega" },
            { id: 28, name: "Saindo para entrega" },
            { id: 29, name: "4ª Tentativa entrega" }
        ];
        
        console.log('🎛️ AdminPanel inicializado');
        this.init();
    }

    // Método debugLog para logging
    debugLog(message, type = 'info', origin = 'AdminPanel') {
        if (this.debugSystem) {
            this.debugSystem.log(message, type, origin);
        } else {
            console.log(`[${type.toUpperCase()}] ${origin}: ${message}`);
        }
    }

    async init() {
        try {
            await this.setupAuthentication();
            await this.setupEventListeners();
            await this.loadLeads();
            this.startAutoUpdate();
            this.setupMassSelectionControls();
            this.setupDebugSystem();
            
            // Configurar eventos dos botões de ação
            this.setupActionButtons();
            
            // Configurar eventos do modal de edição
            this.setupEditModal();
            
            console.log('✅ AdminPanel configurado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização do AdminPanel:', error);
        }
    }

    async setupAuthentication() {
        const loginScreen = document.getElementById('loginScreen');
        const adminPanel = document.getElementById('adminPanel');
        const loginForm = document.getElementById('loginForm');
        const passwordInput = document.getElementById('passwordInput');
        const errorMessage = document.getElementById('errorMessage');

        // Verificar se já está logado
        if (localStorage.getItem('admin_logged_in') === 'true') {
            loginScreen.style.display = 'none';
            adminPanel.style.display = 'block';
            return;
        }

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = passwordInput.value;
            
            // Senhas aceitas
            const validPasswords = ['admin123', 'k7admin', 'logix2024'];
            
            if (validPasswords.includes(password)) {
                localStorage.setItem('admin_logged_in', 'true');
                loginScreen.style.display = 'none';
                adminPanel.style.display = 'block';
                errorMessage.style.display = 'none';
            } else {
                errorMessage.textContent = 'Senha incorreta. Tente novamente.';
                errorMessage.style.display = 'block';
                passwordInput.value = '';
            }
        });

        // Logout
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('admin_logged_in');
                location.reload();
            });
        }
    }

    async setupEventListeners() {
        // Navegação entre views
        document.getElementById('showLeadsView')?.addEventListener('click', () => {
            this.showView('leadsView');
        });

        document.getElementById('showAddLeadView')?.addEventListener('click', () => {
            this.showView('addLeadView');
        });

        document.getElementById('showBulkAddView')?.addEventListener('click', () => {
            this.showView('bulkAddView');
        });

        // Formulário de adicionar lead individual
        document.getElementById('addLeadForm')?.addEventListener('submit', (e) => {
            this.handleAddLead(e);
        });

        // Controles do sistema
        document.getElementById('systemMode')?.addEventListener('change', (e) => {
            this.updateSystemMode(e.target.value);
        });

        document.getElementById('applyFiltersButton')?.addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('refreshButton')?.addEventListener('click', () => {
            this.refreshLeads();
        });

        document.getElementById('clearAllButton')?.addEventListener('click', () => {
            this.clearAllLeads();
        });

        // Ações em massa
        this.setupMassActions();

        // Importação em massa - CORRIGIDO
        this.setupBulkImportEvents();

        // Modais
        this.setupModalEvents();
        
        // Botão de limpar todos os dados
        const clearAllButton = document.getElementById('clearAllButton');
        if (clearAllButton) {
            clearAllButton.addEventListener('click', () => {
                if (confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os leads do sistema!\n\nTem certeza que deseja continuar?')) {
                    this.clearAllLeads();
                }
            });
        }
        
        // Botão de simular tentativa de entrega
        const triggerDeliveryButton = document.getElementById('triggerDeliveryAttempt');
        if (triggerDeliveryButton) {
            triggerDeliveryButton.addEventListener('click', () => {
                this.triggerDeliveryAttemptForSelected();
            });
        }
    }
    
    triggerDeliveryAttemptForSelected() {
        const selectedLeads = this.getSelectedLeads();
        
        if (selectedLeads.length === 0) {
            alert('Selecione pelo menos um lead para simular tentativa de entrega.');
            return;
        }
        
        const leadNames = selectedLeads.slice(0, 3).map(lead => lead.nome_completo).join(', ');
        const moreText = selectedLeads.length > 3 ? ` e mais ${selectedLeads.length - 3}` : '';
        
        if (confirm(`Simular tentativa de entrega para:\n\n${leadNames}${moreText}\n\nIsso irá adicionar a etapa "1ª Tentativa de Entrega" para os leads selecionados.`)) {
            this.processDeliveryAttemptSimulation(selectedLeads);
        }
    }
    
    async processDeliveryAttemptSimulation(selectedLeads) {
        console.log('🚚 Simulando tentativas de entrega para leads selecionados');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const lead of selectedLeads) {
            try {
                // Atualizar lead para etapa 17 (1ª Tentativa de Entrega)
                lead.etapa_atual = 17;
                lead.updated_at = new Date().toISOString();
                
                // Salvar no localStorage
                const leads = JSON.parse(localStorage.getItem('leads') || '[]');
                const leadIndex = leads.findIndex(l => l.id === lead.id);
                
                if (leadIndex !== -1) {
                    leads[leadIndex] = lead;
                    localStorage.setItem('leads', JSON.stringify(leads));
                    successCount++;
                    console.log(`✅ Lead ${lead.nome_completo} atualizado para etapa 17`);
                } else {
                    errorCount++;
                    console.error(`❌ Lead ${lead.nome_completo} não encontrado`);
                }
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Erro ao atualizar lead ${lead.nome_completo}:`, error);
            }
        }
        
        // Atualizar interface
        this.refreshLeads();
        
        // Mostrar resultado
        alert(`Simulação concluída!\n\n✅ Sucessos: ${successCount}\n❌ Erros: ${errorCount}\n\nOs leads agora estão na etapa "1ª Tentativa de Entrega" e o botão "LIBERAR ENTREGA" deve aparecer no rastreamento.`);
    }

    setupMassActions() {
        this.debugLog('Configurando ações em massa...', 'info');
        
        // Usar delegação de eventos para garantir que os botões funcionem
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            
            // Verificar se é um botão de ação em massa
            if (target.id === 'massNextStage') {
                e.preventDefault();
                this.handleMassAction('next');
            } else if (target.id === 'massPrevStage') {
                e.preventDefault();
                this.handleMassAction('prev');
            } else if (target.id === 'massSetStage') {
                e.preventDefault();
                this.handleMassAction('set');
            } else if (target.id === 'massDeleteLeads') {
                e.preventDefault();
                this.handleMassAction('delete');
            } else if (target.id === 'massSelectAll') {
                e.preventDefault();
                this.selectAllLeads();
            } else if (target.id === 'massDeselectAll') {
                e.preventDefault();
                this.deselectAllLeads();
            }
        });
        
        // Botões de selecionar/desmarcar todos
        const selectAllButton = document.getElementById('massSelectAll');
        if (selectAllButton) {
            selectAllButton.addEventListener('click', () => {
                this.selectAllLeads();
            });
        }

        const deselectAllButton = document.getElementById('massDeselectAll');
        if (deselectAllButton) {
            deselectAllButton.addEventListener('click', () => {
                this.deselectAllLeads();
            });
        }
        
        this.debugLog('Ações em massa configuradas', 'info');
    }

    // Configurar eventos de ações em massa
    setupMassActionEvents() {
        console.log('🔧 Configurando eventos de ações em massa...');
        
        // Configurar eventos específicos para cada botão
        this.setupMassActionButton('massNextStage', () => this.handleMassNextStage());
        this.setupMassActionButton('massPrevStage', () => this.handleMassPrevStage());
        this.setupMassActionButton('massSetStage', () => this.handleMassSetStage());
        this.setupMassActionButton('massDeleteLeads', () => this.handleMassDeleteLeads());
    }
    
    setupMassActionButton(buttonId, handler) {
        // Tentar configurar imediatamente
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handler();
            });
            console.log(`✅ Evento configurado para ${buttonId}`);
        }
        
        // Usar delegação como backup
        document.addEventListener('click', (e) => {
            if (e.target.id === buttonId || e.target.closest(`#${buttonId}`)) {
                e.preventDefault();
                e.stopPropagation();
                handler();
            }
        });
    }

    // Lidar com avançar etapa em massa
    async handleMassNextStage() {
        console.log('⬆️ Avançar etapas em massa');
        
        const selectedLeads = this.getSelectedLeads();
        if (selectedLeads.length === 0) {
            alert('Selecione pelo menos um lead para avançar');
            return;
        }
        
        console.log(`📊 Avançando ${selectedLeads.length} leads selecionados`);
        
        // Confirmar ação
        if (!confirm(`Tem certeza que deseja avançar ${selectedLeads.length} leads para a próxima etapa?`)) {
            return;
        }
        
        // Mostrar progresso
        this.showMassActionProgress('Avançando etapas...', selectedLeads.length);
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            // Processar cada lead
            for (let i = 0; i < selectedLeads.length; i++) {
                const lead = selectedLeads[i];
                const currentStage = parseInt(lead.etapa_atual) || 1;
                const nextStage = this.getNextStage(currentStage);
                
                console.log(`📈 Lead ${lead.nome_completo}: Etapa ${currentStage} → ${nextStage}`);
                
                if (nextStage > currentStage) {
                    try {
                        // Atualizar no banco de dados
                        await this.updateLeadStage(lead.cpf, nextStage);
                        
                        // Atualizar na interface
                        lead.etapa_atual = nextStage;
                        lead.updated_at = new Date().toISOString();
                        
                        successCount++;
                        console.log(`✅ Lead ${lead.nome_completo} avançado com sucesso`);
                    } catch (error) {
                        console.error(`❌ Erro ao avançar lead ${lead.nome_completo}:`, error);
                        errorCount++;
                    }
                } else {
                    console.log(`⚠️ Lead ${lead.nome_completo} já está na última etapa`);
                }
                
                // Atualizar progresso
                this.updateMassActionProgress(i + 1, selectedLeads.length);
                
                // Pequeno delay para não sobrecarregar
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Finalizar
            this.hideMassActionProgress();
            
            // Atualizar interface
            this.refreshLeads();
            this.deselectAllLeads();
            
            // Mostrar resultado
            alert(`Operação concluída!\n✅ ${successCount} leads avançados\n❌ ${errorCount} erros`);
            
        } catch (error) {
            console.error('❌ Erro na operação de avançar etapas:', error);
            this.hideMassActionProgress();
            alert('Erro na operação. Verifique o console para detalhes.');
        }
    }
    
    // Atualizar etapa do lead no banco de dados
    async updateLeadStage(cpf, newStage) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === cpf.replace(/[^\d]/g, ''));
            
            if (leadIndex !== -1) {
                leads[leadIndex].etapa_atual = newStage;
                leads[leadIndex].updated_at = new Date().toISOString();
                localStorage.setItem('leads', JSON.stringify(leads));
                console.log(`✅ Etapa atualizada no banco: CPF ${cpf} → Etapa ${newStage}`);
                return true;
            } else {
                throw new Error(`Lead não encontrado para CPF: ${cpf}`);
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar etapa no banco:', error);
            throw error;
        }
    }

    // Lidar com voltar etapa em massa
    async handleMassPrevStage() {
        console.log('⬇️ Voltar etapas em massa');
        
        const selectedLeads = this.getSelectedLeads();
        if (selectedLeads.length === 0) {
            alert('Selecione pelo menos um lead para voltar');
            return;
        }
        
        console.log(`📊 Voltando ${selectedLeads.length} leads selecionados`);
        
        // Confirmar ação
        if (!confirm(`Tem certeza que deseja voltar ${selectedLeads.length} leads para a etapa anterior?`)) {
            return;
        }
        
        // Mostrar progresso
        this.showMassActionProgress('Voltando etapas...', selectedLeads.length);
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            // Processar cada lead
            for (let i = 0; i < selectedLeads.length; i++) {
                const lead = selectedLeads[i];
                const currentStage = parseInt(lead.etapa_atual) || 1;
                const prevStage = this.getPreviousStage(currentStage);
                
                console.log(`📉 Lead ${lead.nome_completo}: Etapa ${currentStage} → ${prevStage}`);
                
                if (prevStage < currentStage) {
                    try {
                        // Atualizar no banco de dados
                        await this.updateLeadStage(lead.cpf, prevStage);
                        
                        // Atualizar na interface
                        lead.etapa_atual = prevStage;
                        lead.updated_at = new Date().toISOString();
                        
                        successCount++;
                        console.log(`✅ Lead ${lead.nome_completo} voltado com sucesso`);
                    } catch (error) {
                        console.error(`❌ Erro ao voltar lead ${lead.nome_completo}:`, error);
                        errorCount++;
                    }
                } else {
                    console.log(`⚠️ Lead ${lead.nome_completo} já está na primeira etapa`);
                }
                
                // Atualizar progresso
                this.updateMassActionProgress(i + 1, selectedLeads.length);
                
                // Pequeno delay para não sobrecarregar
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Finalizar
            this.hideMassActionProgress();
            
            // Atualizar interface
            this.refreshLeads();
            this.deselectAllLeads();
            
            // Mostrar resultado
            alert(`Operação concluída!\n✅ ${successCount} leads voltados\n❌ ${errorCount} erros`);
            
        } catch (error) {
            console.error('❌ Erro na operação de voltar etapas:', error);
            this.hideMassActionProgress();
            alert('Erro na operação. Verifique o console para detalhes.');
        }
    }

    // Lidar com definir etapa em massa
    async handleMassSetStage() {
        console.log('🎯 Definir etapa em massa');
        
        const selectedLeads = this.getSelectedLeads();
        if (selectedLeads.length === 0) {
            alert('Selecione pelo menos um lead para definir etapa');
            return;
        }
        
        const targetStage = document.getElementById('targetStageSelect')?.value;
        if (!targetStage) {
            alert('Selecione uma etapa de destino');
            return;
        }
        
        console.log(`📊 Definindo etapa ${targetStage} para ${selectedLeads.length} leads`);
        
        // Confirmar ação
        const stageName = this.getStageName(parseInt(targetStage));
        if (!confirm(`Tem certeza que deseja definir ${selectedLeads.length} leads para a etapa "${stageName}"?`)) {
            return;
        }
        
        // Mostrar progresso
        this.showMassActionProgress(`Definindo etapa ${targetStage}...`, selectedLeads.length);
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            // Processar cada lead
            for (let i = 0; i < selectedLeads.length; i++) {
                const lead = selectedLeads[i];
                
                try {
                    // Atualizar no banco de dados
                    await this.updateLeadStage(lead.cpf, parseInt(targetStage));
                    
                    // Atualizar na interface
                    lead.etapa_atual = parseInt(targetStage);
                    lead.updated_at = new Date().toISOString();
                    
                    successCount++;
                    console.log(`✅ Lead ${lead.nome_completo} definido para etapa ${targetStage}`);
                } catch (error) {
                    console.error(`❌ Erro ao definir etapa para lead ${lead.nome_completo}:`, error);
                    errorCount++;
                }
                
                // Atualizar progresso
                this.updateMassActionProgress(i + 1, selectedLeads.length);
                
                // Pequeno delay para não sobrecarregar
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Finalizar
            this.hideMassActionProgress();
            
            // Atualizar interface
            this.refreshLeads();
            this.deselectAllLeads();
            
            // Mostrar resultado
            alert(`Operação concluída!\n✅ ${successCount} leads atualizados\n❌ ${errorCount} erros`);
            
        } catch (error) {
            console.error('❌ Erro na operação de definir etapa:', error);
            this.hideMassActionProgress();
            alert('Erro na operação. Verifique o console para detalhes.');
        }
    }

    // Lidar com excluir leads em massa
    async handleMassDeleteLeads() {
        console.log('🗑️ Excluir leads em massa');
        
        const selectedLeads = this.getSelectedLeads();
        if (selectedLeads.length === 0) {
            alert('Selecione pelo menos um lead para excluir');
            return;
        }
        
        if (!confirm(`Tem certeza que deseja excluir ${selectedLeads.length} leads? Esta ação não pode ser desfeita.`)) {
            return;
        }
        
        // Mostrar progresso
        this.showMassActionProgress('Excluindo leads...', selectedLeads.length);
        
        let successCount = 0;
        let errorCount = 0;
        
        try {
            // Processar cada lead
            for (let i = 0; i < selectedLeads.length; i++) {
                const lead = selectedLeads[i];
                
                try {
                    await this.deleteLead(lead.cpf);
                    successCount++;
                    console.log(`✅ Lead ${lead.nome_completo} excluído com sucesso`);
                } catch (error) {
                    console.error(`❌ Erro ao excluir lead ${lead.nome_completo}:`, error);
                    errorCount++;
                }
                
                // Atualizar progresso
                this.updateMassActionProgress(i + 1, selectedLeads.length);
                
                // Pequeno delay para não sobrecarregar
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Finalizar
            this.hideMassActionProgress();
            
            // Atualizar interface
            this.refreshLeads();
            this.deselectAllLeads();
            
            // Mostrar resultado
            alert(`Operação concluída!\n✅ ${successCount} leads excluídos\n❌ ${errorCount} erros`);
            
        } catch (error) {
            console.error('❌ Erro na operação de exclusão:', error);
            this.hideMassActionProgress();
            alert('Erro na operação. Verifique o console para detalhes.');
        }
    }
    
    // Excluir lead do banco de dados
    async deleteLead(cpf) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const filteredLeads = leads.filter(l => l.cpf && l.cpf.replace(/[^\d]/g, '') !== cpf.replace(/[^\d]/g, ''));
            localStorage.setItem('leads', JSON.stringify(filteredLeads));
            console.log(`✅ Lead excluído do banco: CPF ${cpf}`);
            return true;
        } catch (error) {
            console.error('❌ Erro ao excluir lead do banco:', error);
            throw error;
        }
    }

    // Mostrar progresso de ação em massa
    showMassActionProgress(message, total) {
        console.log(`📊 Iniciando progresso: ${message} (${total} itens)`);
        
        // Remover progresso existente se houver
        this.hideMassActionProgress();
        
        const progressContainer = document.createElement('div');
        progressContainer.id = 'massActionProgressContainer';
        progressContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 2px solid #345C7A;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        // Variável para controlar cancelamento
        this.massActionCancelled = false;
        
        progressContainer.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <i class="fas fa-cogs" style="color: #345C7A; margin-right: 10px; font-size: 1.2rem;"></i>
                <span style="font-weight: 600; color: #345C7A;">${message}</span>
            </div>
            <div style="background: #e9ecef; border-radius: 10px; height: 20px; overflow: hidden; margin-bottom: 10px;">
                <div id="massActionProgressBar" style="
                    background: linear-gradient(45deg, #345C7A, #2c4a63);
                    height: 100%;
                    width: 0%;
                    transition: width 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 0.8rem;
                    font-weight: 600;
                ">0%</div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span id="massActionProgressText" style="font-size: 0.9rem; color: #666;">0 de ${total}</span>
                <button id="cancelProgressButton" onclick="window.adminPanel.cancelMassAction()" style="
                    background: #dc3545;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8rem;
                ">Cancelar</button>
            </div>
        `;
        
        document.body.appendChild(progressContainer);
        console.log('✅ Barra de progresso criada');
    }

    // Atualizar progresso de ação em massa
    updateMassActionProgress(current, total) {
        // Verificar se foi cancelado
        if (this.massActionCancelled) {
            throw new Error('Operação cancelada pelo usuário');
        }
        
        const progressBar = document.getElementById('massActionProgressBar');
        const progressText = document.getElementById('massActionProgressText');
        
        if (progressBar && progressText) {
            const percentage = (current / total) * 100;
            progressBar.style.width = `${percentage}%`;
            progressBar.textContent = `${Math.round(percentage)}%`;
            progressText.textContent = `${current} de ${total}`;
            console.log(`📊 Progresso atualizado: ${current}/${total} (${Math.round(percentage)}%)`);
        }
    }

    // Ocultar progresso de ação em massa
    hideMassActionProgress() {
        const progressContainer = document.getElementById('massActionProgressContainer');
        if (progressContainer) {
            progressContainer.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (progressContainer.parentNode) {
                    progressContainer.remove();
                }
            }, 300);
            console.log('✅ Barra de progresso removida');
        }
        
        // Reset da flag de cancelamento
        this.massActionCancelled = false;
    }
    
    // Cancelar ação em massa
    cancelMassAction() {
        console.log('🛑 Cancelando ação em massa...');
        this.massActionCancelled = true;
        this.hideMassActionProgress();
        alert('Operação cancelada pelo usuário');
    }

    // Obter próxima etapa
    getNextStage(currentStage) {
        const stages = this.getStageOrder();
        const currentIndex = stages.indexOf(currentStage);
        
        if (currentIndex === -1 || currentIndex === stages.length - 1) {
            return currentStage; // Já está na última etapa
        }
        
        return stages[currentIndex + 1];
    }

    // Obter etapa anterior
    getPreviousStage(currentStage) {
        const stages = this.getStageOrder();
        const currentIndex = stages.indexOf(currentStage);
        
        if (currentIndex === -1 || currentIndex === 0) {
            return currentStage; // Já está na primeira etapa
        }
        
        return stages[currentIndex - 1];
    }

    // Obter ordem das etapas
    getStageOrder() {
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29];
    }

    // Obter nome da etapa
    getStageName(stageNumber) {
        const stageNames = {
            1: '1 - Pedido criado',
            2: '2 - Preparando para envio',
            3: '3 - Vendedor enviou pedido',
            4: '4 - Centro triagem Shenzhen',
            5: '5 - Centro logístico Shenzhen',
            6: '6 - Trânsito internacional',
            7: '7 - Liberado exportação',
            8: '8 - Saiu origem Shenzhen',
            9: '9 - Chegou no Brasil',
            10: '10 - Trânsito Curitiba/PR',
            11: '11 - Alfândega importação',
            12: '12 - Liberado alfândega',
            13: '13 - Sairá para entrega',
            14: '14 - Em trânsito entrega',
            15: '15 - Rota de entrega',
            16: '16 - Tentativa entrega',
            17: '17 - 1ª Tentativa entrega',
            18: '18 - Reagendamento solicitado',
            19: '19 - Em rota de entrega',
            20: '20 - Saindo para entrega',
            21: '21 - 2ª Tentativa entrega',
            22: '22 - Reagendamento solicitado',
            23: '23 - Em rota de entrega',
            24: '24 - Saindo para entrega',
            25: '25 - 3ª Tentativa entrega',
            26: '26 - Reagendamento solicitado',
            27: '27 - Em rota de entrega',
            28: '28 - Saindo para entrega',
            29: '29 - 4ª Tentativa entrega'
        };
        
        return stageNames[stageNumber] || `Etapa ${stageNumber}`;
    }
    
    // Obter próxima etapa na sequência
    getNextStage(currentStage) {
        const currentIndex = this.stageOrder.findIndex(stage => stage.id === parseInt(currentStage));
        if (currentIndex === -1 || currentIndex === this.stageOrder.length - 1) {
            return currentStage; // Não avança se não encontrar ou se já for a última
        }
        return this.stageOrder[currentIndex + 1].id;
    }
    
    // Obter etapa anterior na sequência
    getPreviousStage(currentStage) {
        const currentIndex = this.stageOrder.findIndex(stage => stage.id === parseInt(currentStage));
        if (currentIndex === -1 || currentIndex === 0) {
            return currentStage; // Não volta se não encontrar ou se já for a primeira
        }
        return this.stageOrder[currentIndex - 1].id;
    }
    
    // Obter nome da etapa pelo ID
    getStageName(stageId) {
        const stage = this.stageOrder.find(s => s.id === parseInt(stageId));
        return stage ? stage.name : `Etapa ${stageId}`;
    }

    async handleMassAction(action) {
        if (this.selectedLeads.size === 0) {
            alert('Nenhum lead selecionado');
            return;
        }

        this.debugLog(`Iniciando ação em massa: ${action} para ${this.selectedLeads.size} leads`, 'info');
        
        const selectedIds = Array.from(this.selectedLeads);
        const selectedLeadsData = this.filteredLeads.filter(lead => selectedIds.includes(lead.id));
        
        // Mostrar barra de progresso
        this.showProgressBar(action, selectedLeadsData.length);
        
        let actionText = '';
        let targetStage = null;
        
        switch (action) {
            case 'next':
                actionText = 'Avançando etapas';
                break;
            case 'prev':
                actionText = 'Retrocedendo etapas';
                break;
            case 'set':
                actionText = 'Definindo etapas';
                targetStage = document.getElementById('targetStageSelect')?.value;
                if (!targetStage) {
                    this.hideProgressBar();
                    alert('Selecione uma etapa de destino');
                    return;
                }
                break;
            case 'delete':
                actionText = 'Excluindo leads';
                if (!confirm(`Tem certeza que deseja excluir ${selectedLeadsData.length} leads?`)) {
                    this.hideProgressBar();
                    return;
                }
                break;
        }

        // Executar ação diretamente com progresso
        await this.executeMassAction(action, selectedLeadsData, targetStage);
    }
    
    async executeMassAction(action, selectedLeadsData, targetStage = null) {
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < selectedLeadsData.length; i++) {
            const lead = selectedLeadsData[i];
            
            try {
                let newStage = lead.etapa_atual;
                
                switch (action) {
                    case 'next':
                        newStage = this.getNextStage(lead.etapa_atual);
                        break;
                    case 'prev':
                        newStage = this.getPreviousStage(lead.etapa_atual);
                        break;
                    case 'set':
                        newStage = parseInt(targetStage);
                        break;
                    case 'delete':
                        // Remover do array
                        const leadIndex = this.allLeads.findIndex(l => l.id === lead.id);
                        if (leadIndex !== -1) {
                            this.allLeads.splice(leadIndex, 1);
                        }
                        
                        // Remover do localStorage
                        const leads = JSON.parse(localStorage.getItem('leads') || '[]');
                        const updatedLeads = leads.filter(l => l.id !== lead.id);
                        localStorage.setItem('leads', JSON.stringify(updatedLeads));
                        
                        successCount++;
                        this.updateProgressBar(i + 1, selectedLeadsData.length);
                        continue;
                }
                
                // Atualizar etapa se não for delete
                if (action !== 'delete' && newStage !== lead.etapa_atual) {
                    lead.etapa_atual = newStage;
                    lead.updated_at = new Date().toISOString();
                    
                    // Atualizar no localStorage
                    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
                    const leadIndex = leads.findIndex(l => l.id === lead.id);
                    if (leadIndex !== -1) {
                        leads[leadIndex] = { ...leads[leadIndex], ...lead };
                        localStorage.setItem('leads', JSON.stringify(leads));
                    }
                    
                    this.debugLog(`Lead ${lead.nome_completo} atualizado para etapa ${newStage} (${this.getStageName(newStage)})`, 'info');
                }
                
                successCount++;
                
            } catch (error) {
                errorCount++;
                this.debugLog(`Erro ao processar lead ${lead.nome_completo}: ${error.message}`, 'error');
            }
            
            // Atualizar progresso
            this.updateProgressBar(i + 1, selectedLeadsData.length);
            
            // Pequeno delay para suavizar a execução
            if (i % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        // Finalizar progresso
        this.finishProgressBar(successCount, errorCount);
        
        // Limpar seleção e atualizar lista
        this.selectedLeads.clear();
        this.updateMassActionButtons();
        this.refreshLeads();
        
        this.debugLog(`Ação em massa concluída: ${successCount} sucessos, ${errorCount} erros`, successCount > 0 ? 'info' : 'error');
    }
    
    showProgressBar(action, total) {
        // Remover barra existente se houver
        this.hideProgressBar();
        
        const progressBar = document.createElement('div');
        progressBar.id = 'massActionProgressBar';
        progressBar.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 2px solid #345C7A;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        let actionText = '';
        switch (action) {
            case 'next': actionText = 'Avançando etapas'; break;
            case 'prev': actionText = 'Retrocedendo etapas'; break;
            case 'set': actionText = 'Definindo etapas'; break;
            case 'delete': actionText = 'Excluindo leads'; break;
        }
        
        progressBar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                <i class="fas fa-cog fa-spin" style="color: #345C7A; font-size: 1.2rem;"></i>
                <div>
                    <div style="font-weight: 600; color: #345C7A; font-size: 1rem;">${actionText}...</div>
                    <div id="progressText" style="color: #666; font-size: 0.9rem;">0 de ${total} concluídos</div>
                </div>
                <button id="cancelMassAction" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 6px 12px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    margin-left: auto;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div style="background: #e9ecef; border-radius: 8px; height: 8px; overflow: hidden;">
                <div id="progressFill" style="
                    background: linear-gradient(45deg, #345C7A, #2c4a63);
                    height: 100%;
                    width: 0%;
                    transition: width 0.3s ease;
                "></div>
            </div>
        `;
        
        document.body.appendChild(progressBar);
        
        // Configurar botão de cancelar
        document.getElementById('cancelMassAction')?.addEventListener('click', () => {
            this.hideProgressBar();
            this.debugLog('Ação em massa cancelada pelo usuário', 'info');
        });
        
        // Adicionar CSS de animação se não existir
        if (!document.getElementById('progressAnimations')) {
            const style = document.createElement('style');
            style.id = 'progressAnimations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    updateProgressBar(current, total) {
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        
        if (progressText && progressFill) {
            const percentage = (current / total) * 100;
            progressText.textContent = `${current} de ${total} concluídos`;
            progressFill.style.width = `${percentage}%`;
        }
    }
    
    finishProgressBar(successCount, errorCount) {
        const progressBar = document.getElementById('massActionProgressBar');
        if (!progressBar) return;
        
        // Mostrar resultado final
        progressBar.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; text-align: center;">
                <i class="fas fa-check-circle" style="color: #27ae60; font-size: 1.5rem;"></i>
                <div>
                    <div style="font-weight: 600; color: #27ae60; font-size: 1rem;">Concluído!</div>
                    <div style="color: #666; font-size: 0.9rem;">
                        ${successCount} sucessos${errorCount > 0 ? `, ${errorCount} erros` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Remover após 2 segundos
        setTimeout(() => {
            this.hideProgressBar();
        }, 2000);
    }
    
    hideProgressBar() {
        const progressBar = document.getElementById('massActionProgressBar');
        if (progressBar) {
            progressBar.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (progressBar.parentNode) {
                    progressBar.remove();
                }
            }, 300);
        }
    }

    setupEditModal() {
        const editModal = document.getElementById('editModal');
        const closeEditModal = document.getElementById('closeEditModal');
        const cancelEdit = document.getElementById('cancelEdit');
        const editForm = document.getElementById('editForm');

        // Fechar modal
        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => {
                this.closeEditModal();
            });
        }

        // Fechar ao clicar fora
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    this.closeEditModal();
                }
            });
        }

        // Submissão do formulário de edição
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEditedLead();
            });
        }

        this.debugLog('info', 'Modal de edição configurado', 'setupEditModal');
    }

    setupActionButtons() {
        // Botão de atualizar
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshLeads();
            });
        }

        // Configurar eventos de edição na tabela (delegação de eventos)
        const leadsTable = document.getElementById('leadsTable');
        if (leadsTable) {
            leadsTable.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-button') || e.target.closest('.edit-button')) {
                    const button = e.target.classList.contains('edit-button') ? e.target : e.target.closest('.edit-button');
                    const leadId = button.dataset.leadId;
                    if (leadId) {
                        this.editLead(leadId);
                    }
                }
            });
        }
    }

    setupMassSelectionControls() {
        // Botão Selecionar Todos
        const selectAllButton = document.getElementById('selectAllLeadsButton');
        if (selectAllButton) {
            selectAllButton.addEventListener('click', () => {
                this.selectAllVisibleLeads();
            });
        }

        // Botão Desmarcar Todos
        const deselectAllButton = document.getElementById('deselectAllLeadsButton');
        if (deselectAllButton) {
            deselectAllButton.addEventListener('click', () => {
                this.deselectAllLeads();
            });
        }
    }
    
    // ===== SISTEMA DE DEBUG =====
    setupDebugSystem() {
        console.log('🐛 Configurando sistema de debug...');
        
        // Criar botão de debug flutuante
        this.createDebugButton();
        
        // Criar painel de debug
        this.createDebugPanel();
        
        // Interceptar erros globais
        this.setupErrorInterception();
        
        // Log inicial
        this.addDebugLog('Sistema de debug inicializado', 'Sistema', 'info');
        
        console.log('✅ Sistema de debug configurado');
    }
    
    createDebugButton() {
        const debugButton = document.createElement('div');
        debugButton.id = 'debugButton';
        debugButton.innerHTML = `
            <i class="fas fa-bug"></i>
            <span id="debugCounter" class="debug-counter">0</span>
        `;
        debugButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: #6c757d;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            transition: all 0.3s ease;
            font-size: 18px;
            border: 2px solid #495057;
        `;
        
        debugButton.addEventListener('click', () => {
            this.toggleDebugPanel();
        });
        
        debugButton.addEventListener('mouseenter', function() {
            this.style.background = '#495057';
            this.style.transform = 'scale(1.1)';
        });
        
        debugButton.addEventListener('mouseleave', function() {
            this.style.background = '#6c757d';
            this.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(debugButton);
    }
    
    createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debugPanel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: #2c3e50;
            color: white;
            z-index: 9998;
            transition: right 0.3s ease;
            box-shadow: -4px 0 15px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            font-family: 'Courier New', monospace;
        `;
        
        debugPanel.innerHTML = `
            <div style="
                padding: 20px;
                background: #34495e;
                border-bottom: 1px solid #4a5f7a;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; color: #ecf0f1;">
                    <i class="fas fa-bug"></i> Debug Console
                </h3>
                <div style="display: flex; gap: 10px;">
                    <button id="clearDebugButton" style="
                        background: #e74c3c;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">
                        <i class="fas fa-trash"></i> Limpar
                    </button>
                    <button id="closeDebugButton" style="
                        background: #95a5a6;
                        color: white;
                        border: none;
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div style="
                padding: 15px;
                background: #2c3e50;
                border-bottom: 1px solid #4a5f7a;
                font-size: 12px;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Total de logs: <span id="totalLogsCount">0</span></span>
                    <span>Erros: <span id="errorLogsCount" style="color: #e74c3c;">0</span></span>
                </div>
                <div style="display: flex; gap: 10px;">
                    <label style="display: flex; align-items: center; gap: 5px; font-size: 11px;">
                        <input type="checkbox" id="showInfoLogs" checked> Info
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; font-size: 11px;">
                        <input type="checkbox" id="showWarningLogs" checked> Avisos
                    </label>
                    <label style="display: flex; align-items: center; gap: 5px; font-size: 11px;">
                        <input type="checkbox" id="showErrorLogs" checked> Erros
                    </label>
                </div>
            </div>
            
            <div id="debugLogContainer" style="
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                font-size: 11px;
                line-height: 1.4;
            ">
                <!-- Logs serão inseridos aqui -->
            </div>
        `;
        
        document.body.appendChild(debugPanel);
        
        // Configurar eventos
        document.getElementById('closeDebugButton').addEventListener('click', () => {
            this.toggleDebugPanel();
        });
        
        document.getElementById('clearDebugButton').addEventListener('click', () => {
            this.clearDebugLogs();
        });
        
        // Filtros de log
        ['showInfoLogs', 'showWarningLogs', 'showErrorLogs'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.updateDebugDisplay();
            });
        });
    }
    
    setupErrorInterception() {
        // Interceptar erros JavaScript globais
        window.addEventListener('error', (event) => {
            this.addDebugLog(
                `Erro JavaScript: ${event.message}`,
                `${event.filename}:${event.lineno}`,
                'error'
            );
        });
        
        // Interceptar promessas rejeitadas
        window.addEventListener('unhandledrejection', (event) => {
            this.addDebugLog(
                `Promise rejeitada: ${event.reason}`,
                'Promise',
                'error'
            );
        });
        
        // Interceptar console.error (opcional)
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.addDebugLog(
                args.join(' '),
                'Console',
                'error'
            );
            originalConsoleError.apply(console, args);
        };
    }
    
    addDebugLog(message, source, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
        
        const logEntry = {
            id: Date.now() + Math.random(),
            timestamp,
            message,
            source,
            type,
            fullTimestamp: new Date().toISOString()
        };
        
        this.debugLogs.unshift(logEntry);
        
        // Limitar número de logs
        if (this.debugLogs.length > this.maxDebugLogs) {
            this.debugLogs = this.debugLogs.slice(0, this.maxDebugLogs);
        }
        
        // Atualizar contador no botão
        this.updateDebugCounter();
        
        // Atualizar display se painel estiver aberto
        if (this.debugVisible) {
            this.updateDebugDisplay();
        }
        
        // Log no console para desenvolvimento
        console.log(`🐛 [${type.toUpperCase()}] ${source}: ${message}`);
    }
    
    updateDebugCounter() {
        const counter = document.getElementById('debugCounter');
        const button = document.getElementById('debugButton');
        
        if (counter && button) {
            const errorCount = this.debugLogs.filter(log => log.type === 'error').length;
            
            if (errorCount > 0) {
                counter.textContent = errorCount;
                counter.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #e74c3c;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                `;
                button.style.background = '#e74c3c';
            } else {
                counter.textContent = this.debugLogs.length;
                counter.style.display = this.debugLogs.length > 0 ? 'flex' : 'none';
                button.style.background = '#6c757d';
            }
        }
    }
    
    updateDebugDisplay() {
        const container = document.getElementById('debugLogContainer');
        const totalCount = document.getElementById('totalLogsCount');
        const errorCount = document.getElementById('errorLogsCount');
        
        if (!container) return;
        
        // Obter filtros ativos
        const showInfo = document.getElementById('showInfoLogs')?.checked;
        const showWarning = document.getElementById('showWarningLogs')?.checked;
        const showError = document.getElementById('showErrorLogs')?.checked;
        
        // Filtrar logs
        const filteredLogs = this.debugLogs.filter(log => {
            if (log.type === 'info' && !showInfo) return false;
            if (log.type === 'warning' && !showWarning) return false;
            if (log.type === 'error' && !showError) return false;
            return true;
        });
        
        // Atualizar contadores
        if (totalCount) totalCount.textContent = this.debugLogs.length;
        if (errorCount) errorCount.textContent = this.debugLogs.filter(log => log.type === 'error').length;
        
        // Renderizar logs
        container.innerHTML = filteredLogs.map(log => {
            const typeColors = {
                info: '#3498db',
                warning: '#f39c12',
                error: '#e74c3c'
            };
            
            const typeIcons = {
                info: 'fas fa-info-circle',
                warning: 'fas fa-exclamation-triangle',
                error: 'fas fa-times-circle'
            };
            
            return `
                <div style="
                    margin-bottom: 8px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    border-left: 3px solid ${typeColors[log.type]};
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 4px;
                    ">
                        <span style="
                            color: ${typeColors[log.type]};
                            font-weight: bold;
                            font-size: 10px;
                        ">
                            <i class="${typeIcons[log.type]}"></i>
                            ${log.type.toUpperCase()}
                        </span>
                        <span style="color: #95a5a6; font-size: 10px;">
                            ${log.timestamp}
                        </span>
                    </div>
                    <div style="color: #ecf0f1; margin-bottom: 2px;">
                        ${log.message}
                    </div>
                    <div style="color: #95a5a6; font-size: 10px;">
                        Origem: ${log.source}
                    </div>
                </div>
            `;
        }).join('');
        
        // Scroll para o topo (logs mais recentes)
        container.scrollTop = 0;
    }
    
    toggleDebugPanel() {
        const panel = document.getElementById('debugPanel');
        if (!panel) return;
        
        this.debugVisible = !this.debugVisible;
        
        if (this.debugVisible) {
            panel.style.right = '0px';
            this.updateDebugDisplay();
        } else {
            panel.style.right = '-400px';
        }
    }
    
    clearDebugLogs() {
        if (confirm('Tem certeza que deseja limpar todos os logs de debug?')) {
            this.debugLogs = [];
            this.updateDebugCounter();
            this.updateDebugDisplay();
            this.addDebugLog('Logs de debug limpos', 'Sistema', 'info');
        }
    }
    
    // Método para adicionar logs de debug de forma fácil
    debug(message, source = 'AdminPanel', type = 'info') {
        this.addDebugLog(message, source, type);
    }

    selectAllVisibleLeads() {
        console.log('📋 Selecionando todos os leads visíveis...');
        
        // Obter todos os checkboxes visíveis na página atual
        const visibleCheckboxes = document.querySelectorAll('#leadsTableBody input[type="checkbox"]:not(#selectAllLeads)');
        
        visibleCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                // Disparar evento change para atualizar contadores
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        // Atualizar checkbox principal
        const selectAllCheckbox = document.getElementById('selectAllLeads');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
        }

        this.updateMassActionButtons();
        console.log(`✅ ${visibleCheckboxes.length} leads selecionados`);
    }

    deselectAllLeads() {
        console.log('🔄 Desmarcando todos os leads...');
        
        // Desmarcar todos os checkboxes
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        allCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                // Disparar evento change para atualizar contadores
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        this.updateMassActionButtons();
        console.log('✅ Todos os leads desmarcados');
    }

    selectAllLeads() {
        try {
            this.debugLog('info', 'Selecionando todos os leads da página atual', 'selectAllLeads');
            
            const checkboxes = document.querySelectorAll('input[type="checkbox"][data-lead-id]');
            let selectedCount = 0;
            
            checkboxes.forEach(checkbox => {
                if (!checkbox.checked) {
                    checkbox.checked = true;
                    selectedCount++;
                }
            });
            
            // Atualizar checkbox "selecionar todos"
            const selectAllCheckbox = document.getElementById('selectAllLeads');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = true;
            }
            
            // Atualizar contadores
            this.updateMassActionButtons();
            
            this.debugLog('info', `${selectedCount} leads selecionados`, 'selectAllLeads');
            
        } catch (error) {
            this.debugLog('error', `Erro ao selecionar todos: ${error.message}`, 'selectAllLeads');
        }
    }

    showProgressBar(operation, total) {
        // Criar container da barra de progresso
        const progressContainer = document.createElement('div');
        progressContainer.id = 'massActionProgressContainer';
        progressContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 2px solid #345C7A;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;

        progressContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                <i class="fas fa-cogs" style="color: #345C7A; font-size: 1.2rem; animation: spin 1s linear infinite;"></i>
                <div>
                    <div style="font-weight: 600; color: #345C7A; font-size: 1rem;">${operation}</div>
                    <div id="progressText" style="color: #666; font-size: 0.9rem;">Iniciando...</div>
                </div>
            </div>
            <div style="background: #e9ecef; border-radius: 10px; height: 8px; overflow: hidden; margin-bottom: 10px;">
                <div id="progressBar" style="
                    background: linear-gradient(45deg, #345C7A, #4a6b8a);
                    height: 100%;
                    width: 0%;
                    transition: width 0.3s ease;
                    border-radius: 10px;
                "></div>
            </div>
            <div style="text-align: center;">
                <button id="cancelProgressButton" style="
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                ">
                    Cancelar
                </button>
            </div>
        `;

        // Adicionar CSS de animação se não existir
        if (!document.getElementById('progressAnimations')) {
            const style = document.createElement('style');
            style.id = 'progressAnimations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(progressContainer);

        // Configurar botão de cancelar
        const cancelButton = document.getElementById('cancelProgressButton');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.hideProgressBar();
            });
        }

        // Armazenar referências para atualização
        this.currentProgressTotal = total;
        this.currentProgressCount = 0;

        return {
            update: (current, total) => {
                const progressFill = document.getElementById('progressBar');
                const progressText = document.getElementById('progressText');
                
                if (progressFill && progressText) {
                    const percentage = (current / total) * 100;
                    progressFill.style.width = `${percentage}%`;
                    progressText.textContent = `${current} de ${total} concluídos`;
                }
            },
            complete: () => {
                const progressContainer = document.getElementById('massActionProgressContainer');
                if (progressContainer) {
                    // Mostrar ícone de sucesso
                    progressContainer.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 12px; text-align: center;">
                            <i class="fas fa-check-circle" style="color: #27ae60; font-size: 1.5rem;"></i>
                            <div>
                                <div style="font-weight: 600; color: #27ae60; font-size: 1rem;">Concluído!</div>
                                <div style="color: #666; font-size: 0.9rem;">Operação finalizada com sucesso</div>
                            </div>
                        </div>
                    `;
                    
                    // Remover após 2 segundos
                    setTimeout(() => {
                        this.hideProgressBar();
                    }, 2000);
                }
            }
        };
    }

    updateProgressBar(current, total, message = '') {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        if (progressBar && progressText) {
            const percentage = (current / total) * 100;
            progressBar.style.width = `${percentage}%`;
            
            const defaultMessage = `${current} de ${total} concluídos`;
            progressText.textContent = message || defaultMessage;
        }
    }

    hideProgressBar(showSuccess = false) {
        const progressContainer = document.getElementById('massActionProgressContainer');
        if (progressContainer) {
            if (showSuccess) {
                // Mostrar ícone de sucesso por 2 segundos
                progressContainer.innerHTML = `
                    <div style="text-align: center; padding: 10px;">
                        <i class="fas fa-check-circle" style="color: #27ae60; font-size: 2rem; margin-bottom: 10px;"></i>
                        <div style="color: #27ae60; font-weight: 600;">Operação concluída!</div>
                    </div>
                `;
                
                setTimeout(() => {
                    progressContainer.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => {
                        if (progressContainer.parentNode) {
                            progressContainer.remove();
                        }
                    }, 300);
                }, 2000);
            } else {
                progressContainer.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (progressContainer.parentNode) {
                        progressContainer.remove();
                    }
                }, 300);
            }
        }
    }

    setupBulkImportEvents() {
        console.log('🔧 Configurando eventos de importação em massa...');

        // Botão de pré-visualização - CORRIGIDO
        const previewButton = document.getElementById('previewBulkDataButton');
        if (previewButton) {
            previewButton.addEventListener('click', () => {
                console.log('🔍 Botão de pré-visualização clicado');
                this.previewBulkData();
            });
        }

        // Botão de limpar dados
        const clearButton = document.getElementById('clearBulkDataButton');
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                this.clearBulkData();
            });
        }

        // Botão de confirmar importação
        const confirmButton = document.getElementById('confirmBulkImportButton');
        if (confirmButton) {
            confirmButton.addEventListener('click', () => {
                this.confirmBulkImport();
            });
        }

        // Botão de editar dados
        const editButton = document.getElementById('editBulkDataButton');
        if (editButton) {
            editButton.addEventListener('click', () => {
                this.editBulkData();
            });
        }

        console.log('✅ Eventos de importação em massa configurados');
    }

    // FUNÇÃO CORRIGIDA - Pré-visualização de dados em massa
    previewBulkData() {
        console.log('🔍 Iniciando pré-visualização de dados em massa...');

        const textarea = document.getElementById('bulkDataTextarea');
        if (!textarea) {
            console.error('❌ Textarea não encontrado');
            return;
        }

        const rawData = textarea.value;
        console.log('📝 Dados brutos obtidos:', {
            length: rawData.length,
            hasContent: !!rawData.trim(),
            firstChars: rawData.substring(0, 100)
        });

        // CORREÇÃO: Verificação mais precisa de dados vazios
        if (!rawData || rawData.trim().length === 0) {
            console.warn('⚠️ Nenhum dado encontrado no textarea');
            this.showError('Por favor, cole os dados da planilha no campo de texto.');
            return;
        }

        try {
            // Parse dos dados - FUNÇÃO CORRIGIDA
            const parsedData = this.parseRawBulkData(rawData);
            
            if (!parsedData.success) {
                console.error('❌ Erro no parse:', parsedData.error);
                this.showError(parsedData.error);
                return;
            }

            console.log('✅ Dados parseados com sucesso:', {
                totalLeads: parsedData.leads.length,
                errors: parsedData.errors.length,
                duplicates: parsedData.duplicates.length
            });

            // Armazenar dados para importação posterior
            this.bulkImportData = parsedData.leads;

            // Mostrar pré-visualização
            this.displayBulkPreview(parsedData);

        } catch (error) {
            console.error('💥 Erro na pré-visualização:', error);
            this.showError(`Erro ao processar dados: ${error.message}`);
        }
    }

    // FUNÇÃO COMPLETAMENTE REESCRITA - Parse de dados brutos
    parseRawBulkData(rawData) {
        console.log('📊 Iniciando parse de dados brutos...');
        
        try {
            // Limpar e dividir em linhas
            const lines = rawData.trim().split('\n').filter(line => line.trim().length > 0);
            
            if (lines.length === 0) {
                return {
                    success: false,
                    error: 'Nenhuma linha válida encontrada nos dados colados.'
                };
            }

            console.log(`📋 Total de linhas para processar: ${lines.length}`);

            const leads = [];
            const errors = [];
            const duplicates = [];
            const processedCPFs = new Set();

            // Obter leads existentes no banco
            const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
            const existingCPFs = new Set(existingLeads.map(lead => 
                lead.cpf ? lead.cpf.replace(/[^\d]/g, '') : ''
            ));

            console.log(`🗄️ CPFs existentes no banco: ${existingCPFs.size}`);

            for (let i = 0; i < lines.length; i++) {
                const lineNumber = i + 1;
                const line = lines[i].trim();
                
                if (!line) continue;

                console.log(`📝 Processando linha ${lineNumber}: ${line.substring(0, 100)}...`);

                try {
                    // DETECÇÃO INTELIGENTE DE SEPARADORES
                    let fields = [];
                    
                    // Tentar TAB primeiro (formato de planilha)
                    if (line.includes('\t')) {
                        fields = line.split('\t');
                        console.log(`🔍 Linha ${lineNumber}: Detectado separador TAB, ${fields.length} campos`);
                    }
                    // Tentar espaços múltiplos
                    else if (line.includes('  ')) {
                        fields = line.split(/\s{2,}/); // 2 ou mais espaços
                        console.log(`🔍 Linha ${lineNumber}: Detectado espaços múltiplos, ${fields.length} campos`);
                    }
                    // Tentar espaço simples
                    else {
                        fields = line.split(/\s+/); // Um ou mais espaços
                        console.log(`🔍 Linha ${lineNumber}: Detectado espaço simples, ${fields.length} campos`);
                    }

                    // Limpar campos
                    fields = fields.map(field => field.trim()).filter(field => field.length > 0);

                    console.log(`📊 Linha ${lineNumber}: ${fields.length} campos após limpeza:`, fields);

                    // Verificar número mínimo de campos
                    if (fields.length < 4) {
                        errors.push({
                            line: lineNumber,
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

                    console.log(`👤 Linha ${lineNumber} - Dados extraídos:`, {
                        nome: nomeCompleto,
                        email: email,
                        telefone: telefone,
                        cpf: documento
                    });

                    // VALIDAÇÕES OBRIGATÓRIAS
                    if (!nomeCompleto || nomeCompleto.length < 2) {
                        errors.push({
                            line: lineNumber,
                            error: 'Nome do cliente é obrigatório e deve ter pelo menos 2 caracteres',
                            data: line
                        });
                        continue;
                    }

                    if (!email || !email.includes('@')) {
                        errors.push({
                            line: lineNumber,
                            error: 'Email é obrigatório e deve ser válido',
                            data: line
                        });
                        continue;
                    }

                    if (!telefone || telefone.replace(/[^\d]/g, '').length < 10) {
                        errors.push({
                            line: lineNumber,
                            error: 'Telefone é obrigatório e deve ter pelo menos 10 dígitos',
                            data: line
                        });
                        continue;
                    }

                    const cleanCPF = documento ? documento.replace(/[^\d]/g, '') : '';
                    if (!cleanCPF || cleanCPF.length !== 11) {
                        errors.push({
                            line: lineNumber,
                            error: 'CPF é obrigatório e deve ter exatamente 11 dígitos',
                            data: line
                        });
                        continue;
                    }

                    // Verificar duplicatas na lista atual
                    if (processedCPFs.has(cleanCPF)) {
                        duplicates.push({
                            line: lineNumber,
                            cpf: cleanCPF,
                            nome: nomeCompleto,
                            type: 'lista'
                        });
                        continue;
                    }

                    // Verificar duplicatas no banco
                    if (existingCPFs.has(cleanCPF)) {
                        duplicates.push({
                            line: lineNumber,
                            cpf: cleanCPF,
                            nome: nomeCompleto,
                            type: 'banco'
                        });
                        continue;
                    }

                    // Processar valor
                    const valorProcessado = this.parseValue(valorTotal);

                    // Construir endereço completo
                    const enderecoCompleto = this.buildFullAddress({
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
                        lineNumber: lineNumber
                    };

                    leads.push(leadData);
                    processedCPFs.add(cleanCPF);

                    console.log(`✅ Linha ${lineNumber}: Lead criado com sucesso para ${nomeCompleto}`);

                } catch (lineError) {
                    console.error(`❌ Erro na linha ${lineNumber}:`, lineError);
                    errors.push({
                        line: lineNumber,
                        error: `Erro ao processar linha: ${lineError.message}`,
                        data: line
                    });
                }
            }

            console.log('📊 Resultado final do parse:', {
                leadsValidos: leads.length,
                erros: errors.length,
                duplicatas: duplicates.length
            });

            return {
                success: true,
                leads: leads,
                errors: errors,
                duplicates: duplicates,
                totalProcessed: lines.length
            };

        } catch (error) {
            console.error('💥 Erro crítico no parse:', error);
            return {
                success: false,
                error: `Erro crítico ao processar dados: ${error.message}`
            };
        }
    }

    // Função auxiliar para processar valores
    parseValue(value) {
        if (!value) return 47.39;
        
        // Converter vírgula para ponto e remover espaços
        const cleanValue = value.toString().replace(',', '.').trim();
        const parsed = parseFloat(cleanValue);
        
        return isNaN(parsed) ? 47.39 : parsed;
    }

    // Função auxiliar para construir endereço completo
    buildFullAddress({ endereco, numero, complemento, bairro, cep, cidade, estado, pais }) {
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

    // Exibir pré-visualização - FUNÇÃO CORRIGIDA
    displayBulkPreview(parsedData) {
        console.log('🖥️ Exibindo pré-visualização...');

        const previewSection = document.getElementById('bulkPreviewSection');
        const previewContainer = document.getElementById('bulkPreviewContainer');
        const previewSummary = document.getElementById('previewSummary');
        const confirmButton = document.getElementById('confirmBulkImportButton');

        if (!previewSection || !previewContainer) {
            console.error('❌ Elementos de pré-visualização não encontrados');
            return;
        }

        // Mostrar seção
        previewSection.style.display = 'block';

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
                        ${this.truncateText(lead.nome_completo, 20)}
                    </td>
                    <td style="padding: 6px; border: 1px solid #ddd;" title="${lead.email}">
                        ${this.truncateText(lead.email, 25)}
                    </td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${lead.telefone}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${CPFValidator.formatCPF(lead.cpf)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;" title="${lead.produto}">
                        ${this.truncateText(lead.produto, 30)}
                    </td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">
                        R$ ${lead.valor_total.toFixed(2)}
                    </td>
                    <td style="padding: 6px; border: 1px solid #ddd;" title="${lead.endereco}">
                        ${this.truncateText(lead.endereco, 35)}
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        // Adicionar seção de erros se houver
        if (parsedData.errors.length > 0 || parsedData.duplicates.length > 0) {
            tableHTML += `
                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
                    <h5 style="color: #856404; margin-bottom: 10px;">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Problemas Encontrados (${parsedData.errors.length + parsedData.duplicates.length})
                    </h5>
                    <div style="max-height: 150px; overflow-y: auto;">
            `;

            // Mostrar erros (limitado a 10)
            const allIssues = [...parsedData.errors, ...parsedData.duplicates];
            allIssues.slice(0, 10).forEach(issue => {
                const type = issue.type ? `Duplicata (${issue.type})` : 'Erro';
                tableHTML += `
                    <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #dc3545;">
                        <strong>Linha ${issue.line}:</strong> ${type} - ${issue.error || `CPF ${CPFValidator.formatCPF(issue.cpf)} já existe`}
                    </div>
                `;
            });

            if (allIssues.length > 10) {
                tableHTML += `
                    <div style="text-align: center; color: #666; font-style: italic; margin-top: 10px;">
                        ... e mais ${allIssues.length - 10} problemas
                    </div>
                `;
            }

            tableHTML += `
                    </div>
                </div>
            `;
        }

        previewContainer.innerHTML = tableHTML;

        // Atualizar resumo
        if (previewSummary) {
            previewSummary.innerHTML = `
                <i class="fas fa-info-circle"></i>
                ${parsedData.leads.length} registros válidos, 
                ${parsedData.errors.length} erros, 
                ${parsedData.duplicates.length} duplicatas
            `;
        }

        // Mostrar/ocultar botão de confirmação
        if (confirmButton) {
            if (parsedData.leads.length > 0) {
                confirmButton.style.display = 'inline-block';
                confirmButton.textContent = `Importar ${parsedData.leads.length} Registros`;
            } else {
                confirmButton.style.display = 'none';
            }
        }

        console.log('✅ Pré-visualização exibida com sucesso');
    }

    // Função auxiliar para truncar texto
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Confirmar importação em massa - MANTIDA A LÓGICA ORIGINAL
    async confirmBulkImport() {
        if (this.isImporting) {
            console.warn('⚠️ Importação já em andamento');
            return;
        }

        if (!this.bulkImportData || this.bulkImportData.length === 0) {
            this.showError('Nenhum dado válido para importar');
            return;
        }

        this.isImporting = true;
        console.log(`🚀 Iniciando importação de ${this.bulkImportData.length} leads...`);

        // Mostrar progresso
        this.showImportProgress();

        try {
            const results = {
                success: 0,
                errors: 0,
                total: this.bulkImportData.length
            };

            // Importar leads um por um (mantendo lógica original)
            for (let i = 0; i < this.bulkImportData.length; i++) {
                const lead = this.bulkImportData[i];
                
                try {
                    // Adicionar timestamps
                    lead.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    lead.created_at = new Date().toISOString();
                    lead.updated_at = new Date().toISOString();

                    // Salvar no localStorage (mantendo lógica original)
                    const existingLeads = JSON.parse(localStorage.getItem('leads') || '[]');
                    existingLeads.push(lead);
                    localStorage.setItem('leads', JSON.stringify(existingLeads));

                    results.success++;
                    console.log(`✅ Lead ${i + 1}/${this.bulkImportData.length} importado: ${lead.nome_completo}`);

                } catch (error) {
                    console.error(`❌ Erro ao importar lead ${i + 1}:`, error);
                    results.errors++;
                    this.debug(`Erro ao importar dados em massa: ${error.message}`, 'confirmBulkImport', 'error');
                }

                // Atualizar progresso
                this.updateImportProgress(i + 1, this.bulkImportData.length);
                
                // Pequeno delay para não travar a interface
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Finalizar importação
            this.finishImport(results);

        } catch (error) {
            console.error('💥 Erro crítico na importação:', error);
            this.showError(`Erro na importação: ${error.message}`);
            this.debug(`Erro ao importar dados em massa: ${error.message}`, 'confirmBulkImport', 'error');
        } finally {
            this.isImporting = false;
        }
    }

    showImportProgress() {
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
                <div id="importProgressText">0 / ${this.bulkImportData.length} leads processados</div>
            </div>
        `;
    }

    updateImportProgress(current, total) {
        const progressFill = document.getElementById('importProgressFill');
        const progressText = document.getElementById('importProgressText');

        if (progressFill && progressText) {
            const percentage = (current / total) * 100;
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${current} / ${total} leads processados`;
        }
    }

    finishImport(results) {
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
                    <button onclick="adminPanel.showView('leadsView'); adminPanel.refreshLeads();" style="
                        background: #345C7A; 
                        color: white; 
                        border: none; 
                        padding: 12px 25px; 
                        border-radius: 8px; 
                        cursor: pointer;
                        font-weight: 600;
                    ">
                        <i class="fas fa-list"></i> Ver Lista de Leads
                    </button>
                </div>
            `;
        }

        // Limpar dados
        this.clearBulkData();
        
        // Atualizar lista de leads
        this.refreshLeads();

        console.log(`🎉 Importação finalizada: ${results.success} sucessos, ${results.errors} erros`);
    }

    clearBulkData() {
        const textarea = document.getElementById('bulkDataTextarea');
        const previewSection = document.getElementById('bulkPreviewSection');
        const resultsSection = document.getElementById('bulkResultsSection');

        if (textarea) textarea.value = '';
        if (previewSection) previewSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';

        this.bulkImportData = [];
        console.log('🧹 Dados de importação limpos');
    }

    editBulkData() {
        const previewSection = document.getElementById('bulkPreviewSection');
        if (previewSection) {
            previewSection.style.display = 'none';
        }
        this.bulkImportData = [];
    }

    async executeMassAction(action, selectedLeads, targetStage = null) {
        console.log(`🚀 Executando ação em massa: ${action} para ${selectedLeads.length} leads`);
        
        // Mostrar barra de progresso
        const operationNames = {
            'next': 'Avançando Etapas',
            'prev': 'Retrocedendo Etapas', 
            'set': 'Definindo Etapas',
            'delete': 'Excluindo Leads'
        };
        
        const progressBar = this.showProgressBar(
            operationNames[action] || 'Processando',
            selectedLeads.length
        );

        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        // Processar leads um por um
        for (let i = 0; i < selectedLeads.length; i++) {
            const lead = selectedLeads[i];
            
            // Atualizar progresso
            progressBar.update(i + 1, selectedLeads.length);
            
            try {
                let success = false;
                
                switch (action) {
                    case 'next':
                        success = await this.nextStage(lead.id);
                        break;
                    case 'prev':
                        success = await this.prevStage(lead.id);
                        break;
                    case 'set':
                        success = await this.setStage(lead.id, targetStage);
                        break;
                    case 'delete':
                        success = await this.deleteLead(lead.id);
                        break;
                }
                
                if (success) {
                    successCount++;
                } else {
                    errorCount++;
                    errors.push({
                        lead: lead.nome_completo,
                        error: 'Operação falhou'
                    });
                }
            } catch (error) {
                console.error(`❌ Erro ao processar lead ${lead.id}:`, error);
                errorCount++;
                errors.push({
                    lead: lead.nome_completo,
                    error: error.message
                });
            }
            
            // Pequeno delay para suavizar a interface
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        // Finalizar barra de progresso
        progressBar.complete();
        
        console.log(`✅ Ação em massa concluída: ${successCount} sucessos, ${errorCount} erros`);
        
        // Atualizar lista
        await this.refreshLeads();
        
        // Limpar seleções
        this.clearAllSelections();
        
        // Mostrar resultado
        if (errorCount > 0) {
            alert(`Operação concluída com ${errorCount} erros. Verifique o console para detalhes.`);
        } else {
            console.log(`🎉 Operação concluída com sucesso para todos os ${successCount} leads`);
        }
    }

    // Resto das funções mantidas como estavam...
    showView(viewName) {
        // Ocultar todas as views
        document.querySelectorAll('.admin-view').forEach(view => {
            view.style.display = 'none';
        });

        // Remover classe active de todos os botões
        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar view selecionada
        const targetView = document.getElementById(viewName);
        if (targetView) {
            targetView.style.display = 'block';
        }

        // Adicionar classe active ao botão correspondente
        const buttonMap = {
            'leadsView': 'showLeadsView',
            'addLeadView': 'showAddLeadView',
            'bulkAddView': 'showBulkAddView'
        };

        const activeButton = document.getElementById(buttonMap[viewName]);
        if (activeButton) {
            activeButton.classList.add('active');
        }

        this.currentView = viewName;

        // Carregar dados específicos da view
        if (viewName === 'leadsView') {
            this.refreshLeads();
        }
    }

    async loadLeads() {
        try {
            const result = await this.dbService.getData();
            if (result.success) {
                this.leads = result.data || [];
                this.filteredLeads = [...this.leads];
                this.updateLeadsDisplay();
                console.log(`📊 ${this.leads.length} leads carregados`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar leads:', error);
        }
    }

    async refreshLeads() {
        console.log('🔄 Atualizando lista de leads...');
        await this.loadLeads();
        this.applyFilters();
    }

    applyFilters() {
        const searchInput = document.getElementById('searchInput');
        const dateFilter = document.getElementById('dateFilter');
        const stageFilter = document.getElementById('stageFilter');

        let filtered = [...this.leads];

        // Filtro de busca
        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.toLowerCase();
            filtered = filtered.filter(lead => 
                (lead.nome_completo && lead.nome_completo.toLowerCase().includes(searchTerm)) ||
                (lead.cpf && lead.cpf.includes(searchTerm.replace(/[^\d]/g, '')))
            );
        }

        // Filtro de data
        if (dateFilter && dateFilter.value) {
            const filterDate = new Date(dateFilter.value);
            filtered = filtered.filter(lead => {
                const leadDate = new Date(lead.created_at);
                return leadDate.toDateString() === filterDate.toDateString();
            });
        }

        // Filtro de etapa - INCLUINDO NOVO FILTRO "AGUARDANDO PAGAMENTO"
        if (stageFilter && stageFilter.value && stageFilter.value !== 'all') {
            if (stageFilter.value === 'awaiting_payment') {
                // Novo filtro: Aguardando Pagamento
                filtered = filtered.filter(lead => {
                    const etapa = lead.etapa_atual || 1;
                    const statusPagamento = lead.status_pagamento || 'pendente';
                    
                    // Etapa 11 (taxa alfandegária) com pagamento pendente
                    if (etapa === 11 && statusPagamento === 'pendente') {
                        return true;
                    }
                    
                    // Etapas de tentativa de entrega (16, 106, 116, etc.)
                    if (etapa === 16 || etapa === 106 || etapa === 116 || etapa === 126) {
                        return true;
                    }
                    
                    return false;
                });
            } else {
                const targetStage = parseInt(stageFilter.value);
                filtered = filtered.filter(lead => (lead.etapa_atual || 1) === targetStage);
            }
        }

        this.filteredLeads = filtered;
        this.currentPage = 1;
        this.updateLeadsDisplay();

        console.log(`🔍 Filtros aplicados: ${filtered.length} leads encontrados`);
    }

    updateLeadsDisplay() {
        const tableBody = document.getElementById('leadsTableBody');
        const leadsCount = document.getElementById('leadsCount');
        const emptyState = document.getElementById('emptyState');
        const paginationControls = document.getElementById('paginationControls');

        if (!tableBody) return;

        // Atualizar contador
        if (leadsCount) {
            const awaitingPayment = this.leads.filter(lead => {
                const etapa = lead.etapa_atual || 1;
                const statusPagamento = lead.status_pagamento || 'pendente';
                return (etapa === 11 && statusPagamento === 'pendente') || 
                       etapa === 16 || etapa === 106 || etapa === 116 || etapa === 126;
            }).length;

            leadsCount.innerHTML = `
                ${this.filteredLeads.length} leads
                ${awaitingPayment > 0 ? `<span style="background: #ffc107; color: #212529; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-left: 8px;">💳 ${awaitingPayment} aguardando pagamento</span>` : ''}
            `;
        }

        // Calcular paginação
        const startIndex = (this.currentPage - 1) * this.leadsPerPage;
        const endIndex = startIndex + this.leadsPerPage;
        const paginatedLeads = this.filteredLeads.slice(startIndex, endIndex);

        if (paginatedLeads.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            if (paginationControls) paginationControls.style.display = 'none';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (paginationControls) paginationControls.style.display = 'flex';

        // Renderizar leads
        tableBody.innerHTML = paginatedLeads.map(lead => {
            const etapa = lead.etapa_atual || 1;
            const statusPagamento = lead.status_pagamento || 'pendente';
            
            // Determinar nome da etapa
            let etapaNome = this.getStageDisplayName(etapa);
            
            // Indicador de pagamento pendente
            let paymentIndicator = '';
            if ((etapa === 11 && statusPagamento === 'pendente') || 
                etapa === 16 || etapa === 106 || etapa === 116 || etapa === 126) {
                paymentIndicator = ' 💳';
                etapaNome += ' (Aguardando Pagamento)';
            }

            return `
                <tr>
                    <td>
                        <input type="checkbox" class="lead-checkbox" data-lead-id="${lead.id}" 
                               onchange="adminPanel.toggleLeadSelection('${lead.id}', this.checked)">
                    </td>
                    <td title="${lead.nome_completo || 'N/A'}">${this.truncateText(lead.nome_completo || 'N/A', 20)}</td>
                    <td>${CPFValidator.formatCPF(lead.cpf || '')}</td>
                    <td title="${lead.email || 'N/A'}">${this.truncateText(lead.email || 'N/A', 25)}</td>
                    <td>${lead.telefone || 'N/A'}</td>
                    <td title="${lead.produto || 'N/A'}">${this.truncateText(lead.produto || 'N/A', 30)}</td>
                    <td>R$ ${(lead.valor_total || 0).toFixed(2)}</td>
                    <td>${this.formatDate(lead.created_at)}</td>
                    <td>
                        <span class="stage-badge ${this.getStageClass(etapa, statusPagamento)}">
                            ${etapa}${paymentIndicator}
                        </span>
                        <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">
                            ${etapaNome}
                        </div>
                    </td>
                    <td>${this.formatDate(lead.updated_at)}</td>
                    <td>
                        <div class="lead-actions">
                            <button class="action-button edit" onclick="adminPanel.editLead('${lead.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-button next" onclick="adminPanel.nextStage('${lead.id}')">
                                <i class="fas fa-forward"></i>
                            </button>
                            <button class="action-button prev" onclick="adminPanel.prevStage('${lead.id}')">
                                <i class="fas fa-backward"></i>
                            </button>
                            <button class="action-button delete" onclick="adminPanel.deleteLead('${lead.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Atualizar controles de paginação
        this.updatePaginationControls();
        
        // Atualizar seleção em massa
        this.updateMassActionButtons();
    }

    getStageDisplayName(etapa) {
        const stageNames = {
            1: 'Pedido criado',
            2: 'Preparando envio',
            3: 'Vendedor enviou',
            4: 'Centro triagem Shenzhen',
            5: 'Centro logístico Shenzhen',
            6: 'Trânsito internacional',
            7: 'Liberado exportação',
            8: 'Saiu origem Shenzhen',
            9: 'Chegou no Brasil',
            10: 'Trânsito Curitiba/PR',
            11: 'Alfândega importação',
            12: 'Liberado alfândega',
            13: 'Sairá para entrega',
            14: 'Em trânsito entrega',
            15: 'Rota de entrega',
            16: '1ª Tentativa entrega',
            // Ciclos de tentativas
            17: '1ª Tentativa entrega',
            18: 'Reagendamento solicitado',
            19: 'Em rota de entrega',
            20: 'Saindo para entrega',
            21: '2ª Tentativa entrega',
            22: 'Reagendamento solicitado',
            23: 'Em rota de entrega',
            24: 'Saindo para entrega',
            25: '3ª Tentativa entrega',
            26: 'Reagendamento solicitado',
            27: 'Em rota de entrega',
            28: 'Saindo para entrega',
            29: '4ª Tentativa entrega'
        };
        
        return stageNames[etapa] || `Etapa ${etapa}`;
    }

    getStageClass(etapa, statusPagamento) {
        if ((etapa === 11 && statusPagamento === 'pendente') || 
            etapa === 16 || etapa === 106 || etapa === 116 || etapa === 126) {
            return 'pending';
        }
        
        if (etapa >= 17 || statusPagamento === 'pago') {
            return 'completed';
        }
        
        return '';
    }

    // Adicionar filtro "Aguardando Pagamento" ao HTML
    addAwaitingPaymentFilter() {
        const stageFilter = document.getElementById('stageFilter');
        if (stageFilter && !document.querySelector('option[value="awaiting_payment"]')) {
            const option = document.createElement('option');
            option.value = 'awaiting_payment';
            option.textContent = '💳 Aguardando Pagamento';
            stageFilter.appendChild(option);
        }
    }

    // Funções auxiliares mantidas...
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showError(message) {
        console.error('❌ Erro:', message);
        alert(message); // Temporário - pode ser substituído por modal
    }

    // Outras funções mantidas como estavam...
    toggleLeadSelection(leadId, isSelected) {
        if (isSelected) {
            this.selectedLeads.add(leadId);
        } else {
            this.selectedLeads.delete(leadId);
        }
        this.updateMassActionButtons();
    }

    toggleSelectAll(selectAll) {
        const checkboxes = document.querySelectorAll('.lead-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
            this.toggleLeadSelection(checkbox.dataset.leadId, selectAll);
        });
    }

    updateMassActionButtons() {
        const selectedCount = this.selectedLeads.size;
        const buttons = ['massNextStage', 'massPrevStage', 'massSetStage', 'massDeleteLeads'];
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = selectedCount === 0;
                const countSpan = button.querySelector('.action-count');
                if (countSpan) {
                    countSpan.textContent = `(${selectedCount} leads)`;
                }
            }
        });

        const selectedCountElement = document.getElementById('selectedCount');
        if (selectedCountElement) {
            selectedCountElement.textContent = `${selectedCount} selecionados`;
        }
    }

    updatePaginationControls() {
        const paginationControls = document.getElementById('paginationControls');
        if (!paginationControls) return;

        const totalPages = Math.ceil(this.filteredLeads.length / this.leadsPerPage);
        const startRecord = (this.currentPage - 1) * this.leadsPerPage + 1;
        const endRecord = Math.min(this.currentPage * this.leadsPerPage, this.filteredLeads.length);

        paginationControls.innerHTML = `
            <div class="pagination-info">
                <span style="color: #666; font-size: 0.9rem;">
                    Exibindo ${startRecord}-${endRecord} de ${this.filteredLeads.length} leads
                </span>
            </div>
            
            <div class="pagination-controls">
                <div class="pagination-buttons">
                    <button 
                        class="pagination-btn" 
                        id="prevPageBtn"
                        ${this.currentPage <= 1 ? 'disabled' : ''}
                        onclick="adminPanel.goToPage(${this.currentPage - 1})"
                    >
                        <i class="fas fa-chevron-left"></i> Anterior
                    </button>
                    
                    <div class="page-info">
                        <span style="margin: 0 15px; font-weight: 600; color: #345C7A;">
                            Página ${this.currentPage} de ${totalPages}
                        </span>
                    </div>
                    
                    <button 
                        class="pagination-btn" 
                        id="nextPageBtn"
                        ${this.currentPage >= totalPages ? 'disabled' : ''}
                        onclick="adminPanel.goToPage(${this.currentPage + 1})"
                    >
                        Próximo <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="per-page-selector">
                    <label for="leadsPerPageSelect" style="margin-right: 8px; color: #666; font-size: 0.9rem;">
                        Leads por página:
                    </label>
                    <select 
                        id="leadsPerPageSelect" 
                        class="per-page-select"
                        onchange="adminPanel.changeLeadsPerPage(this.value)"
                    >
                        <option value="20" ${this.leadsPerPage === 20 ? 'selected' : ''}>20</option>
                        <option value="50" ${this.leadsPerPage === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${this.leadsPerPage === 100 ? 'selected' : ''}>100</option>
                        <option value="500" ${this.leadsPerPage === 500 ? 'selected' : ''}>500</option>
                    </select>
                </div>
            </div>
        `;
    }

    // Navegar para página específica
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredLeads.length / this.leadsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.updateLeadsDisplay();
        
        console.log(`📄 Navegando para página ${page} de ${totalPages}`);
    }

    // Alterar número de leads por página
    changeLeadsPerPage(newPerPage) {
        const oldPerPage = this.leadsPerPage;
        this.leadsPerPage = parseInt(newPerPage);
        
        // Recalcular página atual para manter posição aproximada
        const currentFirstRecord = (this.currentPage - 1) * oldPerPage + 1;
        this.currentPage = Math.ceil(currentFirstRecord / this.leadsPerPage);
        
        this.updateLeadsDisplay();
        
        console.log(`📊 Leads por página alterado: ${oldPerPage} → ${this.leadsPerPage}`);
    }

    setupModalEvents() {
        // Implementar eventos de modais se necessário
    }

    startAutoUpdate() {
        if (this.systemMode === 'auto') {
            this.autoUpdateInterval = setInterval(() => {
                this.processAutoUpdates();
            }, 2 * 60 * 60 * 1000); // 2 horas
        }
    }

    processAutoUpdates() {
        // Implementar atualizações automáticas se necessário
    }

    updateSystemMode(mode) {
        this.systemMode = mode;
        const statusIndicator = document.getElementById('systemStatus');
        
        if (statusIndicator) {
            if (mode === 'auto') {
                statusIndicator.innerHTML = '<i class="fas fa-robot"></i> Modo Automático';
                statusIndicator.className = 'status-indicator auto';
                this.startAutoUpdate();
            } else {
                statusIndicator.innerHTML = '<i class="fas fa-hand-paper"></i> Modo Manual';
                statusIndicator.className = 'status-indicator manual';
                if (this.autoUpdateInterval) {
                    clearInterval(this.autoUpdateInterval);
                    this.autoUpdateInterval = null;
                }
            }
        }
    }

    // Métodos de ação mantidos como estavam...
    async handleAddLead(e) {
        e.preventDefault();
        // Implementar adição de lead individual
    }

    // Função para editar lead
    editLead(leadId) {
        try {
            this.debugLog('info', `Iniciando edição do lead: ${leadId}`, 'editLead');
            
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const lead = leads.find(l => l.id === leadId);
            
            if (!lead) {
                this.debugLog('error', `Lead não encontrado: ${leadId}`, 'editLead');
                alert('Lead não encontrado');
                return;
            }

            this.debugLog('info', `Lead encontrado: ${lead.nome_completo}`, 'editLead');
            
            // Preencher formulário de edição
            this.fillEditForm(lead);
            
            // Armazenar ID do lead sendo editado
            this.currentEditingLeadId = leadId;
            
            // Mostrar modal
            this.showEditModal();
            
            this.debugLog('info', 'Modal de edição aberto com sucesso', 'editLead');
            
        } catch (error) {
            this.debugLog('error', `Erro ao editar lead: ${error.message}`, 'editLead');
            alert('Erro ao carregar dados do lead');
        }
    }

    fillEditForm(lead) {
        try {
            const fields = {
                'editName': lead.nome_completo || '',
                'editCPF': lead.cpf || '',
                'editEmail': lead.email || '',
                'editPhone': lead.telefone || '',
                'editAddress': lead.endereco || '',
                'editStage': lead.etapa_atual || 1
            };

            Object.entries(fields).forEach(([fieldId, value]) => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;
                } else {
                    this.debugLog('warning', `Campo não encontrado: ${fieldId}`, 'fillEditForm');
                }
            });

            // Definir data/hora atual para a etapa
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            const dateTimeField = document.getElementById('editStageDateTime');
            if (dateTimeField) {
                dateTimeField.value = localDateTime;
            }

            this.debugLog('info', 'Formulário de edição preenchido', 'fillEditForm');
        } catch (error) {
            this.debugLog('error', `Erro ao preencher formulário: ${error.message}`, 'fillEditForm');
        }
    }

    showEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.debugLog('info', 'Modal de edição exibido', 'showEditModal');
        } else {
            this.debugLog('error', 'Modal de edição não encontrado no DOM', 'showEditModal');
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.currentEditingLeadId = null;
            this.debugLog('info', 'Modal de edição fechado', 'closeEditModal');
        }
    }

    saveEditedLead() {
        try {
            if (!this.currentEditingLeadId) {
                this.debugLog('error', 'ID do lead sendo editado não encontrado', 'saveEditedLead');
                alert('Erro: ID do lead não encontrado');
                return;
            }

            this.debugLog('info', `Salvando edições do lead: ${this.currentEditingLeadId}`, 'saveEditedLead');

            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => l.id === this.currentEditingLeadId);
            
            if (leadIndex === -1) {
                this.debugLog('error', `Lead não encontrado para salvar: ${this.currentEditingLeadId}`, 'saveEditedLead');
                alert('Lead não encontrado');
                return;
            }

            // Coletar dados do formulário
            const updatedData = {
                nome_completo: document.getElementById('editName').value.trim(),
                cpf: document.getElementById('editCPF').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                telefone: document.getElementById('editPhone').value.trim(),
                endereco: document.getElementById('editAddress').value.trim(),
                etapa_atual: parseInt(document.getElementById('editStage').value),
                updated_at: new Date().toISOString()
            };

            // Validações básicas
            if (!updatedData.nome_completo) {
                this.debugLog('warning', 'Nome completo é obrigatório', 'saveEditedLead');
                alert('Nome completo é obrigatório');
                return;
            }

            if (!updatedData.cpf || updatedData.cpf.replace(/[^\d]/g, '').length !== 11) {
                this.debugLog('warning', 'CPF inválido', 'saveEditedLead');
                alert('CPF deve ter 11 dígitos');
                return;
            }

            // Atualizar lead
            leads[leadIndex] = { ...leads[leadIndex], ...updatedData };
            
            // Salvar no localStorage
            localStorage.setItem('leads', JSON.stringify(leads));
            
            this.debugLog('info', `Lead atualizado com sucesso: ${updatedData.nome_completo}`, 'saveEditedLead');
            
            // Fechar modal
            this.closeEditModal();
            
            // Atualizar lista
            this.refreshLeads();
            
            // Mostrar confirmação
            this.showSuccessMessage('Lead atualizado com sucesso!');
            
        } catch (error) {
            this.debugLog('error', `Erro ao salvar lead editado: ${error.message}`, 'saveEditedLead');
            alert('Erro ao salvar alterações');
        }
    }

    showSuccessMessage(message) {
        // Criar notificação de sucesso
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 15px 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            font-weight: 600;
            animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    async nextStage(leadId) {
        this.debug(`Tentando avançar etapa do lead: ${leadId}`, 'nextStage', 'info');
        
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(lead => lead.id === leadId);
            
            if (leadIndex === -1) {
                this.debug(`Lead não encontrado: ${leadId}`, 'nextStage', 'error');
                throw new Error('Lead não encontrado');
            }

            const currentStage = leads[leadIndex].etapa_atual || 1;
            if (currentStage < 29) {
                leads[leadIndex].etapa_atual = currentStage + 1;
                leads[leadIndex].updated_at = new Date().toISOString();
            }

            localStorage.setItem('leads', JSON.stringify(leads));
            this.refreshLeads();
            this.debug(`Etapa avançada com sucesso para lead ${leadId}`, 'nextStage', 'info');
        } catch (error) {
            this.debug(`Erro ao avançar etapa: ${error.message}`, 'nextStage', 'error');
            console.error('Erro ao avançar etapa:', error);
            alert('Erro ao avançar etapa: ' + error.message);
        }
    }

    async prevStage(leadId) {
        this.debug(`Tentando retroceder etapa do lead: ${leadId}`, 'prevStage', 'info');
        
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(lead => lead.id === leadId);
            
            if (leadIndex === -1) {
                this.debug(`Lead não encontrado: ${leadId}`, 'prevStage', 'error');
                throw new Error('Lead não encontrado');
            }

            const currentStage = leads[leadIndex].etapa_atual || 1;
            if (currentStage > 1) {
                leads[leadIndex].etapa_atual = currentStage - 1;
                leads[leadIndex].updated_at = new Date().toISOString();
            }

            localStorage.setItem('leads', JSON.stringify(leads));
            this.refreshLeads();
            this.debug(`Etapa retrocedida com sucesso para lead ${leadId}`, 'prevStage', 'info');
        } catch (error) {
            this.debug(`Erro ao retroceder etapa: ${error.message}`, 'prevStage', 'error');
            console.error('Erro ao retroceder etapa:', error);
            alert('Erro ao retroceder etapa: ' + error.message);
        }
    }

    async deleteLead(leadId) {
        this.debug(`Tentando excluir lead: ${leadId}`, 'deleteLead', 'info');
        
        if (!confirm('Tem certeza que deseja excluir este lead?')) {
            this.debug(`Exclusão cancelada pelo usuário: ${leadId}`, 'deleteLead', 'info');
            return;
        }

        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const filteredLeads = leads.filter(lead => lead.id !== leadId);
            
            localStorage.setItem('leads', JSON.stringify(filteredLeads));
            this.refreshLeads();
            this.debug(`Lead excluído com sucesso: ${leadId}`, 'deleteLead', 'info');
        } catch (error) {
            this.debug(`Erro ao excluir lead: ${error.message}`, 'deleteLead', 'error');
            console.error('Erro ao excluir lead:', error);
            alert('Erro ao excluir lead: ' + error.message);
        }
    }

    async performMassAction(action, selectedIds, targetStage = null) {
        this.debug(`Iniciando ação em massa: ${action} para ${selectedIds.length} leads`, 'performMassAction', 'info');
        
        // Mostrar barra de progresso
        this.showProgressBar(action, selectedIds.length);
        
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            let successCount = 0;
            let errorCount = 0;
            
            // Processar leads de forma assíncrona
            for (let i = 0; i < selectedIds.length; i++) {
                const leadId = selectedIds[i];
                
                try {
                    // Atualizar progresso
                    this.updateProgressBar(i + 1, selectedIds.length, action);
                    
                    // Pequeno delay para suavizar a interface
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    const leadIndex = leads.findIndex(lead => lead.id === leadId);
                    
                    if (leadIndex === -1) {
                        throw new Error(`Lead ${leadId} não encontrado`);
                    }
                    
                    // Executar ação
                    switch (action) {
                        case 'next':
                            if (leads[leadIndex].etapa_atual < 29) {
                                leads[leadIndex].etapa_atual++;
                            }
                            break;
                        case 'prev':
                            if (leads[leadIndex].etapa_atual > 1) {
                                leads[leadIndex].etapa_atual--;
                            }
                            break;
                        case 'setStage':
                            if (targetStage) {
                                leads[leadIndex].etapa_atual = parseInt(targetStage);
                            }
                            break;
                        case 'delete':
                            leads.splice(leadIndex, 1);
                            break;
                    }
                    
                    leads[leadIndex] && (leads[leadIndex].updated_at = new Date().toISOString());
                    successCount++;
                    
                } catch (error) {
                    this.debug(`Erro ao processar lead ${leadId}: ${error.message}`, 'performMassAction', 'error');
                    errorCount++;
                }
            }
            
            // Salvar alterações
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Finalizar progresso
            this.finishProgressBar(successCount, errorCount);
            
            // Atualizar interface
            this.refreshLeads();
            this.clearSelectedLeads();
            
            this.debug(`Ação em massa concluída: ${successCount} sucessos, ${errorCount} erros`, 'performMassAction', 'info');
            
        } catch (error) {
            this.debug(`Erro na ação em massa: ${error.message}`, 'performMassAction', 'error');
            this.hideProgressBar();
            alert('Erro na operação: ' + error.message);
        }
    }
    
    finishProgressBar(successCount, errorCount) {
        const progressBar = document.getElementById('massActionProgressBar');
        if (!progressBar) return;
        
        // Mostrar resultado final
        progressBar.innerHTML = `
            <div style="
                padding: 20px;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            ">
                <i class="fas fa-check-circle" style="
                    font-size: 32px;
                    color: #27ae60;
                    animation: successPulse 0.6s ease;
                "></i>
                <div style="font-weight: 600; color: #27ae60; font-size: 16px;">
                    Operação Concluída!
                </div>
                <div style="font-size: 14px; color: #666;">
                    ${successCount} sucessos${errorCount > 0 ? `, ${errorCount} erros` : ''}
                </div>
            </div>
        `;
        
        // Remover após 2 segundos
        setTimeout(() => {
            this.hideProgressBar();
        }, 2000);
    }
    
    // Método para limpar seleções
    clearSelectedLeads() {
        this.selectedLeads.clear();
        
        // Desmarcar todos os checkboxes
        document.querySelectorAll('.lead-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Desmarcar checkbox "selecionar todos"
        const selectAllCheckbox = document.getElementById('selectAllLeads');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        
        // Atualizar contadores
        this.updateMassActionButtons();
        
        this.debug('Todas as seleções foram limpas', 'clearSelectedLeads', 'info');
    }
    
    // Método para selecionar todos os leads da página atual
    selectAllCurrentPageLeads() {
        const checkboxes = document.querySelectorAll('.lead-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            this.selectedLeads.add(checkbox.value);
        });
        
        // Marcar checkbox "selecionar todos"
        const selectAllCheckbox = document.getElementById('selectAllLeads');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
        }
        
        this.updateMassActionButtons();
        this.debug(`Selecionados todos os ${checkboxes.length} leads da página atual`, 'selectAllCurrentPageLeads', 'info');
    }
    
    // Sobrescrever método de ação em massa para usar nova lógica
    async executeMassAction(action, targetStage = null) {
        try {
            const selectedLeads = Array.from(this.selectedLeads);
            
            if (selectedLeads.length === 0) {
                alert('Selecione pelo menos um lead para executar esta ação.');
                return;
            }
            
            this.debugLog('info', `Iniciando ação em massa: ${action} em ${selectedLeads.length} leads`, 'executeMassAction');
            
            // Mostrar barra de progresso
            const operationNames = {
                'next': 'Avançando etapas...',
                'prev': 'Retrocedendo etapas...',
                'set': 'Definindo etapas...',
                'delete': 'Excluindo leads...'
            };
            
            this.showProgressBar(operationNames[action] || 'Processando...', selectedLeads.length);
            this.cancelMassOperation = false;
            
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < selectedLeads.length; i++) {
                // Verificar se operação foi cancelada
                if (this.cancelMassOperation) {
                    this.debugLog('info', 'Operação cancelada pelo usuário', 'executeMassAction');
                    break;
                }
                
                const leadId = selectedLeads[i];
                const leadIndex = leads.findIndex(l => l.id === leadId);
                
                if (leadIndex !== -1) {
                    try {
                        switch (action) {
                            case 'next':
                                if (leads[leadIndex].etapa_atual < 29) {
                                    leads[leadIndex].etapa_atual++;
                                    leads[leadIndex].updated_at = new Date().toISOString();
                                    successCount++;
                                }
                                break;
                            case 'prev':
                                if (leads[leadIndex].etapa_atual > 1) {
                                    leads[leadIndex].etapa_atual--;
                                    leads[leadIndex].updated_at = new Date().toISOString();
                                    successCount++;
                                }
                                break;
                            case 'set':
                                if (targetStage) {
                                    leads[leadIndex].etapa_atual = parseInt(targetStage);
                                    leads[leadIndex].updated_at = new Date().toISOString();
                                    successCount++;
                                }
                                break;
                            case 'delete':
                                leads.splice(leadIndex, 1);
                                successCount++;
                                break;
                        }
                    } catch (error) {
                        errorCount++;
                        this.debugLog('error', `Erro ao processar lead ${leadId}: ${error.message}`, 'executeMassAction');
                    }
                }
                
                // Atualizar barra de progresso
                this.updateProgressBar(i + 1, selectedLeads.length);
                
                // Pequeno delay para não travar a interface
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            
            // Salvar alterações
            localStorage.setItem('leads', JSON.stringify(leads));
            
            // Mostrar resultado
            if (!this.cancelMassOperation) {
                this.showOperationSuccess(`✅ ${successCount} leads processados com sucesso!`);
            }
            
            this.debugLog('info', `Ação em massa concluída: ${successCount} sucessos, ${errorCount} erros`, 'executeMassAction');
            
            // Atualizar lista e limpar seleções
            await this.refreshLeads();
            this.clearSelectedLeads();
            
            // Mostrar resultado final
            alert(`Operação concluída!\nSucessos: ${successCount}\nErros: ${errorCount}`);
            
        } catch (error) {
            this.hideProgressBar();
            this.debugLog('error', `Erro na ação em massa: ${error.message}`, 'executeMassAction');
            alert('Erro ao executar ação em massa');
        }
    }

    async createLead(leadData) {
        try {
            // Implementar criação de lead
        } catch (error) {
            this.debug(`Erro ao criar lead: ${error.message}`, 'createLead', 'error');
            console.error('Erro ao criar lead:', error);
            alert('Erro ao criar lead: ' + error.message);
        }
    }

    async saveEditedLead(leadData) {
        try {
            // Implementar salvamento de lead editado
        } catch (error) {
            this.debug(`Erro ao salvar lead editado: ${error.message}`, 'saveEditedLead', 'error');
            console.error('Erro ao salvar lead:', error);
            alert('Erro ao salvar lead: ' + error.message);
        }
    }

    async clearAllLeads() {
        if (confirm('Tem certeza que deseja limpar todos os leads? Esta ação não pode ser desfeita.')) {
            localStorage.setItem('leads', '[]');
            await this.refreshLeads();
            console.log('🧹 Todos os leads foram removidos');
        }
    }

    getSelectedLeads() {
        const selectedIds = Array.from(this.selectedLeads);
        return this.filteredLeads.filter(lead => selectedIds.includes(lead.id));
    }
}

// Inicializar painel quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
    
    // Adicionar filtro "Aguardando Pagamento" após inicialização
    setTimeout(() => {
        window.adminPanel.addAwaitingPaymentFilter();
    }, 1000);
});

export { AdminPanel };