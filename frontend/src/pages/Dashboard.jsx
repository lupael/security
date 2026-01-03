import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { io } from 'socket.io-client';

const Dashboard = () => {
    const { t } = useTranslation();
    const [target, setTarget] = useState('');
    const [scanType, setScanType] = useState('web');
    const [snmpCommunity, setSnmpCommunity] = useState('public');
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(false);

    // In a real app, this would be fetched from a /api/credentials endpoint
    const [credentials, setCredentials] = useState([]);
    const [selectedCredentialId, setSelectedCredentialId] = useState('');

    const handleStartScan = async () => {
        setLoading(true);
        try {
            const payload = {
                target,
                scanType,
                ...(scanType === 'network' && { snmpCommunity, credentialId: selectedCredentialId || null })
            };
            const response = await api.post('/scans', payload);
            setScans(prevScans => [response.data, ...prevScans]);
        } catch (error) {
            console.error("Failed to start scan", error);
            // TODO: Show an error message to the user
        }
        setLoading(false);
    };
    
    // Fetch previous scans on component mount
    useEffect(() => {
        const fetchScans = async () => {
            try {
                const response = await api.get('/scans');
                setScans(response.data);
            } catch (error) {
                console.error("Failed to fetch scans", error);
            }
        };
        // In a real app, you would also fetch credentials here
        // fetchCredentials(); 
        fetchScans();
    }, []);

    // Real-time updates via Socket.IO
    useEffect(() => {
        // Connect to the backend socket server
        const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const socket = io(socketUrl);

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        // Listen for scan updates
        socket.on('scan:updated', (updatedScan) => {
            setScans(prevScans => 
                prevScans.map(scan => scan.id === updatedScan.id ? { ...scan, ...updatedScan } : scan)
            );
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{t('homeTitle')}</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">{t('scanType')}</label>
                    <select
                        value={scanType}
                        onChange={(e) => setScanType(e.target.value)}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                        <option value="web">{t('webApplication')}</option>
                        <option value="network">{t('networkDevice')}</option>
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="target">
                        {scanType === 'web' ? t('targetUrlLabel') : t('targetIpLabel')}
                    </label>
                    <input
                        id="target"
                        type="text"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder={scanType === 'web' ? 'https://example.com' : '192.168.1.1'}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>

                {scanType === 'network' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="snmpCommunity">
                                {t('snmpCommunity')}
                            </label>
                            <input
                                id="snmpCommunity"
                                type="text"
                                value={snmpCommunity}
                                onChange={(e) => setSnmpCommunity(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>
                        {/* In a real app, you would fetch and display credentials */}
                    </>
                )}

                <button
                    onClick={handleStartScan}
                    disabled={loading || !target}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                >
                    {loading ? t('scanning') : t('startScan')}
                </button>
            </div>

            <h2 className="text-xl font-semibold mb-4">{t('previousScans')}</h2>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Target
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                {t('scanType')}
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                {t('status')}
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                {t('scannedOn')}
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {scans.map((scan) => (
                            <tr key={scan.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap">{scan.target}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                                        <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                                        <span className="relative capitalize">{scan.scan_type}</span>
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap capitalize">{scan.status}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap">
                                        {new Date(scan.createdAt).toLocaleDateString()}
                                    </p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {scan.status === 'completed' && (
                                        <Link to={`/report/${scan.id}`} className="text-blue-600 hover:text-blue-900">
                                            View Report
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {scans.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                                    No scans found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;