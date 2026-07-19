import api from './client';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const accountsApi = {
  list: () => api.get('/accounts'),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  remove: (id) => api.delete(`/accounts/${id}`),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const transactionsApi = {
  list: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  remove: (id) => api.delete(`/transactions/${id}`),
};

export const budgetsApi = {
  list: (params) => api.get('/budgets', { params }),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
};

export const goalsApi = {
  list: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  contribute: (id, amount, accountId) => api.post(`/goals/${id}/add`, null, { params: { amount, accountId } }),
  withdraw: (id, amount, accountId) => api.post(`/goals/${id}/withdraw`, null, { params: { amount, accountId } }),
  spend: (id, amount, accountId) => api.post(`/goals/${id}/spend`, null, { params: { amount, accountId } }),
  remove: (id) => api.delete(`/goals/${id}`),
};

export const recurringApi = {
  list: () => api.get('/recurring'),
  create: (data) => api.post('/recurring', data),
  update: (id, data) => api.put(`/recurring/${id}`, data),
  remove: (id) => api.delete(`/recurring/${id}`),
};

export const dashboardApi = {
  get: (params) => api.get('/dashboard', { params }),
};
