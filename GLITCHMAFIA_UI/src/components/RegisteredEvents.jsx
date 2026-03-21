import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaSearch, FaCalendarAlt, FaChevronRight } from 'react-icons/fa';
import './Dashboard.css';

const RegisteredEvents = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("All");
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard/registered-events/')
            .then(res => res.json())
            .then(data => {
                if (data.events) setRegisteredEvents(data.events);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching registered events:", err);
                setLoading(false);
            });
    }, []);

    const filteredEvents = useMemo(() => {
        return registeredEvents.filter(event => {
            const status = event.status ? event.status.toLowerCase() : '';
            const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());

            if (filter === "All") return matchesSearch;
            if (filter === "Live") return matchesSearch && status === "live";
            if (filter === "Upcoming") return matchesSearch && status === "upcoming";
            if (filter === "Past") return matchesSearch && status === "completed";

            return matchesSearch;
        });
    }, [searchTerm, filter, registeredEvents]);

    const counts = {
        All: registeredEvents.length,
        Live: registeredEvents.filter(e => (e.status || '').toLowerCase() === "live").length,
        Upcoming: registeredEvents.filter(e => (e.status || '').toLowerCase() === "upcoming").length,
        Past: registeredEvents.filter(e => (e.status || '').toLowerCase() === "completed").length
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="explore-events-container dashboard-premium-container"
        >
            <div className="premium-header">
                <div>
                    <h1 className="premium-title">
                        Registered <span>Events</span>
                    </h1>
                    <p className="premium-subtitle">Your active operations and history.</p>
                </div>

                <div className="premium-controls-container">
                    <div className="premium-select-wrapper">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="premium-select"
                        >
                            <option value="All">All ({counts["All"]})</option>
                            <option value="Live">Live ({counts["Live"]})</option>
                            <option value="Upcoming">Upcoming ({counts["Upcoming"]})</option>
                            <option value="Past">Past ({counts["Past"]})</option>
                        </select>
                        <div className="premium-select-arrow">▼</div>
                    </div>

                    <div className="premium-search-wrapper">
                        <FaSearch className="premium-search-icon" />
                        <input
                            type="text"
                            placeholder="Search operations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="premium-search-input"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#9ACD32', fontSize: '1.2rem' }}>
                    Loading your registered missions...
                </div>
            ) : (
                /* Events Grid */
                <motion.div className="premium-events-grid" layout>
                    <AnimatePresence mode='popLayout'>
                        {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                            <motion.div
                                layout
                                key={event.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="premium-event-card"
                            >
                                {/* Card Header (Status + Creator) */}
                                <div className="premium-event-header">
                                    <div className={`premium-status-badge ${(event.status || '').toLowerCase() === 'live' ? 'live' : 'default'}`}>
                                        {(event.status || 'UPCOMING')}
                                    </div>
                                    <div className="premium-creator">
                                        <FaShieldAlt style={{ color: '#9ACD32' }} />
                                        <span>{event.creator || 'Admin'}</span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="premium-event-body">
                                    <h3 className="premium-event-title">
                                        {event.title}
                                    </h3>
                                    <p className="premium-event-desc">
                                        {event.description}
                                    </p>
                                </div>

                                {/* Card Footer (Action button + Dates) */}
                                <div className="premium-event-footer">
                                    <div className="premium-event-dates">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaCalendarAlt style={{ color: '#9ACD32' }} /> {event.start_date}</span>
                                    </div>

                                    <button
                                        onClick={() => navigate(`/event/${event.id}`)}
                                        className="premium-btn"
                                    >
                                        {(event.status || '').toLowerCase() === 'completed' ? 'View Results' : 'Enter Arena'} <FaChevronRight size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        )) : (
                            <div className="premium-empty-state">
                                <h2>{searchTerm || filter !== "All" ? "No events found matching your criteria." : "You haven't registered for any events yet!"}</h2>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </motion.div>
    );
};

export default RegisteredEvents;
