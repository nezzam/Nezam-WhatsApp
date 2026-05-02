import axiosInstance from '../lib/api';

class ApiService {
  // Auth & Settings
  async checkSetupStatus() {
    const res = await axiosInstance.get('/auth/setup-status');
    return res.data;
  }

  async setupAdmin(data: any) {
    const res = await axiosInstance.post('/auth/setup', data);
    return res.data;
  }

  async login(data: any) {
    const res = await axiosInstance.post('/auth/login', data);
    return res.data;
  }

  async verify2fa(data: any) {
    const res = await axiosInstance.post('/auth/verify-2fa', data);
    return res.data;
  }

  async getMe() {
    const res = await axiosInstance.get('/auth/me');
    return res.data;
  }

  async updatePassword(data: any) {
    const res = await axiosInstance.post('/auth/update-password', data);
    return res.data;
  }

  async generate2fa() {
    const res = await axiosInstance.post('/auth/2fa/generate');
    return res.data;
  }

  async enable2fa(data: any) {
    const res = await axiosInstance.post('/auth/2fa/enable', data);
    return res.data;
  }

  async disable2fa(data: any) {
    const res = await axiosInstance.post('/auth/2fa/disable', data);
    return res.data;
  }

  async generateApiKey() {
    const res = await axiosInstance.post('/auth/api-key/generate');
    return res.data;
  }

  async revokeApiKey() {
    const res = await axiosInstance.delete('/auth/api-key');
    return res.data;
  }

  // Dashboard
  async getDashboardStats() {
    const res = await axiosInstance.get('/dashboard/stats');
    return res.data;
  }

  // Accounts
  async getAccounts() {
    const res = await axiosInstance.get('/accounts');
    return res.data;
  }

  async createAccount(name: string) {
    const res = await axiosInstance.post('/accounts', { name });
    return res.data;
  }

  async getAccount(id: string) {
    const res = await axiosInstance.get(`/accounts/${id}`);
    return res.data;
  }

  async getQRCode(id: string) {
    const res = await axiosInstance.get(`/accounts/${id}/qr`);
    return res.data;
  }

  async getAccountStatus(id: string) {
    const res = await axiosInstance.get(`/accounts/${id}/status`);
    return res.data;
  }

  async disconnectAccount(id: string) {
    const res = await axiosInstance.post(`/accounts/${id}/disconnect`);
    return res.data;
  }

  async restartAccount(id: string) {
    const res = await axiosInstance.post(`/accounts/${id}/restart`);
    return res.data;
  }

  async deleteAccount(id: string) {
    const res = await axiosInstance.delete(`/accounts/${id}`);
    return res.data;
  }

  // Messages
  async sendMessage(data: {
    accountId: string;
    to: string;
    message: string;
    type?: string;
    mediaPath?: string;
  }) {
    const res = await axiosInstance.post('/messages/send', data);
    return res.data;
  }

  async bulkSend(
    accountId: string,
    messages: Array<{ to: string; message: string; type?: string }>
  ) {
    const res = await axiosInstance.post('/messages/bulk', { accountId, messages });
    return res.data;
  }

  async getMessages(params?: {
    accountId?: string;
    status?: string;
    limit?: number;
    page?: number;
  }) {
    const res = await axiosInstance.get('/messages', { params });
    return res.data;
  }

  // Queue
  async getQueueJobs(params?: { accountId?: string; status?: string }) {
    const res = await axiosInstance.get('/queue/jobs', { params });
    return res.data;
  }

  async getQueueStats() {
    const res = await axiosInstance.get('/queue/stats');
    return res.data;
  }

  async retryJob(id: string) {
    const res = await axiosInstance.post(`/queue/jobs/${id}/retry`);
    return res.data;
  }

  async cancelJob(id: string) {
    const res = await axiosInstance.delete(`/queue/jobs/${id}`);
    return res.data;
  }

  // Automation
  async getRules() {
    const res = await axiosInstance.get('/automation');
    return res.data;
  }

  async createRule(data: {
    keyword: string;
    reply: string;
    matchType?: string;
  }) {
    const res = await axiosInstance.post('/automation', data);
    return res.data;
  }

  async updateRule(
    id: string,
    data: { keyword?: string; reply?: string; isActive?: boolean }
  ) {
    const res = await axiosInstance.put(`/automation/${id}`, data);
    return res.data;
  }

  async deleteRule(id: string) {
    const res = await axiosInstance.delete(`/automation/${id}`);
    return res.data;
  }

  async toggleRule(id: string) {
    const res = await axiosInstance.patch(`/automation/${id}/toggle`);
    return res.data;
  }

  // Upload
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axiosInstance.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  }
}

export const api = new ApiService();
