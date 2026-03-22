import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaFlag, FaCheckCircle, FaTimesCircle, FaLock, 
    FaBug, FaCode, FaDatabase, FaShieldAlt, 
    FaFlask, FaExclamationTriangle, FaStar, FaEye,
    FaChevronLeft, FaDownload, FaLink
} from 'react-icons/fa';
import './AdminTestChallengesOverrides.css';
import './Challenges.css';
import '../components/UserChallengeDetail.css'; // Leverage existing user-side detailed CSS
import { getCsrfToken } from '../utils/csrf';

/* ─── helpers ─────────────────────────────────────────────────── */
const DIFF_COLOR = { easy: '#22d3ee', medium: '#fb923c', hard: '#f87171' };
const DIFF_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const ACCENT = '#22c55e'; // Green testing accent
const CAT_ICONS = {
    web: <FaBug />, crypto: <FaLock />, pwn: <FaCode />,
    forensics: <FaDatabase />, osint: <FaEye />,
    misc: <FaStar />, default: <FaShieldAlt />
};
const CAT_COLORS = {
    web: '#38bdf8', crypto: '#c084fc', pwn: '#f87171',
    forensics: '#4ade80', osint: '#fbbf24', misc: '#f472b6', default: '#00e5ff'
};
function catIcon(cat) { return CAT_ICONS[cat?.toLowerCase()] ?? CAT_ICONS.default; }
function catColor(cat) { return CAT_COLORS[cat?.toLowerCase()] ?? CAT_COLORS.default; }

const AdminTestChallenges = () => {
    const { id } = useParams();
    const [challenges, setChallenges] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Testing View State (Replaces the Modal)
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [flagInput, setFlagInput] = useState('');
    const [submitStatus, setSubmitStatus] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [waveFilter, setWaveFilter] = useState('All');
    const [availableWaves, setAvailableWaves] = useState([]);

    useEffect(() => {
        fetchTestChallenges();
        
        // Remove padding from .admin-content to allow edge-to-edge layout matching the user view
        const adminContent = document.querySelector('.admin-content');
        if (adminContent) {
            adminContent.style.setProperty('padding', '0', 'important');
        }

        return () => {
            if (adminContent) {
                adminContent.style.removeProperty('padding');
            }
        };
    }, [id]);

    const fetchTestChallenges = async () => {
        try {
            const response = await fetch(`/api/admin/event/${id}/test-challenges/`, {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });

            if (!response.ok) {
                if (response.status === 403) throw new Error("Forbidden: You are not an admin for this event.");
                throw new Error("Failed to fetch test challenges");
            }

            const data = await response.json();
            if (data.challenges) {
                setChallenges(data.challenges);
                setEventName(data.event);

                // Extract unique waves for the filter
                const waves = new Set(data.challenges.map(c => c.wave_name).filter(w => w !== null));
                setAvailableWaves(['All', 'No Wave', ...waves]);
            }
            setLoading(false);
        } catch (err) {
            console.error("Test fetch failed:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const submitFlag = async (e) => {
        e.preventDefault();
        if (!selectedChallenge) return;

        setSubmitStatus({ status: 'submitting' });
        try {
            const response = await fetch(`/api/admin/challenge/${selectedChallenge.id}/test-flag/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ flag: flagInput })
            });

            const data = await response.json();

            if (data.success) {
                setSubmitStatus({ status: 'success', message: 'VALID FLAG - Backend hashing format matched test constraints.' });
            } else {
                setSubmitStatus({ status: 'error', message: 'INVALID FLAG - Attempt rejected by backend constraints.' });
                // Reset error message fast for test environment workflow
                setTimeout(() => setSubmitStatus(null), 3000);
            }
        } catch (err) {
            setSubmitStatus({ status: 'error', message: 'Network Error submitting test flag.' });
            setTimeout(() => setSubmitStatus(null), 3000);
        }
    };

    const categories = ['All', ...new Set(challenges.map(c => c.category))];

    const filteredChallenges = challenges.filter(c => {
        const searchVal = searchQuery.toLowerCase();
        const matchesSearch = c.title.toLowerCase().includes(searchVal) ||
            (c.description && c.description.toLowerCase().includes(searchVal));
        const catMatch = categoryFilter === 'All' || c.category === categoryFilter;
        const waveMatch = waveFilter === 'All'
            || (waveFilter === 'No Wave' && !c.wave_name)
            || c.wave_name === waveFilter;
        return matchesSearch && catMatch && waveMatch;
    });

    const grouped = {};
    filteredChallenges.forEach(c => { if (!grouped[c.category]) grouped[c.category] = []; grouped[c.category].push(c); });

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-black text-[#00ff41] font-mono tracking-widest">
            INITIALIZING_TEST_ENVIRONMENT...
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen bg-black text-red-500 font-bold">
            {error}
        </div>
    );

    /* ─── FULL PAGE DETAIL VIEW (Replaces Modal) ─────────────────────── */
    if (selectedChallenge) {
        const diffColor = DIFF_COLOR[selectedChallenge.difficulty?.toLowerCase()] || '#4ADE80';
        return (
            <div className="challenge-detail-page" style={{ minHeight: '100vh', background: '#0a0a0a', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>



                {/* Header Bar matching User UX */}
                <header className="challenge-detail-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="challenge-detail-header-inner" style={{ padding: '0 clamp(1rem, 4vw, 3rem)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button
                                onClick={() => {
                                    setSelectedChallenge(null);
                                    setFlagInput('');
                                    setSubmitStatus(null);
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s', padding: 0 }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#888' }}
                            >
                                <FaChevronLeft size={12} /> Exit Test Environment
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ color: ACCENT, fontSize: '0.85rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaFlask /> SANDBOX OVERRIDE
                            </div>
                        </div>
                    </div>
                </header>

                <main className="challenge-detail-main" style={{ padding: '2rem clamp(1rem, 4vw, 3rem)' }}>
                    {/* Challenge Title Header */}
                    <div className="challenge-detail-title-section">
                        <div className="challenge-detail-title-left">
                            <div style={{
                                width: 'clamp(40px, 8vw, 60px)', height: 'clamp(40px, 8vw, 60px)', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888',
                                flexShrink: 0,
                            }}>
                                <FaFlask size={24} style={{ color: ACCENT }} />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', color: diffColor, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700, background: `${diffColor}15`, padding: '4px 8px', borderRadius: '4px' }}>
                                        {selectedChallenge.difficulty}
                                    </span>
                                    {selectedChallenge.category && <span style={{ fontSize: '0.75rem', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>{selectedChallenge.category}</span>}
                                </div>
                                <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#fff', fontWeight: 700, letterSpacing: '-0.5px', wordBreak: 'break-word' }}>
                                    {selectedChallenge.title}
                                </h1>
                            </div>
                        </div>

                        <div className="challenge-detail-title-right">
                            <div style={{ fontSize: '0.75rem', color: '#666', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Points Potential</div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', lineHeight: '1' }}>
                                {selectedChallenge.points}
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
                                    whiteSpace: 'pre-wrap',       
                                    wordBreak: 'break-word',      
                                    overflowWrap: 'anywhere',     
                                }}>
                                    {selectedChallenge.description}
                                </div>
                            </div>

                            {/* Admin Warning Mode Block */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '12px', padding: '20px', color: '#aaa', fontWeight: 500,
                                    display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.90rem'
                                }}>
                                <FaExclamationTriangle size={20} style={{ color: '#fbbf24' }} />
                                Admin privileges verified. Validating flags in this session simulates solver pipelines but blocks actual database mutations. 
                            </motion.div>

                            {/* Flag Submission Terminal */}
                            <div className="challenge-detail-block" style={{
                                background: 'rgba(15, 15, 15, 0.6)',
                                backdropFilter: 'blur(12px)',
                                border: `1px solid rgba(255,255,255,0.08)`,
                                borderRadius: '12px',
                            }}>
                                <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, marginBottom: '1.5rem' }}>
                                    Submit Admin Test Flag
                                </div>
                                <form onSubmit={submitFlag} style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                                    <div style={{ color: '#888', fontSize: '0.85rem' }}>
                                        {selectedChallenge.flag_format ? `Strict Format Enforcement: ${selectedChallenge.flag_format}` : 'No regex flag format assigned by creator.'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <input
                                            type="text"
                                            value={flagInput}
                                            onChange={(e) => setFlagInput(e.target.value)}
                                            placeholder="Simulate user flag submission..."
                                            style={{
                                                flex: '1 1 200px', minWidth: 0, background: 'rgba(0, 0, 0, 0.4)', 
                                                border: `1px solid rgba(255,255,255,0.15)`, padding: '14px 18px',
                                                color: '#fff', borderRadius: '8px', fontSize: 'clamp(0.85rem, 2vw, 1rem)', outline: 'none', transition: 'all 0.2s',
                                                fontFamily: 'monospace', boxSizing: 'border-box'
                                            }}
                                            onFocus={e => (e.target.style.borderColor = '#fff')}
                                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
                                        />
                                        <button
                                            type="submit"
                                            disabled={submitStatus?.status === 'submitting'}
                                            style={{
                                                background: submitStatus?.status === 'success' ? 'rgba(74, 222, 128, 0.2)' : '#fff',
                                                color: submitStatus?.status === 'success' ? '#4ADE80' : '#000',
                                                border: 'none',
                                                padding: '0 clamp(16px, 3vw, 32px)', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600,
                                                cursor: 'pointer', transition: 'all 0.2s', minHeight: '48px', whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {submitStatus?.status === 'submitting' ? 'EVALUATING...' : 'Evaluate'}
                                        </button>
                                    </div>

                                    {/* Status Message */}
                                    <AnimatePresence>
                                        {submitStatus?.status === 'error' && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><FaTimesCircle /> {submitStatus.message}</motion.div>}
                                        {submitStatus?.status === 'success' && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><FaCheckCircle /> {submitStatus.message}</motion.div>}
                                    </AnimatePresence>
                                </form>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Metadata & Attachments */}
                        <div className="challenge-detail-right-col">
                            {/* Mission Assets Panel */}
                            {((selectedChallenge.files && selectedChallenge.files.length > 0) || (!selectedChallenge.files?.length && !selectedChallenge.url)) && (
                                <div style={{ background: 'rgba(15, 15, 15, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                                        Mission Assets
                                    </div>
                                    <div className="challenge-detail-block-compact" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {selectedChallenge.files && selectedChallenge.files.length > 0 ? (
                                            selectedChallenge.files.map((f, i) => (
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
                            {selectedChallenge.url && (
                                <div style={{ background: 'rgba(15, 15, 15, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>
                                        Target Environment
                                    </div>
                                    <div className="challenge-detail-block-compact" style={{ display: 'flex', flexDirection: 'column' }}>
                                        <a href={selectedChallenge.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.1)', textDecoration: 'none', transition: 'all 0.2s', wordBreak: 'break-word', overflowWrap: 'anywhere' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                                <div style={{ color: '#38bdf8', flexShrink: 0 }}><FaLink size={16} /></div>
                                                <div style={{ color: '#38bdf8', fontSize: '0.9rem', fontWeight: 600 }}>Launch Target Environment</div>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Hints Panel Output */}
                            <div style={{ background: 'rgba(15, 15, 15, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Hints Configuration</span>
                                    <span style={{ fontSize: '0.7rem', color: ACCENT, border: `1px solid ${ACCENT}`, padding: '2px 6px', borderRadius: '4px' }}>ADMIN BYPASS</span>
                                </div>
                                <div className="challenge-detail-block-compact" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {selectedChallenge.hints && selectedChallenge.hints.length > 0 ? selectedChallenge.hints.map((hint, i) => (
                                        <div key={hint.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ color: '#888', fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Hint Node #{i + 1}</span>
                                                <span>Penalty: {hint.cost} pts</span>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', color: '#d0d0d0', fontSize: '0.9rem', wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                                {hint.content}
                                            </div>
                                        </div>
                                    )) : <div style={{ color: '#666', fontSize: '0.85rem', padding: '10px 0' }}>No hints have been attached to this challenge configuration.</div>}
                                </div>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="admin-test-challenges-wrapper" style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: '3rem', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
            <div className="challenges-page">
                {/* ── Main Grid Heading ── */}
                <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="challenges-header" style={{ marginBottom: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', letterSpacing: '3px', color: '#555', fontFamily: 'Orbitron, sans-serif', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>| TEST ARENA ACTIVE</span>
                        </div>
                        <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                            <FaFlask style={{ color: ACCENT }} /> Environment
                        </h1>
                        <p style={{ margin: '4px 0 0', color: '#555', fontSize: '0.85rem' }}>Event Node: {eventName}</p>
                        
                        <div style={{ marginTop: '15px', padding: '12px 15px', background: 'rgba(255, 255, 255, 0.05)', borderLeft: '3px solid #555', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            <FaExclamationTriangle style={{ color: '#aaa' }} />
                            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
                                Sandbox mode active. Testing flags here will NOT alter the database solver tables.
                            </span>
                        </div>
                    </div>
                    <div className="challenges-header-right" style={{ alignSelf: 'flex-start' }}>
                        <div className="challenges-stats-row">
                            <div className="challenges-stat-box">
                                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: ACCENT }}>{challenges.length}</div>
                                <div style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Tests</div>
                            </div>
                        </div>
                        <div style={{ position: 'relative', width: '54px', height: '54px' }}>
                            <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                                <circle cx="27" cy="27" r="22" fill="none" stroke={ACCENT} strokeWidth="4"
                                    strokeDasharray={`${2 * Math.PI * 22}`}
                                    strokeDashoffset="0"
                                    style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 4px ${ACCENT}60)` }} />
                            </svg>
                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, fontWeight: 900, fontSize: '0.75rem' }}><FaFlask /></span>
                        </div>
                    </div>
                </motion.div>

                {/* Filters & Search - Responsive Grid Fix */}
                <div className="admin-test-filters-row">
                    <div className="admin-test-search-box">
                        <FaFlask style={{ color: '#555', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search tests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '12px 10px', outline: 'none', minWidth: 0 }}
                        />
                    </div>
                    
                    <div className="admin-test-selects-wrapper">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={`cat-${cat}`} value={cat} style={{ background: '#111' }}>{cat}</option>
                            ))}
                        </select>

                        {availableWaves.length > 0 && (
                            <select
                                value={waveFilter}
                                onChange={(e) => setWaveFilter(e.target.value)}
                            >
                                {availableWaves.map(wave => (
                                    <option key={`wave-${wave}`} value={wave} style={{ background: '#111' }}>{wave}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* ── CHALLENGE GRID ── */}
                {Object.entries(grouped).map(([category, chs]) => (
                    <div key={category} style={{ marginBottom: '3rem' }}>
                        {/* Section header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.2rem' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: `${catColor(category)}12`,
                                border: `1px solid ${catColor(category)}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: catColor(category), fontSize: '0.9rem'
                            }}>
                                {catIcon(category)}
                            </div>
                            <h2 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'Orbitron, sans-serif' }}>
                                {category}
                            </h2>
                            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, transparent 100%)` }} />
                            <span style={{ fontSize: '0.75rem', color: '#555', letterSpacing: '1px' }}>
                                {chs.length} Challenges
                            </span>
                        </div>

                        <div className="challenges-card-grid">
                            <AnimatePresence mode="popLayout">
                                {chs.map((ch, idx) => (
                                    <motion.div key={ch.id}
                                        layout
                                        initial={{ opacity: 0, y: 14, scale: 0.95 }} 
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }} 
                                        transition={{ delay: idx * 0.04 }}
                                        whileHover={{ y: -5, boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 20px ${ACCENT}18` }}
                                        onClick={() => {
                                            setSelectedChallenge(ch);
                                            setSubmitStatus(null);
                                            setFlagInput('');
                                        }}
                                        className="challenge-card-item"
                                        style={{
                                            background: `rgba(15, 15, 15, 0.6)`,
                                            backdropFilter: 'blur(12px)',
                                            border: `1px solid rgba(255,255,255,0.07)`,
                                            borderRadius: '16px',
                                            cursor: 'pointer',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${ACCENT}08`,
                                            transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                                        }}>

                                        {/* Green radial glow at top */}
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, right: 0, height: '160px',
                                            background: `radial-gradient(ellipse at 50% 0%, ${ACCENT}12 0%, transparent 70%)`,
                                            pointerEvents: 'none'
                                        }} />
                                        {/* Bottom subtle green tint */}
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
                                            background: `linear-gradient(0deg, ${ACCENT}05 0%, transparent 100%)`,
                                            pointerEvents: 'none'
                                        }} />

                                        {/* Card body */}
                                        <div className="challenge-card-body" style={{ padding: '1.5rem 1.5rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, zIndex: 1 }}>
                                            
                                            {/* Top row: category badge + difficulty + icon */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    padding: '5px 11px',
                                                    background: `${catColor(ch.category)}12`,
                                                    border: `1px solid ${catColor(ch.category)}28`,
                                                    borderRadius: '20px',
                                                    color: catColor(ch.category),
                                                    fontSize: '0.7rem', fontWeight: 700,
                                                    textTransform: 'capitalize', letterSpacing: '0.3px'
                                                }}>
                                                    {catIcon(ch.category)} {ch.category}
                                                </div>
                                                <div style={{
                                                    padding: '4px 10px',
                                                    background: `${DIFF_COLOR[ch.difficulty] || '#777'}10`,
                                                    border: `1px solid ${DIFF_COLOR[ch.difficulty] || '#777'}22`,
                                                    borderRadius: '20px',
                                                    color: DIFF_COLOR[ch.difficulty] || '#777',
                                                    fontSize: '0.7rem', fontWeight: 600,
                                                }}>
                                                    {DIFF_LABEL[ch.difficulty] || ch.difficulty}
                                                </div>
                                                <div style={{ marginLeft: 'auto', width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.85rem', flexShrink: 0 }}>
                                                    <FaFlask />
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: '0 0 6px', color: '#f2f2f2', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.45, letterSpacing: '-0.01em' }}>
                                                    {ch.title}
                                                </h3>
                                                {ch.description && (
                                                    <p style={{ margin: 0, color: '#555', fontSize: '0.8rem', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {ch.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Points & Wave */}
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                                                <span style={{ fontSize: '2.4rem', fontWeight: 700, color: '#e8e8e8', fontFamily: "'Playfair Display', serif", lineHeight: 1, letterSpacing: '-0.5px' }}>
                                                    {ch.points}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#555', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>pts</span>
                                                {ch.wave_name && (
                                                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.2)' }}>
                                                        WAVE: {ch.wave_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Full-width CTA button */}
                                        <div className="challenge-card-cta" style={{ padding: '0 1.2rem 1.2rem', zIndex: 1 }}>
                                            <div style={{
                                                width: '100%',
                                                padding: '12px',
                                                borderRadius: '10px',
                                                textAlign: 'center',
                                                background: `${ACCENT}0e`,
                                                border: `1px solid ${ACCENT}22`,
                                                color: `${ACCENT}cc`,
                                                fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.5px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                boxSizing: 'border-box',
                                                transition: 'all 0.2s'
                                            }}>
                                                <FaFlask style={{ fontSize: '0.72rem' }} /> Enter Test Environment
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}

                {filteredChallenges.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#444' }}>
                        <FaFlask style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.2 }} />
                        <p style={{ color: '#555' }}>No test challenges match the current filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTestChallenges;
