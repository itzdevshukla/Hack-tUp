import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaUsers, FaFlag, FaTrophy } from 'react-icons/fa';
import './Dashboard.css';

function UserOverview() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        events_registered: 0,
        challenges_solved: 0,
        total_score: 0,
        upcoming_events: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Function to fetch stats
        const fetchStats = () => {
            fetch('/api/dashboard/overview/')
                .then(res => res.json())
                .then(data => {
                    setStats(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching overview stats:", err);
                    setLoading(false);
                });
        };

        // Initial fetch
        fetchStats();

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/updates/`;
        let ws;

        try {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    // Refresh stats on leaderboard changes (solves/score changes)
                    if (message.type === 'leaderboard_update' || message.type === 'new_announcement') {
                        fetchStats();
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
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="dashboard-premium-container"
        >
            <div className="premium-header">
                <div>
                    <h1 className="premium-title">
                        Welcome back, <span>{user?.username || 'Cadet'}</span>
                    </h1>
                    <p className="premium-subtitle">
                        Hack!tUp Central Command Ready.
                    </p>
                </div>
                <div className="premium-badge">
                    RANK: RECRUIT
                </div>
            </div>

            <div className="overview-premium-layout">
                {/* Stats Grid - Left Side */}
                <div className="premium-stats-grid">
                    {/* Card 1: Events Registered */}
                    <div className="premium-stat-card">
                        <div className="premium-stat-header">
                            <span className="premium-stat-title">Events</span>
                            <div className="premium-stat-icon">
                                <FaCalendarAlt />
                            </div>
                        </div>
                        <div className="premium-stat-value">
                            {loading ? '...' : stats.events_registered}
                        </div>
                    </div>

                    {/* Card 2: Teams */}
                    <div className="premium-stat-card">
                        <div className="premium-stat-header">
                            <span className="premium-stat-title">Teams</span>
                            <div className="premium-stat-icon">
                                <FaUsers />
                            </div>
                        </div>
                        <div className="premium-stat-value">N/A</div>
                    </div>

                    {/* Card 3: Challenges Solved */}
                    <div className="premium-stat-card">
                        <div className="premium-stat-header">
                            <span className="premium-stat-title">Challenges</span>
                            <div className="premium-stat-icon">
                                <FaFlag />
                            </div>
                        </div>
                        <div className="premium-stat-value">
                            {loading ? '...' : stats.challenges_solved}
                        </div>
                    </div>

                    {/* Card 4: Total Score */}
                    <div className="premium-stat-card">
                        <div className="premium-stat-header">
                            <span className="premium-stat-title">Score</span>
                            <div className="premium-stat-icon">
                                <FaTrophy />
                            </div>
                        </div>
                        <div className="premium-stat-value highlight">
                            {loading ? '...' : stats.total_score}
                        </div>
                    </div>
                </div>

                {/* Upcoming Events - Right Side */}
                <div className="premium-sidebar-card">
                    <div className="premium-sidebar-header">
                        <h3>Upcoming Events</h3>
                    </div>
                    <div className="premium-sidebar-body">
                        {loading ? (
                            <p style={{ color: '#666', textAlign: 'center' }}>Loading intel...</p>
                        ) : stats.upcoming_events?.length > 0 ? (
                            stats.upcoming_events.map(event => (
                                <div key={event.id} className="premium-list-item">
                                    <span className="premium-list-title">{event.title}</span>
                                    <div className="premium-list-meta">
                                        <FaCalendarAlt style={{ opacity: 0.7 }} />
                                        <span>
                                            {event.date} • {event.time}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#666', textAlign: 'center', marginTop: '2rem' }}>No incoming events detected on radar.</p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default UserOverview;
