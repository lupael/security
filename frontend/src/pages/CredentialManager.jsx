import React, { useState, useEffect } from 'react';
import { Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import credentialService from '../services/credentialService';

const CredentialManager = () => {
    const [credentials, setCredentials] = useState([]);
    const [name, setName] = useState('');
    const [type, setType] = useState('SSH');
    const [username, setUsername] = useState('');
    const [secret, setSecret] = useState('');

    useEffect(() => {
        fetchCredentials();
    }, []);

    const fetchCredentials = () => {
        credentialService.getCredentials().then(response => {
            setCredentials(response.data);
        });
    };

    const handleCreateCredential = (e) => {
        e.preventDefault();
        credentialService.createCredential(name, type, username, secret).then(() => {
            fetchCredentials();
            setName('');
            setType('SSH');
            setUsername('');
            setSecret('');
        });
    };

    const handleDeleteCredential = (id) => {
        credentialService.deleteCredential(id).then(() => {
            fetchCredentials();
        });
    };

    return (
        <div>
            <h2>Credential Manager</h2>
            <Paper style={{ padding: '20px', marginBottom: '20px' }}>
                <h3>Create New Credential</h3>
                <form onSubmit={handleCreateCredential}>
                    <TextField
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <MenuItem value="SSH">SSH</MenuItem>
                            <MenuItem value="SNMPv3">SNMPv3</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Secret (Password or Private Key)"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        fullWidth
                        margin="normal"
                        type="password"
                    />
                    <Button type="submit" variant="contained" color="primary">Create</Button>
                </form>
            </Paper>

            <h3>Existing Credentials</h3>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Username</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {credentials.map(cred => (
                            <TableRow key={cred.id}>
                                <TableCell>{cred.name}</TableCell>
                                <TableCell>{cred.type}</TableCell>
                                <TableCell>{cred.username}</TableCell>
                                <TableCell>
                                    <Button variant="contained" color="secondary" onClick={() => handleDeleteCredential(cred.id)}>Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default CredentialManager;
