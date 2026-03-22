import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPencilAlt, FaChevronDown, FaChevronUp, FaCheckCircle, FaLock, FaTimes } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

function EventWriteUps() {
    const { id } = useParams();
    const [writeups, setWriteups] = useState({});      // { challengeId: text }
    const [solvedChallenges, setSolvedChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [savedIds, setSavedIds] = useState([]);
    const [eventName, setEventName] = useState('');
    const [acceptingWriteups, setAcceptingWriteups] = useState(false);

    // Modal state
    const [activeChallenge, setActiveChallenge] = useState(null);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [chalRes, wuRes] = await Promise.all([
                fetch(`/api/event/${id}/challenges/`, { credentials: 'include' }),
                fetch(`/api/event/${id}/writeups/`, { credentials: 'include' })
            ]);

            if (chalRes.ok) {
                const chalData = await chalRes.json();
                setEventName(chalData.event || '');
                setAcceptingWriteups(chalData.accepting_writeups === true);

                // SECURITY ENFORCEMENT: ONLY personally solved challenges are displayed here
                // This ensures each team member can only edit what they actually solved.
                const solved = (chalData.challenges || []).filter(c => c.is_personally_solved);
                setSolvedChallenges(solved);
            }

            if (wuRes.ok) {
                const wuData = await wuRes.json();
                const map = {};
                (wuData.writeups || []).forEach(wu => { map[wu.challenge_id] = wu.content; });
                setWriteups(map);
                setSavedIds(Object.keys(map));
            }
        } catch (err) {
            console.error('Failed to load writeups', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (challengeId) => {
        setSaving(challengeId);
        try {
            const res = await fetch(`/api/event/${id}/writeups/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ challenge_id: challengeId, content: writeups[challengeId] || '' })
            });
            if (res.ok) {
                setSavedIds(prev => [...new Set([...prev, challengeId])]);
                setActiveChallenge(null);
            }
        } catch (err) {
            console.error('Failed to save writeup', err);
        } finally {
            setSaving(null);
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', color: '#555', padding: '4rem', fontFamily: 'Orbitron' }}>LOADING...</div>
    );

    return (
        <div style={{ padding: '2rem 2rem 4rem', minHeight: '100vh' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <FaPencilAlt style={{ color: '#9ACD32', fontSize: '1.2rem' }} />
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>My WriteUps</h1>
                </div>
                <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
                    Personal writeups for challenges you've solved in <span style={{ color: '#9ACD32' }}>{eventName}</span>
                </p>
                {!acceptingWriteups && !loading && (
                    <div style={{ marginTop: '1rem', padding: '10px 15px', background: 'rgba(220,53,69,0.1)', border: '1px solid rgba(220,53,69,0.3)', borderRadius: '6px', color: '#dc3545', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaLock /> Write-up submissions are currently closed for this event. You can still view your saved write-ups.
                    </div>
                )}
            </motion.div>

            {solvedChallenges.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', padding: '5rem 2rem', color: '#444' }}>
                    <FaLock style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.2 }} />
                    <p style={{ fontSize: '1.1rem' }}>No solved challenges yet.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Solve a challenge to unlock its writeup slot.</p>
                </motion.div>
            ) : (
                <div className="premium-events-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '2.5rem',
                    width: '100%',
                    alignItems: 'start'
                }}>
                    <AnimatePresence>
                        {solvedChallenges.map((ch, i) => {
                            const hasSaved = savedIds.includes(ch.id);
                            return (
                                <motion.div
                                    key={ch.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="premium-event-card"
                                    style={{ display: 'flex', flexDirection: 'column' }}
                                >
                                    {/* Card Header */}
                                    <div className="premium-event-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 className="premium-event-title" style={{ margin: 0, fontSize: '1.4rem' }}>
                                                {ch.title}
                                            </h3>
                                            <div className="premium-status-badge live" style={{
                                                background: hasSaved ? 'rgba(154, 205, 50, 0.15)' : 'rgba(255, 165, 0, 0.15)',
                                                color: hasSaved ? '#9ACD32' : '#FFA500',
                                                borderColor: hasSaved ? 'rgba(154, 205, 50, 0.4)' : 'rgba(255, 165, 0, 0.4)',
                                                boxShadow: `0 0 12px ${hasSaved ? 'rgba(154, 205, 50, 0.2)' : 'rgba(255, 165, 0, 0.2)'}`
                                            }}>
                                                {hasSaved ? 'SAVED' : 'PENDING'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', color: '#888', fontSize: '0.85rem', fontFamily: 'Orbitron, sans-serif' }}>
                                            <span>{ch.category}</span>
                                            <span>•</span>
                                            <span style={{ color: '#9ACD32' }}>{ch.points} pts</span>
                                        </div>
                                    </div>

                                    {/* Card Body & Action */}
                                    <div className="premium-event-body" style={{ flexGrow: 1, padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        {ch.is_personally_solved ? (
                                            <button
                                                onClick={() => setActiveChallenge(ch)}
                                                className="premium-btn"
                                                style={{
                                                    width: '100%', padding: '1.2rem',
                                                    background: 'linear-gradient(135deg, rgba(154,205,50,0.1) 0%, rgba(154,205,50,0.05) 100%)',
                                                    border: '1px solid rgba(154,205,50,0.4)',
                                                    color: '#9ACD32', borderRadius: '12px',
                                                    fontSize: '1rem', fontWeight: 'bold', letterSpacing: '1px',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(154,205,50,0.2) 0%, rgba(154,205,50,0.1) 100%)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(154,205,50,0.1) 0%, rgba(154,205,50,0.05) 100%)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <FaPencilAlt /> {hasSaved ? "EDIT DOCUMENT" : "DRAFT WRITEUP"}
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="premium-btn"
                                                style={{
                                                    width: '100%', padding: '1.2rem',
                                                    background: 'rgba(255,100,100,0.05)',
                                                    border: '1px solid rgba(255,100,100,0.2)',
                                                    color: '#ff6666', borderRadius: '12px',
                                                    fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1px',
                                                    cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                    opacity: 0.8
                                                }}
                                                title="Only the member who personally submitted the correct flag can document the approach."
                                            >
                                                <FaLock /> SOLVER ONLY
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* WriteUp Editor Modal Overlay */}
            <AnimatePresence>
                {activeChallenge && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '2rem'
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setActiveChallenge(null);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 30, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                width: '100%', maxWidth: '800px',
                                background: 'linear-gradient(145deg, rgba(20,20,20,0.95), rgba(10,10,10,0.98))',
                                border: '1px solid rgba(154,205,50,0.4)',
                                borderRadius: '16px', overflow: 'hidden',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(154,205,50,0.1)',
                                display: 'flex', flexDirection: 'column'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontFamily: 'Orbitron, sans-serif' }}>{activeChallenge.title}</h2>
                                    <div style={{ fontSize: '0.85rem', color: '#9ACD32', letterSpacing: '1px', marginTop: '4px' }}>DOCUMENTATION ENGINE</div>
                                </div>
                                <button
                                    onClick={() => setActiveChallenge(null)}
                                    style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '8px', transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#888'}
                                >
                                    <FaTimes size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: '2rem' }}>
                                <textarea
                                    value={writeups[activeChallenge.id] || ''}
                                    onChange={e => setWriteups(prev => ({ ...prev, [activeChallenge.id]: e.target.value }))}
                                    placeholder={`Document your methodology here...\n\n1. Reconnaissance\n2. Vulnerability Identification\n3. Exploitation\n4. Flag Extraction`}
                                    onCopy={e => e.preventDefault()}
                                    onPaste={e => e.preventDefault()}
                                    onCut={e => e.preventDefault()}
                                    onContextMenu={e => e.preventDefault()}
                                    style={{
                                        width: '100%', height: '350px',
                                        padding: '1.5rem', background: 'rgba(5,5,5,0.8)',
                                        border: '1px solid rgba(154,205,50,0.3)', borderRadius: '12px',
                                        color: '#e0e0e0', fontSize: '1.05rem', fontFamily: 'monospace',
                                        lineHeight: 1.7, resize: 'none', outline: 'none',
                                        boxSizing: 'border-box',
                                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                                        transition: 'border-color 0.3s ease'
                                    }}
                                    onFocus={e => {
                                        e.currentTarget.style.borderColor = '#9ACD32';
                                        e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5), 0 0 15px rgba(154,205,50,0.1)';
                                    }}
                                    onBlur={e => {
                                        e.currentTarget.style.borderColor = 'rgba(154,205,50,0.3)';
                                        e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(0,0,0,0.5)';
                                    }}
                                />
                                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                    <FaLock size={10} /> SECURITY PROTOCOL: CLIPBOARD OPERATIONS DISABLED
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                <button
                                    onClick={() => setActiveChallenge(null)}
                                    style={{
                                        padding: '12px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#ccc', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSave(activeChallenge.id)}
                                    disabled={saving === activeChallenge.id || !acceptingWriteups}
                                    style={{
                                        padding: '12px 30px', background: !acceptingWriteups ? '#333' : '#9ACD32',
                                        border: 'none', color: '#000', borderRadius: '8px', fontWeight: '900', fontSize: '0.95rem',
                                        cursor: (saving === activeChallenge.id || !acceptingWriteups) ? 'not-allowed' : 'pointer',
                                        opacity: saving === activeChallenge.id ? 0.7 : 1,
                                        boxShadow: !acceptingWriteups ? 'none' : '0 4px 15px rgba(154,205,50,0.4)',
                                        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                    onMouseEnter={e => { if (acceptingWriteups && saving !== activeChallenge.id) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { if (acceptingWriteups && saving !== activeChallenge.id) e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    {saving === activeChallenge.id ? <div style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'fa-spin 1s linear infinite' }} /> : <FaCheckCircle />}
                                    {saving === activeChallenge.id ? 'ENCRYPTING...' : 'SAVE TO MAINFRAME'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default EventWriteUps;
