import axios from 'axios';
import authHeader from './authHeader';

const API_URL = 'http://localhost:5001/api/scans/';

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
