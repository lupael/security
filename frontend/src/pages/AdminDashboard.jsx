import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Grid, List, ListItem, ListItemText, Button, Tabs, Tab } from '@mui/material';
import adminService from '../services/adminService';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [scans, setScans] = useState([]);
    const [logs, setLogs] = useState([]);
    const [tabIndex, setTabIndex] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    const fetchUsers = async () => {
        try {
            const response = await adminService.getUsers();
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchScans = async () => {
        try {
            const response = await adminService.getScans();
            setScans(response.data);
        } catch (error) {
            console.error('Failed to fetch scans', error);
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await adminService.getLogs();
            setLogs(response.data);
        } catch (error) {
            console.error('Failed to fetch logs', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchScans();
        fetchLogs();
    }, []);

    const handleDeleteUser = async (id) => {
        try {
            await adminService.deleteUser(id);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
        }
    };

    return (
        <Container>
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Admin Dashboard
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabIndex} onChange={handleTabChange} aria-label="admin tabs">
                        <Tab label="Users" />
                        <Tab label="Scans" />
                        <Tab label="Logs" />
                    </Tabs>
                </Box>
                <TabPanel value={tabIndex} index={0}>
                    <List>
                        {users.map((user) => (
                            <ListItem key={user.id} secondaryAction={
                                <Button edge="end" aria-label="delete" onClick={() => handleDeleteUser(user.id)}>
                                    Delete
                                </Button>
                            }>
                                <ListItemText primary={user.username} secondary={user.email} />
                            </ListItem>
                        ))}
                    </List>
                </TabPanel>
                <TabPanel value={tabIndex} index={1}>
                    <List>
                        {scans.map((scan) => (
                            <ListItem key={scan.id}>
                                <ListItemText primary={scan.target} secondary={`User: ${scan.User.username} - Status: ${scan.status}`} />
                            </ListItem>
                        ))}
                    </List>
                </TabPanel>
                <TabPanel value={tabIndex} index={2}>
                    <List>
                        {logs.map((log) => (
                            <ListItem key={log.id}>
                                <ListItemText primary={log.action} secondary={`User: ${log.User.username}`} />
                            </ListItem>
                        ))}
                    </List>
                </TabPanel>
            </Box>
        </Container>
    );
};

export default AdminDashboard;
