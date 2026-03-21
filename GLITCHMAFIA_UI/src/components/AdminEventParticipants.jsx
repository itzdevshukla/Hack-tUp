import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaUsers, FaArrowLeft, FaBan, FaUnlock, FaExclamationTriangle } from 'react-icons/fa';

/* ── Custom Ban/Unban Confirmation Modal ──────────────────────── */
function BanConfirmModal({ user, isBanned, onConfirm, onCancel, loading }) {
    if (!user) return null;
    const action = isBanned ? 'Unban' : 'Ban';
    const actionColor = isBanned ? '#22c55e' : '#ef4444';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onCancel}>
            <div style={{
                background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px', padding: '28px 32px', maxWidth: '380px', width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column', gap: '16px',
            }} onClick={e => e.stopPropagation()}>

                {/* Icon */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '50%',
                        background: `${actionColor}18`, border: `1.5px solid ${actionColor}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem', color: actionColor,
                    }}>
                        {isBanned ? <FaUnlock /> : <FaBan />}
                    </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                        {action} User
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '.82rem', marginTop: '6px', lineHeight: 1.5 }}>
                        Are you sure you want to <span style={{ color: actionColor, fontWeight: 600 }}>{action.toLowerCase()}</span> <span style={{ color: '#e5e7eb', fontWeight: 600 }}>@{user.username}</span>?
                        {!isBanned && <span style={{ display: 'block', marginTop: '4px', color: '#9ca3af', fontSize: '.75rem' }}>They will lose access to all challenges in this event.</span>}
                    </p>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onCancel} disabled={loading}
                        style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: '#9ca3af', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '.72rem', fontWeight: 600 }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                        style={{ flex: 1, padding: '10px', background: actionColor, border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '.72rem', fontWeight: 700, opacity: loading ? 0.6 : 1 }}>
                        {loading ? '...' : action}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════ */
function AdminEventParticipants() {
    const { id } = useParams();
    const [data, setData] = useState({ event_name: '', is_team_mode: false, participants: [], total_participants: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Custom modal state
    const [banModal, setBanModal] = useState(null); // { user, isBanned }

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const response = await fetch(`/api/admin/event/${id}/participants/`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (!response.ok) throw new Error('Failed to fetch participants');
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchParticipants();
    }, [id]);

    const openBanModal = (user, isBanned) => setBanModal({ user, isBanned });
    const closeBanModal = () => { if (!actionLoading) setBanModal(null); };

    const confirmBan = async () => {
        if (!banModal) return;
        const { user, isBanned } = banModal;
        setActionLoading(true);
        try {
            const response = await fetch(`/api/admin/event/${id}/participant/${user.id}/ban/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to toggle ban status');
            const result = await response.json();
            setData(prev => ({
                ...prev,
                participants: prev.participants.map(p =>
                    p.id === user.id ? { ...p, is_banned: result.is_banned } : p
                )
            }));
            setBanModal(null);
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="loading-text">Loading Participants...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    return (
        <>
            {/* Custom Ban Confirmation Modal */}
            <BanConfirmModal
                user={banModal?.user}
                isBanned={banModal?.isBanned}
                onConfirm={confirmBan}
                onCancel={closeBanModal}
                loading={actionLoading}
            />

            <div className="admin-content-header" style={{ marginBottom: '20px', minWidth: 0, paddingRight: '20px' }}>
                <h1 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: 'clamp(1.1rem, 3.5vw, 2rem)' }}>Participant List: {data.event_name}</h1>
                <p className="admin-content-subtitle">
                    <Link to={`/administration/event/${id}`} style={{ color: '#00ff41', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaArrowLeft /> Back to Event
                    </Link>
                </p>
            </div>

            <div className="admin-table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 style={{ color: '#fff', margin: 0, fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.9rem, 2.5vw, 1.3rem)' }}>
                        <FaUsers color="#00ff41" /> Enrolled Users ({data.total_participants})
                    </h2>
                    {data.is_team_mode && (
                        <Link to={`/administration/event/${id}/teams`} className="admin-btn-view" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.4)', color: '#00bfff', borderRadius: '4px', textDecoration: 'none' }}>
                            <FaUsers /> View Teams
                        </Link>
                    )}
                </div>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>S.No.</th>
                            <th>Username</th>
                            <th>Email</th>
                            {data.is_team_mode && <th>Team</th>}
                            <th>Status</th>
                            <th>Joined At</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.participants.map((p, index) => (
                            <tr key={p.id} style={{ opacity: p.is_banned ? 0.5 : 1 }}>
                                <td>{index + 1}</td>
                                <td>
                                    <span style={{ textDecoration: p.is_banned ? 'line-through' : 'none' }}>
                                        {p.username}
                                    </span>
                                </td>
                                <td>{p.email}</td>
                                {data.is_team_mode && (
                                    <td style={{ color: '#00bfff', fontWeight: 500 }}>{p.team_name}</td>
                                )}
                                <td>
                                    {p.is_banned ?
                                        <span style={{ color: '#ff3b30', fontWeight: 'bold' }}>Banned</span> :
                                        p.is_registered ?
                                            <span style={{ color: '#00ff41', fontWeight: 'bold' }}>Registered</span> :
                                            <span style={{ color: '#ffaa00' }}>Pending</span>
                                    }
                                </td>
                                <td>{p.joined_at || '-'}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <Link to={`/administration/event/${id}/user/${p.id}?from=participants`} className="admin-btn-view">View Profile</Link>
                                        <button
                                            className={p.is_banned ? "admin-btn-unban" : "admin-btn-ban"}
                                            onClick={() => openBanModal(p, p.is_banned)}
                                            disabled={actionLoading}
                                        >
                                            {p.is_banned ? <><FaUnlock /> Unban</> : <><FaBan /> Ban</>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {data.participants.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No participants enrolled yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default AdminEventParticipants;
