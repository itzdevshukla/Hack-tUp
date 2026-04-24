import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { FaEye, FaArrowLeft, FaCheck, FaTimes, FaSearch, FaExpand, FaCompress } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

function AdminEventLiveSubmissions() {
    const { id } = useParams();
    const [data, setData] = useState({ event_name: '', is_team_mode: false, submissions: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const wsRef = useRef(null);

    const fetchSubmissions = async () => {
        try {
            const response = await fetch(`/api/admin/event/${id}/submissions/`, {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (!response.ok) throw new Error('Failed to fetch submissions');
            const result = await response.json();
            setData(result);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load only — no polling interval
        fetchSubmissions();

        // WebSocket for zero-API live updates
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws/event/${id}/`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'new_submission' && message.data.event_id === id) {
                    setData(prev => ({
                        ...prev,
                        submissions: [message.data, ...prev.submissions].slice(0, 200)
                    }));
                }
            } catch (err) {
                console.error('WS parse error:', err);
            }
        };

        ws.onerror = () => setError('WebSocket error — check server');

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [id]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Fullscreen error: ${err.message}`);
                setIsFullscreen(true);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (isFullscreen) {
            document.body.classList.add('is-fullscreen-active');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.classList.remove('is-fullscreen-active');
            document.body.style.overflow = '';
        }
        return () => {
            document.body.classList.remove('is-fullscreen-active');
            document.body.style.overflow = '';
        };
    }, [isFullscreen]);

    if (loading) return <div className="loading-text">Loading Live Submissions...</div>;

    const filteredSubmissions = data.submissions.filter(s =>
        s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.challenge_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.team_name && s.team_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderTable = () => (
        <div className="admin-table-container">
            <h2 style={{
                color: '#fff',
                marginBottom: '20px',
                fontFamily: 'Orbitron',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: isFullscreen ? '1.1rem' : 'clamp(1rem, 3vw, 1.5rem)'
            }}>
                <FaEye color="#00ff41" /> {isFullscreen ? 'LIVE BROADCAST FEED' : 'Submission Feed (Global)'}
                {isFullscreen && (
                    <button className="admin-fullscreen-exit-sm" onClick={toggleFullscreen}>
                        <FaCompress /> Exit
                    </button>
                )}
            </h2>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Username</th>
                        {data.is_team_mode && <th>Team</th>}
                        <th>Challenge</th>
                        <th>Submitted Flag</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredSubmissions.map(s => (
                        <tr key={s.id} className={s.is_correct ? "admin-submission-row-correct" : "admin-submission-row-incorrect"}>
                            <td>{s.submitted_at}</td>
                            <td>
                                <Link to={`/administration/event/${id}/user/${s.user_id}`} style={{ color: '#00ff41', textDecoration: 'none', fontWeight: '600' }}>
                                    {s.username}
                                </Link>
                            </td>
                            {data.is_team_mode && (
                                <td>
                                    {s.team_id ? (
                                        <span style={{ color: '#00bfff', fontWeight: 'bold' }}>{s.team_name}</span>
                                    ) : (
                                        <span style={{ color: '#aaa', fontStyle: 'italic' }}>No Team</span>
                                    )}
                                </td>
                            )}
                            <td>{s.challenge_title}</td>
                            <td style={{ fontFamily: 'monospace', color: '#aaa' }}>
                                {s.flag}
                            </td>
                            <td>
                                {s.is_correct ? (
                                    <span style={{ color: '#00ff41', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                                        <FaCheck /> Correct
                                    </span>
                                ) : (
                                    <span style={{ color: '#ff3b30', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <FaTimes /> Incorrect
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {filteredSubmissions.length === 0 && (
                        <tr>
                            <td colSpan={data.is_team_mode ? "6" : "5"} style={{ textAlign: 'center', padding: '20px' }}>No matching submissions found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const fullscreenOverlay = isFullscreen ? ReactDOM.createPortal(
        <div className="fullscreen-feed">
            {renderTable()}
        </div>,
        document.body
    ) : null;

    return (
        <>
            {fullscreenOverlay}
            <Link to={`/administration/event/${id}`} className="admin-back-link">
                <FaArrowLeft /> Back to Event
            </Link>
            <div className="admin-content-header" style={{ marginBottom: '20px', minWidth: 0, paddingRight: '20px' }}>
                <h1 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: 'clamp(1.1rem, 3.5vw, 2rem)' }}>Live Submissions: {data.event_name}</h1>
                <p className="admin-content-subtitle">
                    <span style={{ color: '#00ff41', fontSize: '0.9rem' }}>⚡ Live via WebSocket</span>
                </p>
            </div>

            {error && <div className="error-text">Polling Error: {error}</div>}

            <div className="admin-controls-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                <div className="admin-search-container">
                    <FaSearch />
                    <input
                        type="text"
                        className="admin-search-input"
                        placeholder={data.is_team_mode ? "Search by Username, Team, or Challenge..." : "Search by Username or Challenge..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="admin-btn-fullscreen" onClick={toggleFullscreen}>
                    <FaExpand /> Full Screen Mode
                </button>
            </div>

            {renderTable()}
        </>
    );
}

export default AdminEventLiveSubmissions;
