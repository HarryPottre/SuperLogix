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
        
        console.log('🎛️ AdminPanel inicializado');
        this.init();
    }

    async init() {
        try {
            await this.setupAuthentication();
            await this.setupEventListeners();
            await this.loadLeads();
            this.startAutoUpdate();
            this.setupMassSelectionControls();
            this.setupDebugSystem();
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
        document.getElementById('massNextStage')?.addEventListener('click', () => {
            this.handleMassAction('next');
        });

        document.getElementById('massPrevStage')?.addEventListener('click', () => {
            this.handleMassAction('prev');
        });

        document.getElementById('massSetStage')?.addEventListener('click', () => {
            this.handleMassAction('set');
        });

        document.getElementById('massDeleteLeads')?.addEventListener('click', () => {
            this.handleMassAction('delete');
        });

        // Importação em massa - CORRIGIDO
        this.setupBulkImportEvents();

        // Modais
        this.setupModalEvents();
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
        console.log('📋 Selecionando todos os leads visíveis...');
        
        // Marcar checkbox principal
        const selectAllCheckbox = document.getElementById('selectAllLeads');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
        }

        // Marcar todos os checkboxes individuais
        const checkboxes = document.querySelectorAll('.lead-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });

        // Atualizar contadores
        this.updateMassActionButtons();
        
        console.log(`✅ ${checkboxes.length} leads selecionados`);
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
            106: '2ª Tentativa entrega',
            116: '3ª Tentativa entrega',
            126: '1ª Tentativa entrega (Ciclo 2)'
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

    async handleMassAction(action) {
        // Implementar ações em massa
    }

    async editLead(leadId) {
        // Implementar edição de lead
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
            if (currentStage < 16) {
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
                            if (leads[leadIndex].etapa_atual < 16) {
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
    
    showProgressBar(action, total) {
        // Remover barra existente se houver
        this.hideProgressBar();
        
        const actionNames = {
            next: 'Avançando etapas',
            prev: 'Retrocedendo etapas', 
            setStage: 'Definindo etapas',
            delete: 'Excluindo leads'
        };
        
        const progressBar = document.createElement('div');
        progressBar.id = 'massActionProgressBar';
        progressBar.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            border: 2px solid #345C7A;
        `;
        
        progressBar.innerHTML = `
            <div style="
                padding: 15px 20px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-cog fa-spin" style="color: #345C7A;"></i>
                    <span style="font-weight: 600; color: #345C7A;">
                        ${actionNames[action] || 'Processando'}...
                    </span>
                </div>
                <button id="cancelMassActionBtn" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div style="padding: 15px 20px;">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                ">
                    <span id="progressText" style="font-size: 14px; color: #666;">
                        0 de ${total} concluídos
                    </span>
                    <span id="progressPercent" style="font-size: 14px; font-weight: 600; color: #345C7A;">
                        0%
                    </span>
                </div>
                
                <div style="
                    width: 100%;
                    height: 8px;
                    background: #e9ecef;
                    border-radius: 4px;
                    overflow: hidden;
                ">
                    <div id="progressFill" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(45deg, #345C7A, #2c4a63);
                        transition: width 0.3s ease;
                        border-radius: 4px;
                    "></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(progressBar);
        
        // Configurar botão cancelar
        document.getElementById('cancelMassActionBtn')?.addEventListener('click', () => {
            this.cancelMassAction = true;
            this.hideProgressBar();
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
                @keyframes successPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    updateProgressBar(current, total, action) {
        const progressText = document.getElementById('progressText');
        const progressPercent = document.getElementById('progressPercent');
        const progressFill = document.getElementById('progressFill');
        
        if (progressText && progressPercent && progressFill) {
            const percentage = Math.round((current / total) * 100);
            
            progressText.textContent = `${current} de ${total} concluídos`;
            progressPercent.textContent = `${percentage}%`;
            progressFill.style.width = `${percentage}%`;
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
    
    // Método para desmarcar todos
    deselectAllLeads() {
        this.clearSelectedLeads();
        this.debug('Todos os leads foram desmarcados', 'deselectAllLeads', 'info');
    }
    
    // Sobrescrever método de ação em massa para usar nova lógica
    async executeMassAction(action, targetStage = null) {
        const selectedIds = Array.from(this.selectedLeads);
        
        if (selectedIds.length === 0) {
            this.debug('Tentativa de ação em massa sem seleções', 'executeMassAction', 'warning');
            alert('Selecione pelo menos um lead para executar esta ação.');
            return;
        }
        
        // Usar nova lógica com progresso
        await this.performMassAction(action, selectedIds, targetStage);
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