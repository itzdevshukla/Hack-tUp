import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminEvents from './AdminEvents';
import AdminEventRequests from './AdminEventRequests';
import AdminUserDetail from './AdminUserDetail';
import AdminEventDetail from './AdminEventDetail';
import AdminEventParticipants from './AdminEventParticipants';
import AdminEventTeams from './AdminEventTeams';
import AdminEventLeaderboard from './AdminEventLeaderboard';
import AdminEventLiveSubmissions from './AdminEventLiveSubmissions';
import AdminEventUserDetail from './AdminEventUserDetail';
import AdminEventChallenges from './AdminEventChallenges';
import AdminEventChallengeDetail from './AdminEventChallengeDetail';
import AdminEventChallengeCreate from './AdminEventChallengeCreate';
import AdminEventRules from './AdminEventRules';
import AdminEventWaves from './AdminEventWaves';
import AdminEventRoles from './AdminEventRoles';
import AdminTestChallenges from './AdminTestChallenges';
import AdminAddEvent from './AdminAddEvent';
import AdminEditEvent from './AdminEditEvent';
import AdminAnnouncements from './AdminAnnouncements';
import NotFound from './NotFound';
import './Admin.css';

function AdminDashboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                navigate('/login');
            } else if (!user.has_admin_access) {
                navigate('/dashboard');
            } else if (!user.is_staff && !user.is_superuser) {
                const unauthorizedPaths = [
                    '/administration',
                    '/administration/',
                    '/administration/event',
                    '/administration/event/',
                    '/administration/users',
                    '/administration/users/',
                    '/administration/event/new'
                ];

                if (unauthorizedPaths.includes(window.location.pathname)) {
                    if (user.assigned_event_id) {
                        navigate(`/administration/event/${user.assigned_event_id}`, { replace: true });
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
                }
            }
        }
    }, [user, loading, navigate]);

    if (loading || !user || !user.has_admin_access) {
        return <div className="loading-screen">Loading Admin Panel...</div>;
    }

    return (
        <div className={`admin-layout ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <main className="admin-content">
                <Routes>
                    <Route path="/" element={<AdminOverview />} />
                    <Route path="/users" element={<AdminUsers />} />
                    <Route path="/events" element={<AdminEvents />} />
                    <Route path="/event-requests" element={<AdminEventRequests />} />
                    <Route path="/event/new" element={<AdminAddEvent />} />
                    <Route path="/user/:id" element={<AdminUserDetail />} />
                    <Route path="/event/:id" element={<AdminEventDetail />} />
                    <Route path="/event/:id/edit" element={<AdminEditEvent />} />
                    <Route path="/event/:id/rules" element={<AdminEventRules />} />
                    <Route path="/event/:id/challenges" element={<AdminEventChallenges />} />
                    <Route path="/event/:id/challenges/new" element={<AdminEventChallengeCreate />} />
                    <Route path="/event/:id/challenge/:challengeId" element={<AdminEventChallengeDetail />} />
                    <Route path="/event/:id/waves" element={<AdminEventWaves />} />
                    <Route path="/event/:id/roles" element={<AdminEventRoles />} />
                    <Route path="/event/:id/participants" element={<AdminEventParticipants />} />
                    <Route path="/event/:id/teams" element={<AdminEventTeams />} />
                    <Route path="/event/:id/leaderboard" element={<AdminEventLeaderboard />} />
                    <Route path="/event/:id/submissions" element={<AdminEventLiveSubmissions />} />
                    <Route path="/event/:id/user/:userId" element={<AdminEventUserDetail />} />
                    <Route path="/event/:id/test-challenges" element={<AdminTestChallenges />} />
                    <Route path="/event/:id/announcements" element={<AdminAnnouncements />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
        </div>
    );
}

export default AdminDashboard;
