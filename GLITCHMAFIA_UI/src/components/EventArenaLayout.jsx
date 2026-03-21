import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBullhorn, FaTimes, FaChevronDown, FaChevronUp, FaInfoCircle, FaExclamationTriangle, FaBan, FaCheckCircle, FaClock, FaRegBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './Dashboard.css';

function EventArenaLayout({ children }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();

    const [eventLoading, setEventLoading] = useState(true);
    const [teamRequired, setTeamRequired] = useState(false);
    const [hasTeam, setHasTeam] = useState(false);

    // Announcements state
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    // Shared WS event — child routes subscribe via useOutletContext
    const [lastWsEvent, setLastWsEvent] = useState(null);

    useEffect(() => {
        if (!id) return;

        const checkEventStatus = async () => {
            try {
                // Fetch basic event details and determine team status
                const res = await fetch(`/api/event/${id}/challenges/`);
                if (res.ok) {
                    const data = await res.json();
                    setTeamRequired(data.is_team_mode || false);

                    if (data.is_team_mode) {
                        // If it's team mode, check if the user actually has a team
                        const teamRes = await fetch(`/api/teams/event/${id}/my-team/`);
                        if (teamRes.ok) {
                            const teamData = await teamRes.json();
                            setHasTeam(!!teamData.team);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to verify arena status", err);
            } finally {
                setEventLoading(false);
            }
        };

        checkEventStatus();
    }, [id]);

    useEffect(() => {
        // Enforce redirect if they are in a team event, have no team, and try to access challenges/leaderboard
        if (!eventLoading && teamRequired && !hasTeam) {
            const isTeamPage = location.pathname.endsWith(`/event/${id}/team`) || location.pathname.endsWith(`/event/${id}/team/`);
            if (!isTeamPage) {
                navigate(`/event/${id}/team`, { replace: true });
            }
        }
    }, [eventLoading, teamRequired, hasTeam, location.pathname, id, navigate]);

    // Announcements Polling
    useEffect(() => {
        if (!id) return;
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch(`/api/event/${id}/announcements/`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAnnouncements(data.announcements || []);
                    if (data.announcements && data.announcements.length > 0) {
                        const lastSeenId = parseInt(localStorage.getItem(`lastSeenAnnouncement_${id}`) || '0');
                        const unread = data.announcements.filter(a => a.id > lastSeenId).length;
                        setUnreadCount(unread);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch announcements", err);
            } finally {
                setAnnouncementsLoading(false);
            }
        };

        fetchAnnouncements();

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/updates/`;
        let ws;

        try {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    // Broadcast event to all child routes via context
                    setLastWsEvent({ ...message, _ts: Date.now() });
                    if (message.type === 'new_announcement') {
                        // Use pushed data directly instead of API call
                        setAnnouncements(prev => [message.data, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    } else if (message.type === 'refresh_announcements') {
                        fetchAnnouncements();
                    }
                } catch (err) {
                    console.error("WS parse error:", err);
                }
            };
        } catch (err) {
            console.error("WS connection error:", err);
        }

        return () => {
            if (ws) ws.close();
        };
    }, [id]);

    const handleOpenNotifications = () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (!isNotificationOpen && announcements.length > 0) {
            localStorage.setItem(`lastSeenAnnouncement_${id}`, announcements[0].id.toString());
            setUnreadCount(0);
        }
    };

    if (authLoading || eventLoading) return <div className="loading-screen" style={{ color: '#9ACD32', fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#050505' }}>INITIALIZING ARENA...</div>;
    if (!user) return <Navigate to="/login" replace />;

    const getTypeIcon = (type) => {
        switch (type) {
            case 'danger': return <FaBan />;
            case 'warning': return <FaExclamationTriangle />;
            case 'success': return <FaCheckCircle />;
            case 'info':
            default: return <FaInfoCircle />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'danger': return '#ff4c4c';
            case 'warning': return '#ffb84d';
            case 'success': return '#4cff4c';
            case 'info':
            default: return '#4da6ff';
        }
    };

    return (
        <>
            <div style={{ paddingTop: '100px', paddingBottom: '2rem', width: '100%', boxSizing: 'border-box' }}>
                {children || <Outlet context={{ announcements, announcementsLoading, lastWsEvent }} />}
            </div>

            {/* ─── Announcement Button ─── */}
            <button
                onClick={handleOpenNotifications}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    height: '44px',
                    padding: '0 12px 0 16px',
                    borderRadius: '8px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: 'pointer',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    outline: 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaRegBell style={{ fontSize: '1.05rem', marginTop: '-1px' }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Announcements</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaChevronDown style={{ fontSize: '0.7rem', color: '#a1a1aa' }} />
                    <div style={{ width: '1px', height: '14px', background: '#27272a' }}></div>
                    <FaTimes style={{ fontSize: '0.95rem', color: '#a1a1aa' }} onClick={(e) => { e.stopPropagation(); setIsNotificationOpen(false); }} />
                </div>
            </button>

            {/* ─── Announcements Popup Modal ─── */}
            <AnimatePresence>
                {isNotificationOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            bottom: '72px',
                            right: '20px',
                            zIndex: 1001,
                            width: '360px',
                            height: '480px',
                            background: '#09090b',
                            border: '1px solid #27272a',
                            borderRadius: '8px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02) inset',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #27272a',
                            flexShrink: 0,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaRegBell style={{ fontSize: '1.2rem', color: '#fff' }} />
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 600 }}>Announcements</h3>
                            </div>
                            <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{unreadCount} unread</span>
                        </div>

                        {/* Body */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            scrollbarWidth: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: announcements.length === 0 ? '0' : '16px',
                            gap: announcements.length === 0 ? '0' : '12px',
                        }}>
                            {announcements.length === 0 ? (
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: '#a1a1aa',
                                    fontSize: '0.9rem'
                                }}>
                                    No announcements yet.
                                </div>
                            ) : (
                                [...announcements].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((ann, index) => (

                                    <div key={ann.id} style={{
                                        padding: '16px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid #27272a',
                                        borderRadius: '8px',
                                    }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: `${getTypeColor(ann.type)}15`,
                                                border: `1px solid ${getTypeColor(ann.type)}30`,
                                                color: getTypeColor(ann.type),
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase'
                                            }}>
                                                {getTypeIcon(ann.type)}
                                                <span>{ann.type || 'info'}</span>
                                            </div>
                                        </div>
                                        <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#fff', fontWeight: 500 }}>{ann.title}</h4>
                                        <p style={{ margin: '0 0 10px', color: '#a1a1aa', fontSize: '0.85rem', lineHeight: '1.4' }}>{ann.content}</p>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <span style={{
                                                color: '#71717a',
                                                fontSize: '0.65rem',
                                                fontFamily: 'Share Tech Mono, monospace',
                                            }}>
                                                auth_signature: <span style={{ color: '#a1a1aa' }}>{ann.author || 'system'}</span>
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default EventArenaLayout;
