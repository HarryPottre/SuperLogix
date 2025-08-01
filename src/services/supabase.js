/**
 * Serviço de integração com Supabase
 */
import { createClient } from '@supabase/supabase-js';

export class SupabaseService {
    constructor() {
        this.supabase = null;
        this.init();
    }

    init() {
        try {
            // Usar URL derivada do projeto
            const supabaseUrl = 'https://enigcxhecrtqlomeewgo.supabase.co';
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuaWdjeGhlY3J0cWxvbWVld2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODk2MDAsImV4cCI6MjA1MTI2NTYwMH0.Zt8bNlJf8vKGZqJQZ8vKGZqJQZ8vKGZqJQZ8vKGZqJQ';

            console.log('🔧 Configurando Supabase:', {
                url: supabaseUrl,
                hasAnonKey: !!supabaseAnonKey,
                project: 'enigcxhecrtqlomeewgo'
            });

            if (!supabaseUrl) {
                console.warn('⚠️ URL do Supabase não encontrada, usando localStorage como fallback');
                return;
            }

            this.supabase = createClient(supabaseUrl, supabaseAnonKey);
            console.log('✅ Supabase inicializado com sucesso para projeto enigcxhecrtqlomeewgo');
            console.log('🔗 Database Host: aws-0-eu-north-1.pooler.supabase.com:6543');
        } catch (error) {
            console.error('❌ Erro ao inicializar Supabase:', error);
        }
    }

    async getLeadByCPF(cpf) {
        if (!this.supabase) {
            return this.getLeadFromLocalStorage(cpf);
        }

        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('🔍 Buscando lead no Supabase para CPF:', cleanCPF);

            const { data, error } = await this.supabase
                .from('leads')
                .select('*')
                .eq('cpf', cleanCPF)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('❌ Lead não encontrado no Supabase para CPF:', cleanCPF);
                    return { success: false, error: 'Lead não encontrado' };
                }
                throw error;
            }

            console.log('✅ Lead encontrado no Supabase:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro ao buscar lead no Supabase:', error);
            // Fallback para localStorage
            return this.getLeadFromLocalStorage(cpf);
        }
    }

    async createLead(leadData) {
        if (!this.supabase) {
            return this.createLeadInLocalStorage(leadData);
        }

        try {
            console.log('📝 Criando lead no Supabase:', leadData);

            const { data, error } = await this.supabase
                .from('leads')
                .insert([leadData])
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('✅ Lead criado no Supabase:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro ao criar lead no Supabase:', error);
            // Fallback para localStorage
            return this.createLeadInLocalStorage(leadData);
        }
    }

    async updatePaymentStatus(cpf, status) {
        if (!this.supabase) {
            return this.updatePaymentStatusInLocalStorage(cpf, status);
        }

        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('💳 Atualizando status de pagamento no Supabase:', cleanCPF, status);

            const { data, error } = await this.supabase
                .from('leads')
                .update({ 
                    status_pagamento: status,
                    updated_at: new Date().toISOString()
                })
                .eq('cpf', cleanCPF)
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('✅ Status de pagamento atualizado no Supabase:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro ao atualizar status de pagamento no Supabase:', error);
            // Fallback para localStorage
            return this.updatePaymentStatusInLocalStorage(cpf, status);
        }
    }

    async updateLeadStage(cpf, stage) {
        if (!this.supabase) {
            return this.updateLeadStageInLocalStorage(cpf, stage);
        }

        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            console.log('📊 Atualizando etapa do lead no Supabase:', cleanCPF, stage);

            const { data, error } = await this.supabase
                .from('leads')
                .update({ 
                    etapa_atual: stage,
                    updated_at: new Date().toISOString()
                })
                .eq('cpf', cleanCPF)
                .select()
                .single();

            if (error) {
                throw error;
            }

            console.log('✅ Etapa do lead atualizada no Supabase:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro ao atualizar etapa do lead no Supabase:', error);
            // Fallback para localStorage
            return this.updateLeadStageInLocalStorage(cpf, stage);
        }
    }

    async getAllLeads() {
        if (!this.supabase) {
            return this.getAllLeadsFromLocalStorage();
        }

        try {
            console.log('📊 Buscando todos os leads no Supabase');

            const { data, error } = await this.supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            console.log(`✅ ${data.length} leads encontrados no Supabase`);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Erro ao buscar leads no Supabase:', error);
            // Fallback para localStorage
            return this.getAllLeadsFromLocalStorage();
        }
    }

    // Métodos de fallback para localStorage
    getLeadFromLocalStorage(cpf) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const lead = leads.find(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === cleanCPF);
            
            if (lead) {
                console.log('✅ Lead encontrado no localStorage:', lead);
                return { success: true, data: lead };
            } else {
                console.log('❌ Lead não encontrado no localStorage para CPF:', cleanCPF);
                return { success: false, error: 'Lead não encontrado' };
            }
        } catch (error) {
            console.error('❌ Erro ao buscar lead no localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    createLeadInLocalStorage(leadData) {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            leadData.id = leadData.id || Date.now().toString();
            leadData.created_at = leadData.created_at || new Date().toISOString();
            leadData.updated_at = new Date().toISOString();
            
            leads.push(leadData);
            localStorage.setItem('leads', JSON.stringify(leads));
            
            console.log('✅ Lead criado no localStorage:', leadData);
            return { success: true, data: leadData };
        } catch (error) {
            console.error('❌ Erro ao criar lead no localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    updatePaymentStatusInLocalStorage(cpf, status) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === cleanCPF);
            
            if (leadIndex !== -1) {
                leads[leadIndex].status_pagamento = status;
                leads[leadIndex].updated_at = new Date().toISOString();
                localStorage.setItem('leads', JSON.stringify(leads));
                
                console.log('✅ Status de pagamento atualizado no localStorage:', status);
                return { success: true, data: leads[leadIndex] };
            } else {
                console.log('❌ Lead não encontrado para atualizar status de pagamento');
                return { success: false, error: 'Lead não encontrado' };
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar status de pagamento:', error);
            return { success: false, error: error.message };
        }
    }

    updateLeadStageInLocalStorage(cpf, stage) {
        try {
            const cleanCPF = cpf.replace(/[^\d]/g, '');
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            const leadIndex = leads.findIndex(l => l.cpf && l.cpf.replace(/[^\d]/g, '') === cleanCPF);
            
            if (leadIndex !== -1) {
                leads[leadIndex].etapa_atual = stage;
                leads[leadIndex].updated_at = new Date().toISOString();
                localStorage.setItem('leads', JSON.stringify(leads));
                
                console.log('✅ Etapa do lead atualizada no localStorage:', stage);
                return { success: true, data: leads[leadIndex] };
            } else {
                console.log('❌ Lead não encontrado para atualizar etapa');
                return { success: false, error: 'Lead não encontrado' };
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar etapa do lead:', error);
            return { success: false, error: error.message };
        }
    }

    getAllLeadsFromLocalStorage() {
        try {
            const leads = JSON.parse(localStorage.getItem('leads') || '[]');
            return { success: true, data: leads };
        } catch (error) {
            console.error('❌ Erro ao obter dados do localStorage:', error);
            return { success: false, error: error.message };
        }
    }

    // Método para testar conexão
    async testConnection() {
        if (!this.supabase) {
            console.log('⚠️ Supabase não inicializado, usando localStorage');
            return false;
        }

        try {
            const { data, error } = await this.supabase
                .from('leads')
                .select('count')
                .limit(1);

            if (error) {
                console.error('❌ Erro ao testar conexão Supabase:', error);
                return false;
            }

            console.log('✅ Conexão Supabase OK');
            return true;
        } catch (error) {
            console.error('❌ Erro ao testar conexão:', error);
            return false;
        }
    }
}