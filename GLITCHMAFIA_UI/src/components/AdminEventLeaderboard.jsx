import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaTrophy, FaArrowLeft, FaEye, FaTimes, FaCheck, FaUsers, FaCrown, FaUser, FaShieldAlt, FaBan } from 'react-icons/fa';
import CustomAlert from './CustomAlert';

/* ─── tiny shared helpers ─────────────────────────────────────────── */
const headers = () => ({  });

const RankBadge = ({ rank }) => {
    const color = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#555';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: '50%',
            background: rank <= 3 ? color : 'transparent',
            border: rank <= 3 ? `2px solid ${color}` : '2px solid #333',
            color: rank <= 3 ? '#000' : '#888',
            fontWeight: 'bold', fontSize: '0.78rem'
        }}>
            {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
        </span>
    );
};

/* ════════════════════════════════════════════════════════════════════
   TEAM LEADERBOARD (is_team_mode = true)
   ════════════════════════════════════════════════════════════════════ */
function TeamLeaderboard({ eventId, eventName, teams, refresh }) {
    const [modalTeam, setModalTeam] = useState(null);
    const [activeTab, setActiveTab] = useState('members');
    const [submissions, setSubmissions] = useState([]);
    const [hintsTaken, setHintsTaken] = useState([]);
    const [subsLoading, setSubsLoading] = useState(false);
    const [subsFilter, setSubsFilter] = useState('all');
    const [togglingBan, setTogglingBan] = useState(false);

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    const openModal = (team) => {
        setModalTeam(team);
        setActiveTab('members');
        setSubmissions([]);
        setHintsTaken([]);
        setSubsFilter('all');
    };

    const loadSubmissions = async (team) => {
        if (submissions.length > 0 && hintsTaken.length > 0) return; // already loaded
        setSubsLoading(true);
        try {
            const res = await fetch(`/api/admin/event/${eventId}/team/${team.team_id}/submissions/`, { headers: headers() });
            const data = await res.json();
            setSubmissions(data.submissions || []);
            setHintsTaken(data.hints_taken || []);
        } catch { setSubmissions([]); setHintsTaken([]); }
        finally { setSubsLoading(false); }
    };

    const switchTab = (tab, team) => {
        setActiveTab(tab);
        if (tab === 'submissions' || tab === 'hints') loadSubmissions(team);
    };

    const handleToggleBan = () => {
        if (!modalTeam) return;
        const willBan = !modalTeam.members.every(m => m.is_banned);
        const action = willBan ? 'BAN' : 'UNBAN';

        setAlertConfig({
            title: 'Are you sure?',
            message: `Do you really want to ${action} the entire team "${modalTeam.team_name}"?`,
            type: willBan ? 'danger' : 'alert',
            confirmText: `Yes, ${action} TEAM!`,
            onCancel: () => setAlertOpen(false),
            onConfirm: async () => {
                setAlertOpen(false);
                setTogglingBan(true);
                try {
                    const res = await fetch(`/api/admin/event/${eventId}/team/${modalTeam.team_id}/ban/`, {
                        method: 'POST',
                        headers: headers()
                    });
                    if (res.ok) {
                        await refresh(); // Refresh parent leaderboard data
                        setModalTeam(null); // Close modal 
                    } else {
                        const data = await res.json();
                        alert(`Failed to toggle ban: ${data.error || 'Unknown error'}`);
                    }
                } catch (err) {
                    alert("Error: " + err.message);
                } finally {
                    setTogglingBan(false);
                }
            }
        });
        setAlertOpen(true);
    };

    const filteredSubs = submissions.filter(s => {
        if (subsFilter === 'correct') return s.is_correct;
        if (subsFilter === 'wrong') return !s.is_correct;
        return true;
    });

    return (
        <>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />
            <div className="admin-table-container">
                <h2 style={{ color: '#fff', marginBottom: 20, fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 'clamp(0.95rem, 2.5vw, 1.4rem)' }}>
                    <FaTrophy color="#ffaa00" /> Team Standings
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#555', fontFamily: 'monospace' }}>
                        {teams.length} team{teams.length !== 1 ? 's' : ''}
                    </span>
                </h2>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Team</th>
                            <th>Captain</th>
                            <th>Members</th>
                            <th>Points</th>
                            <th>Solves</th>
                            <th>Last Solve</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map(t => (
                            <tr key={t.team_id}>
                                <td><RankBadge rank={t.rank} /></td>
                                <td>
                                    <span style={{ color: '#fff', fontWeight: 700, textDecoration: t.members.every(m => m.is_banned) ? 'line-through' : 'none' }}>
                                        {t.team_name}
                                        {t.members.every(m => m.is_banned) ? (
                                            <span style={{ marginLeft: 6, fontSize: '0.65rem', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.4)', color: '#ff3b30', borderRadius: 4, padding: '2px 6px' }}>BANNED</span>
                                        ) : t.members.some(m => m.is_banned) ? (
                                            <span style={{ marginLeft: 6, fontSize: '0.65rem', background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.4)', color: '#ff9500', borderRadius: 4, padding: '2px 6px' }}>PARTIAL BAN</span>
                                        ) : null}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#FFD700', fontSize: '0.85rem' }}>
                                        <FaCrown style={{ fontSize: '0.7rem' }} />{t.captain}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ color: '#aaa' }}>{t.member_count}</span>
                                </td>
                                <td style={{ color: '#00ff41', fontWeight: 'bold' }}>{t.total_points}</td>
                                <td>{t.solves}</td>
                                <td style={{ color: '#666', fontSize: '0.82rem' }}>{t.last_solve || '—'}</td>
                                <td>
                                    <button className="admin-btn-action-view" onClick={() => openModal(t)}>
                                        <FaEye /> View Team
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {teams.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>No teams yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Team Detail Modal ─────────────────────────────────── */}
            {modalTeam && (
                <div className="admin-modal-overlay" onClick={() => setModalTeam(null)} style={{ zIndex: 9999 }}>
                    <div className="admin-modal-content" style={{ maxWidth: 860, width: '95%' }} onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="admin-modal-header" style={{ borderBottom: '1px solid rgba(0,255,65,0.15)', paddingBottom: 14, marginBottom: 0 }}>
                            <div>
                                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 'clamp(0.9rem, 2.5vw, 1.3rem)' }}>
                                    <FaShieldAlt style={{ color: '#00ff41' }} />
                                    {modalTeam.team_name}
                                    <span style={{ fontSize: '0.72rem', background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.3)', color: '#00ff41', borderRadius: 12, padding: '2px 10px' }}>
                                        Rank #{modalTeam.rank}
                                    </span>
                                    {modalTeam.members.every(m => m.is_banned) && (
                                        <span style={{ fontSize: '0.72rem', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.4)', color: '#ff3b30', borderRadius: 12, padding: '2px 10px', marginLeft: 6 }}>
                                            BANNED
                                        </span>
                                    )}
                                </h2>
                                <div style={{ fontSize: '0.82rem', color: '#555', marginTop: 4 }}>
                                    {modalTeam.total_points} pts · {modalTeam.solves} solve{modalTeam.solves !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <button
                                    onClick={handleToggleBan}
                                    disabled={togglingBan}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid #ff3b30',
                                        color: '#ff3b30',
                                        padding: '6px 14px',
                                        borderRadius: 4,
                                        cursor: togglingBan ? 'not-allowed' : 'pointer',
                                        fontFamily: 'Orbitron',
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        opacity: togglingBan ? 0.5 : 1,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <FaBan /> {
                                        modalTeam.members.every(m => m.is_banned) ? 'UNBAN TEAM' :
                                            modalTeam.members.some(m => m.is_banned) ? 'BAN REST OF TEAM' : 'BAN TEAM'
                                    }
                                </button>
                                <button className="admin-modal-close" onClick={() => setModalTeam(null)}>
                                    <FaTimes />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #1a1a1a', marginBottom: 16 }}>
                            {['members', 'submissions', 'hints'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => switchTab(tab, modalTeam)}
                                    style={{
                                        padding: '10px 22px', background: 'transparent', border: 'none',
                                        borderBottom: activeTab === tab ? '2px solid #00ff41' : '2px solid transparent',
                                        color: activeTab === tab ? '#00ff41' : '#555',
                                        cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '0.75rem',
                                        letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.2s'
                                    }}
                                >
                                    {tab === 'members' ? <><FaUsers style={{ marginRight: 6 }} />Members ({modalTeam.member_count})</> : tab === 'submissions' ? <><FaEye style={{ marginRight: 6 }} />Submissions</> : <><FaEye style={{ marginRight: 6 }} />Hints Taken</>}
                                </button>
                            ))}
                        </div>

                        {/* Members Tab */}
                        {activeTab === 'members' && (
                            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Username</th>
                                            <th>Role</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalTeam.members.map(m => (
                                            <tr key={m.user_id}>
                                                <td>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: m.is_banned ? 'line-through' : 'none', color: m.is_banned ? '#ff3b30' : 'inherit' }}>
                                                        <FaUser style={{ color: m.is_banned ? '#ff3b30' : '#555', fontSize: '0.8rem' }} />
                                                        {m.username}
                                                        {m.is_banned && <span style={{ fontSize: '0.65rem', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.4)', color: '#ff3b30', borderRadius: 4, padding: '2px 6px', marginLeft: 4 }}>BANNED</span>}
                                                    </span>
                                                </td>
                                                <td>
                                                    {m.is_captain
                                                        ? <span style={{ color: '#FFD700', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem' }}><FaCrown />Captain</span>
                                                        : <span style={{ color: '#555', fontSize: '0.82rem' }}>Member</span>}
                                                </td>
                                                <td>
                                                    <Link
                                                        to={`/administration/event/${eventId}/user/${m.user_id}?from=leaderboard`}
                                                        style={{
                                                            padding: '5px 14px', background: 'transparent',
                                                            border: '1px solid rgba(0,255,65,0.4)', color: '#00ff41',
                                                            borderRadius: 4, fontSize: '0.78rem', textDecoration: 'none',
                                                            display: 'inline-flex', alignItems: 'center', gap: 5
                                                        }}
                                                        onClick={() => setModalTeam(null)}
                                                    >
                                                        <FaEye /> View Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Submissions Tab */}
                        {activeTab === 'submissions' && (
                            <div>
                                {/* Filter pills */}
                                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                    {[
                                        { key: 'all', label: `All(${submissions.length})` },
                                        { key: 'correct', label: `✔ Correct(${submissions.filter(s => s.is_correct).length})` },
                                        { key: 'wrong', label: `✘ Wrong(${submissions.filter(s => !s.is_correct).length})` },
                                    ].map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setSubsFilter(f.key)}
                                            style={{
                                                padding: '4px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                                                background: subsFilter === f.key ? '#00ff41' : 'rgba(255,255,255,0.05)',
                                                color: subsFilter === f.key ? '#000' : '#888',
                                                fontSize: '0.78rem', fontWeight: subsFilter === f.key ? 'bold' : 'normal',
                                                transition: 'all 0.2s'
                                            }}
                                        >{f.label}</button>
                                    ))}
                                </div>

                                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                                    {subsLoading ? (
                                        <p style={{ textAlign: 'center', padding: 30, color: '#00ff41', fontFamily: 'Orbitron', fontSize: '0.8rem' }}>
                                            LOADING SUBMISSIONS...
                                        </p>
                                    ) : (
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Time</th>
                                                    <th>Member</th>
                                                    <th>Challenge</th>
                                                    <th>Flag</th>
                                                    <th>Result</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredSubs.map(s => (
                                                    <tr key={s.id}>
                                                        <td style={{ fontSize: '0.78rem', color: '#666' }}>{s.submitted_at}</td>
                                                        <td>
                                                            <Link
                                                                to={`/ administration / event / ${eventId} /user/${s.user_id}?from = leaderboard`}
                                                                style={{ color: '#00bfff', textDecoration: 'none', fontSize: '0.88rem' }}
                                                                onClick={() => setModalTeam(null)}
                                                            >
                                                                {s.username}
                                                            </Link>
                                                        </td>
                                                        <td>{s.challenge_title}</td>
                                                        <td style={{ fontFamily: 'monospace', color: '#aaa', fontSize: '0.82rem' }}>{s.flag}</td>
                                                        <td>
                                                            {s.is_correct
                                                                ? <span style={{ color: '#00ff41', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 'bold', fontSize: '0.82rem' }}><FaCheck />Correct</span>
                                                                : <span style={{ color: '#ff3b30', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem' }}><FaTimes />Wrong</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredSubs.length === 0 && !subsLoading && (
                                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20, color: '#555' }}>No submissions found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Hints Tab */}
                        {activeTab === 'hints' && (
                            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                                {subsLoading ? (
                                    <p style={{ textAlign: 'center', padding: 30, color: '#00ff41', fontFamily: 'Orbitron', fontSize: '0.8rem' }}>
                                        LOADING HINTS...
                                    </p>
                                ) : (
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>Member</th>
                                                <th>Challenge</th>
                                                <th>Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hintsTaken.map(h => (
                                                <tr key={h.id}>
                                                    <td style={{ fontSize: '0.78rem', color: '#666' }}>{h.unlocked_at}</td>
                                                    <td style={{ color: '#00bfff', fontSize: '0.88rem' }}>{h.unlocked_by}</td>
                                                    <td>{h.challenge_title}</td>
                                                    <td style={{ color: '#ff3b30', fontWeight: 'bold' }}>-{h.cost}</td>
                                                </tr>
                                            ))}
                                            {hintsTaken.length === 0 && !subsLoading && (
                                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20, color: '#555' }}>No hints taken.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

/* ════════════════════════════════════════════════════════════════════
   INDIVIDUAL LEADERBOARD (is_team_mode = false) — unchanged logic
   ════════════════════════════════════════════════════════════════════ */
function IndividualLeaderboard({ eventId, users }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSubmissions, setUserSubmissions] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    const openSubmissionsModal = async (userId, username) => {
        setSelectedUser(username);
        setModalOpen(true);
        setModalLoading(true);
        try {
            const res = await fetch(`/api/admin/event/${eventId}/leaderboard/${userId}/submissions/`, { headers: headers() });
            const result = await res.json();
            setUserSubmissions(result.submissions || []);
        } catch { setUserSubmissions([]); }
        finally { setModalLoading(false); }
    };

    return (
        <>
            <div className="admin-table-container">
                <h2 style={{ color: '#fff', marginBottom: 20, fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: 10, fontSize: 'clamp(0.95rem, 2.5vw, 1.4rem)' }}>
                    <FaTrophy color="#ffaa00" /> Current Standings
                </h2>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Username</th>
                            <th>Total Points</th>
                            <th>Solves</th>
                            <th>Last Solve Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.user_id}>
                                <td><RankBadge rank={u.rank} /></td>
                                <td>{u.username}</td>
                                <td style={{ color: '#00ff41', fontWeight: 'bold' }}>{u.total_points}</td>
                                <td>{u.solves}</td>
                                <td>{u.last_solve || '—'}</td>
                                <td>
                                    <button className="admin-btn-action-view" onClick={() => openSubmissionsModal(u.user_id, u.username)}>
                                        <FaEye /> View Submissions
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>No solves yet. The leaderboard is empty.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content" style={{ maxWidth: 800 }}>
                        <div className="admin-modal-header">
                            <h2>Submissions History: {selectedUser}</h2>
                            <button className="admin-modal-close" onClick={() => setModalOpen(false)}><FaTimes /></button>
                        </div>
                        {modalLoading ? (
                            <p style={{ color: '#00ff41', textAlign: 'center', padding: 20 }}>Loading submissions...</p>
                        ) : (
                            <div className="admin-table-container" style={{ marginTop: 20, maxHeight: 500, overflowY: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Challenge</th>
                                            <th>Submitted Flag</th>
                                            <th>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userSubmissions.map(s => (
                                            <tr key={s.id}>
                                                <td>{s.submitted_at}</td>
                                                <td>{s.challenge_title}</td>
                                                <td style={{ fontFamily: 'monospace', color: '#aaa' }}>{s.flag}</td>
                                                <td>
                                                    {s.is_correct
                                                        ? <span style={{ color: '#00ff41', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 'bold' }}><FaCheck /> Correct</span>
                                                        : <span style={{ color: '#ff3b30', display: 'flex', alignItems: 'center', gap: 5 }}><FaTimes /> Incorrect</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        {userSubmissions.length === 0 && (
                                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>No submissions found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

/* ════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ════════════════════════════════════════════════════════════════════ */
function AdminEventLeaderboard() {
    const { id } = useParams();
    const [data, setData] = useState({ event_name: '', is_team_mode: false, leaderboard: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/admin/event/${id}/leaderboard/`, { headers: headers() });
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            setData(await res.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    if (loading) return <div className="loading-text">Loading Leaderboard...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    return (
        <>
            <div className="admin-content-header" style={{ marginBottom: 20, minWidth: 0, paddingRight: 20 }}>
                <h1 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: 'clamp(1.1rem, 3.5vw, 2rem)' }}>
                    Admin Leaderboard: {data.event_name}
                    {data.is_team_mode && (
                        <span style={{
                            marginLeft: 12, fontSize: '0.65rem', verticalAlign: 'middle',
                            background: 'rgba(0,191,255,0.12)', border: '1px solid rgba(0,191,255,0.4)',
                            color: '#00bfff', borderRadius: 12, padding: '3px 12px',
                            fontFamily: 'monospace', letterSpacing: 1
                        }}>TEAM MODE</span>
                    )}
                </h1>
                <p className="admin-content-subtitle">
                    <Link to={`/administration/event/${id}`} style={{ color: '#00ff41', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <FaArrowLeft /> Back to Event
                    </Link>
                </p>
            </div>

            {/* is_team_mode is always determined by the server response, not any client flag */}
            {data.is_team_mode
                ? <TeamLeaderboard eventId={id} eventName={data.event_name} teams={data.leaderboard} refresh={fetchData} />
                : <IndividualLeaderboard eventId={id} users={data.leaderboard} />
            }
        </>
    );
}

export default AdminEventLeaderboard;
