import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__ ? 'http://192.168.1.6:5000/api' : 'http://YOUR_LOCAL_IP:5000/api'; // Change YOUR_LOCAL_IP to your computer's IP for physical device testing

const request = async (url, method, body, auth = true) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(auth && token ? { Authorization: token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const authAPI = {
  register: (data) => request('/auth/register', 'POST', data, false),
  login: async (data) => {
    const res = await request('/auth/login', 'POST', data, false);
    if (res.token) await AsyncStorage.setItem('token', res.token);
    return res;
  },
  loadToken: () => AsyncStorage.getItem('token'),
  logout: () => AsyncStorage.removeItem('token'),
};

export const profileAPI = {
  get: () => request('/profile', 'GET'),
  update: (data) => request('/profile', 'PUT', data),
};

export const contactsAPI = {
  getAll: () => request('/contacts', 'GET'),
  add: (data) => request('/contacts', 'POST', data),
  update: (id, data) => request(`/contacts/${id}`, 'PUT', data),
  delete: (id) => request(`/contacts/${id}`, 'DELETE'),
};

export const sosAPI = {
  logEmergency: (data) => request('/sos/start', 'POST', data),
};

export const chatAPI = {
  sendMessage: (message, context) => request('/chat', 'POST', { message, context }),
};
