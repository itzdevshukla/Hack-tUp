import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { FaUsers, FaArrowLeft, FaEye, FaShieldAlt, FaTrash, FaBan, FaUnlock, FaSearch } from 'react-icons/fa';
import CustomAlert from './CustomAlert';
import { getCsrfToken } from '../utils/csrf';

const headers = () => ({
    'Content-Type': 'application/json',
    'X-CSRFToken': getCsrfToken()
});

function AdminEventTeams() {
    const { id } = useParams();
    const [data, setData] = useState({ event_name: '', teams: [], total_teams: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Actions / Modal State
    const [modalTeam, setModalTeam] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    const fetchTeams = async () => {
        try {
            const response = await fetch(`/api/admin/event/${id}/teams/`, { headers: headers() });
            if (!response.ok) throw new Error('Failed to fetch teams');
            setData(await response.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTeams(); }, [id]);

    const handleToggleBan = (team) => {
        const willBan = !team.is_banned;
        const action = willBan ? 'BAN' : 'UNBAN';

        setAlertConfig({
            title: 'Are you sure?',
            message: `Do you really want to ${action} the entire team "${team.team_name}"?`,
            type: willBan ? 'danger' : 'alert',
            confirmText: `Yes, ${action} TEAM!`,
            onCancel: () => setAlertOpen(false),
            onConfirm: async () => {
                setAlertOpen(false);
                setActionLoading(true);
                try {
                    const res = await fetch(`/api/admin/event/${id}/team/${team.team_id}/ban/`, { method: 'POST', headers: headers() });
                    if (res.ok) {
                        await fetchTeams();
                        // Also update modal state if it's currently open
                        if (modalTeam && modalTeam.team_id === team.team_id) {
                            setModalTeam(prev => ({ ...prev, is_banned: !team.is_banned }));
                        }
                    }
                    else alert((await res.json()).error || 'Failed to toggle ban');
                } catch (err) { alert("Error: " + err.message); }
                finally { setActionLoading(false); }
            }
        });
        setAlertOpen(true);
    };

    const handleDeleteTeam = (team) => {
        setAlertConfig({
            title: 'Delete Team?',
            message: `Are you sure you want to permanently delete team "${team.team_name}"? This will allow members to join other teams.`,
            type: 'danger',
            confirmText: 'Yes, DELETE',
            onCancel: () => setAlertOpen(false),
            onConfirm: async () => {
                setAlertOpen(false);
                setActionLoading(true);
                try {
                    const res = await fetch(`/api/admin/event/${id}/team/${team.team_id}/delete/`, { method: 'DELETE', headers: headers() });
                    if (res.ok) {
                        setModalTeam(null);
                        await fetchTeams();
                    }
                    else alert((await res.json()).error || 'Failed to delete team');
                } catch (err) { alert("Error: " + err.message); }
                finally { setActionLoading(false); }
            }
        });
        setAlertOpen(true);
    };

    if (loading) return <div className="loading-text">Loading Teams...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    const filteredTeams = data.teams.filter(t => 
        t.team_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.captain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.invite_code && t.invite_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />
            <div className="admin-content-header" style={{ marginBottom: '20px', minWidth: 0, paddingRight: '20px' }}>
                <h1 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: 'clamp(1.1rem, 3.5vw, 2rem)' }}>Team Management: {data.event_name}</h1>
                <p className="admin-content-subtitle">
                    <Link to={`/administration/event/${id}/participants`} style={{ color: '#00ff41', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaArrowLeft /> Back to Participants
                    </Link>
                </p>
            </div>

            <div className="admin-table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <h2 style={{ color: '#fff', margin: 0, fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.9rem, 2.5vw, 1.3rem)' }}>
                        <FaShieldAlt color="#00ff41" /> Registered Teams ({data.total_teams})
                    </h2>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* SEARCH BAR */}
                        <div style={{ position: 'relative', minWidth: '240px' }}>
                            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,255,65,0.5)', fontSize: '0.85rem' }} />
                            <input 
                                type="text"
                                placeholder="Search by team name or captain..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 15px 10px 38px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '0.85rem',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    fontFamily: 'Inter, sans-serif'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(0,255,65,0.4)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>

                        <Link to={`/administration/event/${id}/leaderboard`} className="admin-btn-view" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.4)', color: '#ffaa00', borderRadius: '4px', textDecoration: 'none' }}>
                            <FaUsers /> Team Leaderboard
                        </Link>
                    </div>
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>S.No.</th>
                            <th>Team Name</th>
                            <th>Captain</th>
                            <th>Members</th>
                            <th>Invite Code</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTeams.map((t, index) => (
                            <tr key={t.team_id} style={{ opacity: t.is_banned ? 0.5 : 1 }}>
                                <td>{index + 1}</td>
                                <td>
                                    <span style={{ fontWeight: 'bold', color: '#fff', textDecoration: t.is_banned ? 'line-through' : 'none' }}>
                                        {t.team_name}
                                    </span>
                                    {t.is_banned && <span style={{ marginLeft: 6, fontSize: '0.65rem', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.4)', color: '#ff3b30', borderRadius: 4, padding: '2px 6px' }}>BANNED</span>}
                                </td>
                                <td>{t.captain}</td>
                                <td><span style={{ color: '#00ff41', fontWeight: 'bold' }}>{t.member_count}</span></td>
                                <td><span style={{ fontFamily: 'monospace', color: '#ff9500' }}>{t.invite_code}</span></td>
                                <td>{t.created_at || '-'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                            className="admin-btn-action-view"
                                            onClick={() => setModalTeam(t)}
                                            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.3)', color: '#00ff41', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            <FaEye /> View
                                        </button>
                                        <button
                                            className={t.is_banned ? "admin-btn-unban" : "admin-btn-ban"}
                                            onClick={() => handleToggleBan(t)}
                                            disabled={actionLoading}
                                            style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                                        >
                                            {t.is_banned ? <><FaUnlock /> Unban</> : <><FaBan /> Ban</>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredTeams.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                    <FaSearch style={{ fontSize: '2rem', display: 'block', margin: '0 auto 15px', opacity: 0.1 }} />
                                    No teams found matching "{searchTerm}"
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Premium Team Detail & Actions Modal ─────────────────────────────────── */}
            {modalTeam && createPortal(
                <div className="admin-modal-overlay" onClick={() => setModalTeam(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                    <div className="admin-modal-content" style={{ background: 'linear-gradient(145deg, #11131c, #0a0b10)', border: '1px solid rgba(0,255,65,0.3)', borderRadius: 20, padding: 'clamp(18px, 3vw, 30px) clamp(16px, 4vw, 40px)', maxWidth: 700, width: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 60px -10px rgba(0,255,65,0.15)', display: 'flex', flexDirection: 'column', gap: 30 }} onClick={e => e.stopPropagation()}>

                        {/* Header Area with Top-Right Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20, flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h2 style={{ margin: '0 0 10px 0', color: '#fff', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Orbitron', fontSize: 'clamp(1rem, 3vw, 1.8rem)', textShadow: '0 0 10px rgba(0, 255, 65, 0.3)', flexWrap: 'wrap' }}>
                                    <FaShieldAlt color="#00ff41" /> {modalTeam.team_name}
                                    {modalTeam.is_banned && <span style={{ fontFamily: 'Inter', fontSize: '0.7rem', background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.5)', color: '#ff3b30', borderRadius: 6, padding: '4px 10px', letterSpacing: '1px', textShadow: 'none' }}>BANNED</span>}
                                </h2>
                                <div style={{ display: 'flex', gap: 15, fontSize: '0.9rem', color: '#888' }}>
                                    <span>Registered on <strong style={{ color: '#00ff41' }}>{modalTeam.created_at}</strong></span>
                                </div>
                            </div>

                            {/* Premium Top Right Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => handleToggleBan(modalTeam)}
                                    title={modalTeam.is_banned ? "Unban Team" : "Ban Team"}
                                    disabled={actionLoading}
                                    style={{
                                        width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        background: modalTeam.is_banned ? 'rgba(0,255,65,0.15)' : 'rgba(255,170,0,0.15)',
                                        border: `1px solid ${modalTeam.is_banned ? 'rgba(0,255,65,0.4)' : 'rgba(255,170,0,0.4)'}`,
                                        color: modalTeam.is_banned ? '#00ff41' : '#ffaa00',
                                        transition: 'all 0.3s ease',
                                        boxShadow: modalTeam.is_banned ? '0 0 15px rgba(0,255,65,0.2)' : '0 0 15px rgba(255,170,0,0.2)'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = modalTeam.is_banned ? 'rgba(0,255,65,0.25)' : 'rgba(255,170,0,0.25)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = modalTeam.is_banned ? 'rgba(0,255,65,0.15)' : 'rgba(255,170,0,0.15)'; }}
                                >
                                    {modalTeam.is_banned ? <FaUnlock size={18} /> : <FaBan size={18} />}
                                </button>
                                <button
                                    onClick={() => handleDeleteTeam(modalTeam)}
                                    title="Delete Team"
                                    disabled={actionLoading}
                                    style={{
                                        width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.4)', color: '#ff3b30',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 0 15px rgba(255,59,48,0.2)'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = 'rgba(255,59,48,0.25)'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255,59,48,0.15)'; }}
                                >
                                    <FaTrash size={16} />
                                </button>
                                <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)', margin: '0 6px' }} />
                                <button
                                    onClick={() => setModalTeam(null)}
                                    style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.8rem', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'color 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                                    onMouseOut={(e) => e.currentTarget.style.color = '#888'}
                                >&times;</button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {/* Cards Row */}
                            <div style={{ display: 'flex', gap: 25, flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 'min(100%, 200px)', background: 'rgba(0,0,0,0.4)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                                    <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Team Captain</p>
                                    <p style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Orbitron' }}>
                                        {modalTeam.captain}
                                        <span style={{ fontSize: '0.8rem' }}>👑</span>
                                    </p>
                                </div>
                                <div style={{ flex: 1, minWidth: 'min(100%, 200px)', background: 'rgba(0,0,0,0.4)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                                    <p style={{ margin: '0 0 8px', color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Invite Code</p>
                                    <p style={{ margin: 0, fontFamily: 'monospace', color: '#ff9500', fontSize: '1.3rem', letterSpacing: '3px', background: 'rgba(255,149,0,0.15)', padding: '4px 12px', borderRadius: 6, display: 'inline-block', border: '1px dashed rgba(255,149,0,0.3)' }}>
                                        {modalTeam.invite_code}
                                    </p>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: 24, borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
                                <h3 style={{ margin: '0 0 16px 0', color: '#e5e7eb', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Orbitron' }}>
                                    Active Roster
                                    <span style={{ fontSize: '0.85rem', background: 'rgba(0,255,65,0.15)', color: '#00ff41', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(0,255,65,0.3)', fontFamily: 'Inter' }}>{modalTeam.member_count} Warriors</span>
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
                                    {modalTeam.members?.map(m => (
                                        <Link
                                            key={m.user_id}
                                            to={`/administration/event/${id}/user/${m.user_id}?from=teams`}
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, transition: 'all 0.3s ease', cursor: 'pointer' }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(0,191,255,0.3)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.is_banned ? '#ff3b30' : '#00ff41', boxShadow: `0 0 8px ${m.is_banned ? '#ff3b30' : '#00ff41'}` }} />
                                                    <span style={{ color: m.is_banned ? '#ff3b30' : '#fff', textDecoration: m.is_banned ? 'line-through' : 'none', fontWeight: 600, fontSize: '1rem' }} >
                                                        {m.username}
                                                    </span>
                                                    {m.is_captain && <span style={{ fontSize: '0.6rem', background: 'linear-gradient(45deg, #FFD700, #FFA500)', color: '#000', padding: '3px 8px', borderRadius: 12, fontWeight: 800, letterSpacing: '0.5px', boxShadow: '0 2px 5px rgba(255,215,0,0.3)' }}>CAPTAIN</span>}
                                                </div>
                                                <span style={{ color: '#00bfff', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                                                    View Profile &rarr;
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

export default AdminEventTeams;
