import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const keyService = {
  // Lấy tất cả keys
  getAllKeys: async () => {
    const response = await apiClient.get('/api/keys');
    return response.data;
  },

  // Tạo key mới
  createKey: async (data) => {
    const response = await apiClient.post('/api/keys', data);
    return response.data;
  },

  // Xóa key
  deleteKey: async (id) => {
    const response = await apiClient.delete(`/api/keys/${id}`);
    return response.data;
  },

  // Cập nhật key
  updateKey: async (id, data) => {
    const response = await apiClient.put(`/api/keys/${id}`, data);
    return response.data;
  },
};

export default keyService;
