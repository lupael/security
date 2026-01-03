import React, { useState, useEffect } from 'react';
import { Button, Container, Typography, Box, TextField, List, ListItem, ListItemText } from '@mui/material';
import scanService from '../services/scanService';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

import { io } from 'socket.io-client';

import { useTranslation } from 'react-i18next';

import NetworkScanForm from '../components/NetworkScanForm';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const [scans, setScans] = useState([]);
  const user = authService.getCurrentUser();
  const isAdmin = user && user.user.role === 'admin';

  const fetchScans = async () => {
    try {
      const response = await scanService.getScans();
      setScans(response.data);
    } catch (error) {
      console.error('Failed to fetch scans', error);
    }
  };

  useEffect(() => {
    fetchScans();

    const socket = io('http://localhost:5001');
    if (user) {
        socket.emit('join', user.user.id);
    }

    socket.on('scan_completed', (data) => {
        alert(`Scan for scanId ${data.scanId} is ${data.status}`);
        fetchScans();
    });

    return () => {
        socket.disconnect();
    };
  }, [user]);

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('dashboard')}
        </Typography>
        {isAdmin && (
          <Button component={Link} to="/admin" variant="contained" color="secondary" sx={{ mb: 2 }}>
            {t('adminDashboard')}
          </Button>
        )}
        <NetworkScanForm />
        <Typography variant="h6" component="h2" sx={{ mt: 4 }}>
          {t('previousScans')}
        </Typography>
        <List>
          {scans.map((scan) => (
            <ListItem
              key={scan.id}
              button
              component={Link}
              to={`/report/${scan.id}`}
            >
              <ListItemText
                primary={scan.target}
                secondary={`${t('status')}: ${scan.status} - ${new Date(scan.createdAt).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Container>
  );
};

export default Dashboard;
