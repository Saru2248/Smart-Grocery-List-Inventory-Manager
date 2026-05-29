const API_URL = 'http://localhost:5000/api';

// Helper to handle requests and inject token
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('grocery_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  // Auth API
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (name, email, password) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  getProfile: async () => {
    return request('/auth/me');
  },

  // Grocery Item CRUD API
  getItems: async (filters = {}) => {
    const { search, category, status } = filters;
    let queryParams = [];

    if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
    if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return request(`/groceries${queryString}`);
  },

  addItem: async (itemData) => {
    return request('/groceries', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  updateItem: async (id, itemData) => {
    return request(`/groceries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  deleteItem: async (id) => {
    return request(`/groceries/${id}`, {
      method: 'DELETE',
    });
  },

  updateQuantity: async (id, change) => {
    return request(`/groceries/${id}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ change }),
    });
  },

  // Dashboard API
  getDashboard: async () => {
    return request('/groceries/dashboard');
  },
};
