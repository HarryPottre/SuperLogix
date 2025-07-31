/**
 * Sistema de rastreamento baseado APENAS em dados do banco
 * SEM API DE CPF - APENAS DADOS DO SUPABASE
 */
import { DatabaseService } from '../services/database.js';
import { UIHelpers } from '../utils/ui-helpers.js';
import { CPFValidator } from '../utils/cpf-validator.js';
import { ZentraPayService } from '../services/zentra-pay.js';
import { TrackingGenerator } from '../utils/tracking-generator.js';

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
        this.showLoadingNotification();

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
                
                this.closeLoadingNotification();
                
                console.log('📋 Exibindo dados do banco...');
                this.displayOrderDetailsFromDatabase();
                this.generateRealTrackingData();
                this.displayTrackingResults();
                this.saveTrackingData();
                
                const orderDetails = document.getElementById('orderDetails');
                if (orderDetails) {
                    this.scrollToElement(orderDetails, 100);
                }
                
                // Destacar botão de liberação se necessário
                setTimeout(() => {
                    this.highlightLiberationButton();
                }, 1000);
                
            } else {
                console.log('❌ CPF não encontrado no banco');
                this.closeLoadingNotification();
                this.showCpfNotFoundDialog();
                
                // Mostrar pop-up discreta após 2 segundos
                setTimeout(() => {
                    this.showDiscreteHelpPopup();
                }, 2000);
            }
            
        } catch (error) {
            console.error('Erro no processo:', error);
            this.closeLoadingNotification();
            this.showError('Erro ao consultar CPF. Tente novamente.');
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
        if (step.id === 11 && currentStage <= 12 && this.leadData?.status_pagamento !== 'pago') {
            buttonHtml = `
                <button class="liberation-button-timeline" data-step-id="${step.id}">
                    <i class="fas fa-unlock"></i> LIBERAR OBJETO
                </button>
            `;
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
        if (step.id === 11 && step.completed) {
            const liberationButton = item.querySelector('.liberation-button-timeline');
            if (liberationButton && !liberationButton.classList.contains('delivery-attempt-button')) {
                liberationButton.addEventListener('click', () => {
                    this.openLiberationModal();
                });
            }
        }

        if (step.id >= 17 && (step.id - 17) % 4 === 0 && step.completed) {
            const deliveryButton = item.querySelector('.delivery-button-timeline');
            if (deliveryButton) {
                deliveryButton.addEventListener('click', () => {
                    const attemptNumber = parseInt(deliveryButton.dataset.attempt);
                    const value = parseFloat(deliveryButton.dataset.value);
                    this.openDeliveryModal(attemptNumber, value);
                });
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

    