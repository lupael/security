import axios from 'axios';
import authHeader from './authHeader';

const API_URL = 'http://localhost:5001/api/admin/';

const getUsers = () => {
    return axios.get(API_URL + 'users', { headers: authHeader() });
};

const deleteUser = (id) => {
    return axios.delete(API_URL + `users/${id}`, { headers: authHeader() });
};

const getScans = () => {
    return axios.get(API_URL + 'scans', { headers: authHeader() });
};

const getLogs = () => {
    return axios.get(API_URL + 'logs', { headers: authHeader() });
};

export default {
    getUsers,
    deleteUser,
    getScans,
    getLogs,
};
