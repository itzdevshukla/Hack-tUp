import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaFlag, FaCheckCircle, FaTimesCircle, FaLock,
    FaBug, FaCode, FaDatabase, FaShieldAlt, FaBan, FaGavel,
    FaArrowRight, FaStar, FaEye
} from 'react-icons/fa';
import './Challenges.css';

/* ─── helpers ─────────────────────────────────────────────────── */
const DIFF_COLOR = { easy: '#22d3ee', medium: '#fb923c', hard: '#f87171' };
const DIFF_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const ACCENT = '#22c55e';

const CAT_ICONS = {
    web: <FaBug />, crypto: <FaLock />, pwn: <FaCode />,
    forensics: <FaDatabase />, osint: <FaEye />,
    misc: <FaStar />, default: <FaShieldAlt />
};
const CAT_COLORS = {
    web: '#38bdf8', crypto: '#c084fc', pwn: '#f87171',
    forensics: '#4ade80', osint: '#fbbf24', misc: '#f472b6', default: '#00e5ff'
};
function catIcon(cat) { return CAT_ICONS[cat?.toLowerCase()] ?? CAT_ICONS.default; }
function catColor(cat) { return CAT_COLORS[cat?.toLowerCase()] ?? CAT_COLORS.default; }

/* ─── component ───────────────────────────────────────────────── */
const Challenges = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category') || 'All';

    const [challenges, setChallenges] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState(categoryParam);
    const [isBanned, setIsBanned] = useState(false);
    const [eventStatus, setEventStatus] = useState('live');


    // Rules overlay
    const [rules, setRules] = useState('');
    const [showRulesOverlay, setShowRulesOverlay] = useState(false);
    const [countdown, setCountdown] = useState(15);
    const countdownRef = useRef(null);

    useEffect(() => { setFilter(categoryParam); }, [categoryParam]);

    useEffect(() => {
        fetchChallenges();
        fetchEventRules();

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/updates/`;
        let ws;

        try {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'leaderboard_update' || message.type === 'challenge_updated' || message.type === 'waves_updated') {
                        // Refresh challenges when events occur (leaderboard updates, challenge add/edit/delete, wave open/close)
                        fetchChallenges();
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

    useEffect(() => {
        if (showRulesOverlay && countdown > 0) {
            countdownRef.current = setInterval(() => {
                setCountdown(prev => { if (prev <= 1) { clearInterval(countdownRef.current); return 0; } return prev - 1; });
            }, 1000);
        }
        return () => clearInterval(countdownRef.current);
    }, [showRulesOverlay]);

    const fetchEventRules = async () => {
        const seenKey = `rules_seen_event_${id}`;
        if (localStorage.getItem(seenKey)) return;
        try {
            const res = await fetch(`/api/dashboard/event/${id}/`);
            if (res.ok) {
                const data = await res.json();
                if (data.rules?.trim()) { setRules(data.rules); setShowRulesOverlay(true); }
            }
        } catch { }
    };

    const dismissRulesOverlay = () => {
        if (countdown > 0) return;
        localStorage.setItem(`rules_seen_event_${id}`, 'true');
        setShowRulesOverlay(false);
    };

    const fetchChallenges = async () => {
        try {
            const res = await fetch(`/api/event/${id}/challenges/`);
            if (res.status === 403) {
                const d = await res.json();
                setError(d.error || 'Access Denied');
                if (d.event) setEventName(d.event);
                setEventStatus('pending');
                setLoading(false);
                return;
            }
            const data = await res.json();

            // Redirect to Team page if they require a team
            if (data.needs_team) {
                navigate(`/event/${id}/team`, { replace: true });
                return;
            }

            if (data.challenges) {
                setChallenges(data.challenges);
                setEventName(data.event);
                setIsBanned(data.is_banned || false);
                setEventStatus(data.status || 'live');
            }
            setLoading(false);
        } catch {
            setError('Failed to load challenges.');
            setLoading(false);
        }
    };

    const openChallenge = (ch) => {
        navigate(`/event/${id}/challenges/${ch.id}`);
    };

    const categories = ['All', ...new Set(challenges.map(c => c.category))];
    const filtered = challenges.filter(c => filter === 'All' || c.category === filter);
    const grouped = {};
    filtered.forEach(c => { if (!grouped[c.category]) grouped[c.category] = []; grouped[c.category].push(c); });

    const solved = challenges.filter(c => c.is_solved).length;
    const total = challenges.length;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

    /* ── splash states ── */
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', fontFamily: 'Orbitron, sans-serif', color: ACCENT, letterSpacing: '4px', fontSize: '0.9rem' }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ textShadow: `0 0 20px ${ACCENT}60` }}>INITIALIZING ARENA...</motion.div>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem', gap: '1.5rem', fontFamily: 'Orbitron, sans-serif' }}>
            <div style={{ fontSize: '3.5rem', opacity: 0.3 }}>
                {error.toLowerCase().includes('started') ? '⏳' : '🔒'}
            </div>
            <h1 style={{ fontSize: '2rem', margin: 0, color: '#fff', letterSpacing: '2px', textTransform: 'uppercase' }}>
                {error.toLowerCase().includes('started') ? 'EVENT NOT STARTED' : 'ACCESS DENIED'}
            </h1>
            <p style={{ fontSize: '1rem', color: '#666', maxWidth: '500px', lineHeight: '1.6', fontFamily: 'Inter, sans-serif', fontWeight: 'normal' }}>
                {error}
            </p>
            <button onClick={() => navigate(`/event/${id}`)} style={{ padding: '10px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#bbb', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Orbitron, sans-serif', fontWeight: 'bold', letterSpacing: '1px', transition: 'all 0.2s' }}>
                ← BACK TO EVENT
            </button>
        </div>
    );

    if (isBanned) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', textAlign: 'center', fontFamily: 'Orbitron, sans-serif' }}>
            <FaBan style={{ fontSize: '3.5rem', color: '#f44336', opacity: 0.6 }} />
            <h1 style={{ margin: 0, color: '#f44336', fontSize: '1.8rem', letterSpacing: '2px' }}>ACCESS TERMINATED</h1>
            <p style={{ color: '#888', maxWidth: '480px', lineHeight: 1.6, fontFamily: 'Inter, sans-serif', fontWeight: 'normal' }}>You are banned from this event. Contact the organizers for details.</p>
        </div>
    );

    return (
        <div className="challenges-page">

            {/* ── RULES OVERLAY ── */}
            <AnimatePresence>
                {showRulesOverlay && (
                    <motion.div key="rules-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
                            className="rules-overlay-inner">
                            <div className="rules-overlay-header">
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px', color: '#fff', fontSize: '1.3rem' }}><FaGavel /></div>
                                <div>
                                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: '900' }}>Rules & Regulations</h2>
                                    <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>You must read these before participating.</p>
                                </div>
                            </div>
                            <div className="rules-overlay-body">
                                {rules.split('\n').map((line, i) => {
                                    if (line.startsWith('# ')) return <h1 key={i} style={{ color: ACCENT, fontSize: '1.5rem', margin: '1rem 0 0.5rem', borderBottom: '1px solid rgba(0,229,255,0.15)', paddingBottom: '0.4rem' }}>{line.slice(2)}</h1>;
                                    if (line.startsWith('## ')) return <h2 key={i} style={{ color: '#e0e0e0', fontSize: '1.15rem', margin: '0.9rem 0 0.3rem' }}>{line.slice(3)}</h2>;
                                    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ color: '#ccc', marginLeft: '1.5rem', listStyle: 'disc', marginBottom: '4px' }}>{line.slice(2)}</li>;
                                    if (line.trim() === '') return <br key={i} />;
                                    return <p key={i} style={{ color: '#aaa', margin: '0.2rem 0' }}>{line}</p>;
                                })}
                            </div>
                            <div className="rules-overlay-footer">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ position: 'relative', width: '50px', height: '50px' }}>
                                        <svg width="50" height="50" viewBox="0 0 50 50" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                                            <circle cx="25" cy="25" r="20" fill="none" stroke={countdown > 0 ? ACCENT : '#4ade80'} strokeWidth="3"
                                                strokeDasharray={`${2 * Math.PI * 20}`}
                                                strokeDashoffset={`${2 * Math.PI * 20 * (countdown / 15)}`}
                                                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
                                        </svg>
                                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: countdown > 0 ? ACCENT : '#4ade80', fontWeight: 'bold', fontSize: '0.85rem' }}>{countdown}</span>
                                    </div>
                                    <span style={{ color: '#666', fontSize: '0.85rem' }}>
                                        {countdown > 0 ? `Please read carefully — ${countdown}s left` : 'You may now proceed.'}
                                    </span>
                                </div>
                                <motion.button onClick={dismissRulesOverlay} disabled={countdown > 0}
                                    whileHover={countdown === 0 ? { scale: 1.04 } : {}}
                                    whileTap={countdown === 0 ? { scale: 0.97 } : {}}
                                    style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: countdown > 0 ? 'rgba(255,255,255,0.04)' : '#fff', color: countdown > 0 ? '#444' : '#000', fontWeight: 'bold', fontSize: '0.95rem', cursor: countdown > 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s', boxShadow: countdown === 0 ? '0 0 20px rgba(255,255,255,0.15)' : 'none' }}>
                                    I Agree & Continue <FaArrowRight />
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── HEADER ── */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                className="challenges-header">
                <div>
                    <div style={{ fontSize: '0.7rem', letterSpacing: '3px', color: '#555', fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase', marginBottom: '4px' }}>CTF Arena</div>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900 }}>{eventName}</h1>
                    <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.85rem' }}>Decryption protocols active. Good luck.</p>
                </div>
                <div className="challenges-header-right">
                    <div className="challenges-stats-row">
                        {[{ label: 'Solved', value: solved, color: ACCENT }, { label: 'Remaining', value: total - solved, color: '#fb923c' }, { label: 'Total', value: total, color: '#777' }].map(s => (
                            <div key={s.label} className="challenges-stat-box">
                                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ position: 'relative', width: '54px', height: '54px' }}>
                        <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                            <circle cx="27" cy="27" r="22" fill="none" stroke={ACCENT} strokeWidth="4"
                                strokeDasharray={`${2 * Math.PI * 22}`}
                                strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
                                style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 4px ${ACCENT}60)` }} />
                        </svg>
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, fontWeight: 900, fontSize: '0.75rem' }}>{pct}%</span>
                    </div>
                </div>
            </motion.div>



            {/* ── CHALLENGE GRID ── */}
            {Object.entries(grouped).map(([category, chs]) => (
                <div key={category} style={{ marginBottom: '3rem' }}>
                    {/* Section header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.2rem' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: `${catColor(category)}12`,
                            border: `1px solid ${catColor(category)}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: catColor(category), fontSize: '0.9rem'
                        }}>
                            {catIcon(category)}
                        </div>
                        <h2 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'Orbitron, sans-serif' }}>
                            {category}
                        </h2>
                        <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 100%)` }} />
                        <span style={{ fontSize: '0.75rem', color: '#555', letterSpacing: '1px' }}>
                            {chs.filter(c => c.is_solved).length}/{chs.length} solved
                        </span>
                    </div>

                    <div className="challenges-card-grid">
                        <AnimatePresence>
                            {chs.map((ch, idx) => (
                                <motion.div key={ch.id}
                                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }} transition={{ delay: idx * 0.04 }}
                                    whileHover={{ y: -5, boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 20px ${ACCENT}18` }}
                                    onClick={() => openChallenge(ch)}
                                    className="challenge-card-item"
                                    style={{
                                        background: ch.is_solved
                                            ? `linear-gradient(160deg, rgba(13,26,15,0.7) 0%, rgba(10,15,11,0.7) 100%)`
                                            : `rgba(15, 15, 15, 0.6)`,
                                        backdropFilter: 'blur(12px)',
                                        border: `1px solid ${ch.is_solved ? `${ACCENT}35` : 'rgba(255,255,255,0.07)'}`,
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxShadow: ch.is_solved
                                            ? `0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px ${ACCENT}18`
                                            : `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${ACCENT}08`,
                                        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                                    }}>

                                    {/* Green radial glow at top */}
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: '160px',
                                        background: `radial-gradient(ellipse at 50% 0%, ${ACCENT}12 0%, transparent 70%)`,
                                        pointerEvents: 'none'
                                    }} />
                                    {/* Bottom subtle green tint */}
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
                                        background: `linear-gradient(0deg, ${ACCENT}05 0%, transparent 100%)`,
                                        pointerEvents: 'none'
                                    }} />

                                    {/* Card body */}
                                    <div className="challenge-card-body" style={{ padding: '1.5rem 1.5rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>

                                        {/* Top row: category badge + difficulty + icon */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '5px 11px',
                                                background: `${catColor(ch.category)}12`,
                                                border: `1px solid ${catColor(ch.category)}28`,
                                                borderRadius: '20px',
                                                color: catColor(ch.category),
                                                fontSize: '0.7rem', fontWeight: 700,
                                                textTransform: 'capitalize', letterSpacing: '0.3px'
                                            }}>
                                                {catIcon(ch.category)} {ch.category}
                                            </div>
                                            <div style={{
                                                padding: '4px 10px',
                                                background: `${DIFF_COLOR[ch.difficulty] || '#777'}10`,
                                                border: `1px solid ${DIFF_COLOR[ch.difficulty] || '#777'}22`,
                                                borderRadius: '20px',
                                                color: DIFF_COLOR[ch.difficulty] || '#777',
                                                fontSize: '0.7rem', fontWeight: 600,
                                            }}>
                                                {DIFF_LABEL[ch.difficulty] || ch.difficulty}
                                            </div>
                                            <div style={{ marginLeft: 'auto', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ch.is_solved ? ACCENT : '#666', fontSize: '0.85rem', flexShrink: 0 }}>
                                                {ch.is_solved ? <FaCheckCircle /> : catIcon(ch.category)}
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: '0 0 6px', color: ch.is_solved ? '#e8e8e8' : '#f2f2f2', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.45, letterSpacing: '-0.01em' }}>
                                                {ch.title}
                                            </h3>
                                            {ch.description && (
                                                <p style={{ margin: 0, color: '#555', fontSize: '0.8rem', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {ch.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Points */}
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                                            <span style={{ fontSize: '2.4rem', fontWeight: 700, color: ch.is_solved ? ACCENT : '#e8e8e8', fontFamily: "'Playfair Display', serif", lineHeight: 1, letterSpacing: '-0.5px' }}>
                                                {ch.points}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#555', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>pts</span>
                                            {ch.solves_count > 0 && (
                                                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#555' }}>
                                                    {ch.solves_count} solve{ch.solves_count !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>

                                        {/* Tags / author row */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            {ch.tags?.slice(0, 2).map(tag => (
                                                <span key={tag} style={{ padding: '3px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', color: '#666', fontSize: '0.68rem', fontWeight: 500 }}>
                                                    {tag}
                                                </span>
                                            ))}
                                            {ch.tags?.length > 2 && (
                                                <span style={{ padding: '3px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', color: '#555', fontSize: '0.68rem' }}>
                                                    +{ch.tags.length - 2}
                                                </span>
                                            )}
                                            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#555' }}>
                                                by <span style={{ color: '#777', fontWeight: 500 }}>{ch.author || 'Unknown'}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Full-width CTA button */}
                                    <div className="challenge-card-cta" style={{ padding: '0 1.2rem 1.2rem' }}>
                                        <div style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '10px',
                                            textAlign: 'center',
                                            background: ch.is_solved
                                                ? `${ACCENT}18`
                                                : `${ACCENT}0e`,
                                            border: `1px solid ${ch.is_solved ? `${ACCENT}40` : `${ACCENT}22`}`,
                                            color: ch.is_solved ? ACCENT : `${ACCENT}cc`,
                                            fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.5px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            boxSizing: 'border-box',
                                            transition: 'all 0.2s'
                                        }}>
                                            {ch.is_solved
                                                ? <><FaCheckCircle style={{ fontSize: '0.75rem' }} /> Challenge Completed</>
                                                : <><FaFlag style={{ fontSize: '0.72rem' }} /> Attempt Challenge</>
                                            }
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            ))}

            {filtered.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#444' }}>
                    <FaFlag style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.2 }} />
                    <p style={{ color: '#555' }}>No challenges in this category yet.</p>
                </div>
            )}
        </div>
    );
};

export default Challenges;
