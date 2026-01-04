import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth/`;

const register = (userData) => {
  return axios.post(API_URL + 'register', userData);
};

const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData);
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

export default {
  register,
  login,
  logout,
  getCurrentUser,
};
