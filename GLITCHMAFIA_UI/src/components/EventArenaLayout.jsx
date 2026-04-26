import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { FaBullhorn, FaTimes, FaChevronDown, FaChevronUp, FaInfoCircle, FaExclamationTriangle, FaBan, FaCheckCircle, FaClock, FaRegBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import BannedAnimation from './BannedAnimation';
import BackgroundParticles from './BackgroundParticles';
import './Dashboard.css';
import { getCsrfToken } from '../utils/csrf';

function EventArenaLayout({ children }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const hideNavbar = searchParams.get('hideNavbar') === 'true';
    const { user, loading: authLoading } = useAuth();

    const [eventLoading, setEventLoading] = useState(true);
    const [teamRequired, setTeamRequired] = useState(false);
    const [hasTeam, setHasTeam] = useState(false);
    const [isBanned, setIsBanned] = useState(false);

    // Announcements state
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    // Shared WS event — child routes subscribe via useOutletContext
    const [lastWsEvent, setLastWsEvent] = useState(null);

    // New notification toast state
    const [newNotificationToast, setNewNotificationToast] = useState(false);
    const [toastTimeout, setToastTimeout] = useState(null);

    useEffect(() => {
        if (!id) return;

        const checkEventStatus = async () => {
            try {
                // Fetch basic event details and determine team status
                const res = await fetch(`/api/event/${id}/challenges/`);
                if (res.ok) {
                    const data = await res.json();
                    setTeamRequired(data.is_team_mode || false);
                    setIsBanned(data.is_banned || false);

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
        // In presentation mode (hideNavbar=true), skip team-check redirects
        // so admins can view the leaderboard without being event participants
        if (hideNavbar) return;
        if (!eventLoading && teamRequired && !hasTeam) {
            const isTeamPage = location.pathname.endsWith(`/event/${id}/team`) || location.pathname.endsWith(`/event/${id}/team/`);
            if (!isTeamPage) {
                navigate(`/event/${id}/team`, { replace: true });
            }
        }
    }, [hideNavbar, eventLoading, teamRequired, hasTeam, location.pathname, id, navigate]);

    // Announcements + WebSocket with auto-reconnect
    useEffect(() => {
        if (!id) return;
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch(`/api/event/${id}/announcements/`, {
                    headers: { 'X-CSRFToken': getCsrfToken() }
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

        // ── WebSocket with auto-reconnect ─────────────────────────────
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/event/${id}/`;

        let ws = null;
        let retryCount = 0;
        let retryTimer = null;
        let destroyed = false;

        const connect = () => {
            if (destroyed) return;
            try {
                ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    retryCount = 0; // reset backoff on successful connect
                    // Start Heartbeat for live tracking
                    const pingInterval = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'ping' }));
                        } else {
                            clearInterval(pingInterval);
                        }
                    }, 60000); // 1 minute heartbeat
                    ws._pingInterval = pingInterval;
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        // Broadcast to all child routes via outlet context
                        setLastWsEvent({ ...message, _ts: Date.now() });

                        if (message.type === 'new_announcement') {
                            setAnnouncements(prev => [message.data, ...prev]);
                            setUnreadCount(prev => prev + 1);
                            setNewNotificationToast(true);
                            if (toastTimeout) clearTimeout(toastTimeout);
                            const timeoutId = setTimeout(() => setNewNotificationToast(false), 5000);
                            setToastTimeout(timeoutId);
                        } else if (message.type === 'refresh_announcements') {
                            fetchAnnouncements();
                        }
                    } catch (err) {
                        console.error("WS parse error:", err);
                    }
                };

                ws.onerror = (err) => {
                    console.warn("Arena WS error:", err);
                };

                ws.onclose = (e) => {
                    if (destroyed) return;
                    // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5 retries)
                    if (retryCount < 5) {
                        const delay = Math.min(1000 * Math.pow(2, retryCount), 16000);
                        retryCount++;
                        console.info(`Arena WS closed (code=${e.code}). Reconnecting in ${delay}ms… (attempt ${retryCount})`);
                        retryTimer = setTimeout(connect, delay);
                    } else {
                        console.error("Arena WS gave up reconnecting after 5 attempts.");
                    }
                };
            } catch (err) {
                console.error("WS connection error:", err);
            }
        };

        connect();

        return () => {
            destroyed = true;
            if (retryTimer) clearTimeout(retryTimer);
            if (ws) {
                if (ws._pingInterval) clearInterval(ws._pingInterval);
                ws.close();
            }
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
    // In presentation mode, skip auth check so admins can view without being logged in as participant
    if (!hideNavbar && !user) return <Navigate to="/login" replace />;

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
        <div style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#050505' }}>
            <BackgroundParticles />
            <div style={{ paddingTop: hideNavbar ? '0px' : '100px', paddingBottom: '2rem', width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>
                {isBanned ? (
                    <BannedAnimation />
                ) : (
                    children || <Outlet context={{ announcements, announcementsLoading, lastWsEvent }} />
                )}
            </div>

            {/* ─── Circular Announcement Button ─── */}
            <button
                onClick={handleOpenNotifications}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 1000,
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#09090b',
                    border: '2px solid #27272a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.6)',
                    outline: 'none',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="notification-toggle-btn"
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#9ACD32';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(154, 205, 50, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#27272a';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.6)';
                    e.currentTarget.style.transform = 'scale(1)';
                }}
            >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaRegBell style={{ fontSize: '1.4rem' }} />
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                background: '#ff4c4c',
                                color: 'white',
                                borderRadius: '50%',
                                minWidth: '20px',
                                height: '20px',
                                padding: '0 4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #09090b',
                                boxShadow: '0 0 10px rgba(255, 76, 76, 0.4)',
                                fontFamily: 'Share Tech Mono, monospace'
                            }}
                        >
                            {unreadCount}
                        </motion.div>
                    )}
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

            {/* ─── New Notification Toast ─── */}
            <AnimatePresence>
                {newNotificationToast && !isNotificationOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        style={{
                            position: 'fixed',
                            bottom: '90px',
                            right: '24px',
                            zIndex: 1002,
                            background: '#050505',
                            color: '#ffffff',
                            border: '1px solid #ffffff',
                            padding: '10px 20px',
                            borderRadius: '30px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            fontFamily: 'Share Tech Mono, monospace'
                        }}
                        onClick={() => {
                            setNewNotificationToast(false);
                            handleOpenNotifications();
                        }}
                    >
                        <FaBullhorn />
                        <span>1 New Notification</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setNewNotificationToast(false);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ffffff',
                                cursor: 'pointer',
                                marginLeft: '5px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0'
                            }}
                        >
                            <FaTimes />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default EventArenaLayout;
