import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomAlert from './CustomAlert';
import { FaChartBar, FaUsers, FaBullseye, FaArrowLeft, FaSignOutAlt, FaBars, FaPlusCircle, FaEye, FaEyeSlash, FaTrophy, FaEdit, FaPlay, FaPause, FaStop, FaCode, FaWater, FaUserShield, FaFlask, FaGavel, FaBullhorn } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

function AdminSidebar({ isOpen, setIsOpen }) {
    const location = useLocation();
    const { user, logoutUser: logout } = useAuth();

    // Helper to determine active route
    const isActive = (path) => {
        // Special strict case for administration overview since it is the base path
        if (path === '/administration' && location.pathname !== '/administration') {
            return '';
        }

        // Exact matching for event dashboard details vs event nested tabs 
        // e.g., `/administration/event/1` shouldn't match `/administration/event/1/leaderboard`
        return location.pathname === path ? 'active' : '';
    };

    // Alert State
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    // Event Control State
    const [eventObj, setEventObj] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const isEventScope = location.pathname.startsWith('/administration/event/') && location.pathname !== '/administration/event/new';
    let eventId = null;
    if (isEventScope) {
        const parts = location.pathname.split('/');
        eventId = parts[3]; // e.g. ["", "administration", "event", "123", ...]
        // Make sure eventId is a valid truthy string (not "new")
        if (!eventId || eventId === 'new') eventId = null;
    }

    // Fetch Event Status for Controls
    useEffect(() => {
        if (eventId) {
            fetchEventStatus();
        } else {
            setEventObj(null);
        }
    }, [eventId, location.pathname]);

    const fetchEventStatus = async () => {
        try {
            const response = await fetch(`/api/admin/event/${eventId}/`, {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (response.ok) {
                const data = await response.json();
                setEventObj(data.event);
            }
        } catch (err) {
            console.error('Failed to fetch event status', err);
        }
    };

    const confirmEventAction = (action, actionName) => {
        setAlertConfig({
            title: `Confirm Action`,
            message: `Are you entirely sure you want to ${actionName}? This will instantly update the event state.`,
            type: action === 'end_event' ? 'danger' : (action.includes('pause') ? 'warning' : 'info'),
            confirmText: action === 'end_event' ? 'END EVENT' : (action === 'stop_reg' ? 'STOP REGISTRATION' : 'CONFIRM'),
            onConfirm: () => executeEventAction(action),
            onCancel: () => setAlertOpen(false)
        });
        setAlertOpen(true);
    };

    const executeEventAction = async (action) => {
        setAlertOpen(false);
        setActionLoading(true);

        try {
            const response = await fetch(`/api/admin/event/${eventId}/control/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),

                },
                body: JSON.stringify({ action })
            });

            if (!response.ok) throw new Error('Failed to update event state');
            await fetchEventStatus();
        } catch (err) {
            setAlertConfig({
                title: 'Error',
                message: err.message,
                type: 'danger',
                onConfirm: () => setAlertOpen(false),
                onCancel: null
            });
            setAlertOpen(true);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />
            <aside className={`admin-sidebar ${isOpen ? 'mobile-open' : ''}`}>
                <ul className="sidebar-menu">
                    {!isEventScope ? (
                        <>
                            {user?.is_staff && (
                                <>
                                    <li>
                                        <Link to="/administration" className={isActive('/administration')} onClick={() => setIsOpen(false)}>
                                            <span className="sidebar-icon"><FaChartBar /></span>
                                            <span>Overview</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/administration/users" className={isActive('/administration/users')} onClick={() => setIsOpen(false)}>
                                            <span className="sidebar-icon"><FaUsers /></span>
                                            <span>Total Participants</span>
                                        </Link>
                                    </li>
                                </>
                            )}
                            <li>
                                <Link to="/administration/events" className={isActive('/administration/events')} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaBullseye /></span>
                                    <span>Manage Events</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/administration/event-requests" className={isActive('/administration/event-requests')} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaUsers /></span>
                                    <span>Event Requests</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/administration/event/new" className={isActive('/administration/event/new')} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaPlusCircle /></span>
                                    <span>Add Event</span>
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>

                            <li>
                                <Link to={`/administration/event/${eventId}`} className={isActive(`/administration/event/${eventId}`)} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaBullseye /></span>
                                    <span>Event Details</span>
                                </Link>
                            </li>
                            <li>
                                <Link to={`/administration/event/${eventId}/submissions`} className={isActive(`/administration/event/${eventId}/submissions`)} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaEye /></span>
                                    <span>Live Submissions</span>
                                </Link>
                            </li>
                            <li>
                                <Link to={`/administration/event/${eventId}/leaderboard`} className={isActive(`/administration/event/${eventId}/leaderboard`)} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaTrophy /></span>
                                    <span>Leaderboard</span>
                                </Link>
                            </li>
                            <li>
                                <Link to={`/administration/event/${eventId}/challenges`} className={isActive(`/administration/event/${eventId}/challenges`)} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaCode /></span>
                                    <span>Challenges</span>
                                </Link>
                            </li>
                            <li>
                                <Link to={`/administration/event/${eventId}/announcements`} className={isActive(`/administration/event/${eventId}/announcements`)} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaBullhorn /></span>
                                    <span>Announcements</span>
                                </Link>
                            </li>
                            <li>
                                <Link to={`/administration/event/${eventId}/waves`} className={isActive(`/administration/event/${eventId}/waves`)} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaWater /></span>
                                    <span>Waves</span>
                                </Link>
                            </li>
                            <li>
                                <Link to={`/administration/event/${eventId}/participants`} className={isActive(`/administration/event/${eventId}/participants`)} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaUsers /></span>
                                    <span>Participants</span>
                                </Link>
                            </li>
                            <li>
                                <Link to={`/administration/event/${eventId}/roles`} className={isActive(`/administration/event/${eventId}/roles`)} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaUserShield /></span>
                                    <span>Event Roles</span>
                                </Link>
                            </li>
                            <li>
                                <Link to={`/administration/event/${eventId}/rules`} className={isActive(`/administration/event/${eventId}/rules`)} onClick={() => setIsOpen(false)}>
                                    <span className="sidebar-icon"><FaGavel /></span>
                                    <span>Rules & Regulations</span>
                                </Link>
                            </li>
                            {eventObj && (user?.is_staff || eventObj.created_by === user?.username) && (
                                <li>
                                    <Link to={`/administration/event/${eventId}/edit`} className={isActive(`/administration/event/${eventId}/edit`)} onClick={() => setIsOpen(false)}>
                                        <span className="sidebar-icon"><FaEdit /></span>
                                        <span>Edit Event</span>
                                    </Link>
                                </li>
                            )}
                            {user?.is_staff && (
                                <li>
                                    <Link to="/administration/events" className="" onClick={() => setIsOpen(false)}>
                                        <span className="sidebar-icon"><FaArrowLeft /></span>
                                        <span style={{ color: '#888' }}>Exit to Global Admin</span>
                                    </Link>
                                </li>
                            )}

                            {eventObj && (
                                <li style={{ padding: '20px 15px 10px 15px', margin: '15px 0 0 0', borderTop: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <span style={{ color: '#aaa', fontSize: '0.75rem', fontFamily: 'Orbitron', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Controls</span>

                                    {(!eventObj.is_registration_open || eventObj.is_registration_paused) ? (
                                        <button
                                            onClick={() => confirmEventAction('start_reg', 'start registration')}
                                            disabled={actionLoading || eventObj.status === 'completed'}
                                            style={{
                                                width: '100%', padding: '10px 12px',
                                                background: eventObj.status === 'completed' ? '#333' : '#f8f9fa',
                                                border: eventObj.status === 'completed' ? '1px solid #444' : '1px solid #e9ecef',
                                                color: eventObj.status === 'completed' ? '#666' : '#111',
                                                borderRadius: '6px',
                                                cursor: eventObj.status === 'completed' || actionLoading ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading ? 0.5 : 1,
                                                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                                transition: 'all 0.2s ease',
                                                boxShadow: eventObj.status === 'completed' ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseEnter={e => { if (eventObj.status !== 'completed' && !actionLoading) e.currentTarget.style.background = '#e2e6ea'; }}
                                            onMouseLeave={e => { if (eventObj.status !== 'completed' && !actionLoading) e.currentTarget.style.background = '#f8f9fa'; }}
                                        >
                                            <FaPlay style={{ color: eventObj.status === 'completed' ? '#555' : '#28a745' }} /> Start Registration
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => confirmEventAction('stop_reg', 'stop registration')}
                                            disabled={actionLoading || eventObj.status === 'completed'}
                                            style={{
                                                width: '100%', padding: '10px 12px',
                                                background: eventObj.status === 'completed' ? '#333' : '#dc3545',
                                                border: 'none',
                                                color: eventObj.status === 'completed' ? '#666' : '#fff',
                                                borderRadius: '6px',
                                                cursor: eventObj.status === 'completed' || actionLoading ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading ? 0.5 : 1,
                                                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                                transition: 'all 0.2s ease',
                                                boxShadow: eventObj.status === 'completed' ? 'none' : '0 4px 6px rgba(220,53,69,0.3)'
                                            }}
                                            onMouseEnter={e => { if (eventObj.status !== 'completed' && !actionLoading) { e.currentTarget.style.background = '#c82333'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(220,53,69,0.5)'; } }}
                                            onMouseLeave={e => { if (eventObj.status !== 'completed' && !actionLoading) { e.currentTarget.style.background = '#dc3545'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(220,53,69,0.3)'; } }}
                                        >
                                            <FaStop style={{ color: eventObj.status === 'completed' ? '#555' : '#fff' }} /> Stop Registration
                                        </button>
                                    )}

                                    {eventObj.is_paused ? (
                                        <button
                                            onClick={() => confirmEventAction('resume_event', 'resume the live event')}
                                            disabled={actionLoading || eventObj.status === 'completed'}
                                            style={{
                                                width: '100%', padding: '10px 12px',
                                                background: eventObj.status === 'completed' ? '#333' : '#f8f9fa',
                                                border: eventObj.status === 'completed' ? '1px solid #444' : '1px solid #e9ecef',
                                                color: eventObj.status === 'completed' ? '#666' : '#111',
                                                borderRadius: '6px',
                                                cursor: eventObj.status === 'completed' || actionLoading ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading ? 0.5 : 1,
                                                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                                transition: 'all 0.2s ease',
                                                boxShadow: eventObj.status === 'completed' ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseEnter={e => { if (eventObj.status !== 'completed' && !actionLoading) e.currentTarget.style.background = '#e2e6ea'; }}
                                            onMouseLeave={e => { if (eventObj.status !== 'completed' && !actionLoading) e.currentTarget.style.background = '#f8f9fa'; }}
                                        >
                                            <FaPlay style={{ color: eventObj.status === 'completed' ? '#555' : '#007bff' }} /> Resume Event
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => confirmEventAction('pause_event', 'pause the live event')}
                                            disabled={actionLoading || eventObj.status === 'completed'}
                                            style={{
                                                width: '100%', padding: '10px 12px',
                                                background: eventObj.status === 'completed' ? '#333' : '#ffc107',
                                                border: 'none',
                                                color: eventObj.status === 'completed' ? '#666' : '#111',
                                                borderRadius: '6px',
                                                cursor: eventObj.status === 'completed' || actionLoading ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading ? 0.5 : 1,
                                                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                                transition: 'all 0.2s ease',
                                                boxShadow: eventObj.status === 'completed' ? 'none' : '0 4px 6px rgba(255,193,7,0.3)'
                                            }}
                                            onMouseEnter={e => { if (eventObj.status !== 'completed' && !actionLoading) { e.currentTarget.style.background = '#e0a800'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(255,193,7,0.5)'; } }}
                                            onMouseLeave={e => { if (eventObj.status !== 'completed' && !actionLoading) { e.currentTarget.style.background = '#ffc107'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(255,193,7,0.3)'; } }}
                                        >
                                            <FaPause style={{ color: eventObj.status === 'completed' ? '#555' : 'inherit' }} /> Pause Event
                                        </button>
                                    )}

                                    {eventObj.is_hidden ? (
                                        <button
                                            onClick={() => confirmEventAction('toggle_hidden', 'make the event public')}
                                            disabled={actionLoading}
                                            style={{
                                                width: '100%', padding: '10px 12px',
                                                background: '#f8f9fa',
                                                border: '1px solid #e9ecef',
                                                color: '#111',
                                                borderRadius: '6px',
                                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading ? 0.5 : 1,
                                                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                marginTop: '5px'
                                            }}
                                            onMouseEnter={e => { if (!actionLoading) e.currentTarget.style.background = '#e2e6ea'; }}
                                            onMouseLeave={e => { if (!actionLoading) e.currentTarget.style.background = '#f8f9fa'; }}
                                        >
                                            <FaEye style={{ color: '#007bff' }} /> Make Public
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => confirmEventAction('toggle_hidden', 'make the event hidden')}
                                            disabled={actionLoading}
                                            style={{
                                                width: '100%', padding: '10px 12px',
                                                background: '#6c757d',
                                                border: 'none',
                                                color: '#fff',
                                                borderRadius: '6px',
                                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading ? 0.5 : 1,
                                                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 4px 6px rgba(108,117,125,0.3)',
                                                marginTop: '5px'
                                            }}
                                            onMouseEnter={e => { if (!actionLoading) { e.currentTarget.style.background = '#5a6268'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(108,117,125,0.5)'; } }}
                                            onMouseLeave={e => { if (!actionLoading) { e.currentTarget.style.background = '#6c757d'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(108,117,125,0.3)'; } }}
                                        >
                                            <FaEyeSlash style={{ color: 'inherit' }} /> Make Hidden
                                        </button>
                                    )}

                                    <button
                                        onClick={() => confirmEventAction('end_event', 'permanently END the event')}
                                        disabled={actionLoading || eventObj.status === 'completed'}
                                        style={{
                                            width: '100%', padding: '10px 12px',
                                            background: eventObj.status === 'completed' ? '#333' : '#8b0000',
                                            border: 'none',
                                            color: eventObj.status === 'completed' ? '#666' : '#fff',
                                            borderRadius: '6px',
                                            cursor: eventObj.status === 'completed' || actionLoading ? 'not-allowed' : 'pointer',
                                            opacity: actionLoading ? 0.5 : 1,
                                            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                            transition: 'all 0.2s ease',
                                            boxShadow: eventObj.status === 'completed' ? 'none' : '0 4px 6px rgba(139,0,0,0.4)',
                                            marginTop: '5px'
                                        }}
                                        onMouseEnter={e => { if (eventObj.status !== 'completed' && !actionLoading) { e.currentTarget.style.background = '#660000'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(139,0,0,0.6)'; } }}
                                        onMouseLeave={e => { if (eventObj.status !== 'completed' && !actionLoading) { e.currentTarget.style.background = '#8b0000'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(139,0,0,0.4)'; } }}
                                    >
                                        <FaStop style={{ color: eventObj.status === 'completed' ? '#555' : 'inherit' }} /> End Event
                                    </button>

                                    <hr style={{ borderColor: '#333', margin: '5px 0' }} />

                                    {/* WriteUp Controls */}
                                    {!eventObj.accepting_writeups ? (
                                        <button
                                            onClick={() => confirmEventAction('start_writeups', 'start accepting writeups')}
                                            disabled={actionLoading || eventObj.status === 'completed'}
                                            style={{
                                                width: '100%', padding: '10px 12px',
                                                background: eventObj.status === 'completed' ? '#333' : '#f8f9fa',
                                                border: eventObj.status === 'completed' ? '1px solid #444' : '1px solid #e9ecef',
                                                color: eventObj.status === 'completed' ? '#666' : '#111',
                                                borderRadius: '6px',
                                                cursor: eventObj.status === 'completed' || actionLoading ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading ? 0.5 : 1,
                                                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                                transition: 'all 0.2s ease',
                                                boxShadow: eventObj.status === 'completed' ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseEnter={e => { if (eventObj.status !== 'completed' && !actionLoading) e.currentTarget.style.background = '#e2e6ea'; }}
                                            onMouseLeave={e => { if (eventObj.status !== 'completed' && !actionLoading) e.currentTarget.style.background = '#f8f9fa'; }}
                                        >
                                            <FaPlay style={{ color: eventObj.status === 'completed' ? '#555' : '#17a2b8' }} /> Accept WriteUps
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => confirmEventAction('stop_writeups', 'stop accepting writeups')}
                                            disabled={actionLoading || eventObj.status === 'completed'}
                                            style={{
                                                width: '100%', padding: '10px 12px',
                                                background: eventObj.status === 'completed' ? '#333' : '#17a2b8',
                                                border: 'none',
                                                color: eventObj.status === 'completed' ? '#666' : '#fff',
                                                borderRadius: '6px',
                                                cursor: eventObj.status === 'completed' || actionLoading ? 'not-allowed' : 'pointer',
                                                opacity: actionLoading ? 0.5 : 1,
                                                textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 'bold',
                                                transition: 'all 0.2s ease',
                                                boxShadow: eventObj.status === 'completed' ? 'none' : '0 4px 6px rgba(23,162,184,0.3)'
                                            }}
                                            onMouseEnter={e => { if (eventObj.status !== 'completed' && !actionLoading) { e.currentTarget.style.background = '#138496'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(23,162,184,0.5)'; } }}
                                            onMouseLeave={e => { if (eventObj.status !== 'completed' && !actionLoading) { e.currentTarget.style.background = '#17a2b8'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(23,162,184,0.3)'; } }}
                                        >
                                            <FaStop style={{ color: eventObj.status === 'completed' ? '#555' : '#fff' }} /> Stop WriteUps
                                        </button>
                                    )}

                                    <hr style={{ borderColor: '#333', margin: '5px 0' }} />
                                    <button
                                        onClick={async () => {
                                            try {
                                                const res = await fetch(`/api/admin/event/${eventId}/export/`, {
                                                    headers: {
                    'X-CSRFToken': getCsrfToken()
                }
                                                });
                                                if (res.ok) {
                                                    const blob = await res.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${eventObj.name.replace(/ /g, '_').toLowerCase()}_export.xlsx`;
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                } else {
                                                    alert("Failed to export data.");
                                                }
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }}
                                        style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: '1px solid #17a2b8', color: '#17a2b8', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.2s ease' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(23,162,184,0.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <span className="sidebar-icon"><FaChartBar /></span> Export Data
                                    </button>
                                </li>
                            )}
                        </>
                    )}
                    {eventId ? (
                        <li>
                            <Link to={`/administration/event/${eventId}/test-challenges`} className={isActive(`/administration/event/${eventId}/test-challenges`)} onClick={() => setIsOpen(false)}>
                                <span className="sidebar-icon"><FaFlask /></span>
                                <span>Test Challenges</span>
                            </Link>
                        </li>
                    ) : (
                        <li>
                            <Link to="/dashboard" className="" onClick={() => setIsOpen(false)}>
                                <span className="sidebar-icon"><FaArrowLeft /></span>
                                <span>Back to User Dashboard</span>
                            </Link>
                        </li>
                    )}
                    <li>
                        <div
                            onClick={logout}
                            style={{ cursor: 'pointer', padding: '15px 25px', color: '#888', display: 'flex', alignItems: 'center', gap: '15px', transition: 'all 0.2s ease', borderLeft: '4px solid transparent', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.95rem' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#111'; e.currentTarget.style.borderLeftColor = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; }}
                        >
                            <span className="sidebar-icon"><FaSignOutAlt /></span>
                            <span>Logout</span>
                        </div>
                    </li>
                </ul>
            </aside>

            {/* Mobile Menu Toggle */}
            <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}><FaBars /></button>
        </>
    );
}

export default AdminSidebar;
