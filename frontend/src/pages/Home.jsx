import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';

import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t } = useTranslation();

  return (
    <Container>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          {t('homeTitle')}
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          {t('homeSubtitle')}
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button component={Link} to="/login" variant="contained" sx={{ mr: 2 }}>
            {t('signIn')}
          </Button>
          <Button component={Link} to="/register" variant="outlined">
            {t('signUp')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;
