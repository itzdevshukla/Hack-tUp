import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaHeartbeat } from 'react-icons/fa';
import { FaCalendarDay, FaBolt, FaArrowTrendUp } from 'react-icons/fa6';

const ActivityHeatmap = () => {
    const [heatmapData, setHeatmapData] = useState({});
    const [metrics, setMetrics] = useState({
        total_activity: 0,
        active_days: 0,
        avg_daily: 0,
        current_streak: 0,
        max_streak: 0
    });
    const [loading, setLoading] = useState(true);
    const [tooltipContent, setTooltipContent] = useState('');
    const [hoveredCell, setHoveredCell] = useState(null);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await fetch('/api/dashboard/activity-heatmap/');
                const data = await res.json();
                setHeatmapData(data.heatmap || {});
                setMetrics(data.metrics || {});
                setLoading(false);
            } catch (err) {
                console.error("Failed to load activity heatmap", err);
                setLoading(false);
            }
        };
        fetchActivity();
    }, []);

    // Helper to generate the last 365 days
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            dates.push(d);
        }
        return dates;
    };

    const dates = generateDates();

    // Group dates into columns of 7 (weeks)
    const weeks = [];
    let currentWeek = [];

    // Pad the first week to align the start day correctly if needed
    // Assuming Sunday = 0, Monday = 1
    const firstDayOfWeek = dates[0].getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
        currentWeek.push(null); // Empty cells before the 365 days start
    }

    dates.forEach(date => {
        currentWeek.push(date);
        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) {
        // Pad the last week
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }

    // Determine color intensity
    const getColor = (count) => {
        if (!count || count === 0) return 'rgba(255, 255, 255, 0.05)'; // Empty
        if (count === 1) return '#4d6619'; // Lightest Green
        if (count >= 2 && count <= 3) return '#739926'; // Medium Green
        if (count >= 4 && count <= 5) return '#9ACD32'; // Base YellowGreen
        return '#c2ff3d'; // Brightest Neon Green
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ACD32', fontFamily: "'Share Tech Mono', monospace" }}>
                <FaHeartbeat className="pulse" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                <div>COMPILING MISSION LOGS...</div>
            </div>
        );
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Compute month label positions based on the weeks array
    const monthLabels = [];
    let currentMonth = -1;
    weeks.forEach((week, index) => {
        const firstValidDay = week.find(d => d !== null);
        if (firstValidDay) {
            const month = firstValidDay.getMonth();
            if (month !== currentMonth) {
                // Ensure labels aren't clustered too close to the end
                if (index < weeks.length - 2) {
                    monthLabels.push({ month: months[month], index });
                }
                currentMonth = month;
            }
        }
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* HEATMAP PANEL */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'rgba(10, 10, 10, 0.8)',
                    border: '1px solid rgba(154, 205, 50, 0.2)',
                    borderRadius: '16px',
                    padding: 'clamp(1rem, 2.5vw, 2rem)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background Watermark/Glitch Graphic representation */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '15rem',
                    fontWeight: '900',
                    color: 'rgba(154, 205, 50, 0.02)',
                    zIndex: 0,
                    pointerEvents: 'none',
                    letterSpacing: '-10px',
                    fontFamily: "'Share Tech Mono', monospace"
                }}>
                    LOGS
                </div>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(1rem, 2vw, 2rem)', zIndex: 1, position: 'relative', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', color: '#fff' }}>
                        <div style={{ background: 'rgba(154, 205, 50, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(154, 205, 50, 0.3)' }}>
                            <FaHeartbeat style={{ color: '#9ACD32' }} />
                        </div>
                        Activity Overview
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '8px 15px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: '#888',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            Hover over a sector for details
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#888' }}>
                            Less
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(255, 255, 255, 0.05)' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#4d6619' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#739926' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#9ACD32' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#c2ff3d' }} />
                            </div>
                            More
                        </div>
                    </div>
                </div>

                {/* Heatmap Grid Area */}
                <div style={{ zIndex: 1, position: 'relative', overflowX: 'auto', paddingBottom: '10px' }}>

                    {/* Month Labels */}
                    <div style={{ display: 'flex', marginLeft: '30px', marginBottom: '10px', position: 'relative', height: '20px' }}>
                        {monthLabels.map((ml, i) => (
                            <div key={i} style={{
                                position: 'absolute',
                                left: `${ml.index * 16}px`, // 12px width + 4px gap = 16px per col
                                fontSize: '0.75rem',
                                color: '#888'
                            }}>
                                {ml.month}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Day Labels (Sun, Mon, Tue...) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '2px' }}>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                <div key={i} style={{ height: '12px', fontSize: '0.65rem', color: '#666', lineHeight: '12px' }}>
                                    {i % 2 !== 0 ? day : ''} {/* Only show Mon, Wed, Fri as is standard */}
                                </div>
                            ))}
                        </div>

                        {/* The Grid */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {week.map((date, dayIndex) => {
                                        if (!date) {
                                            return <div key={dayIndex} style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'transparent' }} />;
                                        }

                                        // Ensure local timezone formatting doesn't shift the day
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        const dateStr = `${year}-${month}-${day}`;

                                        const count = heatmapData[dateStr] || 0;
                                        const isHovered = hoveredCell === dateStr;

                                        return (
                                            <div
                                                key={dayIndex}
                                                onMouseEnter={() => {
                                                    setHoveredCell(dateStr);
                                                    setTooltipContent(`${count > 0 ? count : 'No'} challenges solved on ${date.toLocaleDateString()}`);
                                                }}
                                                onMouseLeave={() => {
                                                    setHoveredCell(null);
                                                    setTooltipContent('');
                                                }}
                                                style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '3px',
                                                    background: getColor(count),
                                                    transition: 'all 0.15s ease',
                                                    transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                                                    zIndex: isHovered ? 10 : 1,
                                                    boxShadow: isHovered ? (count > 0 ? '0 0 10px #9ACD32' : '0 0 5px rgba(255,255,255,0.2)') : 'none',
                                                    cursor: 'crosshair',
                                                    position: 'relative'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tooltip display below grid */}
                    <div style={{
                        height: '20px',
                        marginTop: '15px',
                        fontSize: '0.85rem',
                        color: '#9ACD32',
                        fontFamily: "'Share Tech Mono', monospace",
                        textAlign: 'center',
                        opacity: tooltipContent ? 1 : 0,
                        transition: 'opacity 0.2s'
                    }}>
                        {tooltipContent || 'Hover over the grid'}
                    </div>

                </div>
            </motion.div>

            {/* STAT CARDS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'clamp(0.8rem, 1.5vw, 1.5rem)' }}>
                <ActivityStatCard
                    title="Total Activity"
                    value={metrics.total_activity}
                    icon={<FaHeartbeat />}
                    delay={0.1}
                />
                <ActivityStatCard
                    title="Active Days"
                    value={metrics.active_days}
                    icon={<FaCalendarDay />}
                    delay={0.2}
                />
                <ActivityStatCard
                    title="Avg. Daily"
                    value={metrics.avg_daily}
                    icon={<FaArrowTrendUp />}
                    delay={0.3}
                />
                <ActivityStatCard
                    title="Current Streak"
                    value={metrics.current_streak}
                    icon={<FaBolt />}
                    highlight={metrics.current_streak > 0}
                    delay={0.4}
                />
            </div>
        </div>
    );
};

// Sub-component for the stats at the bottom
const ActivityStatCard = ({ title, value, icon, delay, highlight }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ y: -5, borderColor: '#9ACD32', boxShadow: '0 10px 20px rgba(154,205,50,0.1)' }}
        style={{
            background: 'rgba(20, 20, 20, 0.6)',
            border: '1px solid rgba(154, 205, 50, 0.1)',
            borderRadius: '12px',
            padding: 'clamp(0.8rem, 2vw, 1.5rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            transition: 'all 0.3s ease',
            minWidth: 0
        }}
    >
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: '#888', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            <div style={{
                fontSize: 'clamp(1.3rem, 3vw, 2rem)',
                fontWeight: 'bold',
                color: highlight ? '#9ACD32' : '#fff',
                textShadow: highlight ? '0 0 10px rgba(154,205,50,0.5)' : 'none'
            }}>
                {value}
            </div>
        </div>
        <div style={{
            background: highlight ? 'rgba(154, 205, 50, 0.2)' : 'rgba(255,255,255,0.05)',
            padding: 'clamp(10px, 1.5vw, 15px)',
            borderRadius: '10px',
            color: highlight ? '#9ACD32' : '#666',
            fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
            border: `1px solid ${highlight ? 'rgba(154, 205, 50, 0.4)' : 'rgba(255,255,255,0.05)'}`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {icon}
        </div>
    </motion.div>
);

export default ActivityHeatmap;
