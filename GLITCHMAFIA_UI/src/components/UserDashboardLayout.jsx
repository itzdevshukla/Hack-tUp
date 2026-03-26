import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBell, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundParticles from './BackgroundParticles';
import './Dashboard.css';

function UserDashboardLayout({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="loading-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return (
        <div className="user-dashboard-layout" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#050505', overflowX: 'hidden' }}>
            <BackgroundParticles />
            <main className="user-dashboard-content dashboard-premium-container" style={{ flex: 1, paddingTop: '100px', boxSizing: 'border-box', width: '100%', position: 'relative', zIndex: 1 }}>
                {children || <Outlet />}
            </main>
        </div>
    );
}

export default UserDashboardLayout;
