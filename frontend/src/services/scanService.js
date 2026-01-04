import axios from 'axios';
import authHeader from './authHeader';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/scans/`;

const getScans = () => {
  return axios.get(API_URL, { headers: authHeader() });
};

const startScan = (target, type, credentialId) => {
  const scanData = { target, type };
  if (credentialId) {
    scanData.credentialId = credentialId;
  }
  return axios.post(API_URL, scanData, { headers: authHeader() });
};

const getScanReport = (scanId) => {
    return axios.get(API_URL + scanId, { headers: authHeader() });
};

export default {
  getScans,
  startScan,
  getScanReport,
};
