import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaFlag, FaPuzzlePiece, FaUsers, FaCalendarAlt, FaMapMarkerAlt, FaKey, FaClock, FaCopy } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

function AdminEventDetail() {
    const { id } = useParams();
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);

    const handleCopyCode = (code) => {
        if (!code || code === 'N/A') return;
        navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    useEffect(() => {
        fetchEventDetail();
    }, [id]);

    const fetchEventDetail = async () => {
        try {
            const response = await fetch(`/api/admin/event/${id}/`, {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (!response.ok) throw new Error('Failed to fetch event details');
            const data = await response.json();
            setEventData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading-text">Loading Event Data...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;
    if (!eventData) return <div className="error-text">Event not found.</div>;

    const { event, stats, challenges, participants } = eventData;

    return (
        <div className="admin-event-detail-page">
            <div className="admin-event-header-container" style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="admin-content-header" style={{ marginBottom: '10px', minWidth: 0, paddingRight: '20px' }}>
                        <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 2.5rem)', marginBottom: '5px', wordBreak: 'break-word', overflowWrap: 'anywhere', color: '#00ff41', textShadow: '0 0 10px rgba(0,255,65,0.3)' }}>{event.name}</h1>
                        <p className="admin-content-subtitle" style={{ fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            <span style={{ color: event.status === 'live' ? '#ff3b30' : (event.status === 'paused' ? '#FFA500' : '#888'), fontWeight: 'bold' }}>● {event.is_paused ? 'PAUSED' : event.status}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(16px, 3vw, 30px)', marginBottom: '40px' }}>
                {/* Left Column: Description & Vital Info */}
                <div className="admin-event-main-col">
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #333', borderRadius: '8px', padding: 'clamp(14px, 2.5vw, 25px)', marginBottom: '20px' }}>
                        <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '15px', fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaFlag color="#00ff41" /> Event Description
                        </h3>
                        <div style={{ color: '#ccc', lineHeight: '1.6', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
                            {event.description || 'No description provided for this event.'}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div className="admin-info-card" style={{ margin: 0 }}>
                            <div className="card-icon"><FaMapMarkerAlt /></div>
                            <div className="card-data">
                                <h4 style={{ color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase' }}>Venue</h4>
                                <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{event.venue || 'TBA'}</p>
                            </div>
                        </div>

                        <div
                            className="admin-info-card"
                            onClick={() => handleCopyCode(event.access_code)}
                            style={{ margin: 0, cursor: event.access_code ? 'pointer' : 'default', position: 'relative', border: event.access_code ? '1px solid rgba(0,255,65,0.3)' : '1px solid #333', background: event.access_code ? 'rgba(0,255,65,0.05)' : 'rgba(0,0,0,0.3)' }}
                            title={event.access_code ? "Copy Access Code" : ""}
                        >
                            <div className="card-icon">
                                <FaKey style={{ color: event.access_code ? '#00ff41' : '#666' }} />
                            </div>
                            <div className="card-data">
                                <h4 style={{ color: event.access_code ? '#00ff41' : '#aaa', fontSize: '0.8rem', textTransform: 'uppercase' }}>Access Code</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <p style={{ color: event.access_code ? '#fff' : '#666', fontSize: '1.2rem', fontFamily: 'monospace', letterSpacing: '2px' }}>{event.access_code || 'N/A'}</p>
                                    {event.access_code && <FaCopy style={{ color: copiedCode ? '#00ff41' : '#888', fontSize: '1rem', transition: 'color 0.2s' }} />}
                                </div>
                            </div>
                            {copiedCode && (
                                <div style={{ position: 'absolute', top: '-12px', right: '10px', background: '#00ff41', color: '#000', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s' }}>
                                    Copied!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Timeline */}
                <div className="admin-event-side-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
                        <h4 style={{ color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '15px' }}>Event Statistics</h4>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '15px', borderBottom: '1px outset #222', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ddd' }}>
                                <FaUsers color="#00ff41" size="1.2em" /> <span>Participants</span>
                            </div>
                            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>{stats.total_participants}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ddd' }}>
                                <FaPuzzlePiece color="#00ff41" size="1.2em" /> <span>Challenges</span>
                            </div>
                            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>{stats.total_challenges}</span>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
                        <h4 style={{ color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaCalendarAlt /> Timeline
                        </h4>

                        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px dashed #333' }}>
                            <div style={{ color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Registration Window
                            </div>
                            <div style={{ color: '#00ff41', fontSize: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                {event.reg_start_date ? `${event.reg_start_date} ${event.reg_start_time.substring(0, 5)}` : 'N/A'} <br />
                                <span style={{ color: '#666', fontSize: '0.8rem' }}>to</span> <br />
                                {event.reg_end_date ? `${event.reg_end_date} ${event.reg_end_time.substring(0, 5)}` : 'N/A'}
                            </div>
                        </div>

                        <div>
                            <div style={{ color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaClock /> Live Event Window
                            </div>
                            <div style={{ color: '#fff', fontSize: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                {event.start_date ? `${event.start_date} ${event.start_time.substring(0, 5)}` : 'N/A'} <br />
                                <span style={{ color: '#666', fontSize: '0.8rem' }}>to</span> <br />
                                {event.end_date ? `${event.end_date} ${event.end_time.substring(0, 5)}` : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="admin-table-container" style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '0 5px 15px 5px', borderBottom: '1px solid #222', marginBottom: '15px' }}>
                    <h2 style={{ color: '#fff', fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: 'clamp(0.9rem, 2.5vw, 1.3rem)' }}>
                        <FaPuzzlePiece color="#00ff41" /> Challenges Map ({stats.total_challenges})
                    </h2>
                    <Link to={`/administration/event/${id}/challenges`} style={{ background: 'transparent', border: '1px solid #00ff41', color: '#00ff41', padding: '6px 14px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 0 5px rgba(0,255,65,0.1)' }}>
                        Manage Challenges →
                    </Link>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Points</th>
                            <th>Total Solves</th>
                        </tr>
                    </thead>
                    <tbody>
                        {challenges.map(c => (
                            <tr key={c.id}>
                                <td>{c.id}</td>
                                <td style={{ fontWeight: 'bold', color: '#00ff41' }}>{c.title}</td>
                                <td>{c.category}</td>
                                <td style={{ color: '#fff' }}>{c.points}</td>
                                <td>{c.solves}</td>
                            </tr>
                        ))}
                        {challenges.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>No challenges loaded into this event yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminEventDetail;
