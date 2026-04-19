import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaClock, FaTrophy, FaMedal, FaFlag, FaUsers, FaUser, FaCrown, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

/* ─────────────────────────────────────────────────────────────────
   ERROR BOUNDARY
───────────────────────────────────────────────────────────────── */
class ChartErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Recharts Engine Faulted:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ff4c4c' }}>
                    <FaExclamationTriangle style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.6 }} />
                    <p style={{ margin: 0, fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px' }}>Timeline Vis Offline</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', opacity: 0.6 }}>A rendering fault occurred. Waiting for next update...</p>
                </div>
            );
        }
        return this.props.children;
    }
}

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


/* ─────────────────────────────────────────────────────────────────
   TIMELINE GRAPH — Top 10 Graphical Layout
───────────────────────────────────────────────────────────────── */
const CHART_COLORS = [
    '#39FF14', // Neon Green
    '#60A5FA', // Blue
    '#A78BFA', // Purple
    '#F472B6', // Pink
    '#FBBF24', // Yellow
    '#34D399', // Emerald
    '#F87171', // Red
    '#38BDF8', // Sky
    '#FB923C', // Orange
    '#A3E635'  // Lime
];

function CustomTooltip({ active, payload, label }) {
    if (active && payload && payload.length) {
        // Filter out everyone except the ACTUAL person who had an event/solve exactly at this tick!
        const isolatedPayload = payload.filter(pld => pld.payload[`${pld.dataKey}_isEvent`]);
        // Fast fallback if someone hovers obscurely and no exact match is found
        const renderPayload = isolatedPayload.length > 0 ? isolatedPayload : payload;

        // Sort highest point on top
        const sorted = [...renderPayload].sort((a, b) => b.value - a.value);
        return (
            <div style={{
                background: 'rgba(5, 5, 5, 0.85)',
                border: '1px solid rgba(154, 205, 50, 0.25)',
                padding: '12px 18px',
                borderRadius: '12px',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.9), inset 0 0 20px rgba(154, 205, 50, 0.05)',
                minWidth: '220px',
                color: '#fff'
            }}>
                <div style={{ margin: '0 0 12px 0', color: '#9ACD32', fontSize: '0.75rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '2px', borderBottom: '1px solid rgba(154,205,50,0.15)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaClock style={{ fontSize: '0.7rem' }} />
                    {payload[0]?.payload?.rawTime ? payload[0].payload.rawTime.replace('T', ' ').substring(0, 19) : label}
                </div>
                {sorted.map((pld, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: pld.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: pld.color, display: 'inline-block', boxShadow: `0 0 10px ${pld.color}` }} />
                            {pld.name}
                        </span>
                        <span style={{ color: pld.color, fontWeight: 900, fontFamily: 'Orbitron, sans-serif', textShadow: `0 0 10px ${pld.color}66` }}>
                            {pld.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

function TimelineGraph({ board, isTeamMode }) {
    const colorMapRef = useRef({});
    const colorIndexRef = useRef(0);

    if (board.length === 0) {
        return (
            <div style={{ height: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#2a3a2a' }}>
                <FaTrophy style={{ fontSize: '3rem', opacity: 0.12 }} />
                <p style={{ margin: 0, fontSize: '0.82rem', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif' }}>No participants yet</p>
            </div>
        );
    }

    const top10 = board.slice(0, 10);
    
    // Assign stable locked colors to players so their lines don't swap dynamically when overtaking
    top10.forEach(player => {
        if (!colorMapRef.current[player.id]) {
            colorMapRef.current[player.id] = CHART_COLORS[colorIndexRef.current % CHART_COLORS.length];
            colorIndexRef.current += 1;
        }
    });
    
    let chartData = [];
    let customTop10 = top10;
    try {
        // 1. Rebuild sanitized chronological history per player
        const sanitizedTimelines = {};
        const nowIso = new Date().toISOString();

        top10.forEach(p => {
            sanitizedTimelines[p.id] = [];
            if (!p.history || !Array.isArray(p.history)) return;
            
            // Filter out dummy backend 'start' and 'now' to prevent temporal paradoxes!
            const solvesOnly = p.history.filter(h => h?.id !== 'start' && h?.id !== 'now');
            solvesOnly.sort((a,b) => new Date(a.rawTime).getTime() - new Date(b.rawTime).getTime());
            
            let runningTotal = 0;
            solvesOnly.forEach(h => {
                runningTotal += h.points || 0;
                h.total = runningTotal;
            });

            const nowEvent = { rawTime: nowIso, id: 'now', total: runningTotal, points: 0 };
            sanitizedTimelines[p.id] = [...solvesOnly, nowEvent];
        });

        // 2. Establish universal Start Baseline across all players (30 mins before first solve)
        let globalStart = Date.now();
        top10.forEach(p => {
            const solves = sanitizedTimelines[p.id].filter(h => h.id !== 'now');
            if (solves.length > 0) {
                const firstT = new Date(solves[0].rawTime).getTime();
                if (!isNaN(firstT) && firstT < globalStart) globalStart = firstT;
            }
        });
        const startIso = new Date(globalStart - 30 * 60000).toISOString();

        top10.forEach(p => {
            if (sanitizedTimelines[p.id]) {
                sanitizedTimelines[p.id].unshift({ rawTime: startIso, id: 'start', total: 0, points: 0 });
            }
        });

        // 3. Collect all unique valid times
        const timeSet = new Set();
        top10.forEach(p => {
            if (sanitizedTimelines[p.id]) {
                sanitizedTimelines[p.id].forEach(h => { if(h.rawTime) timeSet.add(h.rawTime) });
            }
        });
        const sortedTimes = Array.from(timeSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        // 4. Build chart array with pure carry-forward step
        const currentScores = {};
        chartData = sortedTimes.map(timeStr => {
            const point = { 
                rawTime: timeStr, 
                timeLabel: new Date(timeStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) 
            };
            
            top10.forEach(p => {
                const hList = sanitizedTimelines[p.id] || [];
                const eventAtTime = hList.find(h => h.rawTime === timeStr);
                if (eventAtTime) {
                    currentScores[p.id] = eventAtTime.total;
                    point[`${p.id}_isEvent`] = true;
                    point[`${p.id}_eventDetails`] = eventAtTime;
                }
                point[p.id] = currentScores[p.id] !== undefined ? currentScores[p.id] : 0; 
            });
            
            return point;
        });
    } catch (parseError) {
        console.error("Timeline Rendering Fault Escaped:", parseError);
        chartData = []; // degrade gracefully
    }

    const renderCustomDot = (props) => {
        const { cx, cy, payload, dataKey, lineFill } = props;
        if (isNaN(cx) || isNaN(cy) || cx === undefined || cy === undefined) return null;
        
        // Only draw dot if this EXACT tick was an actual solve for this player
        if (payload[`${dataKey}_isEvent`] && payload[`${dataKey}_eventDetails`]?.id !== 'start' && payload[`${dataKey}_eventDetails`]?.id !== 'now') {
            return <circle key={`${dataKey}-${payload.rawTime || cx}`} cx={cx} cy={cy} r={4} fill={lineFill} strokeWidth={0} style={{ filter: `drop-shadow(0 0 6px ${lineFill})` }} />;
        }
        return null;
    };

    const renderActiveHoverDot = (props) => {
        const { cx, cy, payload, dataKey, lineFill } = props;
        if (isNaN(cx) || isNaN(cy) || cx === undefined || cy === undefined) return null;
        
        if (payload[`${dataKey}_isEvent`]) {
            return <circle key={`active-${dataKey}-${cx}`} cx={cx} cy={cy} r={7} fill={lineFill} stroke="#050505" strokeWidth={2} style={{ filter: `drop-shadow(0 0 10px ${lineFill})` }} />;
        }
        return null;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '420px', flex: 1, padding: '10px 0 0 0' }}>
            <div style={{ width: '100%', paddingBottom: '20px' }}>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis 
                            dataKey="timeLabel" 
                            stroke="rgba(255,255,255,0.4)" 
                            fontSize={11} 
                            tickMargin={12} 
                            tick={{ fill: 'rgba(255,255,255,0.5)' }}
                            minTickGap={30}
                        />
                        <YAxis 
                            stroke="rgba(255,255,255,0.4)" 
                            fontSize={11} 
                            tickMargin={12}
                            tick={{ fill: 'rgba(255,255,255,0.5)' }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} shared={false} />
                        <Legend 
                            wrapperStyle={{ fontSize: '12px', paddingTop: '15px', color: '#ccc', fontFamily: 'Orbitron, sans-serif' }}
                            iconType="circle"
                        />
                        {top10.map((player) => {
                            const name = isTeamMode ? player.name : player.username;
                            const color = colorMapRef.current[player.id];
                            return (
                                <Line 
                                    key={player.id}
                                    type="monotone"
                                    name={name}
                                    dataKey={player.id}
                                    stroke={color}
                                    strokeWidth={3}
                                    dot={(props) => renderCustomDot({ ...props, lineFill: color })}
                                    activeDot={(props) => renderActiveHoverDot({ ...props, lineFill: color })}
                                    isAnimationActive={false}
                                />
                            );
                        })}
                    </LineChart>
                </ResponsiveContainer>
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
    // useOutletContext can be null when opened in a new tab (presentation mode)
    let outletCtx = null;
    try { outletCtx = useOutletContext(); } catch { outletCtx = null; }
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
            {/* Background is now provided by EventArenaLayout */}

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
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'clamp(1.5rem, 3vw, 2.5rem)',
                        alignItems: 'stretch',
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
                                            const m_col = CHART_COLORS[(rank-1) % CHART_COLORS.length];
                                            const m = rank <= 3 ? { col: m_col, shadow: rank===1?'57,255,20':rank===2?'96,165,250':'167,139,250', icon: rank===1?<FaCrown/>:<FaMedal/> } : null;

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

                        {/* ── TOP: Graphical Timeline ── */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '2rem' }}>
                                <FaChartLine style={{ color: '#9ACD32', fontSize: '1.2rem', filter: 'drop-shadow(0 0 10px #9ACD32)' }} />
                                <span style={{ fontSize: '1rem', color: '#fff', letterSpacing: '4px', textTransform: 'uppercase', fontFamily: 'Orbitron, sans-serif', fontWeight: 800 }}>Top 10 Timeline</span>
                            </div>

                            <div style={{ flex: 1, position: 'relative' }}>
                                <ChartErrorBoundary>
                                    <TimelineGraph board={activeBoard} isTeamMode={isTeamMode} />
                                </ChartErrorBoundary>
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
                    /* Stacks vertically */
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
