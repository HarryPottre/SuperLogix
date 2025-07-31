import"./modulepreload-polyfill-B5Qt9EMX.js";import{D}from"./database-CTJo1PQf.js";import{C as b}from"./cpf-validator-B4PsRAE6.js";class M{constructor(){this.dbService=new D,this.currentView="leadsView",this.leads=[],this.filteredLeads=[],this.currentPage=1,this.leadsPerPage=20,this.selectedLeads=new Set,this.debugLogs=[],this.maxDebugLogs=100,this.debugVisible=!1,this.systemMode="auto",this.autoUpdateInterval=null,this.bulkImportData=[],this.isImporting=!1,this.stageOrder=[{id:1,name:"Pedido criado"},{id:2,name:"Preparando para envio"},{id:3,name:"Vendedor enviou pedido"},{id:4,name:"Centro triagem Shenzhen"},{id:5,name:"Centro logístico Shenzhen"},{id:6,name:"Trânsito internacional"},{id:7,name:"Liberado exportação"},{id:8,name:"Saiu origem Shenzhen"},{id:9,name:"Chegou no Brasil"},{id:10,name:"Trânsito Curitiba/PR"},{id:11,name:"Alfândega importação"},{id:12,name:"Liberado alfândega"},{id:13,name:"Sairá para entrega"},{id:14,name:"Em trânsito entrega"},{id:15,name:"Rota de entrega"},{id:16,name:"Tentativa entrega"},{id:17,name:"1ª Tentativa entrega"},{id:18,name:"Reagendamento solicitado"},{id:19,name:"Em rota de entrega"},{id:20,name:"Saindo para entrega"},{id:21,name:"2ª Tentativa entrega"},{id:22,name:"Reagendamento solicitado"},{id:23,name:"Em rota de entrega"},{id:24,name:"Saindo para entrega"},{id:25,name:"3ª Tentativa entrega"},{id:26,name:"Reagendamento solicitado"},{id:27,name:"Em rota de entrega"},{id:28,name:"Saindo para entrega"},{id:29,name:"4ª Tentativa entrega"}],console.log("🎛️ AdminPanel inicializado"),this.init()}debugLog(e,t="info",a="AdminPanel"){this.debugSystem?this.debugSystem.log(e,t,a):console.log(`[${t.toUpperCase()}] ${a}: ${e}`)}async init(){try{await this.setupAuthentication(),await this.setupEventListeners(),await this.loadLeads(),this.startAutoUpdate(),this.setupMassSelectionControls(),this.setupDebugSystem(),this.setupActionButtons(),this.setupEditModal(),console.log("✅ AdminPanel configurado com sucesso")}catch(e){console.error("❌ Erro na inicialização do AdminPanel:",e)}}async setupAuthentication(){const e=document.getElementById("loginScreen"),t=document.getElementById("adminPanel"),a=document.getElementById("loginForm"),o=document.getElementById("passwordInput"),s=document.getElementById("errorMessage");if(localStorage.getItem("admin_logged_in")==="true"){e.style.display="none",t.style.display="block";return}a.addEventListener("submit",i=>{i.preventDefault();const r=o.value;["admin123","k7admin","logix2024"].includes(r)?(localStorage.setItem("admin_logged_in","true"),e.style.display="none",t.style.display="block",s.style.display="none"):(s.textContent="Senha incorreta. Tente novamente.",s.style.display="block",o.value="")});const n=document.getElementById("logoutButton");n&&n.addEventListener("click",()=>{localStorage.removeItem("admin_logged_in"),location.reload()})}async setupEventListeners(){var a,o,s,n,i,r,d,l;(a=document.getElementById("showLeadsView"))==null||a.addEventListener("click",()=>{this.showView("leadsView")}),(o=document.getElementById("showAddLeadView"))==null||o.addEventListener("click",()=>{this.showView("addLeadView")}),(s=document.getElementById("showBulkAddView"))==null||s.addEventListener("click",()=>{this.showView("bulkAddView")}),(n=document.getElementById("addLeadForm"))==null||n.addEventListener("submit",c=>{this.handleAddLead(c)}),(i=document.getElementById("systemMode"))==null||i.addEventListener("change",c=>{this.updateSystemMode(c.target.value)}),(r=document.getElementById("applyFiltersButton"))==null||r.addEventListener("click",()=>{this.applyFilters()}),(d=document.getElementById("refreshButton"))==null||d.addEventListener("click",()=>{this.refreshLeads()}),(l=document.getElementById("clearAllButton"))==null||l.addEventListener("click",()=>{this.clearAllLeads()}),this.setupMassActions(),this.setupBulkImportEvents(),this.setupModalEvents();const e=document.getElementById("clearAllButton");e&&e.addEventListener("click",()=>{confirm(`⚠️ ATENÇÃO: Isso irá apagar TODOS os leads do sistema!

Tem certeza que deseja continuar?`)&&this.clearAllLeads()});const t=document.getElementById("triggerDeliveryAttempt");t&&t.addEventListener("click",()=>{this.triggerDeliveryAttemptForSelected()})}triggerDeliveryAttemptForSelected(){const e=this.getSelectedLeads();if(e.length===0){alert("Selecione pelo menos um lead para simular tentativa de entrega.");return}const t=e.slice(0,3).map(o=>o.nome_completo).join(", "),a=e.length>3?` e mais ${e.length-3}`:"";confirm(`Simular tentativa de entrega para:

${t}${a}

Isso irá adicionar a etapa "1ª Tentativa de Entrega" para os leads selecionados.`)&&this.processDeliveryAttemptSimulation(e)}async processDeliveryAttemptSimulation(e){console.log("🚚 Simulando tentativas de entrega para leads selecionados");let t=0,a=0;for(const o of e)try{o.etapa_atual=17,o.updated_at=new Date().toISOString();const s=JSON.parse(localStorage.getItem("leads")||"[]"),n=s.findIndex(i=>i.id===o.id);n!==-1?(s[n]=o,localStorage.setItem("leads",JSON.stringify(s)),t++,console.log(`✅ Lead ${o.nome_completo} atualizado para etapa 17`)):(a++,console.error(`❌ Lead ${o.nome_completo} não encontrado`))}catch(s){a++,console.error(`❌ Erro ao atualizar lead ${o.nome_completo}:`,s)}this.refreshLeads(),alert(`Simulação concluída!

✅ Sucessos: ${t}
❌ Erros: ${a}

Os leads agora estão na etapa "1ª Tentativa de Entrega" e o botão "LIBERAR ENTREGA" deve aparecer no rastreamento.`)}setupMassActions(){this.debugLog("Configurando ações em massa...","info"),document.addEventListener("click",a=>{const o=a.target.closest("button");o&&(o.id==="massNextStage"?(a.preventDefault(),this.handleMassAction("next")):o.id==="massPrevStage"?(a.preventDefault(),this.handleMassAction("prev")):o.id==="massSetStage"?(a.preventDefault(),this.handleMassAction("set")):o.id==="massDeleteLeads"?(a.preventDefault(),this.handleMassAction("delete")):o.id==="massSelectAll"?(a.preventDefault(),this.selectAllLeads()):o.id==="massDeselectAll"&&(a.preventDefault(),this.deselectAllLeads()))});const e=document.getElementById("massSelectAll");e&&e.addEventListener("click",()=>{this.selectAllLeads()});const t=document.getElementById("massDeselectAll");t&&t.addEventListener("click",()=>{this.deselectAllLeads()}),this.debugLog("Ações em massa configuradas","info")}setupMassActionEvents(){console.log("🔧 Configurando eventos de ações em massa..."),this.setupMassActionButton("massNextStage",()=>this.handleMassNextStage()),this.setupMassActionButton("massPrevStage",()=>this.handleMassPrevStage()),this.setupMassActionButton("massSetStage",()=>this.handleMassSetStage()),this.setupMassActionButton("massDeleteLeads",()=>this.handleMassDeleteLeads())}setupMassActionButton(e,t){const a=document.getElementById(e);a&&(a.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),t()}),console.log(`✅ Evento configurado para ${e}`)),document.addEventListener("click",o=>{(o.target.id===e||o.target.closest(`#${e}`))&&(o.preventDefault(),o.stopPropagation(),t())})}async handleMassNextStage(){console.log("⬆️ Avançar etapas em massa");const e=this.getSelectedLeads();if(e.length===0){alert("Selecione pelo menos um lead para avançar");return}if(console.log(`📊 Avançando ${e.length} leads selecionados`),!confirm(`Tem certeza que deseja avançar ${e.length} leads para a próxima etapa?`))return;this.showMassActionProgress("Avançando etapas...",e.length);let t=0,a=0;try{for(let o=0;o<e.length;o++){const s=e[o],n=parseInt(s.etapa_atual)||1,i=this.getNextStage(n);if(console.log(`📈 Lead ${s.nome_completo}: Etapa ${n} → ${i}`),i>n)try{await this.updateLeadStage(s.cpf,i),s.etapa_atual=i,s.updated_at=new Date().toISOString(),t++,console.log(`✅ Lead ${s.nome_completo} avançado com sucesso`)}catch(r){console.error(`❌ Erro ao avançar lead ${s.nome_completo}:`,r),a++}else console.log(`⚠️ Lead ${s.nome_completo} já está na última etapa`);this.updateMassActionProgress(o+1,e.length),await new Promise(r=>setTimeout(r,100))}this.hideMassActionProgress(),this.refreshLeads(),this.deselectAllLeads(),alert(`Operação concluída!
✅ ${t} leads avançados
❌ ${a} erros`)}catch(o){console.error("❌ Erro na operação de avançar etapas:",o),this.hideMassActionProgress(),alert("Erro na operação. Verifique o console para detalhes.")}}async updateLeadStage(e,t){try{const a=JSON.parse(localStorage.getItem("leads")||"[]"),o=a.findIndex(s=>s.cpf&&s.cpf.replace(/[^\d]/g,"")===e.replace(/[^\d]/g,""));if(o!==-1)return a[o].etapa_atual=t,a[o].updated_at=new Date().toISOString(),localStorage.setItem("leads",JSON.stringify(a)),console.log(`✅ Etapa atualizada no banco: CPF ${e} → Etapa ${t}`),!0;throw new Error(`Lead não encontrado para CPF: ${e}`)}catch(a){throw console.error("❌ Erro ao atualizar etapa no banco:",a),a}}async handleMassPrevStage(){console.log("⬇️ Voltar etapas em massa");const e=this.getSelectedLeads();if(e.length===0){alert("Selecione pelo menos um lead para voltar");return}if(console.log(`📊 Voltando ${e.length} leads selecionados`),!confirm(`Tem certeza que deseja voltar ${e.length} leads para a etapa anterior?`))return;this.showMassActionProgress("Voltando etapas...",e.length);let t=0,a=0;try{for(let o=0;o<e.length;o++){const s=e[o],n=parseInt(s.etapa_atual)||1,i=this.getPreviousStage(n);if(console.log(`📉 Lead ${s.nome_completo}: Etapa ${n} → ${i}`),i<n)try{await this.updateLeadStage(s.cpf,i),s.etapa_atual=i,s.updated_at=new Date().toISOString(),t++,console.log(`✅ Lead ${s.nome_completo} voltado com sucesso`)}catch(r){console.error(`❌ Erro ao voltar lead ${s.nome_completo}:`,r),a++}else console.log(`⚠️ Lead ${s.nome_completo} já está na primeira etapa`);this.updateMassActionProgress(o+1,e.length),await new Promise(r=>setTimeout(r,100))}this.hideMassActionProgress(),this.refreshLeads(),this.deselectAllLeads(),alert(`Operação concluída!
✅ ${t} leads voltados
❌ ${a} erros`)}catch(o){console.error("❌ Erro na operação de voltar etapas:",o),this.hideMassActionProgress(),alert("Erro na operação. Verifique o console para detalhes.")}}async handleMassSetStage(){var n;console.log("🎯 Definir etapa em massa");const e=this.getSelectedLeads();if(e.length===0){alert("Selecione pelo menos um lead para definir etapa");return}const t=(n=document.getElementById("targetStageSelect"))==null?void 0:n.value;if(!t){alert("Selecione uma etapa de destino");return}console.log(`📊 Definindo etapa ${t} para ${e.length} leads`);const a=this.getStageName(parseInt(t));if(!confirm(`Tem certeza que deseja definir ${e.length} leads para a etapa "${a}"?`))return;this.showMassActionProgress(`Definindo etapa ${t}...`,e.length);let o=0,s=0;try{for(let i=0;i<e.length;i++){const r=e[i];try{await this.updateLeadStage(r.cpf,parseInt(t)),r.etapa_atual=parseInt(t),r.updated_at=new Date().toISOString(),o++,console.log(`✅ Lead ${r.nome_completo} definido para etapa ${t}`)}catch(d){console.error(`❌ Erro ao definir etapa para lead ${r.nome_completo}:`,d),s++}this.updateMassActionProgress(i+1,e.length),await new Promise(d=>setTimeout(d,100))}this.hideMassActionProgress(),this.refreshLeads(),this.deselectAllLeads(),alert(`Operação concluída!
✅ ${o} leads atualizados
❌ ${s} erros`)}catch(i){console.error("❌ Erro na operação de definir etapa:",i),this.hideMassActionProgress(),alert("Erro na operação. Verifique o console para detalhes.")}}async handleMassDeleteLeads(){console.log("🗑️ Excluir leads em massa");const e=this.getSelectedLeads();if(e.length===0){alert("Selecione pelo menos um lead para excluir");return}if(!confirm(`Tem certeza que deseja excluir ${e.length} leads? Esta ação não pode ser desfeita.`))return;this.showMassActionProgress("Excluindo leads...",e.length);let t=0,a=0;try{for(let o=0;o<e.length;o++){const s=e[o];try{await this.deleteLead(s.cpf),t++,console.log(`✅ Lead ${s.nome_completo} excluído com sucesso`)}catch(n){console.error(`❌ Erro ao excluir lead ${s.nome_completo}:`,n),a++}this.updateMassActionProgress(o+1,e.length),await new Promise(n=>setTimeout(n,100))}this.hideMassActionProgress(),this.refreshLeads(),this.deselectAllLeads(),alert(`Operação concluída!
✅ ${t} leads excluídos
❌ ${a} erros`)}catch(o){console.error("❌ Erro na operação de exclusão:",o),this.hideMassActionProgress(),alert("Erro na operação. Verifique o console para detalhes.")}}async deleteLead(e){try{const a=JSON.parse(localStorage.getItem("leads")||"[]").filter(o=>o.cpf&&o.cpf.replace(/[^\d]/g,"")!==e.replace(/[^\d]/g,""));return localStorage.setItem("leads",JSON.stringify(a)),console.log(`✅ Lead excluído do banco: CPF ${e}`),!0}catch(t){throw console.error("❌ Erro ao excluir lead do banco:",t),t}}showMassActionProgress(e,t){console.log(`📊 Iniciando progresso: ${e} (${t} itens)`),this.hideMassActionProgress();const a=document.createElement("div");a.id="massActionProgressContainer",a.style.cssText=`
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
        `,this.massActionCancelled=!1,a.innerHTML=`
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <i class="fas fa-cogs" style="color: #345C7A; margin-right: 10px; font-size: 1.2rem;"></i>
                <span style="font-weight: 600; color: #345C7A;">${e}</span>
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
                <span id="massActionProgressText" style="font-size: 0.9rem; color: #666;">0 de ${t}</span>
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
        `,document.body.appendChild(a),console.log("✅ Barra de progresso criada")}updateMassActionProgress(e,t){if(this.massActionCancelled)throw new Error("Operação cancelada pelo usuário");const a=document.getElementById("massActionProgressBar"),o=document.getElementById("massActionProgressText");if(a&&o){const s=e/t*100;a.style.width=`${s}%`,a.textContent=`${Math.round(s)}%`,o.textContent=`${e} de ${t}`,console.log(`📊 Progresso atualizado: ${e}/${t} (${Math.round(s)}%)`)}}hideMassActionProgress(){const e=document.getElementById("massActionProgressContainer");e&&(e.style.animation="slideOutRight 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove()},300),console.log("✅ Barra de progresso removida")),this.massActionCancelled=!1}cancelMassAction(){console.log("🛑 Cancelando ação em massa..."),this.massActionCancelled=!0,this.hideMassActionProgress(),alert("Operação cancelada pelo usuário")}getNextStage(e){const t=this.getStageOrder(),a=t.indexOf(e);return a===-1||a===t.length-1?e:t[a+1]}getPreviousStage(e){const t=this.getStageOrder(),a=t.indexOf(e);return a===-1||a===0?e:t[a-1]}getStageOrder(){return[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29]}getStageName(e){return{1:"1 - Pedido criado",2:"2 - Preparando para envio",3:"3 - Vendedor enviou pedido",4:"4 - Centro triagem Shenzhen",5:"5 - Centro logístico Shenzhen",6:"6 - Trânsito internacional",7:"7 - Liberado exportação",8:"8 - Saiu origem Shenzhen",9:"9 - Chegou no Brasil",10:"10 - Trânsito Curitiba/PR",11:"11 - Alfândega importação",12:"12 - Liberado alfândega",13:"13 - Sairá para entrega",14:"14 - Em trânsito entrega",15:"15 - Rota de entrega",16:"16 - Tentativa entrega",17:"17 - 1ª Tentativa entrega",18:"18 - Reagendamento solicitado",19:"19 - Em rota de entrega",20:"20 - Saindo para entrega",21:"21 - 2ª Tentativa entrega",22:"22 - Reagendamento solicitado",23:"23 - Em rota de entrega",24:"24 - Saindo para entrega",25:"25 - 3ª Tentativa entrega",26:"26 - Reagendamento solicitado",27:"27 - Em rota de entrega",28:"28 - Saindo para entrega",29:"29 - 4ª Tentativa entrega"}[e]||`Etapa ${e}`}getNextStage(e){const t=this.stageOrder.findIndex(a=>a.id===parseInt(e));return t===-1||t===this.stageOrder.length-1?e:this.stageOrder[t+1].id}getPreviousStage(e){const t=this.stageOrder.findIndex(a=>a.id===parseInt(e));return t===-1||t===0?e:this.stageOrder[t-1].id}getStageName(e){const t=this.stageOrder.find(a=>a.id===parseInt(e));return t?t.name:`Etapa ${e}`}async handleMassAction(e){var s;if(this.selectedLeads.size===0){alert("Nenhum lead selecionado");return}this.debugLog(`Iniciando ação em massa: ${e} para ${this.selectedLeads.size} leads`,"info");const t=Array.from(this.selectedLeads),a=this.filteredLeads.filter(n=>t.includes(n.id));this.showProgressBar(e,a.length);let o=null;switch(e){case"next":break;case"prev":break;case"set":if(o=(s=document.getElementById("targetStageSelect"))==null?void 0:s.value,!o){this.hideProgressBar(),alert("Selecione uma etapa de destino");return}break;case"delete":if(!confirm(`Tem certeza que deseja excluir ${a.length} leads?`)){this.hideProgressBar();return}break}await this.executeMassAction(e,a,o)}async executeMassAction(e,t,a=null){let o=0,s=0;for(let n=0;n<t.length;n++){const i=t[n];try{let r=i.etapa_atual;switch(e){case"next":r=this.getNextStage(i.etapa_atual);break;case"prev":r=this.getPreviousStage(i.etapa_atual);break;case"set":r=parseInt(a);break;case"delete":const d=this.allLeads.findIndex(g=>g.id===i.id);d!==-1&&this.allLeads.splice(d,1);const c=JSON.parse(localStorage.getItem("leads")||"[]").filter(g=>g.id!==i.id);localStorage.setItem("leads",JSON.stringify(c)),o++,this.updateProgressBar(n+1,t.length);continue}if(e!=="delete"&&r!==i.etapa_atual){i.etapa_atual=r,i.updated_at=new Date().toISOString();const d=JSON.parse(localStorage.getItem("leads")||"[]"),l=d.findIndex(c=>c.id===i.id);l!==-1&&(d[l]={...d[l],...i},localStorage.setItem("leads",JSON.stringify(d))),this.debugLog(`Lead ${i.nome_completo} atualizado para etapa ${r} (${this.getStageName(r)})`,"info")}o++}catch(r){s++,this.debugLog(`Erro ao processar lead ${i.nome_completo}: ${r.message}`,"error")}this.updateProgressBar(n+1,t.length),n%5===0&&await new Promise(r=>setTimeout(r,50))}this.finishProgressBar(o,s),this.selectedLeads.clear(),this.updateMassActionButtons(),this.refreshLeads(),this.debugLog(`Ação em massa concluída: ${o} sucessos, ${s} erros`,o>0?"info":"error")}showProgressBar(e,t){var s;this.hideProgressBar();const a=document.createElement("div");a.id="massActionProgressBar",a.style.cssText=`
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
        `;let o="";switch(e){case"next":o="Avançando etapas";break;case"prev":o="Retrocedendo etapas";break;case"set":o="Definindo etapas";break;case"delete":o="Excluindo leads";break}if(a.innerHTML=`
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                <i class="fas fa-cog fa-spin" style="color: #345C7A; font-size: 1.2rem;"></i>
                <div>
                    <div style="font-weight: 600; color: #345C7A; font-size: 1rem;">${o}...</div>
                    <div id="progressText" style="color: #666; font-size: 0.9rem;">0 de ${t} concluídos</div>
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
        `,document.body.appendChild(a),(s=document.getElementById("cancelMassAction"))==null||s.addEventListener("click",()=>{this.hideProgressBar(),this.debugLog("Ação em massa cancelada pelo usuário","info")}),!document.getElementById("progressAnimations")){const n=document.createElement("style");n.id="progressAnimations",n.textContent=`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `,document.head.appendChild(n)}}updateProgressBar(e,t){const a=document.getElementById("progressText"),o=document.getElementById("progressFill");if(a&&o){const s=e/t*100;a.textContent=`${e} de ${t} concluídos`,o.style.width=`${s}%`}}finishProgressBar(e,t){const a=document.getElementById("massActionProgressBar");a&&(a.innerHTML=`
            <div style="display: flex; align-items: center; gap: 12px; text-align: center;">
                <i class="fas fa-check-circle" style="color: #27ae60; font-size: 1.5rem;"></i>
                <div>
                    <div style="font-weight: 600; color: #27ae60; font-size: 1rem;">Concluído!</div>
                    <div style="color: #666; font-size: 0.9rem;">
                        ${e} sucessos${t>0?`, ${t} erros`:""}
                    </div>
                </div>
            </div>
        `,setTimeout(()=>{this.hideProgressBar()},2e3))}hideProgressBar(){const e=document.getElementById("massActionProgressBar");e&&(e.style.animation="slideOutRight 0.3s ease",setTimeout(()=>{e.parentNode&&e.remove()},300))}setupEditModal(){const e=document.getElementById("editModal"),t=document.getElementById("closeEditModal"),a=document.getElementById("cancelEdit"),o=document.getElementById("editForm");t&&t.addEventListener("click",()=>{this.closeEditModal()}),a&&a.addEventListener("click",()=>{this.closeEditModal()}),e&&e.addEventListener("click",s=>{s.target===e&&this.closeEditModal()}),o&&o.addEventListener("submit",s=>{s.preventDefault(),this.saveEditedLead()}),this.debugLog("info","Modal de edição configurado","setupEditModal")}setupActionButtons(){const e=document.getElementById("refreshButton");e&&e.addEventListener("click",()=>{this.refreshLeads()});const t=document.getElementById("leadsTable");t&&t.addEventListener("click",a=>{if(a.target.classList.contains("edit-button")||a.target.closest(".edit-button")){const s=(a.target.classList.contains("edit-button")?a.target:a.target.closest(".edit-button")).dataset.leadId;s&&this.editLead(s)}})}setupMassSelectionControls(){const e=document.getElementById("selectAllLeadsButton");e&&e.addEventListener("click",()=>{this.selectAllVisibleLeads()});const t=document.getElementById("deselectAllLeadsButton");t&&t.addEventListener("click",()=>{this.deselectAllLeads()})}setupDebugSystem(){console.log("🐛 Configurando sistema de debug..."),this.createDebugButton(),this.createDebugPanel(),this.setupErrorInterception(),this.addDebugLog("Sistema de debug inicializado","Sistema","info"),console.log("✅ Sistema de debug configurado")}createDebugButton(){const e=document.createElement("div");e.id="debugButton",e.innerHTML=`
            <i class="fas fa-bug"></i>
            <span id="debugCounter" class="debug-counter">0</span>
        `,e.style.cssText=`
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
        `,e.addEventListener("click",()=>{this.toggleDebugPanel()}),e.addEventListener("mouseenter",function(){this.style.background="#495057",this.style.transform="scale(1.1)"}),e.addEventListener("mouseleave",function(){this.style.background="#6c757d",this.style.transform="scale(1)"}),document.body.appendChild(e)}createDebugPanel(){const e=document.createElement("div");e.id="debugPanel",e.style.cssText=`
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
        `,e.innerHTML=`
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
        `,document.body.appendChild(e),document.getElementById("closeDebugButton").addEventListener("click",()=>{this.toggleDebugPanel()}),document.getElementById("clearDebugButton").addEventListener("click",()=>{this.clearDebugLogs()}),["showInfoLogs","showWarningLogs","showErrorLogs"].forEach(t=>{document.getElementById(t).addEventListener("change",()=>{this.updateDebugDisplay()})})}setupErrorInterception(){window.addEventListener("error",t=>{this.addDebugLog(`Erro JavaScript: ${t.message}`,`${t.filename}:${t.lineno}`,"error")}),window.addEventListener("unhandledrejection",t=>{this.addDebugLog(`Promise rejeitada: ${t.reason}`,"Promise","error")});const e=console.error;console.error=(...t)=>{this.addDebugLog(t.join(" "),"Console","error"),e.apply(console,t)}}addDebugLog(e,t,a="info"){const o=new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit",fractionalSecondDigits:3}),s={id:Date.now()+Math.random(),timestamp:o,message:e,source:t,type:a,fullTimestamp:new Date().toISOString()};this.debugLogs.unshift(s),this.debugLogs.length>this.maxDebugLogs&&(this.debugLogs=this.debugLogs.slice(0,this.maxDebugLogs)),this.updateDebugCounter(),this.debugVisible&&this.updateDebugDisplay(),console.log(`🐛 [${a.toUpperCase()}] ${t}: ${e}`)}updateDebugCounter(){const e=document.getElementById("debugCounter"),t=document.getElementById("debugButton");if(e&&t){const a=this.debugLogs.filter(o=>o.type==="error").length;a>0?(e.textContent=a,e.style.cssText=`
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
                `,t.style.background="#e74c3c"):(e.textContent=this.debugLogs.length,e.style.display=this.debugLogs.length>0?"flex":"none",t.style.background="#6c757d")}}updateDebugDisplay(){var r,d,l;const e=document.getElementById("debugLogContainer"),t=document.getElementById("totalLogsCount"),a=document.getElementById("errorLogsCount");if(!e)return;const o=(r=document.getElementById("showInfoLogs"))==null?void 0:r.checked,s=(d=document.getElementById("showWarningLogs"))==null?void 0:d.checked,n=(l=document.getElementById("showErrorLogs"))==null?void 0:l.checked,i=this.debugLogs.filter(c=>!(c.type==="info"&&!o||c.type==="warning"&&!s||c.type==="error"&&!n));t&&(t.textContent=this.debugLogs.length),a&&(a.textContent=this.debugLogs.filter(c=>c.type==="error").length),e.innerHTML=i.map(c=>{const g={info:"#3498db",warning:"#f39c12",error:"#e74c3c"},u={info:"fas fa-info-circle",warning:"fas fa-exclamation-triangle",error:"fas fa-times-circle"};return`
                <div style="
                    margin-bottom: 8px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    border-left: 3px solid ${g[c.type]};
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 4px;
                    ">
                        <span style="
                            color: ${g[c.type]};
                            font-weight: bold;
                            font-size: 10px;
                        ">
                            <i class="${u[c.type]}"></i>
                            ${c.type.toUpperCase()}
                        </span>
                        <span style="color: #95a5a6; font-size: 10px;">
                            ${c.timestamp}
                        </span>
                    </div>
                    <div style="color: #ecf0f1; margin-bottom: 2px;">
                        ${c.message}
                    </div>
                    <div style="color: #95a5a6; font-size: 10px;">
                        Origem: ${c.source}
                    </div>
                </div>
            `}).join(""),e.scrollTop=0}toggleDebugPanel(){const e=document.getElementById("debugPanel");e&&(this.debugVisible=!this.debugVisible,this.debugVisible?(e.style.right="0px",this.updateDebugDisplay()):e.style.right="-400px")}clearDebugLogs(){confirm("Tem certeza que deseja limpar todos os logs de debug?")&&(this.debugLogs=[],this.updateDebugCounter(),this.updateDebugDisplay(),this.addDebugLog("Logs de debug limpos","Sistema","info"))}debug(e,t="AdminPanel",a="info"){this.addDebugLog(e,t,a)}selectAllVisibleLeads(){console.log("📋 Selecionando todos os leads visíveis...");const e=document.querySelectorAll('#leadsTableBody input[type="checkbox"]:not(#selectAllLeads)');e.forEach(a=>{a.checked||(a.checked=!0,a.dispatchEvent(new Event("change")))});const t=document.getElementById("selectAllLeads");t&&(t.checked=!0),this.updateMassActionButtons(),console.log(`✅ ${e.length} leads selecionados`)}deselectAllLeads(){console.log("🔄 Desmarcando todos os leads..."),document.querySelectorAll('input[type="checkbox"]').forEach(t=>{t.checked&&(t.checked=!1,t.dispatchEvent(new Event("change")))}),this.updateMassActionButtons(),console.log("✅ Todos os leads desmarcados")}selectAllLeads(){try{this.debugLog("info","Selecionando todos os leads da página atual","selectAllLeads");const e=document.querySelectorAll('input[type="checkbox"][data-lead-id]');let t=0;e.forEach(o=>{o.checked||(o.checked=!0,t++)});const a=document.getElementById("selectAllLeads");a&&(a.checked=!0),this.updateMassActionButtons(),this.debugLog("info",`${t} leads selecionados`,"selectAllLeads")}catch(e){this.debugLog("error",`Erro ao selecionar todos: ${e.message}`,"selectAllLeads")}}showProgressBar(e,t){const a=document.createElement("div");if(a.id="massActionProgressContainer",a.style.cssText=`
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
        `,a.innerHTML=`
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                <i class="fas fa-cogs" style="color: #345C7A; font-size: 1.2rem; animation: spin 1s linear infinite;"></i>
                <div>
                    <div style="font-weight: 600; color: #345C7A; font-size: 1rem;">${e}</div>
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
        `,!document.getElementById("progressAnimations")){const s=document.createElement("style");s.id="progressAnimations",s.textContent=`
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
            `,document.head.appendChild(s)}document.body.appendChild(a);const o=document.getElementById("cancelProgressButton");return o&&o.addEventListener("click",()=>{this.hideProgressBar()}),this.currentProgressTotal=t,this.currentProgressCount=0,{update:(s,n)=>{const i=document.getElementById("progressBar"),r=document.getElementById("progressText");if(i&&r){const d=s/n*100;i.style.width=`${d}%`,r.textContent=`${s} de ${n} concluídos`}},complete:()=>{const s=document.getElementById("massActionProgressContainer");s&&(s.innerHTML=`
                        <div style="display: flex; align-items: center; gap: 12px; text-align: center;">
                            <i class="fas fa-check-circle" style="color: #27ae60; font-size: 1.5rem;"></i>
                            <div>
                                <div style="font-weight: 600; color: #27ae60; font-size: 1rem;">Concluído!</div>
                                <div style="color: #666; font-size: 0.9rem;">Operação finalizada com sucesso</div>
                            </div>
                        </div>
                    `,setTimeout(()=>{this.hideProgressBar()},2e3))}}}updateProgressBar(e,t,a=""){const o=document.getElementById("progressBar"),s=document.getElementById("progressText");if(o&&s){const n=e/t*100;o.style.width=`${n}%`;const i=`${e} de ${t} concluídos`;s.textContent=a||i}}hideProgressBar(e=!1){const t=document.getElementById("massActionProgressContainer");t&&(e?(t.innerHTML=`
                    <div style="text-align: center; padding: 10px;">
                        <i class="fas fa-check-circle" style="color: #27ae60; font-size: 2rem; margin-bottom: 10px;"></i>
                        <div style="color: #27ae60; font-weight: 600;">Operação concluída!</div>
                    </div>
                `,setTimeout(()=>{t.style.animation="slideOutRight 0.3s ease",setTimeout(()=>{t.parentNode&&t.remove()},300)},2e3)):(t.style.animation="slideOutRight 0.3s ease",setTimeout(()=>{t.parentNode&&t.remove()},300)))}setupBulkImportEvents(){console.log("🔧 Configurando eventos de importação em massa...");const e=document.getElementById("previewBulkDataButton");e&&e.addEventListener("click",()=>{console.log("🔍 Botão de pré-visualização clicado"),this.previewBulkData()});const t=document.getElementById("clearBulkDataButton");t&&t.addEventListener("click",()=>{this.clearBulkData()});const a=document.getElementById("confirmBulkImportButton");a&&a.addEventListener("click",()=>{this.confirmBulkImport()});const o=document.getElementById("editBulkDataButton");o&&o.addEventListener("click",()=>{this.editBulkData()}),console.log("✅ Eventos de importação em massa configurados")}previewBulkData(){console.log("🔍 Iniciando pré-visualização de dados em massa...");const e=document.getElementById("bulkDataTextarea");if(!e){console.error("❌ Textarea não encontrado");return}const t=e.value;if(console.log("📝 Dados brutos obtidos:",{length:t.length,hasContent:!!t.trim(),firstChars:t.substring(0,100)}),!t||t.trim().length===0){console.warn("⚠️ Nenhum dado encontrado no textarea"),this.showError("Por favor, cole os dados da planilha no campo de texto.");return}try{const a=this.parseRawBulkData(t);if(!a.success){console.error("❌ Erro no parse:",a.error),this.showError(a.error);return}console.log("✅ Dados parseados com sucesso:",{totalLeads:a.leads.length,errors:a.errors.length,duplicates:a.duplicates.length}),this.bulkImportData=a.leads,this.displayBulkPreview(a)}catch(a){console.error("💥 Erro na pré-visualização:",a),this.showError(`Erro ao processar dados: ${a.message}`)}}parseRawBulkData(e){console.log("📊 Iniciando parse de dados brutos...");try{const t=e.trim().split(`
`).filter(d=>d.trim().length>0);if(t.length===0)return{success:!1,error:"Nenhuma linha válida encontrada nos dados colados."};console.log(`📋 Total de linhas para processar: ${t.length}`);const a=[],o=[],s=[],n=new Set,i=JSON.parse(localStorage.getItem("leads")||"[]"),r=new Set(i.map(d=>d.cpf?d.cpf.replace(/[^\d]/g,""):""));console.log(`🗄️ CPFs existentes no banco: ${r.size}`);for(let d=0;d<t.length;d++){const l=d+1,c=t[d].trim();if(c){console.log(`📝 Processando linha ${l}: ${c.substring(0,100)}...`);try{let g=[];if(c.includes("	")?(g=c.split("	"),console.log(`🔍 Linha ${l}: Detectado separador TAB, ${g.length} campos`)):c.includes("  ")?(g=c.split(/\s{2,}/),console.log(`🔍 Linha ${l}: Detectado espaços múltiplos, ${g.length} campos`)):(g=c.split(/\s+/),console.log(`🔍 Linha ${l}: Detectado espaço simples, ${g.length} campos`)),g=g.map(y=>y.trim()).filter(y=>y.length>0),console.log(`📊 Linha ${l}: ${g.length} campos após limpeza:`,g),g.length<4){o.push({line:l,error:`Poucos campos encontrados: ${g.length}. Mínimo necessário: 4 (Nome, Email, Telefone, CPF)`,data:c});continue}const[u,m,h,f,x="Kit 262 Cores Canetinhas Coloridas Edição Especial Com Ponta Dupla",E="47.39",L="",w="",S="",$="",I="",P="",B="",A="BR"]=g;if(console.log(`👤 Linha ${l} - Dados extraídos:`,{nome:u,email:m,telefone:h,cpf:f}),!u||u.length<2){o.push({line:l,error:"Nome do cliente é obrigatório e deve ter pelo menos 2 caracteres",data:c});continue}if(!m||!m.includes("@")){o.push({line:l,error:"Email é obrigatório e deve ser válido",data:c});continue}if(!h||h.replace(/[^\d]/g,"").length<10){o.push({line:l,error:"Telefone é obrigatório e deve ter pelo menos 10 dígitos",data:c});continue}const p=f?f.replace(/[^\d]/g,""):"";if(!p||p.length!==11){o.push({line:l,error:"CPF é obrigatório e deve ter exatamente 11 dígitos",data:c});continue}if(n.has(p)){s.push({line:l,cpf:p,nome:u,type:"lista"});continue}if(r.has(p)){s.push({line:l,cpf:p,nome:u,type:"banco"});continue}const v=this.parseValue(E),k=this.buildFullAddress({endereco:L,numero:w,complemento:S,bairro:$,cep:I,cidade:P,estado:B,pais:A}),C={nome_completo:u,email:m,telefone:h,cpf:p,produto:x,valor_total:v,endereco:k,meio_pagamento:"PIX",origem:"direto",etapa_atual:1,status_pagamento:"pendente",order_bumps:[],produtos:[{nome:x,preco:v}],lineNumber:l};a.push(C),n.add(p),console.log(`✅ Linha ${l}: Lead criado com sucesso para ${u}`)}catch(g){console.error(`❌ Erro na linha ${l}:`,g),o.push({line:l,error:`Erro ao processar linha: ${g.message}`,data:c})}}}return console.log("📊 Resultado final do parse:",{leadsValidos:a.length,erros:o.length,duplicatas:s.length}),{success:!0,leads:a,errors:o,duplicates:s,totalProcessed:t.length}}catch(t){return console.error("💥 Erro crítico no parse:",t),{success:!1,error:`Erro crítico ao processar dados: ${t.message}`}}}parseValue(e){if(!e)return 47.39;const t=e.toString().replace(",",".").trim(),a=parseFloat(t);return isNaN(a)?47.39:a}buildFullAddress({endereco:e,numero:t,complemento:a,bairro:o,cep:s,cidade:n,estado:i,pais:r}){const d=[];return e&&d.push(e),t&&d.push(t),a&&d.push(`- ${a}`),o&&d.push(`- ${o}`),n&&i&&d.push(`- ${n}/${i}`),s&&d.push(`- CEP: ${s}`),r&&r!=="BR"&&d.push(`- ${r}`),d.join(" ")||"Endereço não informado"}displayBulkPreview(e){console.log("🖥️ Exibindo pré-visualização...");const t=document.getElementById("bulkPreviewSection"),a=document.getElementById("bulkPreviewContainer"),o=document.getElementById("previewSummary"),s=document.getElementById("confirmBulkImportButton");if(!t||!a){console.error("❌ Elementos de pré-visualização não encontrados");return}t.style.display="block";let n=`
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
        `;if(e.leads.forEach((i,r)=>{const d=r%2===0?"#f8f9fa":"#ffffff";n+=`
                <tr style="background: ${d};">
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${i.lineNumber}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;" title="${i.nome_completo}">
                        ${this.truncateText(i.nome_completo,20)}
                    </td>
                    <td style="padding: 6px; border: 1px solid #ddd;" title="${i.email}">
                        ${this.truncateText(i.email,25)}
                    </td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${i.telefone}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;">${b.formatCPF(i.cpf)}</td>
                    <td style="padding: 6px; border: 1px solid #ddd;" title="${i.produto}">
                        ${this.truncateText(i.produto,30)}
                    </td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">
                        R$ ${i.valor_total.toFixed(2)}
                    </td>
                    <td style="padding: 6px; border: 1px solid #ddd;" title="${i.endereco}">
                        ${this.truncateText(i.endereco,35)}
                    </td>
                </tr>
            `}),n+=`
                    </tbody>
                </table>
            </div>
        `,e.errors.length>0||e.duplicates.length>0){n+=`
                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
                    <h5 style="color: #856404; margin-bottom: 10px;">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Problemas Encontrados (${e.errors.length+e.duplicates.length})
                    </h5>
                    <div style="max-height: 150px; overflow-y: auto;">
            `;const i=[...e.errors,...e.duplicates];i.slice(0,10).forEach(r=>{const d=r.type?`Duplicata (${r.type})`:"Erro";n+=`
                    <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #dc3545;">
                        <strong>Linha ${r.line}:</strong> ${d} - ${r.error||`CPF ${b.formatCPF(r.cpf)} já existe`}
                    </div>
                `}),i.length>10&&(n+=`
                    <div style="text-align: center; color: #666; font-style: italic; margin-top: 10px;">
                        ... e mais ${i.length-10} problemas
                    </div>
                `),n+=`
                    </div>
                </div>
            `}a.innerHTML=n,o&&(o.innerHTML=`
                <i class="fas fa-info-circle"></i>
                ${e.leads.length} registros válidos, 
                ${e.errors.length} erros, 
                ${e.duplicates.length} duplicatas
            `),s&&(e.leads.length>0?(s.style.display="inline-block",s.textContent=`Importar ${e.leads.length} Registros`):s.style.display="none"),console.log("✅ Pré-visualização exibida com sucesso")}truncateText(e,t){return e?e.length>t?e.substring(0,t)+"...":e:""}async confirmBulkImport(){if(this.isImporting){console.warn("⚠️ Importação já em andamento");return}if(!this.bulkImportData||this.bulkImportData.length===0){this.showError("Nenhum dado válido para importar");return}this.isImporting=!0,console.log(`🚀 Iniciando importação de ${this.bulkImportData.length} leads...`),this.showImportProgress();try{const e={success:0,errors:0,total:this.bulkImportData.length};for(let t=0;t<this.bulkImportData.length;t++){const a=this.bulkImportData[t];try{a.id=Date.now().toString()+Math.random().toString(36).substr(2,9),a.created_at=new Date().toISOString(),a.updated_at=new Date().toISOString();const o=JSON.parse(localStorage.getItem("leads")||"[]");o.push(a),localStorage.setItem("leads",JSON.stringify(o)),e.success++,console.log(`✅ Lead ${t+1}/${this.bulkImportData.length} importado: ${a.nome_completo}`)}catch(o){console.error(`❌ Erro ao importar lead ${t+1}:`,o),e.errors++,this.debug(`Erro ao importar dados em massa: ${o.message}`,"confirmBulkImport","error")}this.updateImportProgress(t+1,this.bulkImportData.length),t%10===0&&await new Promise(o=>setTimeout(o,100))}this.finishImport(e)}catch(e){console.error("💥 Erro crítico na importação:",e),this.showError(`Erro na importação: ${e.message}`),this.debug(`Erro ao importar dados em massa: ${e.message}`,"confirmBulkImport","error")}finally{this.isImporting=!1}}showImportProgress(){const e=document.getElementById("bulkResultsSection"),t=document.getElementById("bulkResultsContainer");!e||!t||(e.style.display="block",t.innerHTML=`
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
        `)}updateImportProgress(e,t){const a=document.getElementById("importProgressFill"),o=document.getElementById("importProgressText");if(a&&o){const s=e/t*100;a.style.width=`${s}%`,o.textContent=`${e} / ${t} leads processados`}}finishImport(e){const t=document.getElementById("bulkResultsContainer");t&&(t.innerHTML=`
                <div style="text-align: center; padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <i class="fas fa-check-circle" style="font-size: 2rem; color: #27ae60;"></i>
                    </div>
                    <h4 style="color: #27ae60; margin-bottom: 15px;">Importação Concluída!</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="padding: 15px; background: #d4edda; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: #155724;">${e.success}</div>
                            <div style="color: #155724;">Sucessos</div>
                        </div>
                        <div style="padding: 15px; background: #f8d7da; border-radius: 8px;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: #721c24;">${e.errors}</div>
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
            `),this.clearBulkData(),this.refreshLeads(),console.log(`🎉 Importação finalizada: ${e.success} sucessos, ${e.errors} erros`)}clearBulkData(){const e=document.getElementById("bulkDataTextarea"),t=document.getElementById("bulkPreviewSection"),a=document.getElementById("bulkResultsSection");e&&(e.value=""),t&&(t.style.display="none"),a&&(a.style.display="none"),this.bulkImportData=[],console.log("🧹 Dados de importação limpos")}editBulkData(){const e=document.getElementById("bulkPreviewSection");e&&(e.style.display="none"),this.bulkImportData=[]}async executeMassAction(e,t,a=null){console.log(`🚀 Executando ação em massa: ${e} para ${t.length} leads`);const o={next:"Avançando Etapas",prev:"Retrocedendo Etapas",set:"Definindo Etapas",delete:"Excluindo Leads"},s=this.showProgressBar(o[e]||"Processando",t.length);let n=0,i=0;const r=[];for(let d=0;d<t.length;d++){const l=t[d];s.update(d+1,t.length);try{let c=!1;switch(e){case"next":c=await this.nextStage(l.id);break;case"prev":c=await this.prevStage(l.id);break;case"set":c=await this.setStage(l.id,a);break;case"delete":c=await this.deleteLead(l.id);break}c?n++:(i++,r.push({lead:l.nome_completo,error:"Operação falhou"}))}catch(c){console.error(`❌ Erro ao processar lead ${l.id}:`,c),i++,r.push({lead:l.nome_completo,error:c.message})}d%10===0&&await new Promise(c=>setTimeout(c,50))}s.complete(),console.log(`✅ Ação em massa concluída: ${n} sucessos, ${i} erros`),await this.refreshLeads(),this.clearAllSelections(),i>0?alert(`Operação concluída com ${i} erros. Verifique o console para detalhes.`):console.log(`🎉 Operação concluída com sucesso para todos os ${n} leads`)}showView(e){document.querySelectorAll(".admin-view").forEach(s=>{s.style.display="none"}),document.querySelectorAll(".nav-button").forEach(s=>{s.classList.remove("active")});const t=document.getElementById(e);t&&(t.style.display="block");const a={leadsView:"showLeadsView",addLeadView:"showAddLeadView",bulkAddView:"showBulkAddView"},o=document.getElementById(a[e]);o&&o.classList.add("active"),this.currentView=e,e==="leadsView"&&this.refreshLeads()}async loadLeads(){try{const e=await this.dbService.getData();e.success&&(this.leads=e.data||[],this.filteredLeads=[...this.leads],this.updateLeadsDisplay(),console.log(`📊 ${this.leads.length} leads carregados`))}catch(e){console.error("❌ Erro ao carregar leads:",e)}}async refreshLeads(){console.log("🔄 Atualizando lista de leads..."),await this.loadLeads(),this.applyFilters()}applyFilters(){const e=document.getElementById("searchInput"),t=document.getElementById("dateFilter"),a=document.getElementById("stageFilter");let o=[...this.leads];if(e&&e.value.trim()){const s=e.value.toLowerCase();o=o.filter(n=>n.nome_completo&&n.nome_completo.toLowerCase().includes(s)||n.cpf&&n.cpf.includes(s.replace(/[^\d]/g,"")))}if(t&&t.value){const s=new Date(t.value);o=o.filter(n=>new Date(n.created_at).toDateString()===s.toDateString())}if(a&&a.value&&a.value!=="all")if(a.value==="awaiting_payment")o=o.filter(s=>{const n=s.etapa_atual||1,i=s.status_pagamento||"pendente";return n===11&&i==="pendente"||n===16||n===106||n===116||n===126});else{const s=parseInt(a.value);o=o.filter(n=>(n.etapa_atual||1)===s)}this.filteredLeads=o,this.currentPage=1,this.updateLeadsDisplay(),console.log(`🔍 Filtros aplicados: ${o.length} leads encontrados`)}updateLeadsDisplay(){const e=document.getElementById("leadsTableBody"),t=document.getElementById("leadsCount"),a=document.getElementById("emptyState"),o=document.getElementById("paginationControls");if(!e)return;if(t){const r=this.leads.filter(d=>{const l=d.etapa_atual||1,c=d.status_pagamento||"pendente";return l===11&&c==="pendente"||l===16||l===106||l===116||l===126}).length;t.innerHTML=`
                ${this.filteredLeads.length} leads
                ${r>0?`<span style="background: #ffc107; color: #212529; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-left: 8px;">💳 ${r} aguardando pagamento</span>`:""}
            `}const s=(this.currentPage-1)*this.leadsPerPage,n=s+this.leadsPerPage,i=this.filteredLeads.slice(s,n);if(i.length===0){e.innerHTML="",a&&(a.style.display="block"),o&&(o.style.display="none");return}a&&(a.style.display="none"),o&&(o.style.display="flex"),e.innerHTML=i.map(r=>{const d=r.etapa_atual||1,l=r.status_pagamento||"pendente";let c=this.getStageDisplayName(d),g="";return(d===11&&l==="pendente"||d===16||d===106||d===116||d===126)&&(g=" 💳",c+=" (Aguardando Pagamento)"),`
                <tr>
                    <td>
                        <input type="checkbox" class="lead-checkbox" data-lead-id="${r.id}" 
                               onchange="adminPanel.toggleLeadSelection('${r.id}', this.checked)">
                    </td>
                    <td title="${r.nome_completo||"N/A"}">${this.truncateText(r.nome_completo||"N/A",20)}</td>
                    <td>${b.formatCPF(r.cpf||"")}</td>
                    <td title="${r.email||"N/A"}">${this.truncateText(r.email||"N/A",25)}</td>
                    <td>${r.telefone||"N/A"}</td>
                    <td title="${r.produto||"N/A"}">${this.truncateText(r.produto||"N/A",30)}</td>
                    <td>R$ ${(r.valor_total||0).toFixed(2)}</td>
                    <td>${this.formatDate(r.created_at)}</td>
                    <td>
                        <span class="stage-badge ${this.getStageClass(d,l)}">
                            ${d}${g}
                        </span>
                        <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">
                            ${c}
                        </div>
                    </td>
                    <td>${this.formatDate(r.updated_at)}</td>
                    <td>
                        <div class="lead-actions">
                            <button class="action-button edit" onclick="adminPanel.editLead('${r.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-button next" onclick="adminPanel.nextStage('${r.id}')">
                                <i class="fas fa-forward"></i>
                            </button>
                            <button class="action-button prev" onclick="adminPanel.prevStage('${r.id}')">
                                <i class="fas fa-backward"></i>
                            </button>
                            <button class="action-button delete" onclick="adminPanel.deleteLead('${r.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `}).join(""),this.updatePaginationControls(),this.updateMassActionButtons()}getStageDisplayName(e){return{1:"Pedido criado",2:"Preparando envio",3:"Vendedor enviou",4:"Centro triagem Shenzhen",5:"Centro logístico Shenzhen",6:"Trânsito internacional",7:"Liberado exportação",8:"Saiu origem Shenzhen",9:"Chegou no Brasil",10:"Trânsito Curitiba/PR",11:"Alfândega importação",12:"Liberado alfândega",13:"Sairá para entrega",14:"Em trânsito entrega",15:"Rota de entrega",16:"1ª Tentativa entrega",17:"1ª Tentativa entrega",18:"Reagendamento solicitado",19:"Em rota de entrega",20:"Saindo para entrega",21:"2ª Tentativa entrega",22:"Reagendamento solicitado",23:"Em rota de entrega",24:"Saindo para entrega",25:"3ª Tentativa entrega",26:"Reagendamento solicitado",27:"Em rota de entrega",28:"Saindo para entrega",29:"4ª Tentativa entrega"}[e]||`Etapa ${e}`}getStageClass(e,t){return e===11&&t==="pendente"||e===16||e===106||e===116||e===126?"pending":e>=17||t==="pago"?"completed":""}addAwaitingPaymentFilter(){const e=document.getElementById("stageFilter");if(e&&!document.querySelector('option[value="awaiting_payment"]')){const t=document.createElement("option");t.value="awaiting_payment",t.textContent="💳 Aguardando Pagamento",e.appendChild(t)}}formatDate(e){return e?new Date(e).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"N/A"}showError(e){console.error("❌ Erro:",e),alert(e)}toggleLeadSelection(e,t){t?this.selectedLeads.add(e):this.selectedLeads.delete(e),this.updateMassActionButtons()}toggleSelectAll(e){document.querySelectorAll(".lead-checkbox").forEach(a=>{a.checked=e,this.toggleLeadSelection(a.dataset.leadId,e)})}updateMassActionButtons(){const e=this.selectedLeads.size;["massNextStage","massPrevStage","massSetStage","massDeleteLeads"].forEach(o=>{const s=document.getElementById(o);if(s){s.disabled=e===0;const n=s.querySelector(".action-count");n&&(n.textContent=`(${e} leads)`)}});const a=document.getElementById("selectedCount");a&&(a.textContent=`${e} selecionados`)}updatePaginationControls(){const e=document.getElementById("paginationControls");if(!e)return;const t=Math.ceil(this.filteredLeads.length/this.leadsPerPage),a=(this.currentPage-1)*this.leadsPerPage+1,o=Math.min(this.currentPage*this.leadsPerPage,this.filteredLeads.length);e.innerHTML=`
            <div class="pagination-info">
                <span style="color: #666; font-size: 0.9rem;">
                    Exibindo ${a}-${o} de ${this.filteredLeads.length} leads
                </span>
            </div>
            
            <div class="pagination-controls">
                <div class="pagination-buttons">
                    <button 
                        class="pagination-btn" 
                        id="prevPageBtn"
                        ${this.currentPage<=1?"disabled":""}
                        onclick="adminPanel.goToPage(${this.currentPage-1})"
                    >
                        <i class="fas fa-chevron-left"></i> Anterior
                    </button>
                    
                    <div class="page-info">
                        <span style="margin: 0 15px; font-weight: 600; color: #345C7A;">
                            Página ${this.currentPage} de ${t}
                        </span>
                    </div>
                    
                    <button 
                        class="pagination-btn" 
                        id="nextPageBtn"
                        ${this.currentPage>=t?"disabled":""}
                        onclick="adminPanel.goToPage(${this.currentPage+1})"
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
                        <option value="20" ${this.leadsPerPage===20?"selected":""}>20</option>
                        <option value="50" ${this.leadsPerPage===50?"selected":""}>50</option>
                        <option value="100" ${this.leadsPerPage===100?"selected":""}>100</option>
                        <option value="500" ${this.leadsPerPage===500?"selected":""}>500</option>
                    </select>
                </div>
            </div>
        `}goToPage(e){const t=Math.ceil(this.filteredLeads.length/this.leadsPerPage);e<1||e>t||(this.currentPage=e,this.updateLeadsDisplay(),console.log(`📄 Navegando para página ${e} de ${t}`))}changeLeadsPerPage(e){const t=this.leadsPerPage;this.leadsPerPage=parseInt(e);const a=(this.currentPage-1)*t+1;this.currentPage=Math.ceil(a/this.leadsPerPage),this.updateLeadsDisplay(),console.log(`📊 Leads por página alterado: ${t} → ${this.leadsPerPage}`)}setupModalEvents(){}startAutoUpdate(){this.systemMode==="auto"&&(this.autoUpdateInterval=setInterval(()=>{this.processAutoUpdates()},2*60*60*1e3))}processAutoUpdates(){}updateSystemMode(e){this.systemMode=e;const t=document.getElementById("systemStatus");t&&(e==="auto"?(t.innerHTML='<i class="fas fa-robot"></i> Modo Automático',t.className="status-indicator auto",this.startAutoUpdate()):(t.innerHTML='<i class="fas fa-hand-paper"></i> Modo Manual',t.className="status-indicator manual",this.autoUpdateInterval&&(clearInterval(this.autoUpdateInterval),this.autoUpdateInterval=null)))}async handleAddLead(e){e.preventDefault()}editLead(e){try{this.debugLog("info",`Iniciando edição do lead: ${e}`,"editLead");const a=JSON.parse(localStorage.getItem("leads")||"[]").find(o=>o.id===e);if(!a){this.debugLog("error",`Lead não encontrado: ${e}`,"editLead"),alert("Lead não encontrado");return}this.debugLog("info",`Lead encontrado: ${a.nome_completo}`,"editLead"),this.fillEditForm(a),this.currentEditingLeadId=e,this.showEditModal(),this.debugLog("info","Modal de edição aberto com sucesso","editLead")}catch(t){this.debugLog("error",`Erro ao editar lead: ${t.message}`,"editLead"),alert("Erro ao carregar dados do lead")}}fillEditForm(e){try{const t={editName:e.nome_completo||"",editCPF:e.cpf||"",editEmail:e.email||"",editPhone:e.telefone||"",editAddress:e.endereco||"",editStage:e.etapa_atual||1};Object.entries(t).forEach(([n,i])=>{const r=document.getElementById(n);r?r.value=i:this.debugLog("warning",`Campo não encontrado: ${n}`,"fillEditForm")});const a=new Date,o=new Date(a.getTime()-a.getTimezoneOffset()*6e4).toISOString().slice(0,16),s=document.getElementById("editStageDateTime");s&&(s.value=o),this.debugLog("info","Formulário de edição preenchido","fillEditForm")}catch(t){this.debugLog("error",`Erro ao preencher formulário: ${t.message}`,"fillEditForm")}}showEditModal(){const e=document.getElementById("editModal");e?(e.style.display="flex",document.body.style.overflow="hidden",this.debugLog("info","Modal de edição exibido","showEditModal")):this.debugLog("error","Modal de edição não encontrado no DOM","showEditModal")}closeEditModal(){const e=document.getElementById("editModal");e&&(e.style.display="none",document.body.style.overflow="auto",this.currentEditingLeadId=null,this.debugLog("info","Modal de edição fechado","closeEditModal"))}saveEditedLead(){try{if(!this.currentEditingLeadId){this.debugLog("error","ID do lead sendo editado não encontrado","saveEditedLead"),alert("Erro: ID do lead não encontrado");return}this.debugLog("info",`Salvando edições do lead: ${this.currentEditingLeadId}`,"saveEditedLead");const e=JSON.parse(localStorage.getItem("leads")||"[]"),t=e.findIndex(o=>o.id===this.currentEditingLeadId);if(t===-1){this.debugLog("error",`Lead não encontrado para salvar: ${this.currentEditingLeadId}`,"saveEditedLead"),alert("Lead não encontrado");return}const a={nome_completo:document.getElementById("editName").value.trim(),cpf:document.getElementById("editCPF").value.trim(),email:document.getElementById("editEmail").value.trim(),telefone:document.getElementById("editPhone").value.trim(),endereco:document.getElementById("editAddress").value.trim(),etapa_atual:parseInt(document.getElementById("editStage").value),updated_at:new Date().toISOString()};if(!a.nome_completo){this.debugLog("warning","Nome completo é obrigatório","saveEditedLead"),alert("Nome completo é obrigatório");return}if(!a.cpf||a.cpf.replace(/[^\d]/g,"").length!==11){this.debugLog("warning","CPF inválido","saveEditedLead"),alert("CPF deve ter 11 dígitos");return}e[t]={...e[t],...a},localStorage.setItem("leads",JSON.stringify(e)),this.debugLog("info",`Lead atualizado com sucesso: ${a.nome_completo}`,"saveEditedLead"),this.closeEditModal(),this.refreshLeads(),this.showSuccessMessage("Lead atualizado com sucesso!")}catch(e){this.debugLog("error",`Erro ao salvar lead editado: ${e.message}`,"saveEditedLead"),alert("Erro ao salvar alterações")}}showSuccessMessage(e){const t=document.createElement("div");t.style.cssText=`
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
        `,t.innerHTML=`
            <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
            ${e}
        `,document.body.appendChild(t),setTimeout(()=>{t.parentNode&&t.remove()},3e3)}async nextStage(e){this.debug(`Tentando avançar etapa do lead: ${e}`,"nextStage","info");try{const t=JSON.parse(localStorage.getItem("leads")||"[]"),a=t.findIndex(s=>s.id===e);if(a===-1)throw this.debug(`Lead não encontrado: ${e}`,"nextStage","error"),new Error("Lead não encontrado");const o=t[a].etapa_atual||1;o<29&&(t[a].etapa_atual=o+1,t[a].updated_at=new Date().toISOString()),localStorage.setItem("leads",JSON.stringify(t)),this.refreshLeads(),this.debug(`Etapa avançada com sucesso para lead ${e}`,"nextStage","info")}catch(t){this.debug(`Erro ao avançar etapa: ${t.message}`,"nextStage","error"),console.error("Erro ao avançar etapa:",t),alert("Erro ao avançar etapa: "+t.message)}}async prevStage(e){this.debug(`Tentando retroceder etapa do lead: ${e}`,"prevStage","info");try{const t=JSON.parse(localStorage.getItem("leads")||"[]"),a=t.findIndex(s=>s.id===e);if(a===-1)throw this.debug(`Lead não encontrado: ${e}`,"prevStage","error"),new Error("Lead não encontrado");const o=t[a].etapa_atual||1;o>1&&(t[a].etapa_atual=o-1,t[a].updated_at=new Date().toISOString()),localStorage.setItem("leads",JSON.stringify(t)),this.refreshLeads(),this.debug(`Etapa retrocedida com sucesso para lead ${e}`,"prevStage","info")}catch(t){this.debug(`Erro ao retroceder etapa: ${t.message}`,"prevStage","error"),console.error("Erro ao retroceder etapa:",t),alert("Erro ao retroceder etapa: "+t.message)}}async deleteLead(e){if(this.debug(`Tentando excluir lead: ${e}`,"deleteLead","info"),!confirm("Tem certeza que deseja excluir este lead?")){this.debug(`Exclusão cancelada pelo usuário: ${e}`,"deleteLead","info");return}try{const a=JSON.parse(localStorage.getItem("leads")||"[]").filter(o=>o.id!==e);localStorage.setItem("leads",JSON.stringify(a)),this.refreshLeads(),this.debug(`Lead excluído com sucesso: ${e}`,"deleteLead","info")}catch(t){this.debug(`Erro ao excluir lead: ${t.message}`,"deleteLead","error"),console.error("Erro ao excluir lead:",t),alert("Erro ao excluir lead: "+t.message)}}async performMassAction(e,t,a=null){this.debug(`Iniciando ação em massa: ${e} para ${t.length} leads`,"performMassAction","info"),this.showProgressBar(e,t.length);try{const o=JSON.parse(localStorage.getItem("leads")||"[]");let s=0,n=0;for(let i=0;i<t.length;i++){const r=t[i];try{this.updateProgressBar(i+1,t.length,e),await new Promise(l=>setTimeout(l,50));const d=o.findIndex(l=>l.id===r);if(d===-1)throw new Error(`Lead ${r} não encontrado`);switch(e){case"next":o[d].etapa_atual<29&&o[d].etapa_atual++;break;case"prev":o[d].etapa_atual>1&&o[d].etapa_atual--;break;case"setStage":a&&(o[d].etapa_atual=parseInt(a));break;case"delete":o.splice(d,1);break}o[d]&&(o[d].updated_at=new Date().toISOString()),s++}catch(d){this.debug(`Erro ao processar lead ${r}: ${d.message}`,"performMassAction","error"),n++}}localStorage.setItem("leads",JSON.stringify(o)),this.finishProgressBar(s,n),this.refreshLeads(),this.clearSelectedLeads(),this.debug(`Ação em massa concluída: ${s} sucessos, ${n} erros`,"performMassAction","info")}catch(o){this.debug(`Erro na ação em massa: ${o.message}`,"performMassAction","error"),this.hideProgressBar(),alert("Erro na operação: "+o.message)}}finishProgressBar(e,t){const a=document.getElementById("massActionProgressBar");a&&(a.innerHTML=`
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
                    ${e} sucessos${t>0?`, ${t} erros`:""}
                </div>
            </div>
        `,setTimeout(()=>{this.hideProgressBar()},2e3))}clearSelectedLeads(){this.selectedLeads.clear(),document.querySelectorAll(".lead-checkbox").forEach(t=>{t.checked=!1});const e=document.getElementById("selectAllLeads");e&&(e.checked=!1),this.updateMassActionButtons(),this.debug("Todas as seleções foram limpas","clearSelectedLeads","info")}selectAllCurrentPageLeads(){const e=document.querySelectorAll(".lead-checkbox");e.forEach(a=>{a.checked=!0,this.selectedLeads.add(a.value)});const t=document.getElementById("selectAllLeads");t&&(t.checked=!0),this.updateMassActionButtons(),this.debug(`Selecionados todos os ${e.length} leads da página atual`,"selectAllCurrentPageLeads","info")}async executeMassAction(e,t=null){try{const a=Array.from(this.selectedLeads);if(a.length===0){alert("Selecione pelo menos um lead para executar esta ação.");return}this.debugLog("info",`Iniciando ação em massa: ${e} em ${a.length} leads`,"executeMassAction");const o={next:"Avançando etapas...",prev:"Retrocedendo etapas...",set:"Definindo etapas...",delete:"Excluindo leads..."};this.showProgressBar(o[e]||"Processando...",a.length),this.cancelMassOperation=!1;const s=JSON.parse(localStorage.getItem("leads")||"[]");let n=0,i=0;for(let r=0;r<a.length;r++){if(this.cancelMassOperation){this.debugLog("info","Operação cancelada pelo usuário","executeMassAction");break}const d=a[r],l=s.findIndex(c=>c.id===d);if(l!==-1)try{switch(e){case"next":s[l].etapa_atual<29&&(s[l].etapa_atual++,s[l].updated_at=new Date().toISOString(),n++);break;case"prev":s[l].etapa_atual>1&&(s[l].etapa_atual--,s[l].updated_at=new Date().toISOString(),n++);break;case"set":t&&(s[l].etapa_atual=parseInt(t),s[l].updated_at=new Date().toISOString(),n++);break;case"delete":s.splice(l,1),n++;break}}catch(c){i++,this.debugLog("error",`Erro ao processar lead ${d}: ${c.message}`,"executeMassAction")}this.updateProgressBar(r+1,a.length),r%10===0&&await new Promise(c=>setTimeout(c,50))}localStorage.setItem("leads",JSON.stringify(s)),this.cancelMassOperation||this.showOperationSuccess(`✅ ${n} leads processados com sucesso!`),this.debugLog("info",`Ação em massa concluída: ${n} sucessos, ${i} erros`,"executeMassAction"),await this.refreshLeads(),this.clearSelectedLeads(),alert(`Operação concluída!
Sucessos: ${n}
Erros: ${i}`)}catch(a){this.hideProgressBar(),this.debugLog("error",`Erro na ação em massa: ${a.message}`,"executeMassAction"),alert("Erro ao executar ação em massa")}}async createLead(e){}async saveEditedLead(e){}async clearAllLeads(){confirm("Tem certeza que deseja limpar todos os leads? Esta ação não pode ser desfeita.")&&(localStorage.setItem("leads","[]"),await this.refreshLeads(),console.log("🧹 Todos os leads foram removidos"))}getSelectedLeads(){const e=Array.from(this.selectedLeads);return this.filteredLeads.filter(t=>e.includes(t.id))}}document.addEventListener("DOMContentLoaded",()=>{window.adminPanel=new M,setTimeout(()=>{window.adminPanel.addAwaitingPaymentFilter()},1e3)});
