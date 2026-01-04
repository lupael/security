import axios from 'axios';
import authHeader from './authHeader';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/reports/`;

const exportReport = (scanId, format) => {
  return axios.get(API_URL + `${scanId}/export?format=${format}`, { 
    headers: authHeader(),
    responseType: 'blob',
  }).then((response) => {
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report-${scanId}.${format}`);
    document.body.appendChild(link);
    link.click();
  });
};


export default {
    exportReport,
};
