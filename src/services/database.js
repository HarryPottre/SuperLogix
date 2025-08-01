/**
 * Serviço de banco de dados - Integração com Supabase
 */
import { SupabaseService } from './supabase.js';

export class DatabaseService {
    constructor() {
        this.supabaseService = new SupabaseService();
        console.log('🗄️ DatabaseService inicializado com Supabase');
    }

    async getLeadByCPF(cpf) {
        return await this.supabaseService.getLeadByCPF(cpf);
    }

    async createLead(leadData) {
        return await this.supabaseService.createLead(leadData);
    }

    async updatePaymentStatus(cpf, status) {
        return await this.supabaseService.updatePaymentStatus(cpf, status);
    }

    async updateLeadStage(cpf, stage) {
        return await this.supabaseService.updateLeadStage(cpf, stage);
    }

    // Método para compatibilidade
    async getAllLeads() {
        return await this.supabaseService.getAllLeads();
    }

    async testConnection() {
        return await this.supabaseService.testConnection();
    }
}