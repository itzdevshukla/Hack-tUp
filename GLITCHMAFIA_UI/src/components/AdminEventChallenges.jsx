import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import CustomAlert from './CustomAlert';
import { FaPlusCircle, FaEdit, FaTrash, FaPuzzlePiece, FaShieldAlt, FaFire } from 'react-icons/fa';

const CATEGORY_COLORS = {
    'Web': { bg: 'rgba(0,122,255,0.15)', border: '#007aff', color: '#007aff' },
    'Crypto': { bg: 'rgba(48,209,88,0.12)', border: '#30d158', color: '#30d158' },
    'Reverse Engineering': { bg: 'rgba(255,159,10,0.12)', border: '#ff9f0a', color: '#ff9f0a' },
    'Forensics': { bg: 'rgba(100,210,255,0.12)', border: '#64d2ff', color: '#64d2ff' },
    'Pwn': { bg: 'rgba(255,69,58,0.12)', border: '#ff453a', color: '#ff453a' },
    'Misc': { bg: 'rgba(191,90,242,0.12)', border: '#bf5af2', color: '#bf5af2' },
    'OSINT': { bg: 'rgba(255,214,10,0.12)', border: '#ffd60a', color: '#ffd60a' },
};

const getCategoryStyle = (cat) => CATEGORY_COLORS[cat] || { bg: 'rgba(255,255,255,0.05)', border: '#444', color: '#aaa' };

function AdminEventChallenges() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    useEffect(() => {
        fetchEventChallenges();
    }, [id]);

    const fetchEventChallenges = async () => {
        try {
            const response = await fetch(`/api/admin/event/${id}/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch event data');
            const data = await response.json();
            setChallenges(data.challenges || []);
            setEventName(data.event.name);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (challengeId, title) => {
        setAlertConfig({
            title: 'Delete Challenge?',
            message: `Are you sure you want to permanently delete "${title}"? This will also remove all associated solves and awarded points.`,
            type: 'danger',
            confirmText: 'DELETE',
            onConfirm: () => executeDelete(challengeId),
            onCancel: () => setAlertOpen(false)
        });
        setAlertOpen(true);
    };

    const executeDelete = async (challengeId) => {
        setAlertOpen(false);
        try {
            const res = await fetch(`/api/admin/event/${id}/challenge/${challengeId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!res.ok) throw new Error('Failed to delete challenge');
            setChallenges(prev => prev.filter(c => c.id !== challengeId));
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="loading-text">Loading Challenges...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    return (
        <div style={{ padding: 'clamp(16px, 3vw, 30px)', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />

            {/* Page Header */}
            <div style={{ marginBottom: '35px' }}>
                <Link
                    to={`/administration/event/${id}`}
                    style={{ color: '#555', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#555'}
                >
                    ← Back to Event Details
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '5px' }}>
                            <FaPuzzlePiece color="#00ff41" size="1.3em" />
                            <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.1rem, 3vw, 2rem)', fontFamily: 'Orbitron', fontWeight: '500' }}>
                                Challenges
                            </h1>
                            <span style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.3)', color: '#00ff41', padding: '2px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                {challenges.length}
                            </span>
                        </div>
                        <p style={{ margin: 0, color: '#555', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                            {eventName}
                        </p>
                    </div>

                    <Link
                        to={`/administration/event/${id}/challenges/new`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#00ff41', color: '#000', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#00cc33'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,255,65,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#00ff41'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <FaPlusCircle /> New Challenge
                    </Link>
                </div>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                {challenges.map(c => {
                    const catStyle = getCategoryStyle(c.category);
                    return (
                        <div
                            key={c.id}
                            style={{
                                background: '#0d0d0d',
                                border: '1px solid #1e1e1e',
                                borderRadius: '12px',
                                padding: '0',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                transition: 'all 0.25s',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                minHeight: '300px'
                            }}
                            onClick={() => navigate(`/administration/event/${id}/challenge/${c.id}`)}
                            onMouseEnter={e => {
                                e.currentTarget.style.border = `1px solid ${catStyle.border}`;
                                e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.5)`;
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.border = '1px solid #1e1e1e';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            {/* Card Top Accent Bar */}
                            <div style={{ height: '3px', background: catStyle.border, opacity: 0.7, flexShrink: 0 }} />

                            {/* Card Body */}
                            <div style={{ padding: '22px 22px 15px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                {/* Category + Points row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <span style={{
                                        background: catStyle.bg,
                                        border: `1px solid ${catStyle.border}`,
                                        color: catStyle.color,
                                        padding: '3px 10px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {c.category}
                                    </span>
                                    <span style={{ fontFamily: 'Orbitron', color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
                                        {c.points}<span style={{ color: '#444', fontSize: '0.75rem', marginLeft: '2px' }}> pts</span>
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: '1.1rem', fontFamily: 'Orbitron', fontWeight: '500', lineHeight: '1.4', wordBreak: 'break-word' }}>
                                    {c.title}
                                </h3>

                                {/* Description Preview */}
                                <p style={{
                                    margin: 0,
                                    color: '#555',
                                    fontSize: '0.88rem',
                                    lineHeight: '1.6',
                                    flexGrow: 1,
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {c.description || 'No description provided.'}
                                </p>
                            </div>

                            {/* Card Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 22px', borderTop: '1px solid #1a1a1a' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#444', fontSize: '0.8rem' }}>
                                    <FaFire color={c.solves > 0 ? '#ff9f0a' : '#333'} />
                                    <span style={{ color: c.solves > 0 ? '#888' : '#444' }}>{c.solves} solve{c.solves !== 1 ? 's' : ''}</span>
                                </div>

                                <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/administration/event/${id}/challenge/${c.id}`); }}
                                        style={{ background: 'transparent', border: 'none', color: '#444', padding: '6px', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.2s', fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#1a1a1a'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.background = 'transparent'; }}
                                        title="Edit Challenge"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); confirmDelete(c.id, c.title); }}
                                        style={{ background: 'transparent', border: 'none', color: '#444', padding: '6px', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.2s', fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#ff453a'; e.currentTarget.style.background = 'rgba(255,69,58,0.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = '#444'; e.currentTarget.style.background = 'transparent'; }}
                                        title="Delete Challenge"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {challenges.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '80px 40px',
                        background: '#0d0d0d',
                        border: '1px dashed #222',
                        borderRadius: '12px',
                        color: '#444',
                        gap: '15px'
                    }}>
                        <FaPuzzlePiece size="3em" color="#222" />
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#555' }}>No challenges yet</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#333' }}>Click "New Challenge" to add the first one.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminEventChallenges;
