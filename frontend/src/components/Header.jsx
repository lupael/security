import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import LanguageSwitcher from './LanguageSwitcher';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        Security Checker
                    </Link>
                </Typography>
                <LanguageSwitcher />
            </Toolbar>
        </AppBar>
    );
};

export default Header;
