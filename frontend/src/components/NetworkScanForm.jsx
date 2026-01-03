import React, { useState, useEffect } from 'react';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import credentialService from '../services/credentialService';
import scanService from '../services/scanService';

const NetworkScanForm = () => {
    const [target, setTarget] = useState('');
    const [scanType, setScanType] = useState('WEB');
    const [credentials, setCredentials] = useState([]);
    const [selectedCredential, setSelectedCredential] = useState('');

    useEffect(() => {
        credentialService.getCredentials().then(response => {
            setCredentials(response.data);
        });
    }, []);

    const handleStartScan = (e) => {
        e.preventDefault();
        scanService.startScan(target, scanType, selectedCredential);
    };

    return (
        <form onSubmit={handleStartScan}>
            <TextField
                label="Target (URL or IP)"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                fullWidth
                margin="normal"
            />
            <FormControl fullWidth margin="normal">
                <InputLabel>Scan Type</InputLabel>
                <Select
                    value={scanType}
                    onChange={(e) => setScanType(e.target.value)}
                >
                    <MenuItem value="WEB">Web Scan</MenuItem>
                    <MenuItem value="NETWORK">Network Scan</MenuItem>
                </Select>
            </FormControl>
            {scanType === 'NETWORK' && (
                <FormControl fullWidth margin="normal">
                    <InputLabel>Credential</InputLabel>
                    <Select
                        value={selectedCredential}
                        onChange={(e) => setSelectedCredential(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>None</em>
                        </MenuItem>
                        {credentials.map(cred => (
                            <MenuItem key={cred.id} value={cred.id}>{cred.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
            <Button type="submit" variant="contained" color="primary">Start Scan</Button>
        </form>
    );
};

export default NetworkScanForm;
