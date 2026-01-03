import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Box } from '@mui/material';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <Box>
            <Button onClick={() => changeLanguage('en')} disabled={i18n.language === 'en'}>English</Button>
            <Button onClick={() => changeLanguage('es')} disabled={i18n.language === 'es'}>Español</Button>
        </Box>
    );
};

export default LanguageSwitcher;
