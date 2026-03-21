import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useParams, Link, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaTimes, FaTrophy, FaStar, FaUser, FaCrosshairs, FaExchangeAlt, FaSearch, FaBullseye, FaBan, FaDownload, FaPencilAlt, FaEye, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import CustomAlert from './CustomAlert';

function AdminEventUserDetail() {
    const { id, userId } = useParams();
    const location = useLocation();
    const fromParticipants = new URLSearchParams(location.search).get('from') === 'participants';
    const [loading, setLoading] = useState(true);
    const [eventName, setEventName] = useState('');
    const [username, setUsername] = useState('');
    const [rank, setRank] = useState('—');
    const [points, setPoints] = useState(0);
    const [solves, setSolves] = useState(0);
    const [submissions, setSubmissions] = useState([]);
    const [filter, setFilter] = useState('all');
    const [leaderboard, setLeaderboard] = useState([]);

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    const [compareQuery, setCompareQuery] = useState('');
    const [compareUser, setCompareUser] = useState(null);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareError, setCompareError] = useState('');
    const [showCompareModal, setShowCompareModal] = useState(false);
    const [isBanned, setIsBanned] = useState(false);
    const [banLoading, setBanLoading] = useState(false);

    const [writeupsModal, setWriteupsModal] = useState(false);
    const [userWriteups, setUserWriteups] = useState([]);
    const [writeupsLoading, setWriteupsLoading] = useState(false);
    const [expandedWriteupIndex, setExpandedWriteupIndex] = useState(null);

    const [hintsModal, setHintsModal] = useState(false);
    const [userHints, setUserHints] = useState([]);

    const handleViewWriteups = async () => {
        setWriteupsModal(true);
        setWriteupsLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
            const res = await fetch(`/api/admin/event/${id}/user/${userId}/writeups/`, { headers });
            const data = await res.json();
            if (res.ok) {
                setUserWriteups(data.writeups || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setWriteupsLoading(false);
        }
    };

    useEffect(() => {
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
        Promise.all([
            fetch(`/api/admin/event/${id}/leaderboard/`, { headers }),
            fetch(`/api/admin/event/${id}/leaderboard/${userId}/submissions/`, { headers })
        ])
            .then(([lbRes, subRes]) => Promise.all([lbRes.json(), subRes.json()]))
            .then(([lbData, subData]) => {
                setEventName(subData.event_name || lbData.event_name || '');
                setUsername(subData.username || '');
                setSubmissions(subData.submissions || []);
                setUserHints(subData.hints_taken || []);
                setLeaderboard(lbData.leaderboard || []);
                setIsBanned(subData.is_banned || false);
                const entry = (lbData.leaderboard || []).find(e => String(e.user_id) === String(userId));
                if (entry) { setRank(entry.rank); setPoints(entry.total_points); setSolves(entry.solves); }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id, userId]);

    const handleCompare = async () => {
        const query = compareQuery.trim().toLowerCase();
        if (!query) return;
        const rival = leaderboard.find(e => e.username.toLowerCase() === query);
        if (!rival) { setCompareError('User not found in this event'); setCompareUser(null); return; }

        setCompareLoading(true);
        setCompareError('');
        try {
            const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
            const res = await fetch(`/api/admin/event/${id}/leaderboard/${rival.user_id}/submissions/`, { headers });
            const data = await res.json();
            const subs = data.submissions || [];
            const rivalCorrectSubs = subs.filter(s => s.is_correct);
            const rivalAccuracy = subs.length > 0 ? ((rivalCorrectSubs.length / subs.length) * 100).toFixed(1) : '0.0';
            setCompareUser({
                username: rival.username, rank: rival.rank, points: rival.total_points, solves: rival.solves,
                correctCount: rivalCorrectSubs.length, incorrectCount: subs.filter(s => !s.is_correct).length,
                totalSubs: subs.length, accuracy: rivalAccuracy, correctSubs: rivalCorrectSubs
            });
            setShowCompareModal(true);
        } catch {
            setCompareError('Failed to fetch rival data');
            setCompareUser(null);
        } finally {
            setCompareLoading(false);
        }
    };

    const handleExportData = () => {
        const correctSubs = submissions.filter(s => s.is_correct);
        let csvContent = "Event Name,Username,Total Points,Total Solves\n";
        csvContent += `"${eventName}","${username}",${points},${solves}\n\n`;

        csvContent += "Correct Submissions\n";
        csvContent += "No.,Challenge Title,Timestamp\n";

        if (correctSubs.length === 0) {
            csvContent += "No correct submissions found.,,\n";
        } else {
            correctSubs.forEach((sub, index) => {
                const safeTitle = sub.challenge_title.replace(/"/g, '""');
                csvContent += `${index + 1},"${safeTitle}","${sub.submitted_at}"\n`;
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${username}_${eventName.replace(/\s+/g, '_')}_export.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) return <div className="loading-text">Loading...</div>;

    const filtered = submissions.filter(s => {
        if (filter === 'correct') return s.is_correct;
        if (filter === 'incorrect') return !s.is_correct;
        return true;
    });

    const correctCount = submissions.filter(s => s.is_correct).length;
    const incorrectCount = submissions.filter(s => !s.is_correct).length;
    const accuracy = submissions.length > 0 ? ((correctCount / submissions.length) * 100).toFixed(1) : '0.0';

    const statWinner = (v1, v2, higherWins = true) => {
        const a = typeof v1 === 'string' ? parseFloat(v1) : v1;
        const b = typeof v2 === 'string' ? parseFloat(v2) : v2;
        if (isNaN(a) || isNaN(b) || a === b) return '';
        if (higherWins) return a > b ? 'winner' : 'loser';
        return a < b ? 'winner' : 'loser';
    };

    const myCorrectSubs = submissions.filter(s => s.is_correct);
    const timestampChallenges = compareUser
        ? [...new Set([...myCorrectSubs.map(s => s.challenge_title), ...compareUser.correctSubs.map(s => s.challenge_title)])]
        : [];

    // Compare Modal
    const compareModal = (showCompareModal && compareUser) ? ReactDOM.createPortal(
        <div className="cmp-overlay" onClick={() => setShowCompareModal(false)}>
            <div className="cmp-modal" onClick={e => e.stopPropagation()}>
                <button className="cmp-close" onClick={() => setShowCompareModal(false)}><FaTimes /></button>

                <h2 className="cmp-title">
                    <FaExchangeAlt style={{ marginRight: '10px', color: '#00ff41' }} />
                    {username} vs {compareUser.username}
                </h2>

                <div className="eud-compare-table">
                    <div className="eud-compare-header-row">
                        <div className="eud-compare-label"></div>
                        <div className="eud-compare-player">{username}</div>
                        <div className="eud-compare-player">{compareUser.username}</div>
                    </div>
                    {[
                        { label: 'Rank', v1: rank, v2: compareUser.rank, fmt: v => `#${v}`, higher: false },
                        { label: 'Points', v1: points, v2: compareUser.points, fmt: v => v, higher: true },
                        { label: 'Solves', v1: solves, v2: compareUser.solves, fmt: v => v, higher: true },
                        { label: 'Correct', v1: correctCount, v2: compareUser.correctCount, fmt: v => v, higher: true },
                        { label: 'Wrong', v1: incorrectCount, v2: compareUser.incorrectCount, fmt: v => v, higher: false },
                        { label: 'Total Attempts', v1: submissions.length, v2: compareUser.totalSubs, fmt: v => v, higher: null },
                        { label: 'Accuracy', v1: parseFloat(accuracy), v2: parseFloat(compareUser.accuracy), fmt: v => `${v}%`, higher: true },
                    ].map((row, i) => (
                        <div key={i} className="eud-compare-row">
                            <div className="eud-compare-label">{row.label}</div>
                            <div className={`eud-compare-val ${row.higher !== null ? statWinner(row.v1, row.v2, row.higher) : ''}`}>{row.fmt(row.v1)}</div>
                            <div className={`eud-compare-val ${row.higher !== null ? statWinner(row.v2, row.v1, row.higher) : ''}`}>{row.fmt(row.v2)}</div>
                        </div>
                    ))}
                </div>

                {timestampChallenges.length > 0 && (
                    <>
                        <h3 className="cmp-subtitle">Solve Timestamps</h3>
                        <div className="eud-compare-table">
                            <div className="eud-compare-header-row">
                                <div className="eud-compare-label">Challenge</div>
                                <div className="eud-compare-player">{username}</div>
                                <div className="eud-compare-player">{compareUser.username}</div>
                            </div>
                            {timestampChallenges.map((ch, i) => {
                                const mySub = myCorrectSubs.find(s => s.challenge_title === ch);
                                const rivalSub = compareUser.correctSubs.find(s => s.challenge_title === ch);
                                return (
                                    <div key={i} className="eud-compare-row">
                                        <div className="eud-compare-label" style={{ fontWeight: 600, color: '#ccc' }}>{ch}</div>
                                        <div className="eud-compare-val" style={{ fontSize: '0.8rem', color: '#888' }}>{mySub ? mySub.submitted_at : '—'}</div>
                                        <div className="eud-compare-val" style={{ fontSize: '0.8rem', color: '#888' }}>{rivalSub ? rivalSub.submitted_at : '—'}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    ) : null;

    // WriteUps Modal
    const writeupsPortal = writeupsModal ? ReactDOM.createPortal(
        <div className="cmp-overlay" onClick={() => setWriteupsModal(false)} style={{ backdropFilter: 'blur(4px)' }}>
            <div className="cmp-modal" onClick={e => e.stopPropagation()} style={{
                maxWidth: '850px', width: '95%',
                background: 'linear-gradient(145deg, rgba(15,15,15,0.95) 0%, rgba(5,5,5,0.95) 100%)',
                border: '1px solid rgba(0,255,65,0.3)',
                boxShadow: '0 0 30px rgba(0,255,65,0.15), inset 0 0 20px rgba(0,0,0,0.8)',
                borderRadius: '12px', padding: '25px', fontFamily: "'Share Tech Mono', monospace"
            }}>
                <button className="cmp-close" onClick={() => setWriteupsModal(false)} style={{ color: '#00ff41', opacity: 0.8 }}><FaTimes /></button>
                <h2 className="cmp-title" style={{ color: '#fff', borderBottom: '1px solid rgba(0,255,65,0.2)', paddingBottom: '20px', marginBottom: '25px', display: 'flex', alignItems: 'center', fontFamily: "'Orbitron', sans-serif" }}>
                    <FaPencilAlt style={{ marginRight: '15px', color: '#00ff41', filter: 'drop-shadow(0 0 5px rgba(0,255,65,0.5))' }} />
                    <span style={{ color: '#00ff41', marginRight: '8px' }}>{username}'s</span> WriteUps
                </h2>

                {writeupsLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#00ff41', fontFamily: "'Orbitron', sans-serif" }}>DECRYPTING WRITEUPS...</div>
                ) : userWriteups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#555', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px dashed #333' }}>
                        <FaPencilAlt style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.2 }} />
                        <div style={{ fontSize: '1.1rem', fontFamily: "'Orbitron', sans-serif" }}>NO WRITEUPS FOUND</div>
                        <div style={{ fontSize: '0.9rem', marginTop: '10px' }}>This user hasn't submitted any write-ups for this event yet.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                        {userWriteups.map((w, i) => {
                            const isExpanded = expandedWriteupIndex === i;
                            return (
                                <div key={i} style={{
                                    background: isExpanded ? 'rgba(0,255,65,0.03)' : 'rgba(10,10,10,0.6)',
                                    border: `1px solid ${isExpanded ? 'rgba(0,255,65,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                    borderRadius: '8px', overflow: 'hidden', transition: 'all 0.3s ease',
                                    boxShadow: isExpanded ? '0 0 15px rgba(0,255,65,0.05)' : 'none'
                                }}>
                                    <div
                                        onClick={() => setExpandedWriteupIndex(isExpanded ? null : i)}
                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', cursor: 'pointer', background: isExpanded ? 'rgba(0,255,65,0.08)' : 'transparent', borderBottom: isExpanded ? '1px solid rgba(0,255,65,0.2)' : 'none', transition: 'background 0.2s ease' }}
                                    >
                                        <div>
                                            <h3 style={{ margin: '0 0 8px 0', color: isExpanded ? '#00ff41' : '#ddd', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Orbitron', sans-serif" }}>
                                                <span style={{ color: '#00ff41', fontSize: '0.8rem' }}>&gt;_</span>
                                                {w.challenge_title}
                                            </h3>
                                            <div style={{ fontSize: '0.85rem', color: '#777' }}>
                                                <span style={{ color: '#444' }}>[</span> Submitted: <span style={{ color: '#aaa' }}>{w.submitted_at ? new Date(w.submitted_at).toLocaleString() : 'UNKNOWN'}</span> <span style={{ color: '#444' }}>]</span>
                                            </div>
                                        </div>
                                        <div style={{ color: isExpanded ? '#00ff41' : '#666', fontSize: '1.2rem', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease, color 0.3s ease' }}>
                                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div style={{ padding: '20px', background: 'rgba(5,5,5,0.9)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: '15px' }}>
                                                <span style={{ color: '#555', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Payload_Content</span>
                                                <span style={{ color: '#00ff41', fontSize: '0.8rem', opacity: 0.5 }}>length: {w.content?.length || 0} chars</span>
                                            </div>
                                            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#ccc', background: 'transparent', padding: '0', borderRadius: '0', border: 'none', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>
                                                {w.content || '/* No content provided */'}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>,
        document.body
    ) : null;

    // Hints Modal
    const hintsPortal = hintsModal ? ReactDOM.createPortal(
        <div className="cmp-overlay" onClick={() => setHintsModal(false)} style={{ backdropFilter: 'blur(4px)' }}>
            <div className="cmp-modal" onClick={e => e.stopPropagation()} style={{
                maxWidth: '600px', width: '95%',
                background: 'linear-gradient(145deg, rgba(15,15,15,0.95) 0%, rgba(5,5,5,0.95) 100%)',
                border: '1px solid rgba(255,149,0,0.3)',
                boxShadow: '0 0 30px rgba(255,149,0,0.15), inset 0 0 20px rgba(0,0,0,0.8)',
                borderRadius: '12px', padding: '25px', fontFamily: "'Share Tech Mono', monospace"
            }}>
                <button className="cmp-close" onClick={() => setHintsModal(false)} style={{ color: '#ff9500', opacity: 0.8 }}><FaTimes /></button>
                <h2 className="cmp-title" style={{ color: '#fff', borderBottom: '1px solid rgba(255,149,0,0.2)', paddingBottom: '20px', marginBottom: '25px', display: 'flex', alignItems: 'center', fontFamily: "'Orbitron', sans-serif" }}>
                    <FaStar style={{ marginRight: '15px', color: '#ff9500', filter: 'drop-shadow(0 0 5px rgba(255,149,0,0.5))' }} />
                    <span style={{ color: '#ff9500', marginRight: '8px' }}>{username}'s</span> Hints
                </h2>

                {userHints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#555', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px dashed #333' }}>
                        <FaStar style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.2 }} />
                        <div style={{ fontSize: '1.1rem', fontFamily: "'Orbitron', sans-serif" }}>NO HINTS TAKEN</div>
                        <div style={{ fontSize: '0.9rem', marginTop: '10px' }}>This user hasn't unlocked any hints yet.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                        {userHints.map((h, i) => (
                            <div key={i} style={{ background: 'rgba(10,10,10,0.6)', border: '1px solid rgba(255,149,0,0.15)', borderRadius: '8px', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '5px', fontFamily: "'Orbitron', sans-serif" }}>{h.challenge_title}</div>
                                    <div style={{ color: '#777', fontSize: '0.85rem' }}>{h.unlocked_at}</div>
                                </div>
                                <div style={{ background: 'rgba(255,149,0,0.1)', color: '#ff9500', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    -{h.cost} pts
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />
            {compareModal}
            {writeupsPortal}
            {hintsPortal}
            <Link to={fromParticipants ? `/administration/event/${id}/participants` : `/administration/event/${id}/submissions`} className="admin-back-link">
                <FaArrowLeft /> {fromParticipants ? 'Back to Participants' : 'Back to Live Submissions'}
            </Link>

            <div className="eud-header">
                <div className="eud-avatar"><FaUser /></div>
                <div>
                    <h1 className="eud-username">{username}</h1>
                    <p className="eud-event-name">{eventName}</p>
                </div>
                <button
                    className={`eud-ban-btn ${isBanned ? 'banned' : ''}`}
                    disabled={banLoading}
                    onClick={() => {
                        const action = isBanned ? 'UNBAN' : 'BAN';
                        setAlertConfig({
                            title: 'Are you sure?',
                            message: `Do you really want to ${action} ${username}?`,
                            type: isBanned ? 'alert' : 'danger',
                            confirmText: `Yes, ${action}!`,
                            onCancel: () => setAlertOpen(false),
                            onConfirm: async () => {
                                setAlertOpen(false);
                                setBanLoading(true);
                                try {
                                    const res = await fetch(`/api/admin/event/${id}/participant/${userId}/ban/`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                    });
                                    const data = await res.json();
                                    if (res.ok) setIsBanned(data.is_banned);
                                    else alert(data.error || 'Failed to toggle ban');
                                } catch (e) {
                                    console.error(e);
                                    alert('Network error');
                                } finally {
                                    setBanLoading(false);
                                }
                            }
                        });
                        setAlertOpen(true);
                    }}
                >
                    <FaBan /> {banLoading ? '...' : isBanned ? 'Unban' : 'Ban'}
                </button>
                <button
                    className="eud-ban-btn"
                    style={{ background: 'transparent', border: '1px solid #00ff41', color: '#00ff41', marginLeft: '10px' }}
                    onClick={handleExportData}
                >
                    <FaDownload /> Export Data
                </button>
                <button
                    className="eud-ban-btn"
                    style={{ background: 'transparent', border: '1px solid #17a2b8', color: '#17a2b8', marginLeft: '10px' }}
                    onClick={handleViewWriteups}
                >
                    <FaEye /> View WriteUps
                </button>
                <button
                    className="eud-ban-btn"
                    style={{ background: 'transparent', border: '1px solid #ff9500', color: '#ff9500', marginLeft: '10px' }}
                    onClick={() => setHintsModal(true)}
                >
                    <FaEye /> Hints Taken
                </button>
            </div>

            <div className="eud-stats-row">
                <div className="eud-stat-card">
                    <FaTrophy className="eud-stat-icon" style={{ color: '#FFD700' }} />
                    <span className="eud-stat-value">#{rank}</span>
                    <span className="eud-stat-label">Rank</span>
                </div>
                <div className="eud-stat-card">
                    <FaStar className="eud-stat-icon" style={{ color: '#00ff41' }} />
                    <span className="eud-stat-value">{points}</span>
                    <span className="eud-stat-label">Points</span>
                </div>
                <div className="eud-stat-card">
                    <FaCrosshairs className="eud-stat-icon" style={{ color: '#00bfff' }} />
                    <span className="eud-stat-value">{solves}</span>
                    <span className="eud-stat-label">Solves</span>
                </div>
                <div className="eud-stat-card">
                    <FaBullseye className="eud-stat-icon" style={{ color: '#ff9500' }} />
                    <span className="eud-stat-value">{accuracy}%</span>
                    <span className="eud-stat-label">Accuracy</span>
                </div>
            </div>

            {/* Compare Search */}
            <div className="eud-section">
                <div className="eud-section-header">
                    <h2 className="eud-section-title"><FaExchangeAlt style={{ marginRight: '8px' }} />Compare with Player</h2>
                </div>
                <div className="eud-compare-search-wrapper">
                    <div className="eud-compare-search">
                        <FaSearch className="eud-compare-search-icon" />
                        <input
                            type="text"
                            className="eud-compare-input"
                            placeholder="Enter username to compare..."
                            value={compareQuery}
                            onChange={e => setCompareQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCompare()}
                        />
                        <button className="eud-compare-btn" onClick={handleCompare} disabled={compareLoading}>
                            {compareLoading ? 'Loading...' : 'Compare'}
                        </button>
                    </div>
                    {compareQuery.trim().length > 0 && (() => {
                        const q = compareQuery.trim().toLowerCase();
                        const suggestions = leaderboard
                            .filter(e => e.username.toLowerCase().includes(q) && String(e.user_id) !== String(userId))
                            .slice(0, 6);
                        if (suggestions.length === 0) return null;
                        return (
                            <div className="eud-suggestions">
                                {suggestions.map(s => (
                                    <div key={s.user_id} className="eud-suggestion-item" onClick={() => { setCompareQuery(s.username); }}>
                                        <span className="eud-suggestion-name">{s.username}</span>
                                        <span className="eud-suggestion-meta">Rank #{s.rank} &middot; {s.total_points} pts</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
                {compareError && <div className="eud-compare-error">{compareError}</div>}
            </div>

            {/* Submission History */}
            <div className="eud-section" style={{ marginTop: '10px' }}>
                <div className="eud-section-header">
                    <h2 className="eud-section-title">Submission History</h2>
                    <div className="eud-filters">
                        <button className={`eud-filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                            All ({submissions.length})
                        </button>
                        <button className={`eud-filter-pill correct ${filter === 'correct' ? 'active' : ''}`} onClick={() => setFilter('correct')}>
                            Correct ({correctCount})
                        </button>
                        <button className={`eud-filter-pill incorrect ${filter === 'incorrect' ? 'active' : ''}`} onClick={() => setFilter('incorrect')}>
                            Wrong ({incorrectCount})
                        </button>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="eud-empty">No submissions match this filter.</div>
                ) : (
                    <div className="eud-submissions">
                        {filtered.map((s, i) => (
                            <div key={i} className={`eud-sub-row ${s.is_correct ? 'correct' : 'incorrect'}`}>
                                <div className="eud-sub-challenge">{s.challenge_title}</div>
                                <div className="eud-sub-flag">{s.flag}</div>
                                <div className="eud-sub-time">{s.submitted_at}</div>
                                <div className="eud-sub-result">
                                    {s.is_correct ? (
                                        <span className="eud-badge-correct"><FaCheck /> Correct</span>
                                    ) : (
                                        <span className="eud-badge-incorrect"><FaTimes /> Wrong</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default AdminEventUserDetail;
