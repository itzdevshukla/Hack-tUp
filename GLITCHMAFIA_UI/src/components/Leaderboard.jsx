import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCrown, FaChartLine, FaUserSecret, FaGlobe, FaTrophy } from 'react-icons/fa';
import './Dashboard.css';

const Leaderboard = () => {
    const { id } = useParams();
    const [leaders, setLeaders] = useState([]);
    const [currentUserStats, setCurrentUserStats] = useState(null);
    const [eventName, setEventName] = useState('Event Leaderboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // If no ID is present (e.g. global leaderboard route), handle potentially
                // For now assuming event context if id exists, or maybe global fetch if not?
                // The implementation plan focused on event leaderboard.
                const url = id ? `/api/event/${id}/leaderboard/` : '/api/leaderboard/'; // Fallback if we implemented global

                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch leaderboard');

                const data = await response.json();
                setLeaders(data.leaderboard || []);
                if (data.event_name) setEventName(data.event_name);
                if (data.current_user_stats) setCurrentUserStats(data.current_user_stats);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [id]);

    // Top 10 for Graph
    const graphData = useMemo(() => {
        return leaders.slice(0, 10);
    }, [leaders]);

    const maxScore = Math.max(...graphData.map(u => u.points), 2000);

    if (loading) return <div className="flex h-screen items-center justify-center text-green-500 font-mono">LOADING_DATA...</div>;

    return (
        <div className="dashboard-premium-container" style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '4rem' }}>
            <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>

                {/* Header */}
                <div className="premium-header">
                    <div>
                        <motion.h2
                            className="premium-title"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            {eventName} <span>Leaderboard</span>
                        </motion.h2>
                        <p className="premium-subtitle">Top operative tracking</p>
                    </div>
                </div>

                {/* --- 1. GRAPH SECTION --- */}
                <div className="glass-panel graph-panel" style={{ marginBottom: '3rem', padding: '1.5rem', height: 'auto', border: '1px solid rgba(255,255,255,0.08)', background: '#111' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#dedede', fontSize: '1.4rem', fontWeight: '400' }}>
                        Timeline for Top 10 Players
                    </h3>

                    {/* Legend */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                        {graphData.map((user) => (
                            <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#aaa', cursor: 'pointer' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: `1px solid ${user.color}` }}></div>
                                <span>{user.username}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ height: '450px', position: 'relative', paddingLeft: '3rem', paddingBottom: '2rem' }}>
                        {/* Interactive Tooltip */}
                        <AnimatePresence>
                            {hoveredPoint && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        position: 'absolute',
                                        // Smart Positioning Logic
                                        left: hoveredPoint.x,
                                        top: hoveredPoint.y, // Dynamic top based on point

                                        // Transforms based on Quadrant
                                        // If X > 60% -> Shift Left (-100%)
                                        // If Y > 50% -> Shift Up (-100%)
                                        transform: `translate(${parseFloat(hoveredPoint.x) > 60 ? '-100%' : '0'}, ${parseFloat(hoveredPoint.y) > 50 ? '-110%' : '10px'})`,

                                        // Margins for spacing
                                        marginLeft: parseFloat(hoveredPoint.x) > 60 ? '-15px' : '15px',
                                        marginTop: parseFloat(hoveredPoint.y) > 50 ? '0' : '0',

                                        background: 'rgba(10,10,10,0.95)',
                                        border: `1px solid ${hoveredPoint.color}`,
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        zIndex: 100, // Ensure high Z
                                        pointerEvents: 'none',
                                        minWidth: '200px',
                                        backdropFilter: 'blur(5px)',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
                                    }}
                                >
                                    <div style={{ color: hoveredPoint.color, fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.4rem', borderBottom: `1px solid ${hoveredPoint.color}30`, paddingBottom: '0.3rem' }}>
                                        {hoveredPoint.username}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '0.2rem' }}>
                                        <span style={{ color: '#777' }}>Challenge:</span> {hoveredPoint.flag}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#aaa', marginTop: '0.5rem' }}>
                                        <span>+{hoveredPoint.points} XP</span>
                                        <span>{hoveredPoint.time}</span>
                                    </div>
                                    <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold', marginTop: '0.5rem', textAlign: 'right' }}>
                                        Total: {hoveredPoint.score}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            {/* Grid Lines */}
                            {[...Array(6)].map((_, i) => (
                                <div key={i} style={{ position: 'absolute', left: 0, right: 0, bottom: `${i * 20}%`, height: '1px', background: 'rgba(255,255,255,0.05)' }}>
                                    <span style={{ position: 'absolute', left: '-40px', top: '-6px', fontSize: '0.75rem', color: '#666' }}>
                                        {Math.round((maxScore / 5) * i)}
                                    </span>
                                </div>
                            ))}

                            <svg viewBox="0 0 1000 450" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                {graphData.map((user, userIndex) => {
                                    // Use 430 as ground level to leave 20px padding at bottom
                                    const GROUND_Y = 430;
                                    const CHART_HEIGHT = 430;

                                    // Calculate Time-Based X-Axis
                                    // 1. Find global min/max time for the graph range
                                    // ideally passed from parent/backend, but we can compute from "graphData" (Top 10)
                                    // We need the earliest start and latest now across ALL displayed users to align them.
                                    // Actually, simpler: Start is usually 0 (Event Start). End is Now.
                                    // We already ensured every user has Start and Now points in backend.
                                    // So we can just take the first point of any user as Start, and last as End (assuming synchronized).
                                    // Robust way:
                                    const allPoints = graphData.flatMap(u => u.history);
                                    const times = allPoints.map(p => new Date(p.rawTime).getTime());
                                    const minTime = Math.min(...times);
                                    const maxTime = Math.max(...times);
                                    const timeRange = maxTime - minTime || 1; // Avoid divide by zero

                                    let d = `M0,${GROUND_Y} `;
                                    const points = user.history.map((h, i) => {
                                        // Time-based X
                                        const t = new Date(h.rawTime).getTime();
                                        const x = ((t - minTime) / timeRange) * 1000;

                                        const y = GROUND_Y - Math.min((h.total / maxScore) * CHART_HEIGHT, CHART_HEIGHT);
                                        return { x, y, ...h };
                                    });
                                    points.forEach(p => { d += `L${p.x},${p.y} `; });

                                    return (
                                        <g key={user.id}>
                                            <motion.path
                                                d={d}
                                                fill="none"
                                                stroke={user.color}
                                                strokeWidth={3} // Thicker line
                                                strokeOpacity={0.9}
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 1.5, delay: userIndex * 0.1 }}
                                            />
                                            {/* Render dots for visibility */}
                                            {points.map((p, i) => (
                                                <circle
                                                    key={i}
                                                    cx={p.x}
                                                    cy={p.y}
                                                    r={4}
                                                    fill="#000"
                                                    stroke={user.color}
                                                    strokeWidth={2}
                                                    style={{ cursor: 'pointer' }}
                                                    onMouseEnter={() => setHoveredPoint({
                                                        x: `${(p.x / 1000) * 100}%`,
                                                        y: `${(p.y / 450) * 100}%`,
                                                        username: user.username,
                                                        color: user.color,
                                                        score: p.total,
                                                        flag: p.flagName,
                                                        time: p.timestamp
                                                    })}
                                                    onMouseLeave={() => setHoveredPoint(null)}
                                                />
                                            ))}
                                            <filter id={`glow-${user.id}`}>
                                                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </g>
                                    );
                                })}
                            </svg>

                        </div>
                    </div>
                </div>

                {/* --- 2. PODIUM SECTION (Cards match reference) --- */}
                <div className="top3-container" style={{ marginBottom: '3rem' }}>
                    {/* Expanded to fill width: gap adjusted, maxWidth increased/removed */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', width: '100%' }}>
                        {leaders.slice(0, 3).map((user, index) => {
                            // Colors based on reference: #2 -> Orange, #1 -> Gold, #3 -> Reddish
                            const borderColors = { 0: '#FFD700', 1: '#FF8C00', 2: '#FF4500' };
                            const bgColors = { 0: '#FFD700', 1: '#FF8C00', 2: '#FF4500' };
                            const isActive = index === 0;

                            return (
                                <motion.div
                                    key={user.rank}
                                    className="glass-panel"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (index * 0.1) }}
                                    style={{
                                        padding: '0',
                                        border: '1px solid #222',
                                        borderLeft: `5px solid ${borderColors[index]}`,
                                        background: '#121212',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        minHeight: '180px',
                                        position: 'relative',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {/* Rank Tag (Top Left) */}
                                    <div style={{
                                        position: 'absolute', top: '15px', left: '0',
                                        background: bgColors[index], color: '#000',
                                        padding: '0.2rem 1rem', fontWeight: '900',
                                        fontFamily: 'arial', fontSize: '0.9rem',
                                        clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)'
                                    }}>
                                        #{user.rank}
                                    </div>

                                    {/* Crown for #1 (Optional, positioned middle top border if needed, but keeping subtle) */}
                                    {isActive && (
                                        <div style={{
                                            position: 'absolute', top: '-1px', left: '50%', transform: 'translate(-50%, -50%)',
                                            background: '#FFD700', padding: '0.4rem', borderRadius: '50%',
                                            width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            zIndex: 5, boxShadow: '0 0 10px #FFD700'
                                        }}>
                                            <FaCrown style={{ color: '#000', fontSize: '0.8rem' }} />
                                        </div>
                                    )}

                                    <div style={{ padding: '3.5rem 1.5rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.6rem', color: '#fff', margin: '0 0 0.5rem 0', fontWeight: 'bold', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                                                    {user.username.length > 10 ? user.username.substring(0, 8) + '..' : user.username}
                                                </h3>
                                                <div style={{ color: '#888', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                                    {user.points} / <span style={{ color: '#555' }}>Pts</span>
                                                </div>
                                            </div>

                                            {/* US Circle */}
                                            <div style={{
                                                width: '50px', height: '50px', borderRadius: '50%',
                                                background: '#2b3a42', color: '#ccc',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 'bold', fontSize: '0.9rem', border: '1px solid #444'
                                            }}>
                                                IN
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#aaa', fontFamily: 'monospace', marginTop: '1rem' }}>
                                            {user.flags} / {user.totalFlags} flags
                                        </div>
                                    </div>

                                    {/* Bottom highlight for #1 */}
                                    {isActive && <div style={{ height: '3px', width: '100%', background: '#FFD700', position: 'absolute', bottom: 0 }}></div>}
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* --- 3. BOTTOM GRID: LIST + SIDEBAR --- */}
                <div className="leaderboard-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>

                    {/* Left: Top Players List */}
                    <div className="main-col">
                        <h3 style={{ fontSize: '1.1rem', color: '#eee', marginBottom: '1rem', fontWeight: 'bold' }}>Top Players</h3>
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', background: '#111', border: '1px solid #222' }}>
                            <div style={{
                                display: 'grid', gridTemplateColumns: '0.5fr 2fr 1fr 1fr',
                                padding: '1rem 1.5rem', background: '#161616',
                                borderBottom: '1px solid #222',
                                color: '#666', fontWeight: 'bold', fontSize: '0.8rem'
                            }}>
                                <span>Rank</span>
                                <span>Team</span>
                                <span>Flags</span>
                                <span style={{ textAlign: 'right' }}>Points</span>
                            </div>

                            <div>
                                {leaders.slice(3).map((user, index) => (
                                    <motion.div
                                        key={user.id}
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        whileHover={{ backgroundColor: '#1a1a1a' }}
                                        style={{
                                            display: 'grid', gridTemplateColumns: '0.5fr 2fr 1fr 1fr',
                                            padding: '1rem 1.5rem', borderBottom: '1px solid #1a1a1a', alignItems: 'center',
                                            transition: 'all 0.2s',
                                            background: user.username === 'GhostAgent' ? '#162b16' : 'transparent',
                                            borderLeft: user.username === 'GhostAgent' ? '2px solid #39FF14' : '2px solid transparent'
                                        }}
                                    >
                                        <span style={{ color: '#555', fontWeight: 'bold', fontFamily: 'monospace' }}>#{user.rank}</span>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${user.color}30`, overflow: 'hidden' }}>
                                                <img src={user.avatar} alt="" style={{ width: '100%' }} />
                                            </div>
                                            <span style={{ color: user.username === 'GhostAgent' ? '#39FF14' : '#ccc', fontWeight: '500' }}>
                                                {user.username}
                                            </span>
                                        </div>

                                        <span style={{ fontSize: '0.85rem', color: '#888', fontFamily: 'monospace' }}>{user.flags}</span>

                                        <span style={{ textAlign: 'right', color: user.color, fontWeight: 'bold', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                                            {user.points.toLocaleString()}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Sidebar (Updated to match Image 2) */}
                    <div className="sidebar-col">
                        {currentUserStats ? (
                            <div className="glass-panel" style={{
                                padding: '1.5rem',
                                position: 'sticky', top: '120px', // Added offset for navbar
                                background: '#111',
                                border: '1px solid #222',
                                borderLeft: '4px solid #39FF14' // Green left border
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #222' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1px solid #39FF14', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        <img src={currentUserStats.avatar} alt="User" style={{ width: '100%' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ color: '#fff', margin: 0, fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{currentUserStats.username.toUpperCase()}</h3>
                                        <span style={{ color: '#39FF14', fontSize: '0.9rem', fontWeight: 'bold' }}>#{currentUserStats.rank} • Hack!t</span>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.95rem', color: '#aaa', borderBottom: '1px solid #1a1a1a', paddingBottom: '0.5rem' }}>
                                        <span>My Points</span>
                                        <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{currentUserStats.points.toLocaleString()} XP</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.95rem', color: '#aaa', borderBottom: '1px solid #1a1a1a', paddingBottom: '0.5rem' }}>
                                        <span>Solved / Total</span>
                                        <span style={{ color: '#fff', fontFamily: 'monospace' }}>{currentUserStats.flags} / {currentUserStats.totalFlags}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#aaa' }}>
                                        <span>Current Rank</span>
                                        <span style={{ color: '#39FF14', fontFamily: 'monospace', fontWeight: 'bold' }}>#{currentUserStats.rank}</span>
                                    </div>
                                </div>

                                <h4 style={{ color: '#666', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Recent Activity</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Placeholder Recent Activity - could also be fetched from backend if we want precise history */}
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Waiting for incoming transmission...</div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel" style={{ padding: '1.5rem', background: '#111' }}>
                                <div style={{ color: '#666' }}>Log in to view your stats.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};

export default Leaderboard;
