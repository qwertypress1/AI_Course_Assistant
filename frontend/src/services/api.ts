import axios from 'axios';

let rawBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');
if (!rawBaseUrl.endsWith('/api/v1')) {
  rawBaseUrl = `${rawBaseUrl}/api/v1`;
}
export const API_BASE_URL = rawBaseUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token if stored in localStorage as fallback
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to clear stale token on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    if (res.data.access_token) {
      localStorage.setItem('access_token', res.data.access_token);
    }
    return res.data;
  },
  login: async (data: any) => {
    const res = await api.post('/auth/login', data);
    if (res.data.access_token) {
      localStorage.setItem('access_token', res.data.access_token);
    }
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: async () => {
    localStorage.removeItem('access_token');
  },
};

// Course API
export const courseApi = {
  list: async () => {
    const res = await api.get('/courses');
    return res.data;
  },
  create: async (data: { name: string; code: string; description?: string }) => {
    const res = await api.post('/courses', data);
    return res.data;
  },
  get: async (id: string) => {
    const res = await api.get(`/courses/${id}`);
    return res.data;
  },
  enroll: async (courseId: string, role: string = 'student') => {
    const res = await api.post(`/courses/${courseId}/enroll`, { course_id: courseId, role });
    return res.data;
  },
};

// Document API
export const documentApi = {
  upload: async (courseId: string, file: File) => {
    const formData = new FormData();
    formData.append('course_id', courseId);
    formData.append('file', file);
    const res = await api.post('/documents/upload', formData);
    return res.data;
  },
  list: async (courseId: string) => {
    const res = await api.get(`/documents?course_id=${courseId}`);
    return res.data;
  },
  getStatus: async (documentId: string) => {
    const res = await api.get(`/documents/${documentId}/status`);
    return res.data;
  },
  delete: async (documentId: string) => {
    const res = await api.delete(`/documents/${documentId}`);
    return res.data;
  },
};

// Chat API
export const chatApi = {
  createSession: async (courseId: string, title?: string) => {
    const res = await api.post('/chat/sessions', { course_id: courseId, title });
    return res.data;
  },
  listSessions: async (courseId?: string) => {
    const url = courseId ? `/chat/sessions?course_id=${courseId}` : '/chat/sessions';
    const res = await api.get(url);
    return res.data;
  },
  getMessages: async (sessionId: string) => {
    const res = await api.get(`/chat/sessions/${sessionId}/messages`);
    return res.data;
  },
  deleteSession: async (sessionId: string) => {
    const res = await api.delete(`/chat/sessions/${sessionId}`);
    return res.data;
  },
};
