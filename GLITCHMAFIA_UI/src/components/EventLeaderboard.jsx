import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
        // Sort by value descending
        const sorted = [...payload].sort((a, b) => b.value - a.value);
        
        // Find if anyone solved something at this exact tick
        const events = payload
            .filter(pld => pld.payload[`${pld.dataKey}_isEvent`]);

        return (
            <div style={{
                background: 'rgba(5, 8, 5, 0.85)',
                border: '1px solid rgba(154, 205, 50, 0.3)',
                padding: '12px 18px',
                borderRadius: '8px',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                minWidth: '240px',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '10px', 
                    borderBottom: '1px solid rgba(154,205,50,0.15)',
                    paddingBottom: '8px'
                }}>
                    <span style={{ color: '#9ACD32', fontSize: '0.65rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '2px' }}>
                        TIMELINE SNAPSHOT
                    </span>
                    <span style={{ color: '#fff', fontSize: '0.7rem', opacity: 0.6 }}>
                        {label}
                    </span>
                </div>

                {/* HIGHLIGHT SOLVES */}
                {events.length > 0 && (
                    <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {events.map((ev, i) => (
                            <div key={i} style={{ 
                                background: 'rgba(154, 205, 50, 0.1)', 
                                padding: '6px 10px', 
                                borderRadius: '4px',
                                borderLeft: `3px solid ${ev.color}`
                            }}>
                                <div style={{ fontSize: '0.55rem', color: ev.color, fontWeight: 900, textTransform: 'uppercase' }}>
                                    {ev.name} SOLVED
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
                                    {ev.payload[`${ev.dataKey}_eventDetails`]?.flagName || 'Challenge'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sorted.slice(0, 5).map((pld, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: pld.color, boxShadow: `0 0 8px ${pld.color}` }} />
                                <span style={{ fontSize: '0.8rem', color: '#ccc' }}>{pld.name}</span>
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', fontFamily: 'Orbitron, sans-serif' }}>{pld.value}</span>
                        </div>
                    ))}
                    {sorted.length > 5 && (
                        <div style={{ fontSize: '0.6rem', color: '#555', textAlign: 'center', marginTop: '4px' }}>
                            + {sorted.length - 5} OTHERS
                        </div>
                    )}
                </div>
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
                        <Tooltip 
                            content={<CustomTooltip />} 
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} 
                            shared={true} 
                        />
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
                                    isAnimationActive={true}
                                    animationDuration={1500}
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
    const { user } = useAuth();
    const [board, setBoard] = useState([]);
    const [eventName, setEventName] = useState('');
    const [isTeamMode, setIsTeamMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [myStanding, setMyStanding] = useState(null);
    const [isMultiTab, setIsMultiTab] = useState(false);

    const debounceRef = useRef(null);
    // useOutletContext can be null when opened in a new tab (presentation mode)
    let outletCtx = null;
    try { outletCtx = useOutletContext(); } catch { outletCtx = null; }
    const lastWsEvent = outletCtx?.lastWsEvent;


    const fetchHistory = useCallback(async (currentBoard) => {
        if (!currentBoard || currentBoard.length === 0) return currentBoard;
        try {
            const res = await fetch(`/api/event/${id}/leaderboard/history/?top=10`);
            if (!res.ok) return currentBoard;
            const json = await res.json();
            // json.histories = [{id, name, history: [...]}]
            const histMap = {};
            (json.histories || []).forEach(h => { histMap[h.id] = h.history; });
            return currentBoard.map(p => histMap[p.id] ? { ...p, history: histMap[p.id] } : p);
        } catch {
            return currentBoard;
        }
    }, [id]);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(`/api/event/${id}/leaderboard/`);
            if (res.ok) {
                const json = await res.json();
                const lb = json.leaderboard || [];
                const lbWithHistory = await fetchHistory(lb);
                setBoard(lbWithHistory);
                setEventName(json.event || '');
                setIsTeamMode(json.is_team_mode || false);
                setMyStanding(json.my_standing || null);
                setLastUpdated(new Date());
            }
        } catch { }
        finally { if (!silent) setLoading(false); }
    }, [id, fetchHistory]);

    useEffect(() => {
        // --- SINGLE TAB DETECTION ---
        const channel = new BroadcastChannel(`lb_sync_${id}`);
        
        const handlePing = (e) => {
            if (e.data === 'ping') {
                channel.postMessage('pong');
            } else if (e.data === 'pong') {
                setIsMultiTab(true);
            }
        };

        channel.onmessage = handlePing;
        channel.postMessage('ping');

        fetchData();
        return () => { 
            if (debounceRef.current) clearTimeout(debounceRef.current);
            channel.close();
        };
    }, [fetchData, id]);

    useEffect(() => {
        if (!lastWsEvent) return;

        const d = lastWsEvent.data;
        const isUpdate = lastWsEvent.type === 'leaderboard_update' || (lastWsEvent.type === 'new_submission' && d?.is_correct);

        if (!isUpdate) return;

        if (d?.leaderboard?.length > 0) {
            // Smooth Update: If WS payload already contains top_history, use it directly.
            // This prevents a second fetch and makes the update flicker-free.
            if (d.top_history) {
                const histMap = {};
                d.top_history.forEach(h => { histMap[h.id] = h.history; });
                const lbWithHistory = d.leaderboard.map(p => histMap[p.id] ? { ...p, history: histMap[p.id] } : p);
                setBoard(lbWithHistory);
                if (d.event) setEventName(d.event);
                if (d.is_team_mode !== undefined) setIsTeamMode(d.is_team_mode);
                if (d.my_standing) setMyStanding(d.my_standing);
                setLastUpdated(new Date());
            } else {
                // Fallback to fetch if not present
                fetchHistory(d.leaderboard).then(lbWithHistory => {
                    setBoard(lbWithHistory);
                    if (d.event) setEventName(d.event);
                    if (d.is_team_mode !== undefined) setIsTeamMode(d.is_team_mode);
                    if (d.my_standing) setMyStanding(d.my_standing);
                    setLastUpdated(new Date());
                });
            }
        } else {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => fetchData(true), 1500);
        }
    }, [lastWsEvent, fetchData, fetchHistory]);

    // Only show solvers
    const activeBoard = board.filter(p => (p.flags || 0) > 0);

    return (
        <div style={{ minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#fff', position: 'relative', overflow: 'hidden' }}>
            {/* MULTI-TAB WARNING OVERLAY */}
            <AnimatePresence>
                {isMultiTab && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9999,
                            background: 'rgba(5, 0, 0, 0.98)',
                            backdropFilter: 'blur(20px)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '2rem'
                        }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{ 
                                width: '100px', 
                                height: '100px', 
                                borderRadius: '50%', 
                                background: 'rgba(255, 76, 76, 0.1)', 
                                border: '2px solid #ff4c4c',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '2rem',
                                boxShadow: '0 0 30px rgba(255, 76, 76, 0.4)'
                            }}
                        >
                            <FaExclamationTriangle style={{ color: '#ff4c4c', fontSize: '3rem' }} />
                        </motion.div>
                        <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: '#ff4c4c', letterSpacing: '4px', marginBottom: '1rem', fontSize: '1.8rem', textTransform: 'uppercase' }}>
                            Security Protocol Violation
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '500px', lineHeight: '1.6', fontSize: '1rem' }}>
                            Multiple active sessions detected for this leaderboard. To ensure system stability and real-time synchronization, only one instance is permitted per user.
                        </p>
                        <div style={{ marginTop: '2.5rem', color: '#ff4c4c', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                            Please close this tab or the other active instance.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(1.2rem, 3vw, 2.5rem)', maxWidth: '1400px', margin: '0 auto', paddingBottom: '4rem' }}>

                {/* ──────── HEADER ──────── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    style={{ 
                        marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}>

                    <div style={{ flex: '1 1 300px' }}>
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
                            <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginTop: '4px', fontFamily: 'Orbitron, sans-serif', letterSpacing: '2px' }}>
                                {eventName || 'Active Event'}
                            </span>
                        </h1>
                    </div>

                    {/* PERSONAL STANDING CARD */}
                    {myStanding && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                background: 'rgba(154,205,50,0.08)',
                                border: '1px solid rgba(154,205,50,0.2)',
                                borderRadius: '16px',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                flex: '0 1 auto'
                            }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6rem', color: 'rgba(154,205,50,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px', fontFamily: 'Orbitron, sans-serif' }}>Your Rank</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#9ACD32', fontFamily: 'Orbitron, sans-serif' }}>#{myStanding.rank}</div>
                            </div>
                            <div style={{ width: '1px', height: '30px', background: 'rgba(154,205,50,0.2)' }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px', fontFamily: 'Orbitron, sans-serif' }}>Your Score</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', fontFamily: 'Orbitron, sans-serif' }}>{myStanding.points}</div>
                            </div>
                        </motion.div>
                    )}
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
                                        activeBoard.slice(0, 100).map((player, idx) => {
                                            const rank = idx + 1;
                                            
                                            // Dynamic "isMe" detection (works with cached data)
                                            const isMe = isTeamMode 
                                                ? (player.members && user?.username && player.members.includes(user.username))
                                                : (player.username === user?.username);

                                            const name = isTeamMode ? player.name : player.username;
                                            const top1 = rank === 1;
                                            const top3 = rank <= 3;
                                            const isTop10 = rank <= 10;
                                            const m_col = CHART_COLORS[(rank-1) % CHART_COLORS.length];
                                            const m = rank <= 3 ? { col: m_col, shadow: rank===1?'57,255,20':rank===2?'96,165,250':'167,139,250', icon: rank===1?<FaCrown/>:<FaMedal/> } : null;

                                            return (
                                                <motion.div
                                                    key={player.id || name || idx}
                                                    initial={isTop10 ? { opacity: 0, x: -10 } : { opacity: 1 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={isTop10 ? { delay: idx * 0.05 } : { duration: 0 }}
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
