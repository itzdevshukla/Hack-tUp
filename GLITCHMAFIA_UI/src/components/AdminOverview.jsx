import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    live:      { label: 'LIVE',     color: G,     bg: 'rgba(0,255,65,0.07)',   border: 'rgba(0,255,65,0.22)' },
    upcoming:  { label: 'UPCOMING', color: BLUE,  bg: 'rgba(57,170,255,0.07)', border: 'rgba(57,170,255,0.18)' },
    completed: { label: 'ENDED',    color: '#555', bg: 'rgba(60,60,60,0.07)',  border: 'rgba(60,60,60,0.14)' },
    draft:     { label: 'DRAFT',    color: GOLD,  bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)' },
};

/* ── Normalised section label ── */
const SecLabel = ({ children }) => (
    <p style={{ margin: '0 0 18px', fontFamily: "'Share Tech Mono', monospace", color: '#444', fontSize: '0.72rem', letterSpacing: '2.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: G, opacity: 0.5 }}>//</span> {children}
    </p>
);

/* ── Metric card ── */
function Metric({ icon, label, value, accent = G, sub, to }) {
    const body = (
        <div style={{
            background: '#141414',
            border: '1px solid #2a2a2a',
            borderLeft: `3px solid ${accent}`,
            borderRadius: '6px',
            padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 2.5vw, 22px)',
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            transition: 'border-color .2s, transform .2s, box-shadow .2s',
            cursor: to ? 'pointer' : 'default',
        }}
        onMouseEnter={e => { if (to) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.6), 0 0 12px ${accent}0a`; e.currentTarget.style.borderColor = accent; }}}
        onMouseLeave={e => { if (to) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '#1a1a1a'; }}}>
            <div style={{ width: '42px', height: '42px', borderRadius: '6px', background: `${accent}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: '1.1rem', flexShrink: 0 }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(1.1rem, 2.5vw, 1.55rem)', color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}>{value ?? '—'}</div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 'clamp(0.6rem, 1vw, 0.68rem)', color: '#555', marginTop: '5px', letterSpacing: '1px' }}>{label}</div>
                {sub && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: accent, opacity: 0.65, marginTop: '3px' }}>{sub}</div>}
            </div>
            {to && <FaArrowRight style={{ color: '#2a2a2a', fontSize: '0.65rem', flexShrink: 0 }} />}
        </div>
    );
    return to ? <Link to={to} style={{ textDecoration: 'none' }}>{body}</Link> : body;
}

/* ── List row ── */
function ListRow({ to, left, right, accent = '#2a2a2a' }) {
    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 18px', borderLeft: `2px solid transparent`, transition: 'background .12s, border-color .12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderLeftColor = accent; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeftColor = 'transparent'; }}>
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
            const res  = await fetch('/api/admin/dashboard/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            if (!res.ok) throw new Error('Failed to fetch');
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

    /* ── Loading ── */
    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
            <FaTerminal style={{ fontSize: '2rem', color: G, opacity: 0.5 }} />
            <p style={{ fontFamily: "'Share Tech Mono', monospace", color: G, fontSize: '0.82rem', letterSpacing: '2px', opacity: 0.8, animation: 'fadepulse 1.2s ease-in-out infinite' }}>
                LOADING SYSTEM DATA...
            </p>
            <style>{`@keyframes fadepulse{0%,100%{opacity:.8}50%{opacity:.3}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0.1}}`}</style>
        </div>
    );

    /* ── Error ── */
    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '12px', color: RED }}>
            <FaExclamationTriangle style={{ fontSize: '1.8rem', opacity: 0.7 }} />
            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem' }}>ERR: {error}</p>
            <button onClick={load} className="admin-btn-action-view" style={{ marginTop: '8px' }}>RETRY</button>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(24px, 4vw, 44px)' }}>
            <style>{`@keyframes blink{0%,100%{opacity:1}40%{opacity:0.15}}`}</style>

            {/* ══ HEADER ══ */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', paddingBottom: '28px', borderBottom: '1px solid #111' }}>
                <div>
                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', color: G, letterSpacing: '3px', marginBottom: '8px', opacity: 0.8 }}>
                        &gt; {greeting.toUpperCase()}, ADMIN
                    </div>
                    <h1 style={{ margin: '0 0 10px', fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(1.2rem, 3vw, 2rem)', color: '#fff', letterSpacing: '2px', fontWeight: 700 }}>
                        DASHBOARD OVERVIEW
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: '#555' }}>
                            {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span style={{ color: '#222' }}>|</span>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: '#333' }}>{timeStr}</span>
                        <span style={{ color: '#222' }}>|</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: G, display: 'inline-block', animation: 'blink 2s infinite' }} />
                            <span style={{ color: G }}>System Online</span>
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {stats?.live_events > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: `${G}06`, border: `1px solid ${G}20`, borderRadius: '4px', color: G, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', letterSpacing: '1px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: G, display: 'inline-block', animation: 'blink 1.2s infinite' }} />
                            {stats.live_events} LIVE
                        </div>
                    )}
                    {stats?.pending_requests > 0 && (
                        <Link to="/administration/event-requests" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: `${GOLD}06`, border: `1px solid ${GOLD}20`, borderRadius: '4px', color: GOLD, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', letterSpacing: '1px' }}>
                            <FaInbox style={{ fontSize: '0.7rem' }} /> {stats.pending_requests} PENDING
                        </Link>
                    )}
                    <button onClick={load} className="admin-btn-action-view" style={{ fontSize: '0.72rem', letterSpacing: '1px' }}>
                        ↻&nbsp; REFRESH
                    </button>
                </div>
            </div>

            {/* ══ METRICS ══ */}
            <div>
                <SecLabel>system_metrics</SecLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: 'clamp(10px, 1.5vw, 14px)' }}>
                    <Metric icon={<FaUsers />}       label="TOTAL USERS"    value={stats?.total_users}      accent={G}     to="/administration/users" />
                    <Metric icon={<FaCalendarAlt />} label="TOTAL EVENTS"   value={stats?.total_events}     accent={BLUE}  to="/administration/events" />
                    <Metric icon={<FaFire />}        label="LIVE NOW"       value={stats?.live_events}      accent={G}     sub={stats?.live_events > 0 ? '● Active right now' : '○ None running'} />
                    <Metric icon={<FaClock />}       label="UPCOMING"       value={stats?.upcoming_events}  accent={BLUE} />
                    <Metric icon={<FaCheckCircle />} label="COMPLETED"      value={stats?.completed_events} accent="#333" />
                </div>
            </div>

            {/* ══ EVENTS + USERS ══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'clamp(16px, 3vw, 28px)' }}>

                {/* Recent Events */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <SecLabel>recent_events</SecLabel>
                        <Link to="/administration/events" className="admin-btn-action-view" style={{ fontSize: '0.68rem', padding: '4px 12px', marginBottom: '18px', textDecoration: 'none' }}>
                            All Events &nbsp;<FaArrowRight style={{ fontSize: '0.55rem' }} />
                        </Link>
                    </div>
                    <div className="admin-table-container" style={{ padding: 0, overflow: 'hidden', background: '#141414', border: '1px solid #242424' }}>
                        {events.length === 0
                            ? <p style={{ textAlign: 'center', padding: '2.5rem', color: '#333', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.78rem' }}>// NO EVENTS</p>
                            : events.map(ev => {
                                const sc = STATUS[ev.status] || STATUS.draft;
                                return (
                                    <ListRow
                                        key={ev.id}
                                        to={`/administration/event/${ev.id}`}
                                        accent={sc.color}
                                        left={
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.86rem', fontWeight: 600, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {ev.name}
                                                </div>
                                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.67rem', color: '#444', marginTop: '4px' }}>
                                                    {ev.start_date || '—'} &nbsp;·&nbsp; {ev.participants} participant{ev.participants !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        }
                                        right={
                                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.6rem', fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, padding: '3px 9px', borderRadius: '3px', letterSpacing: '0.5px' }}>
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
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <SecLabel>recent_users</SecLabel>
                        <Link to="/administration/users" className="admin-btn-action-view" style={{ fontSize: '0.68rem', padding: '4px 12px', marginBottom: '18px', textDecoration: 'none' }}>
                            All Users &nbsp;<FaArrowRight style={{ fontSize: '0.55rem' }} />
                        </Link>
                    </div>
                    <div className="admin-table-container" style={{ padding: 0, overflow: 'hidden', background: '#141414', border: '1px solid #242424' }}>
                        {users.length === 0
                            ? <p style={{ textAlign: 'center', padding: '2.5rem', color: '#333', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.78rem' }}>// NO USERS</p>
                            : users.map(u => (
                                <ListRow
                                    key={u.id}
                                    to={`/administration/user/${u.id}`}
                                    accent={G}
                                    left={
                                        <>
                                            <div style={{ width: '33px', height: '33px', borderRadius: '4px', background: `${G}0a`, border: `1px solid ${G}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G, fontFamily: "'Share Tech Mono', monospace", fontSize: '0.72rem', fontWeight: 700, flexShrink: 0, letterSpacing: '1px' }}>
                                                {u.username.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.86rem', fontWeight: 600, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {u.username}
                                                    </span>
                                                    {u.is_staff && <FaUserShield style={{ color: GOLD, fontSize: '0.58rem', flexShrink: 0 }} title="Staff" />}
                                                </div>
                                                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.67rem', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {u.email}
                                                </div>
                                            </div>
                                        </>
                                    }
                                    right={<span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.63rem', color: '#333' }}>{u.date_joined}</span>}
                                />
                              ))
                        }
                    </div>
                </div>
            </div>

            {/* ══ QUICK ACTIONS ══ */}
            <div>
                <SecLabel>quick_actions</SecLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: 'clamp(10px, 2vw, 16px)' }}>
                    {[
                        { to: '/administration/event/new',      icon: <FaPlus />,    label: 'Create New Event',  desc: 'Launch a new CTF event',       color: G    },
                        { to: '/administration/users',          icon: <FaUsers />,   label: 'Manage Users',      desc: 'View and manage all users',     color: BLUE },
                        { to: '/administration/events',         icon: <FaListAlt />, label: 'All Events',        desc: 'Browse all events in system',   color: G    },
                        { to: '/administration/event-requests', icon: <FaInbox />,   label: 'Event Requests',    desc: 'Review pending host requests',  color: GOLD, badge: stats?.pending_requests },
                    ].map(({ to, icon, label, desc, color, badge }) => (
                        <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                            <div style={{
                                padding: 'clamp(14px, 2.5vw, 20px) clamp(16px, 2.5vw, 22px)',
                                background: '#141414',
                                border: '1px solid #2a2a2a',
                                borderTop: `2px solid ${color}`,
                                borderRadius: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                position: 'relative',
                                transition: 'transform .2s, box-shadow .2s, border-color .2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.7), 0 0 12px ${color}0a`; e.currentTarget.style.borderBottomColor = color+'22'; e.currentTarget.style.borderLeftColor = color+'22'; e.currentTarget.style.borderRightColor = color+'22'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderBottomColor = '#1a1a1a'; e.currentTarget.style.borderLeftColor = '#1a1a1a'; e.currentTarget.style.borderRightColor = '#1a1a1a'; }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '1.5rem', color }}>{icon}</span>
                                    {badge > 0 && (
                                        <span style={{ background: color, color: '#000', borderRadius: '3px', fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.5px' }}>
                                            {badge}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: '#e0e0e0', marginBottom: '4px' }}>{label}</div>
                                    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.68rem', color: '#444', lineHeight: 1.4 }}>{desc}</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

        </div>
    );
}
