import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaTrophy, FaMedal, FaFlag, FaUsers, FaUser, FaCrown, FaKhanda } from 'react-icons/fa';

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
function fmt(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
}

function initials(name = '') {
    return name.trim().split(/[\s_-]+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

/* ─────────────────────────────────────────────────────────────────
   BACKGROUND — animated dot grid + HACK!TUP watermark
───────────────────────────────────────────────────────────────── */
function Background() {
    const canvasRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let W = (canvas.width = window.innerWidth);
        let H = (canvas.height = window.innerHeight);
        const resize = () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);

        const pts = Array.from({ length: 70 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            r: Math.random() * 1.6 + 0.4,
        }));

        const tick = () => {
            ctx.clearRect(0, 0, W, H);
            pts.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > W) p.vx *= -1;
                if (p.y < 0 || p.y > H) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(154,205,50,0.45)';
                ctx.fill();
            });
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 120) {
                        ctx.beginPath();
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.strokeStyle = `rgba(154,205,50,${0.12 * (1 - d / 120)})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }
            animRef.current = requestAnimationFrame(tick);
        };
        tick();
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
    }, []);

    return (
        <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'linear-gradient(135deg, #000 0%, #080808 40%, #050a05 100%)', pointerEvents: 'none' }} />
            <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{
                    fontSize: 'clamp(7rem, 20vw, 20rem)',
                    fontWeight: 900,
                    fontFamily: "'Orbitron', sans-serif",
                    color: 'transparent',
                    WebkitTextStroke: '1.5px rgba(154,205,50,0.055)',
                    letterSpacing: '0.04em',
                    transform: 'rotate(-20deg)',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                }}>
                    HACK!TUP
                </div>
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────────────────────────
   PODIUM PANEL — top 3 Graphical Layout
───────────────────────────────────────────────────────────────── */
const MEDAL = {
    1: { col: '#9ACD32', shadow: '57,255,20', icon: <FaCrown />, height: '160px' },
    2: { col: '#60a5fa', shadow: '96,165,250', icon: <FaMedal />, height: '110px' },
    3: { col: '#a78bfa', shadow: '167,139,250', icon: <FaMedal />, height: '80px' },
};

function VisualPodiumCard({ player, rank, isTeamMode }) {
    if (!player) return <div style={{ flex: 1 }} />;
    
    const m = MEDAL[rank];
    const name = isTeamMode ? player.name : player.username;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.15, duration: 0.6, type: 'spring', bounce: 0.4 }}
            style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'flex-end',
                position: 'relative',
                zIndex: rank === 1 ? 10 : 5
            }}
        >
            {/* Float Avatar / Stats above Pillar */}
            <motion.div 
                animate={rank === 1 ? { y: [0, -8, 0] } : {}}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    marginBottom: '15px', position: 'relative'
                }}
            >
                <div style={{ 
                    width: rank === 1 ? '60px' : '48px', 
                    height: rank === 1 ? '60px' : '48px', 
                    borderRadius: '14px', 
                    background: `rgba(${m.shadow},0.15)`, 
                    border: `1px solid rgba(${m.shadow},0.5)`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: rank === 1 ? '1.4rem' : '1.1rem', fontWeight: 800,
                    color: m.col, boxShadow: `0 0 25px rgba(${m.shadow},0.4)`,
                    position: 'relative', zIndex: 2, fontFamily: 'Orbitron, sans-serif',
                    backdropFilter: 'blur(5px)'
                }}>
                    {m.icon}
                </div>
                
                {rank === 1 && (
                    <div style={{ position: 'absolute', top: '-15px', color: m.col, filter: 'drop-shadow(0 0 5px #9ACD32)' }}>
                        <FaTrophy style={{ fontSize: '1.2rem' }} />
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <div style={{ fontWeight: 800, fontSize: rank === 1 ? '1rem' : '0.9rem', color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                        {name}
                    </div>
                    <div style={{ fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: m.col, fontSize: rank === 1 ? '1.3rem' : '1.1rem', marginTop: '4px', textShadow: `0 0 10px rgba(${m.shadow},0.4)` }}>
                        {player.points}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                        {player.flags} flags
                    </div>
                </div>
            </motion.div>

            {/* Glowing Pillar */}
            <div style={{
                width: '100%',
                height: m.height,
                background: `linear-gradient(to top, rgba(${m.shadow},0.05) 0%, rgba(${m.shadow},0.3) 100%)`,
                borderTop: `3px solid ${m.col}`,
                borderLeft: `1px solid rgba(${m.shadow},0.2)`,
                borderRight: `1px solid rgba(${m.shadow},0.2)`,
                boxShadow: `inset 0 20px 40px rgba(${m.shadow},0.15), 0 -10px 30px rgba(${m.shadow},0.1)`,
                borderTopLeftRadius: '4px',
                borderTopRightRadius: '4px',
                display: 'flex',
                justifyContent: 'center',
                paddingTop: '15px'
            }}>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '2.5rem', fontWeight: 900, color: `rgba(${m.shadow},0.3)` }}>
                    {rank}
                </span>
            </div>
        </motion.div>
    );
}

function PodiumPanel({ board, isTeamMode }) {
    if (board.length === 0) {
        return (
            <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#2a3a2a' }}>
                <FaTrophy style={{ fontSize: '3rem', opacity: 0.12 }} />
                <p style={{ margin: 0, fontSize: '0.82rem', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>No participants yet</p>
            </div>
        );
    }

    const p1 = board[0];
    const p2 = board[1];
    const p3 = board[2];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '380px', justifyContent: 'flex-end', padding: '10px 20px 0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '15px', height: '100%', paddingBottom: '20px' }}>
                <VisualPodiumCard player={p2} rank={2} isTeamMode={isTeamMode} />
                <VisualPodiumCard player={p1} rank={1} isTeamMode={isTeamMode} />
                <VisualPodiumCard player={p3} rank={3} isTeamMode={isTeamMode} />
            </div>

            {/* Separator & Stats */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(154,205,50,0.15), transparent)', margin: '15px 0 10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#3a5a3a', padding: '0 10px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isTeamMode ? <FaUsers /> : <FaUser />}
                    {board.length} Ranked
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ACD32', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9ACD32', display: 'inline-block', animation: 'lb-pulse 2s infinite' }} />
                    Live Connection
                </span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function EventLeaderboard() {
    const { id } = useParams();
    const [board, setBoard] = useState([]);
    const [eventName, setEventName] = useState('');
    const [isTeamMode, setIsTeamMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const debounceRef = useRef(null);
    const outletCtx = useOutletContext();
    const lastWsEvent = outletCtx?.lastWsEvent;

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(`/api/event/${id}/leaderboard/`);
            if (res.ok) {
                const json = await res.json();
                setBoard(json.leaderboard || []);
                setEventName(json.event || '');
                setIsTeamMode(json.is_team_mode || false);
                setLastUpdated(new Date());
            }
        } catch { }
        finally { if (!silent) setLoading(false); }
    }, [id]);

    useEffect(() => {
        fetchData();
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [fetchData]);

    useEffect(() => {
        if (!lastWsEvent || lastWsEvent.type !== 'leaderboard_update') return;
        const d = lastWsEvent.data;
        if (d?.leaderboard?.length > 0) {
            setBoard(d.leaderboard);
            if (d.event) setEventName(d.event);
            if (d.is_team_mode !== undefined) setIsTeamMode(d.is_team_mode);
            setLastUpdated(new Date());
        } else {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => fetchData(true), 1500);
        }
    }, [lastWsEvent, fetchData]);

    // Only show solvers
    const activeBoard = board.filter(p => (p.flags || 0) > 0);

    return (
        <div style={{ minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <Background />

            <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(1.2rem, 3vw, 2.5rem)', maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>

                {/* ──────── HEADER ──────── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    style={{ marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9ACD32', opacity: 0.4 + i * 0.2 }} />
                            ))}
                        </div>
                        <span style={{ fontSize: '0.6rem', color: 'rgba(154,205,50,0.6)', letterSpacing: '4px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>
                            Season Rankings &nbsp;·&nbsp; Live
                        </span>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9ACD32', display: 'inline-block', animation: 'lb-pulse 2s infinite', marginLeft: '2px' }} />
                    </div>

                    <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1.05 }}>
                        Leaderboard
                    </h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', flexWrap: 'wrap' }}>
                        {eventName && (
                            <span style={{ fontSize: '0.85rem', color: '#9ACD32', fontWeight: 700, background: 'rgba(154,205,50,0.08)', border: '1px solid rgba(154,205,50,0.2)', padding: '4px 12px', borderRadius: '20px' }}>
                                {eventName}
                            </span>
                        )}
                        {lastUpdated && (
                            <span style={{ fontSize: '0.75rem', color: '#444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaClock style={{ fontSize: '0.65rem' }} />
                                Updated {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* ──────── CONTENT ──────── */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '10rem 2rem', color: '#9ACD32', fontFamily: 'Orbitron, sans-serif', letterSpacing: '4px', fontSize: '0.82rem' }}>
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.6 }}>
                            LOADING LEADERBOARD...
                        </motion.div>
                    </div>
                ) : (
                    <div className="lb-layout-grid" style={{
                        display: 'grid',
                        gap: 'clamp(1.5rem, 3vw, 2.5rem)',
                        alignItems: 'start',
                    }}>

                        {/* ── LEFT: Ranking Table (WIDER & SCROLLABLE) ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                background: 'rgba(8,8,8,0.92)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '20px',
                                overflow: 'hidden', // Contains the header and scrolling body
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 0 0 1px rgba(154,205,50,0.05), 0 24px 80px rgba(0,0,0,0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                height: '650px', // Fixed height for scrollability
                                order: 2
                            }}
                        >
                            {/* Table header row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 70px 90px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(154,205,50,0.04)', flexShrink: 0 }}>
                                {['#', isTeamMode ? 'Team' : 'Player', <FaFlag key="f" style={{ fontSize: '0.7rem' }} />, 'Score'].map((h, i) => (
                                    <div key={i} style={{ fontSize: '0.7rem', color: 'rgba(154,205,50,0.5)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, textAlign: i === 0 || i >= 2 ? 'center' : 'left', fontFamily: 'Orbitron, sans-serif' }}>{h}</div>
                                ))}
                            </div>

                            {/* Scrollable Table Body */}
                            <div className="custom-table-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                                <AnimatePresence>
                                    {activeBoard.length === 0 ? (
                                        <div style={{ padding: '8rem 2rem', textAlign: 'center', color: '#252525' }}>
                                            <FaTrophy style={{ fontSize: '3.5rem', display: 'block', margin: '0 auto 1rem', opacity: 0.2 }} />
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '2px', textTransform: 'uppercase' }}>Be the first!</p>
                                        </div>
                                    ) : (
                                        activeBoard.map((player, idx) => {
                                            const rank = idx + 1;
                                            const isMe = player.is_me || player.is_my_team;
                                            const name = isTeamMode ? player.name : player.username;
                                            const top1 = rank === 1;
                                            const top3 = rank <= 3;
                                            const m = MEDAL[rank];

                                            return (
                                                <motion.div
                                                    key={player.id || name || idx}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '60px 1fr 70px 90px',
                                                        padding: top1 ? '20px 24px' : top3 ? '16px 24px' : '12px 24px',
                                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                        background: top1
                                                            ? 'linear-gradient(90deg, rgba(57,255,20,0.08) 0%, rgba(57,255,20,0.01) 60%, transparent 100%)'
                                                            : top3 ? `linear-gradient(90deg, rgba(${m.shadow},0.05) 0%, transparent 60%)`
                                                                : isMe ? 'rgba(154,205,50,0.03)' : 'transparent',
                                                        alignItems: 'center',
                                                        transition: 'background 0.2s',
                                                    }}
                                                    whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                                                >
                                                    {/* Rank */}
                                                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                        {m && <span style={{ color: m.col, fontSize: '0.85rem', marginBottom: '1px', filter: `drop-shadow(0 0 5px rgba(${m.shadow},0.6))` }}>{m.icon}</span>}
                                                        <span style={{ color: m ? m.col : '#3a4a3a', fontWeight: 900, fontSize: top3 ? '1.05rem' : '0.9rem', fontFamily: 'Orbitron, sans-serif' }}>
                                                            {rank}
                                                        </span>
                                                    </div>

                                                    {/* Player */}
                                                    <div style={{ minWidth: 0, paddingRight: '12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                                            {/* Avatar */}
                                                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: m ? `rgba(${m.shadow},0.12)` : 'rgba(255,255,255,0.04)', border: `1px solid ${m ? `rgba(${m.shadow},0.3)` : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: m ? m.col : '#555', flexShrink: 0, fontFamily: 'Orbitron, sans-serif' }}>
                                                                {initials(name)}
                                                            </div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span style={{ fontWeight: 700, fontSize: top1 ? '1.05rem' : '0.95rem', color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                        {name}
                                                                    </span>
                                                                    {isMe && <span style={{ fontSize: '0.55rem', color: '#9ACD32', background: 'rgba(154,205,50,0.15)', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(154,205,50,0.3)', fontWeight: 800, flexShrink: 0 }}>YOU</span>}
                                                                </div>
                                                                <div style={{ fontSize: '0.68rem', color: '#444', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                                    <FaClock style={{ fontSize: '0.6rem', color: m ? m.col : 'inherit', opacity: 0.5 }} />{fmt(player.last_solve_time)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Flags */}
                                                    <div style={{ textAlign: 'center', fontWeight: 800, fontSize: top3 ? '1.05rem' : '0.9rem', color: m ? m.col : '#3a4a3a' }}>
                                                        {player.flags}
                                                    </div>

                                                    {/* Score */}
                                                    <div style={{ textAlign: 'center', fontWeight: 900, fontSize: top1 ? '1.3rem' : top3 ? '1.1rem' : '1rem', fontFamily: 'Orbitron, sans-serif', color: m ? m.col : isMe ? '#9ACD32' : '#4a6a4a', letterSpacing: '1px', textShadow: m && top1 ? `0 0 20px rgba(${m.shadow},0.6)` : 'none' }}>
                                                        {player.points}
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>

                        {/* ── RIGHT: Visual Podium ── */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            style={{
                                background: 'rgba(8,8,8,0.92)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '20px',
                                padding: 'clamp(1.5rem, 2vw, 2.5rem)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: '0 0 0 1px rgba(154,205,50,0.05), 0 24px 80px rgba(0,0,0,0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                order: 1
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '3rem' }}>
                                <FaCrown style={{ color: '#9ACD32', fontSize: '1.2rem', filter: 'drop-shadow(0 0 10px #9ACD32)' }} />
                                <span style={{ fontSize: '1rem', color: '#fff', letterSpacing: '4px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif', fontWeight: 800 }}>Hall of Fame</span>
                            </div>
                            
                            <div style={{ flex: 1, position: 'relative' }}>
                                <PodiumPanel board={activeBoard} isTeamMode={isTeamMode} />
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* ──────── FOOTER ──────── */}
                {!loading && (
                    <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.72rem', color: '#2a3a2a', letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>
                        Leaderboard updates automatically &nbsp;·&nbsp; Powered by{' '}
                        <span style={{ color: '#9ACD32' }}>HACK!</span>
                        <span style={{ color: '#fff' }}>TUP</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes lb-pulse {
                    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(154,205,50,0.6); }
                    50%       { opacity: 0.3; box-shadow: 0 0 0 6px rgba(154,205,50,0); }
                }
                
                /* Layout Grid CSS */
                .lb-layout-grid {
                    grid-template-columns: 1fr 1.5fr; /* Table is wider than podium */
                }
                @media (max-width: 1024px) {
                    .lb-layout-grid {
                        grid-template-columns: 1fr;
                    }
                }

                /* Custom Table Scrollbar */
                .custom-table-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-table-scroll::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                }
                .custom-table-scroll::-webkit-scrollbar-thumb {
                    background: rgba(154, 205, 50, 0.3);
                    border-radius: 4px;
                }
                .custom-table-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(154, 205, 50, 0.6);
                }
            `}</style>
        </div>
    );
}
