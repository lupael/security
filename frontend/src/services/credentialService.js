import axios from 'axios';
import authHeader from './authHeader';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/credentials/`;

const createCredential = (name, type, username, secret) => {
    return axios.post(API_URL, { name, type, username, secret }, { headers: authHeader() });
};

const getCredentials = () => {
    return axios.get(API_URL, { headers: authHeader() });
};

const getCredential = (id) => {
    return axios.get(API_URL + id, { headers: authHeader() });
};

const updateCredential = (id, name, type, username, secret) => {
    return axios.put(API_URL + id, { name, type, username, secret }, { headers: authHeader() });
};

const deleteCredential = (id) => {
    return axios.delete(API_URL + id, { headers: authHeader() });
};

export default {
    createCredential,
    getCredentials,
    getCredential,
    updateCredential,
    deleteCredential,
};
