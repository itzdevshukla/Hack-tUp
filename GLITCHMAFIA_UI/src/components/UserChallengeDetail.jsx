import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFlag, FaLock, FaChevronLeft, FaTimesCircle, FaDownload, FaLink, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';
import faaaaSound from '../assets/audio/faaaa.mp3';
import './UserChallengeDetail.css';

// Color map for difficulty tags matching the user's theme
const DIFF_COLOR = {
    easy: '#4ADE80',    // Light Green
    medium: '#F59E0B',  // Amber/Orange
    hard: '#EF4444',    // Red
    insane: '#8B5CF6'   // Purple
};

const UserChallengeDetail = () => {
    const { id, challengeId } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flagInput, setFlagInput] = useState('');
    const [submitStatus, setSubmitStatus] = useState(null); // 'submitting', 'success', 'error'
    const [eventStatus, setEventStatus] = useState('live');
    const [eventName, setEventName] = useState('Loading...');
    const [isTeamMode, setIsTeamMode] = useState(false);

    // Audio reference for incorrect submission
    const errorAudioRef = useRef(null);

    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'solves'
    const [solvers, setSolvers] = useState([]);
    const [loadingSolvers, setLoadingSolvers] = useState(false);

    useEffect(() => {
        fetchChallengeData();
        // eslint-disable-next-line
    }, [id, challengeId]);

    // Fetch Solvers when tab changes
    useEffect(() => {
        if (activeTab === 'solves' && solvers.length === 0 && challenge && challenge.solves_count > 0) {
            fetchSolversList();
        }
        // eslint-disable-next-line
    }, [activeTab, challenge]);

    const fetchChallengeData = async () => {
        try {
            const res = await fetch(`/api/event/${id}/challenges/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await res.json();

            if (!res.ok) {
                if (data.error?.includes('register') || data.error?.includes('team') || data.error?.includes('banned')) {
                    navigate(`/event/${id}`);
                    return;
                }
                throw new Error(data.error || 'Failed to fetch challenge data');
            }

            setEventName(data.event || `Event #${id}`);
            const foundStatus = data.event_status || data.status || 'live';
            setEventStatus(foundStatus);
            setIsTeamMode(data.is_team_mode || false);

            const allChalls = data.challenges || [];
            const current = allChalls.find(c => c.id.toString() === challengeId);

            if (current) {
                setChallenge(current);
            } else {
                navigate(`/event/${id}/challenges`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchSolversList = async () => {
        setLoadingSolvers(true);
        try {
            const res = await fetch(`/api/challenge/${challenge.id}/solvers/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await res.json();
            if (data.solvers) {
                setSolvers(data.solvers);
            }
        } catch { } finally {
            setLoadingSolvers(false);
        }
    };

    const submitFlag = async (e) => {
        e.preventDefault();
        if (!flagInput.trim() || challenge?.is_solved || eventStatus !== 'live') return;

        // "Warm up" the audio to unlock it for this user gesture
        if (errorAudioRef.current) {
            errorAudioRef.current.play().then(() => {
                errorAudioRef.current.pause();
                errorAudioRef.current.currentTime = 0;
            }).catch(() => {
                // Silently fail if first attempt is blocked
            });
        }

        setSubmitStatus({ status: 'submitting' });
        try {
            const res = await fetch(`/api/challenge/${challenge.id}/submit/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ flag: flagInput })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSubmitStatus({ status: 'success', message: data.message || 'Correct flag! Points awarded.' });
                setChallenge(prev => ({
                    ...prev,
                    is_solved: true,
                    solves_count: (prev.solves_count || 0) + 1
                }));
            } else {
                // Incorrect flag handling: Play sound
                try {
                    if (errorAudioRef.current) {
                        errorAudioRef.current.currentTime = 0; // Reset audio to start
                        errorAudioRef.current.play().catch(e => {
                            console.log('Audio play failed (browser policy):', e);
                        });
                    }
                } catch (e) {
                    console.error("Audio error:", e);
                }

                setSubmitStatus({ status: 'error', message: 'FAAAA!!!' });
            }
        } catch (err) {
            setSubmitStatus({ status: 'error', message: 'Error submitting flag.' });
            setTimeout(() => setSubmitStatus(null), 3000);
        }
    };

    const unlockHint = async (hintId, cost) => {
        if (!window.confirm(`Unlock this hint for ${cost} points?`)) return;
        try {
            const res = await fetch(`/api/hint/${hintId}/unlock/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'X-CSRFToken': getCsrfToken()
                }
            });
            const data = await res.json();
            if (data.success) {
                setChallenge(prev => ({
                    ...prev,
                    hints: prev.hints.map(h => h.id === hintId ? { ...h, is_unlocked: true, content: data.hint_content } : h)
                }));
            } else {
                alert(data.error || 'Failed to unlock hint.');
            }
        } catch { }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'transparent', color: '#888', fontFamily: "'Inter', sans-serif", fontSize: '1rem', letterSpacing: '1px' }}>
            Loading challenge data...
        </div>
    );

    if (error || !challenge) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'transparent', color: '#ef4444', fontFamily: "'Inter', sans-serif" }}>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}><FaExclamationTriangle /> Challenge Not Found</h2>
            <p style={{ color: '#888', marginTop: '10px' }}>{error || 'Unable to load the requested challenge.'}</p>
            <button onClick={() => navigate(`/event/${id}/challenges`)} style={{ marginTop: '30px', padding: '12px 24px', background: 'transparent', color: '#ef4444', border: '1px solid currentColor', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.3s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>Return to Challenges</button>
        </div>
    );

    const diffColor = DIFF_COLOR[challenge.difficulty?.toLowerCase()] || '#4ADE80';
    const isSolved = challenge.is_solved;

    return (
        <div className="challenge-detail-page">

            <audio
                ref={errorAudioRef}
                src={faaaaSound}
                preload="auto"
                onEnded={() => setSubmitStatus(null)}
            />

            {/* FAAAA! Full Screen Animation */}
            <AnimatePresence>
                {submitStatus?.status === 'error' && submitStatus?.message === 'FAAAA!!!' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            pointerEvents: 'none'
                        }}
                    >
                        <motion.h1
                            initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
                            animate={{ opacity: 1, scale: 1.1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 1.5, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            style={{
                                fontSize: 'clamp(5rem, 18vw, 12rem)',
                                color: '#FFD700', // Gold/Yellow
                                fontWeight: 900,
                                textTransform: 'uppercase',
                                fontFamily: "'Inter', 'Impact', sans-serif",
                                textShadow: '8px 8px 0px #EF4444, 15px 15px 30px rgba(0,0,0,0.5)',
                                margin: 0,
                                textAlign: 'center',
                                fontStyle: 'italic'
                            }}
                        >
                            FAAAA!!!
                        </motion.h1>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Bar */}
            <header className="challenge-detail-header">
                <div className="challenge-detail-header-inner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button
                            onClick={() => navigate(`/event/${id}/challenges`)}
                            style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s', padding: 0 }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#888' }}
                        >
                            <FaChevronLeft size={12} /> Back to Challenges
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ color: '#888', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {eventName}
                        </div>
                    </div>
                </div>
            </header>

            <main className="challenge-detail-main">

                {/* Challenge Title Header */}
                <div className="challenge-detail-title-section">
                    <div className="challenge-detail-title-left">
                        <div style={{
                            width: 'clamp(40px, 8vw, 60px)', height: 'clamp(40px, 8vw, 60px)', borderRadius: '12px',
                            background: isSolved ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isSolved ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSolved ? '#4ADE80' : '#888',
                            flexShrink: 0,
                        }}>
                            {isSolved ? <FaCheckCircle size={24} /> : <FaFlag size={24} />}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.75rem', color: diffColor, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700, background: `${diffColor}15`, padding: '4px 8px', borderRadius: '4px' }}>
                                    {challenge.difficulty}
                                </span>
                                {challenge.category && <span style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>{challenge.category}</span>}
                            </div>
                            <h1 style={{ margin: 0, fontSize: '2rem', color: '#fff', fontWeight: 700, letterSpacing: '-0.5px' }}>
                                {challenge.title}
                            </h1>
                        </div>
                    </div>

                    <div className="challenge-detail-title-right">
                        <div style={{ fontSize: '0.75rem', color: '#666', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Points Potential</div>
                        <div style={{ color: '#fff', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', lineHeight: '1' }}>
                            {challenge.points}
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="challenge-detail-columns">

                    {/* LEFT COLUMN: Main Briefing & Terminal */}
                    <div className="challenge-detail-left-col">

                        {/* Description Block */}
                        <div className="challenge-detail-block" style={{
                            background: 'rgba(15, 15, 15, 0.6)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                        }}>
                            <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                Challenge Description
                            </div>
                            <div style={{
                                fontSize: '1rem', lineHeight: '1.7', color: '#a0a0a0',
                                fontFamily: "'Inter', sans-serif",
                                whiteSpace: 'pre-wrap',       // Persists line breaks from DB
                                wordBreak: 'break-word',      // Force breaks for extremely long strings
                                overflowWrap: 'anywhere',     // Ultimate fallback for line breaking
                            }}>
                                {challenge.description}
                            </div>
                        </div>

                        {/* Solved Notification Box */}
                        {isSolved && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'rgba(74, 222, 128, 0.05)',
                                    border: '1px solid rgba(74, 222, 128, 0.2)',
                                    borderRadius: '12px', padding: '20px', color: '#4ADE80', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem'
                                }}>
                                <FaCheckCircle size={20} />
                                {isTeamMode
                                    ? "This challenge has been solved by your team."
                                    : "You have successfully solved this challenge."
                                }
                            </motion.div>
                        )}

                        {/* Flag Submission Terminal */}
                        <div className="challenge-detail-block" style={{
                            background: 'rgba(15, 15, 15, 0.6)',
                            backdropFilter: 'blur(12px)',
                            border: `1px solid ${isSolved ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '12px',
                        }}>

                            <div style={{ fontSize: '1rem', color: isSolved ? '#4ADE80' : '#fff', fontWeight: 600, marginBottom: '1.5rem' }}>
                                Submit Flag
                            </div>

                            <form
                                onSubmit={submitFlag}
                                style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}
                            >
                                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                                    {challenge.flag_format ? `Format: ${challenge.flag_format}` : 'Submit the flag here.'}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    <input
                                        type="text"
                                        value={flagInput}
                                        onChange={(e) => setFlagInput(e.target.value)}
                                        placeholder={challenge.flag_format || "Hack!tUp{...}"}
                                        disabled={isSolved || eventStatus !== 'live'}
                                        style={{
                                            flex: '1 1 200px', minWidth: 0, background: 'rgba(0, 0, 0, 0.4)', border: `1px solid ${isSolved ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255,255,255,0.15)'}`, padding: '14px 18px',
                                            color: isSolved ? '#4ADE80' : '#fff', borderRadius: '8px', fontSize: 'clamp(0.85rem, 2vw, 1rem)', outline: 'none', transition: 'all 0.2s',
                                            fontFamily: 'monospace', opacity: (isSolved || eventStatus !== 'live') ? 0.7 : 1,
                                            boxSizing: 'border-box'
                                        }}
                                        onFocus={e => !isSolved && (e.target.style.borderColor = '#fff')}
                                        onBlur={e => !isSolved && (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSolved || eventStatus !== 'live' || submitStatus?.status === 'submitting'}
                                        style={{
                                            background: isSolved ? 'rgba(74, 222, 128, 0.1)' : '#fff',
                                            color: isSolved ? '#4ADE80' : '#000',
                                            border: 'none',
                                            padding: '0 clamp(16px, 3vw, 32px)', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600,
                                            cursor: (isSolved || eventStatus !== 'live') ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s', minHeight: '48px', whiteSpace: 'nowrap'
                                        }}
                                        onMouseEnter={e => { if (!isSolved && eventStatus === 'live') { e.currentTarget.style.opacity = '0.9' } }}
                                        onMouseLeave={e => { if (!isSolved && eventStatus === 'live') { e.currentTarget.style.opacity = '1' } }}
                                    >
                                        {submitStatus?.status === 'submitting' ? '...' : isSolved ? 'Solved' : eventStatus !== 'live' ? 'Locked' : 'Submit'}
                                    </button>
                                </div>
                                {/* Status Message */}
                                <AnimatePresence>
                                    {submitStatus?.status === 'error' && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 500 }}>{submitStatus.message}</motion.div>}
                                    {submitStatus?.status === 'success' && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 500 }}>{submitStatus.message}</motion.div>}
                                </AnimatePresence>
                            </form>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Metadata & Attachments */}
                    <div className="challenge-detail-right-col">

                        {/* Files Panel */}
                        {((challenge.files && challenge.files.length > 0) || (!challenge.files?.length && !challenge.url)) && (
                            <div style={{ background: 'rgba(15, 15, 15, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                                    Mission Assets
                                </div>
                                <div className="challenge-detail-block-compact" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {challenge.files && challenge.files.length > 0 ? (
                                        challenge.files.map((f, i) => (
                                            <a key={i} href={f.url} download style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                                    <div style={{ color: '#888', flexShrink: 0 }}><FaDownload size={14} /></div>
                                                    <div style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 500, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>Download Asset {i + 1}</div>
                                                </div>
                                            </a>
                                        ))
                                    ) : (
                                        <div style={{ color: '#666', fontSize: '0.85rem', padding: '10px 0' }}>No files attached.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* External Link Panel */}
                        {challenge.url && (
                            <div style={{ background: 'rgba(15, 15, 15, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                                    Target Environment
                                </div>
                                <div className="challenge-detail-block-compact" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <a href={challenge.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.1)', textDecoration: 'none', transition: 'all 0.2s', wordBreak: 'break-word', overflowWrap: 'anywhere' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                            <div style={{ color: '#38bdf8', flexShrink: 0 }}><FaLink size={16} /></div>
                                            <div style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: 600 }}>Launch Target Environment</div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Hints Panel */}
                        <div style={{ background: 'rgba(15, 15, 15, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                                Hints
                            </div>
                            <div className="challenge-detail-block-compact" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {challenge.hints && challenge.hints.length > 0 ? challenge.hints.map((hint, i) => (
                                    <div key={hint.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ color: '#888', fontSize: '0.8rem', fontWeight: 600 }}>Hint {i + 1}</div>
                                        {hint.is_unlocked ? (
                                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: '#d0d0d0', fontSize: '0.9rem', wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                                {hint.content}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => unlockHint(hint.id, hint.cost)}
                                                style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontSize: '0.9rem', fontWeight: 500 }}
                                                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                            >
                                                <FaLock size={12} /> Unlock (-{hint.cost} points)
                                            </button>
                                        )}
                                    </div>
                                )) : <div style={{ color: '#666', fontSize: '0.85rem', padding: '10px 0' }}>No hints available.</div>}
                            </div>
                        </div>

                        {/* Top Solvers Panel */}
                        <div style={{ background: 'rgba(15, 15, 15, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                Solvers
                                <span style={{ color: '#888', fontWeight: 400 }}>{challenge.solves_count || 0}</span>
                            </div>
                            <div className="challenge-detail-block-compact" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
                                {/* Load Solvers Button */}
                                {solvers.length === 0 && challenge.solves_count > 0 ? (
                                    <button
                                        onClick={fetchSolversList}
                                        disabled={loadingSolvers}
                                        style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: '#ccc', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        {loadingSolvers ? 'Loading...' : 'Load Solvers List'}
                                    </button>
                                ) : solvers.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {solvers.slice(0, 5).map((s, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ color: '#888', fontWeight: 600, fontSize: '0.8rem', width: '20px' }}>#{i + 1}</span>
                                                    <span style={{ color: '#eee', fontSize: '0.9rem' }}>{s.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '10px', color: '#666', fontSize: '0.85rem' }}>No solves recorded yet.</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserChallengeDetail;
