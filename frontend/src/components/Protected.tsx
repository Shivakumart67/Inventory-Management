import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

interface ProtectedProps {
  children: React.ReactElement;
  allowedRoles?: Array<'ADMIN' | 'MANAGER'>;
}

export const Protected: React.FC<ProtectedProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress color="primary" size={50} />
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          Verifying session details...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not allowed, redirect user back to their respective main dashboard
    const defaultRedirect = user.role === 'ADMIN' ? '/admin/dashboard' : '/manager/dashboard';
    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
};

export default Protected;
