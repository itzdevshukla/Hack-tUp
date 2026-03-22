import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCsrfToken } from '../utils/csrf';
import {
    FaUsers, FaCalendarAlt, FaFire, FaClock, FaCheckCircle,
    FaExclamationTriangle, FaUserShield, FaArrowRight,
    FaListAlt, FaInbox, FaPlus, FaTerminal, FaCircle,
} from 'react-icons/fa';

const G     = '#22d660';
const BLUE  = '#4da6ff';
const GOLD  = '#f59e0b';
const RED   = '#ff3b30';

const STATUS = {
    live:      { label: 'LIVE',     color: G,     bg: 'rgba(34, 214, 96, 0.1)',   border: 'rgba(34, 214, 96, 0.3)' },
    upcoming:  { label: 'UPCOMING', color: BLUE,  bg: 'rgba(77, 166, 255, 0.1)', border: 'rgba(77, 166, 255, 0.3)' },
    completed: { label: 'ENDED',    color: '#888', bg: 'rgba(136, 136, 136, 0.1)',  border: 'rgba(136, 136, 136, 0.3)' },
    draft:     { label: 'DRAFT',    color: GOLD,  bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
};

/* ── Normalised section label ── */
const SecLabel = ({ children }) => (
    <p style={{ 
        margin: '0 0 20px', 
        fontFamily: "'Share Tech Mono', monospace", 
        color: '#aaa', 
        fontSize: '0.8rem', 
        letterSpacing: '3px', 
        textTransform: 'uppercase', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        textShadow: '0 0 10px rgba(255, 255, 255, 0.1)'
    }}>
        <span style={{ color: G, opacity: 0.8, textShadow: `0 0 8px ${G}` }}>//</span> {children}
    </p>
);

/* ── Metric card ── */
function Metric({ icon, label, value, accent = G, sub, to }) {
    const body = (
        <div style={{
            background: 'rgba(15, 15, 15, 0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderLeft: `3px solid ${accent}`,
            borderRadius: '12px',
            padding: 'clamp(16px, 3vw, 24px) clamp(20px, 3vw, 26px)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            cursor: to ? 'pointer' : 'default',
            position: 'relative',
            overflow: 'hidden'
        }}
        onMouseEnter={e => { 
            if (to) { 
                e.currentTarget.style.transform = 'translateY(-4px)'; 
                e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.5), 0 0 15px ${accent}22`; 
                e.currentTarget.style.borderColor = `rgba(255, 255, 255, 0.1)`; 
                e.currentTarget.style.background = 'rgba(20, 20, 20, 0.6)';
            }
        }}
        onMouseLeave={e => { 
            if (to) { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = 'none'; 
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; 
                e.currentTarget.style.background = 'rgba(15, 15, 15, 0.4)';
            }
        }}>
            {/* Subtle glow behind icon */}
            <div style={{ position: 'absolute', top: '50%', left: '30px', transform: 'translateY(-50%)', width: '40px', height: '40px', background: accent, filter: 'blur(30px)', opacity: 0.2, borderRadius: '50%', pointerEvents: 'none' }} />
            
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: `${accent}15`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: '1.3rem', flexShrink: 0, zIndex: 1 }}>
                {icon}
            </div>
            <div style={{ flex: 1, zIndex: 1 }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: '#fff', lineHeight: 1, letterSpacing: '-0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{value ?? '—'}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 'clamp(0.65rem, 1.2vw, 0.75rem)', color: '#aaa', marginTop: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</div>
                {sub && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: accent, opacity: 0.8, marginTop: '4px' }}>{sub}</div>}
            </div>
            {to && <FaArrowRight style={{ color: '#555', fontSize: '0.8rem', flexShrink: 0, transition: 'color 0.2s, transform 0.2s', zIndex: 1 }} className="metric-arrow" />}
        </div>
    );
    return to ? <Link to={to} style={{ textDecoration: 'none' }} className="metric-link">{body}</Link> : body;
}

/* ── List row ── */
function ListRow({ to, left, right, accent = 'rgba(255, 255, 255, 0.1)' }) {
    return (
        <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'transparent', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { 
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    const indicator = e.currentTarget.querySelector('.row-indicator');
                    if (indicator) {
                        indicator.style.opacity = '1';
                        indicator.style.transform = 'scaleY(1)';
                    }
                }}
                onMouseLeave={e => { 
                    e.currentTarget.style.background = 'transparent';
                    const indicator = e.currentTarget.querySelector('.row-indicator');
                    if (indicator) {
                        indicator.style.opacity = '0';
                        indicator.style.transform = 'scaleY(0)';
                    }
                }}>
                <div className="row-indicator" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: accent, opacity: 0, transform: 'scaleY(0)', transformOrigin: 'center', transition: 'all 0.2s ease', boxShadow: `0 0 10px ${accent}` }} />
                {left}
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>{right}</div>
            </div>
        </Link>
    );
}

/* ── Main ── */
export default function AdminOverview() {
    const [stats,   setStats]  = useState(null);
    const [events,  setEvents] = useState([]);
    const [users,   setUsers]  = useState([]);
    const [loading, setLoad]   = useState(true);
    const [error,   setError]  = useState('');
    const [now,     setNow]    = useState(new Date());

    useEffect(() => { load(); }, []);
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

    async function load() {
        setLoad(true); setError('');
        try {
            const res  = await fetch('/api/admin/dashboard/', { headers: {
                    'X-CSRFToken': getCsrfToken()
                } });
            if (!res.ok) throw new Error('Failed to fetch dashboard data');
            const d = await res.json();
            setStats(d.stats);
            setEvents(d.recent_events || []);
            setUsers(d.recent_users   || []);
        } catch (e) { setError(e.message); }
        finally { setLoad(false); }
    }

    const h = now.getHours();
    const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    const timeStr  = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    /* ── Common Styles ── */
    const glassContainerStyle = {
        background: 'rgba(10, 10, 10, 0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    };
    
    // Inline CSS for hover interactions that React struggles with standalone
    const globalStyles = `
        @keyframes fadepulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 0.3; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 40% { opacity: 0.15; } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .metric-link:hover .metric-arrow { color: ${G} !important; transform: translateX(3px) !important; }
        .premium-btn {
            background: rgba(34, 214, 96, 0.05);
            border: 1px solid rgba(34, 214, 96, 0.3);
            color: #22d660;
            padding: 8px 18px;
            border-radius: 8px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.75rem;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-transform: uppercase;
            text-decoration: none;
            backdrop-filter: blur(8px);
        }
        .premium-btn:hover {
            background: rgba(34, 214, 96, 0.15);
            border-color: #22d660;
            box-shadow: 0 0 15px rgba(34, 214, 96, 0.2);
            transform: translateY(-2px);
            color: #fff;
        }
        .action-card {
            padding: clamp(18px, 3vw, 24px) clamp(20px, 3vw, 28px);
            background: rgba(15, 15, 15, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            position: relative;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            overflow: hidden;
        }
        .action-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: var(--card-color);
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }
        .action-card:hover {
            transform: translateY(-5px);
            background: rgba(20, 20, 20, 0.6);
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 20px var(--card-glow);
        }
        .action-card:hover::before {
            opacity: 1;
            box-shadow: 0 0 10px var(--card-color);
        }
    `;

    /* ── Loading ── */
    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
            <style>{globalStyles}</style>
            <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: -20, background: G, filter: 'blur(40px)', opacity: 0.1, borderRadius: '50%' }} />
                <FaTerminal style={{ fontSize: '2.5rem', color: G, filter: 'drop-shadow(0 0 10px rgba(34,214,96,0.5))' }} />
            </div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", color: G, fontSize: '0.9rem', letterSpacing: '3px', animation: 'fadepulse 1.5s ease-in-out infinite', textShadow: `0 0 10px ${G}` }}>
                INITIALIZING SUBSYSTEMS...
            </p>
        </div>
    );

    /* ── Error ── */
    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px', color: RED }}>
            <style>{globalStyles}</style>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 59, 48, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 59, 48, 0.3)', boxShadow: '0 0 30px rgba(255, 59, 48, 0.15)' }}>
                <FaExclamationTriangle style={{ fontSize: '2.2rem', color: RED, filter: 'drop-shadow(0 0 8px rgba(255,59,48,0.6))' }} />
            </div>
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.95rem', letterSpacing: '1px', marginTop: '10px' }}>SYSTEM ERROR DETECTED</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: '#aaa', maxWidth: '400px', textAlign: 'center', lineHeight: 1.5 }}>{error}</p>
            <button onClick={load} className="premium-btn" style={{ marginTop: '15px', borderColor: RED, color: RED, background: 'rgba(255, 59, 48, 0.05)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 59, 48, 0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 59, 48, 0.05)'; e.currentTarget.style.color = RED; e.currentTarget.style.boxShadow = 'none'; }}>
                REBOOT SYSTEM
            </button>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(30px, 4vw, 50px)', paddingBottom: '40px' }}>
            <style>{globalStyles}</style>

            {/* ══ HEADER ══ */}
            <div style={{ 
                ...glassContainerStyle, 
                padding: 'clamp(20px, 4vw, 32px)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '24px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background glow for header */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: G, filter: 'blur(100px)', opacity: 0.05, borderRadius: '50%', pointerEvents: 'none' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(34, 214, 96, 0.05)', borderRadius: '20px', border: '1px solid rgba(34, 214, 96, 0.2)', marginBottom: '16px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: G, display: 'inline-block', animation: 'blink 2s infinite', boxShadow: `0 0 8px ${G}` }} />
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: G, letterSpacing: '2px' }}>SYSTEM ONLINE</span>
                    </div>
                    
                    <h1 style={{ margin: '0 0 12px', fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', color: '#fff', letterSpacing: '3px', fontWeight: 800, textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                        <span style={{ background: 'linear-gradient(90deg, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DASHBOARD</span> OVERVIEW
                    </h1>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem', color: G, letterSpacing: '1px', opacity: 0.9 }}>
                            &gt; {greeting.toUpperCase()}, ADMIN
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', color: '#888' }}>
                            <FaCalendarAlt style={{ opacity: 0.7 }} />
                            <span>{now.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span style={{ color: 'rgba(255,255,255,0.1)' }}>•</span>
                            <span style={{ color: '#ccc' }}>{timeStr}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', zIndex: 1 }}>
                    {stats?.live_events > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'rgba(34, 214, 96, 0.1)', border: `1px solid rgba(34, 214, 96, 0.3)`, borderRadius: '8px', color: G, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', letterSpacing: '1px', boxShadow: '0 0 15px rgba(34, 214, 96, 0.1)' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: G, display: 'inline-block', animation: 'blink 1.2s infinite', boxShadow: `0 0 6px ${G}` }} />
                            {stats.live_events} <span style={{ color: '#fff' }}>LIVE</span>
                        </div>
                    )}
                    {stats?.pending_requests > 0 && (
                        <Link to="/administration/event-requests" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'rgba(245, 158, 11, 0.1)', border: `1px solid rgba(245, 158, 11, 0.3)`, borderRadius: '8px', color: GOLD, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', letterSpacing: '1px', boxShadow: '0 0 15px rgba(245, 158, 11, 0.1)', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 20px rgba(245, 158, 11, 0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.1)'; }}>
                            <FaInbox style={{ fontSize: '0.9rem', filter: `drop-shadow(0 0 4px ${GOLD})` }} /> {stats.pending_requests} <span style={{ color: '#fff' }}>PENDING</span>
                        </Link>
                    )}
                    <button onClick={load} className="premium-btn">
                        <FaCircle style={{ fontSize: '0.4rem', marginRight: '6px' }} /> REFRESH
                    </button>
                </div>
            </div>

            {/* ══ METRICS ══ */}
            <div>
                <SecLabel>system_metrics</SecLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
                    <Metric icon={<FaUsers />}       label="TOTAL USERS"    value={stats?.total_users}      accent={G}     to="/administration/users" />
                    <Metric icon={<FaCalendarAlt />} label="TOTAL EVENTS"   value={stats?.total_events}     accent={BLUE}  to="/administration/events" />
                    <Metric icon={<FaFire />}        label="LIVE NOW"       value={stats?.live_events}      accent={G}     sub={stats?.live_events > 0 ? '● Active right now' : '○ None running'} />
                    <Metric icon={<FaClock />}       label="UPCOMING"       value={stats?.upcoming_events}  accent={BLUE} />
                    <Metric icon={<FaCheckCircle />} label="COMPLETED"      value={stats?.completed_events} accent="#888" />
                </div>
            </div>

            {/* ══ EVENTS + USERS ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 'clamp(24px, 3vw, 32px)' }}>

                {/* Recent Events */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <SecLabel>recent_events</SecLabel>
                        <Link to="/administration/events" className="premium-btn" style={{ padding: '6px 14px', fontSize: '0.7rem', background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#aaa', backdropFilter: 'none' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                            VIEW ALL <FaArrowRight style={{ marginLeft: '6px' }} />
                        </Link>
                    </div>
                    <div style={{ ...glassContainerStyle, padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {events.length === 0
                            ? <p style={{ textAlign: 'center', padding: '3rem 2rem', color: '#555', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem', margin: 'auto' }}>// NO EVENTS FOUND</p>
                            : events.map((ev, i) => {
                                const sc = STATUS[ev.status] || STATUS.draft;
                                return (
                                    <ListRow
                                        key={ev.id}
                                        to={`/administration/event/${ev.id}`}
                                        accent={sc.color}
                                        left={
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                                                    {ev.name}
                                                </div>
                                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: '#777', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaCalendarAlt style={{ fontSize: '0.65rem' }}/> {ev.start_date || '—'}</span>
                                                    <span>•</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaUsers style={{ fontSize: '0.65rem' }}/> {ev.participants} pts</span>
                                                </div>
                                            </div>
                                        }
                                        right={
                                            <span style={{ 
                                                fontFamily: "'Share Tech Mono', monospace", 
                                                fontSize: '0.65rem', 
                                                fontWeight: 700, 
                                                color: sc.color, 
                                                background: sc.bg, 
                                                border: `1px solid ${sc.border}`, 
                                                padding: '4px 10px', 
                                                borderRadius: '6px', 
                                                letterSpacing: '1px',
                                                boxShadow: `0 0 10px ${sc.bg}`
                                            }}>
                                                {sc.label}
                                            </span>
                                        }
                                    />
                                );
                              })
                        }
                    </div>
                </div>

                {/* Recent Users */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <SecLabel>recent_users</SecLabel>
                        <Link to="/administration/users" className="premium-btn" style={{ padding: '6px 14px', fontSize: '0.7rem', background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: '#aaa', backdropFilter: 'none' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                            VIEW ALL <FaArrowRight style={{ marginLeft: '6px' }} />
                        </Link>
                    </div>
                    <div style={{ ...glassContainerStyle, padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {users.length === 0
                            ? <p style={{ textAlign: 'center', padding: '3rem 2rem', color: '#555', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem', margin: 'auto' }}>// NO USERS FOUND</p>
                            : users.map(u => (
                                <ListRow
                                    key={u.id}
                                    to={`/administration/user/${u.id}`}
                                    accent={G}
                                    left={
                                        <>
                                            <div style={{ 
                                                width: '40px', height: '40px', 
                                                borderRadius: '10px', 
                                                background: 'rgba(34, 214, 96, 0.08)', 
                                                border: `1px solid rgba(34, 214, 96, 0.2)`, 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                color: G, fontFamily: "'Share Tech Mono', monospace", 
                                                fontSize: '0.85rem', fontWeight: 700, flexShrink: 0, letterSpacing: '1px',
                                                textShadow: `0 0 8px ${G}`,
                                                boxShadow: `inset 0 0 10px rgba(34, 214, 96, 0.05)`
                                            }}>
                                                {u.username.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, paddingLeft: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 600, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {u.username}
                                                    </span>
                                                    {u.is_staff && (
                                                        <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: GOLD, padding: '2px 6px', borderRadius: '4px', border: `1px solid rgba(245, 158, 11, 0.3)`, fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.5px' }}>
                                                            <FaUserShield /> STAFF
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: '#777', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {u.email}
                                                </div>
                                            </div>
                                        </>
                                    }
                                    right={<span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: '#555' }}>{u.date_joined}</span>}
                                />
                              ))
                        }
                    </div>
                </div>
            </div>

            {/* ══ QUICK ACTIONS ══ */}
            <div>
                <SecLabel>quick_actions</SecLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
                    {[
                        { to: '/administration/event/new',      icon: <FaPlus />,    label: 'CREATE NEW EVENT',  desc: 'Deploy a new CTF engagement',  color: G,    colorRgb: '34, 214, 96' },
                        { to: '/administration/users',          icon: <FaUsers />,   label: 'MANAGE PROFILES',   desc: 'Control user access and data', color: BLUE, colorRgb: '77, 166, 255' },
                        { to: '/administration/events',         icon: <FaListAlt />, label: 'SYSTEM EVENTS',     desc: 'Browse entire event log',      color: G,    colorRgb: '34, 214, 96' },
                        { to: '/administration/event-requests', icon: <FaInbox />,   label: 'EVENT REQUESTS',    desc: 'Review host applications',     color: GOLD, colorRgb: '245, 158, 11', badge: stats?.pending_requests },
                    ].map(({ to, icon, label, desc, color, colorRgb, badge }) => (
                        <Link key={to} to={to} style={{ textDecoration: 'none', '--card-color': color, '--card-glow': `rgba(${colorRgb}, 0.2)` }} className="action-card">
                            {/* Ambient glow inside card */}
                            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '100px', height: '100px', background: color, filter: 'blur(50px)', opacity: 0.1, pointerEvents: 'none', borderRadius: '50%' }} />
                            
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div style={{ 
                                    width: '48px', height: '48px', 
                                    borderRadius: '12px', 
                                    background: `rgba(${colorRgb}, 0.1)`, 
                                    border: `1px solid rgba(${colorRgb}, 0.2)`, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    color: color, fontSize: '1.4rem',
                                    boxShadow: `0 0 15px rgba(${colorRgb}, 0.1)`
                                }}>
                                    {icon}
                                </div>
                                {badge > 0 && (
                                    <span style={{ background: `rgba(${colorRgb}, 0.15)`, color: color, border: `1px solid rgba(${colorRgb}, 0.4)`, borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '1px', boxShadow: `0 0 10px rgba(${colorRgb}, 0.2)` }}>
                                        {badge} NEW
                                    </span>
                                )}
                            </div>
                            <div style={{ position: 'relative', zIndex: 1, marginTop: '8px' }}>
                                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', fontWeight: 700, color: '#f0f0f0', marginBottom: '6px', letterSpacing: '0.5px' }}>{label}</div>
                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: '#888', lineHeight: 1.5 }}>{desc}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    );
}
