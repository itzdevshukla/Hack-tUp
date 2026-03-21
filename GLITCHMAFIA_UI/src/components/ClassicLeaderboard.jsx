import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock } from 'react-icons/fa';
import bgImage from '../assets/ben10_bg_new.jpg';

/* ── helpers ──────────────────────────────────────────────────── */
function formatTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    });
}

/* ── Background ─────────────────────────────────────── */
function BenTenBackground() {
    return (
        <img
            src={bgImage}
            alt="Ben 10 Background"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                objectFit: 'cover',
                zIndex: 0,
                opacity: 0.2, // Increased opacity since it might be too dark against black
                pointerEvents: 'none'
            }}
        />
    );
}

export default function ClassicLeaderboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [board, setBoard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTeamMode, setIsTeamMode] = useState(false);
    const [eventName, setEventName] = useState('');

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(`/api/event/${id}/leaderboard/`);
            if (res.ok) {
                const json = await res.json();
                setBoard(json.leaderboard || []);
                setEventName(json.event || '');
                setIsTeamMode(json.is_team_mode || false);
            }
        } catch { }
        finally { if (!silent) setLoading(false); }
    }, [id]);

    useEffect(() => {
        fetchData();

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Connect to Django Channels WebSocket
        const wsUrl = `${protocol}//${window.location.host}/ws/updates/`;
        let ws = new WebSocket(wsUrl);

        ws.onmessage = (e) => {
            try {
                const message = JSON.parse(e.data);
                if (message.type === 'leaderboard_update') {
                    // Refetch data immediately when someone solves a challenge
                    fetchData(true);
                }
            } catch (err) {
                console.error("WebSocket message error:", err);
            }
        };

        ws.onclose = () => {
            console.log('Leaderboard WebSocket closed.');
        };

        return () => {
            if (ws) ws.close();
        };
    }, [fetchData]);

    return (
        <div style={{ minHeight: '100vh', background: '#050505', fontFamily: "'Inter', sans-serif", color: '#fff', padding: '2rem', position: 'relative' }}>
            <BenTenBackground />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', maxWidth: '1400px', margin: '0 auto 2.5rem auto' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#9ACD32', letterSpacing: '1px', textShadow: '0 0 20px rgba(154,205,50,0.5)' }}>{eventName}</h1>
                        <div style={{ color: '#9ACD32', fontSize: '0.9rem', marginTop: '5px', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.8 }}>
                            {isTeamMode ? 'Team Leaderboard' : 'Classic Leaderboard'}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#9ACD32', fontFamily: 'monospace' }}>
                        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                            LOADING_LEADERBOARD...
                        </motion.div>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '24px',
                        maxWidth: '1400px',
                        margin: '0 auto'
                    }}>
                        <AnimatePresence>
                            {board.map((player, idx) => {
                                const rank = idx + 1;
                                const name = isTeamMode ? player.name : player.username;
                                const isMe = player.is_me || player.is_my_team;
                                const isTop3 = rank <= 3;

                                // Calculate first solve time
                                let firstSolve = null;
                                if (player.history && player.history.length > 2) {
                                    firstSolve = player.history[1].rawTime;
                                }

                                // Premium dark glassmorphism for Top 3, without green backgrounds
                                const cardBg = isTop3
                                    ? `linear-gradient(135deg, rgba(20,20,22,0.85) 0%, rgba(10,10,12,0.95) 100%)`
                                    : 'rgba(12, 12, 14, 0.85)';

                                const cardBorder = isTop3
                                    ? `1px solid rgba(${rank === 1 ? '57,255,20' : rank === 2 ? '154,205,50' : '46,139,87'}, 0.4)`
                                    : '1px solid rgba(255, 255, 255, 0.05)';

                                const cardShadow = isTop3
                                    ? `0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(${rank === 1 ? '57,255,20' : rank === 2 ? '154,205,50' : '46,139,87'}, 0.15)`
                                    : '0 8px 32px rgba(0,0,0,0.6)';

                                return (
                                    <motion.div
                                        key={player.id || idx}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(idx * 0.04, 0.6) }}
                                        style={{
                                            background: cardBg,
                                            border: cardBorder,
                                            borderRadius: '16px', // Slightly rounder for premium feel
                                            padding: '28px', // Slightly more padding
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            boxShadow: cardShadow,
                                            backdropFilter: 'blur(12px)',
                                            WebkitBackdropFilter: 'blur(12px)', // Safari support
                                            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                                        }}
                                        whileHover={{ y: -5, boxShadow: isTop3 ? `0 12px 40px rgba(0,0,0,0.9), 0 0 30px rgba(${rank === 1 ? '57,255,20' : rank === 2 ? '154,205,50' : '46,139,87'}, 0.25)` : '0 12px 40px rgba(0,0,0,0.8), 0 0 15px rgba(255,255,255,0.05)' }}
                                    >
                                        {/* Stationary 3D Grid/Hexagon Background Texture */}
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            zIndex: 0,
                                            opacity: 0.15, // Subtle texture
                                            backgroundSize: '20px 20px',
                                            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
                                            transform: 'perspective(500px) rotateX(20deg) scale(1.1)', // Gives it a static 3D floor/wall look
                                            transformOrigin: 'bottom',
                                            pointerEvents: 'none'
                                        }} />

                                        {/* Wraps content to sit above the 3D background */}
                                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            {/* Top Section: Rank + Name and Points */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{
                                                        background: isTop3 ? `rgba(${rank === 1 ? '57,255,20' : rank === 2 ? '154,205,50' : '46,139,87'}, 0.1)` : 'rgba(255,255,255,0.05)',
                                                        color: isTop3 ? (rank === 1 ? '#39FF14' : '#9ACD32') : '#a0a0a5',
                                                        padding: '6px 10px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 900,
                                                        border: isTop3 ? `1px solid rgba(${rank === 1 ? '57,255,20' : rank === 2 ? '154,205,50' : '46,139,87'}, 0.3)` : '1px solid rgba(255,255,255,0.1)',
                                                        boxShadow: isTop3 ? `0 0 15px rgba(${rank === 1 ? '57,255,20' : '154,205,50'}, 0.2)` : 'none'
                                                    }}>
                                                        #{rank}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '1.25rem',
                                                        fontWeight: isTop3 ? 800 : 600,
                                                        color: isTop3 ? '#fff' : (isMe ? '#9ACD32' : '#e5e5ea'),
                                                        letterSpacing: '0.5px',
                                                        textShadow: isTop3 ? '0 0 10px rgba(255,255,255,0.3)' : 'none'
                                                    }}>
                                                        {name}
                                                    </span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '1.7rem', fontWeight: 800, color: isTop3 ? (rank === 1 ? '#39FF14' : '#9ACD32') : '#9ACD32', lineHeight: '1', textShadow: isTop3 ? `0 0 15px rgba(${rank === 1 ? '57,255,20' : '154,205,50'}, 0.5)` : 'none' }}>
                                                        {player.points}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: isTop3 ? '#a0a0a0' : '#8e8e93', marginTop: '6px' }}>
                                                        points
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Middle Section: Timestamps */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isTop3 ? '#999' : '#636366', fontSize: '0.85rem' }}>
                                                    <FaClock style={{ fontSize: '0.75rem', color: isTop3 ? '#9ACD32' : 'inherit' }} />
                                                    <span>First: {formatTime(firstSolve)}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isTop3 ? '#999' : '#636366', fontSize: '0.85rem' }}>
                                                    <FaClock style={{ fontSize: '0.75rem', color: isTop3 ? '#9ACD32' : 'inherit' }} />
                                                    <span>Last: {formatTime(player.last_solve_time)}</span>
                                                </div>
                                            </div>

                                            {/* Bottom Progress Indicator */}
                                            <div style={{ height: isTop3 ? '8px' : '6px', background: '#1c1c1e', borderRadius: '4px', overflow: 'hidden', boxShadow: isTop3 ? 'inset 0 0 5px #000' : 'none' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.max(player.progress || 0, 5)}%`,
                                                    background: isTop3 ? (rank === 1 ? '#39FF14' : '#9ACD32') : '#9ACD32',
                                                    borderRadius: '4px',
                                                    boxShadow: isTop3 ? `0 0 15px rgba(${rank === 1 ? '57,255,20' : '154,205,50'}, 0.8)` : '0 0 10px rgba(154, 205, 50, 0.4)'
                                                }} />
                                            </div>

                                            {/* Subtle Top-Right accent line (like in image) */}
                                            <div style={{ position: 'absolute', top: '-28px', right: '-8px', width: '40px', height: isTop3 ? '3px' : '2px', background: isTop3 ? (rank === 1 ? '#39FF14' : '#9ACD32') : '#9ACD32', opacity: isTop3 ? 0.8 : 0.5, boxShadow: isTop3 ? `0 0 10px rgba(${rank === 1 ? '57,255,20' : '154,205,50'}, 0.8)` : 'none' }} />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* Floating Back Button */}
                <button
                    onClick={() => navigate(`/event/${id}/challenges`)}
                    style={{
                        position: 'fixed',
                        bottom: '40px',
                        right: '40px',
                        background: '#9ACD32',
                        color: '#000',
                        border: 'none',
                        padding: '14px 28px',
                        borderRadius: '30px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(154, 205, 50, 0.3)',
                        transition: 'all 0.2s',
                        zIndex: 100
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.background = '#8ac722';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(154, 205, 50, 0.6)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = '#9ACD32';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(154, 205, 50, 0.3)';
                    }}
                >
                    Back to Challenges
                </button>

                {board.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#8e8e93' }}>
                        No submissions yet. Be the first!
                    </div>
                )}
            </div>
        </div>
    );
}
