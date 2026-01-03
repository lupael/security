import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

const AdminRoute = () => {
    const user = authService.getCurrentUser();
    const isAdmin = user && user.user.role === 'admin';

    return isAdmin ? <Outlet /> : <Navigate to="/login" />;
};

export default AdminRoute;
