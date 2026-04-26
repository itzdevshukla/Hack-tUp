import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaBan, FaArrowLeft, FaUnlock, FaSearch } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

// Custom Unban All Confirmation Modal
function UnbanAllConfirmModal({ onConfirm, onCancel, loading }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }} onClick={onCancel}>
            <div style={{
                background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px', padding: '28px 32px', maxWidth: '400px', width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column', gap: '16px',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '50%',
                        background: '#22c55e18', border: '1.5px solid #22c55e44',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem', color: '#22c55e',
                    }}>
                        <FaUnlock />
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                        Unban All Users
                    </h3>
                    <p style={{ color: '#6b7280', fontSize: '.85rem', marginTop: '8px', lineHeight: 1.5 }}>
                        Are you sure you want to unban <strong style={{ color: '#fff' }}>all</strong> users for this event? This will restore their access to all challenges immediately.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button onClick={onCancel} disabled={loading}
                        style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: '#9ca3af', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '.8rem', fontWeight: 600 }}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                        style={{ flex: 1, padding: '12px', background: '#22c55e', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontFamily: 'Orbitron', fontSize: '.8rem', fontWeight: 700, opacity: loading ? 0.6 : 1 }}>
                        {loading ? 'Unbanning...' : 'Yes, Unban All'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AdminEventBannedUsers() {
    const { id } = useParams();
    const [data, setData] = useState({ event_name: '', banned_users: [], total_banned: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUnbanAllModal, setShowUnbanAllModal] = useState(false);

    useEffect(() => {
        fetchBannedUsers();
    }, [id]);

    const fetchBannedUsers = async () => {
        try {
            const response = await fetch(`/api/admin/event/${id}/banned-users/`, {
                headers: { 'X-CSRFToken': getCsrfToken() }
            });
            if (!response.ok) throw new Error('Failed to fetch banned users');
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmUnbanAll = async () => {
        setActionLoading(true);
        try {
            const response = await fetch(`/api/admin/event/${id}/banned-users/unban-all/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCsrfToken() }
            });
            if (!response.ok) throw new Error('Failed to unban all users');
            
            // Clear the list since everyone is unbanned
            setData(prev => ({ ...prev, banned_users: [], total_banned: 0 }));
            setShowUnbanAllModal(false);
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const unbanSingleUser = async (userId) => {
        setActionLoading(true);
        try {
            const response = await fetch(`/api/admin/event/${id}/participant/${userId}/ban/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCsrfToken() }
            });
            if (!response.ok) throw new Error('Failed to unban user');
            
            // Remove user from the banned list
            setData(prev => ({
                ...prev,
                banned_users: prev.banned_users.filter(u => u.id !== userId),
                total_banned: prev.total_banned - 1
            }));
        } catch (err) {
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="loading-text">Loading Banned Users...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    const filteredUsers = data.banned_users.filter(p => 
        p.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            {showUnbanAllModal && (
                <UnbanAllConfirmModal
                    onConfirm={confirmUnbanAll}
                    onCancel={() => setShowUnbanAllModal(false)}
                    loading={actionLoading}
                />
            )}

            <div className="admin-content-header" style={{ marginBottom: '20px', minWidth: 0, paddingRight: '20px' }}>
                <h1 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: 'clamp(1.1rem, 3.5vw, 2rem)', color: '#ef4444' }}>
                    Banned Users: {data.event_name}
                </h1>
                <p className="admin-content-subtitle">
                    <Link to={`/administration/event/${id}/participants`} style={{ color: '#00ff41', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaArrowLeft /> Back to Participants
                    </Link>
                </p>
            </div>

            <div className="admin-table-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <h2 style={{ color: '#fff', margin: 0, fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.9rem, 2.5vw, 1.3rem)' }}>
                        <FaBan color="#ef4444" /> Banned ({data.total_banned})
                    </h2>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '500px', justifyContent: 'flex-end' }}>
                        {/* SEARCH BAR */}
                        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(239, 68, 68, 0.5)', fontSize: '0.85rem' }} />
                            <input 
                                type="text"
                                placeholder="Search users..."
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
                                onFocus={(e) => e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>

                        {data.total_banned > 0 && (
                            <button 
                                onClick={() => setShowUnbanAllModal(true)}
                                disabled={actionLoading}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '8px', 
                                    padding: '10px 16px', background: 'rgba(34, 197, 94, 0.15)', 
                                    border: '1px solid rgba(34, 197, 94, 0.4)', color: '#22c55e', 
                                    borderRadius: '8px', cursor: 'pointer', fontFamily: 'Orbitron',
                                    fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap'
                                }}
                            >
                                <FaUnlock /> Unban All
                            </button>
                        )}
                    </div>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>S.No.</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Banned On</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((p, index) => (
                                <tr key={p.id}>
                                    <td>{index + 1}</td>
                                    <td><span style={{ color: '#ef4444', fontWeight: 600 }}>{p.username}</span></td>
                                    <td>{p.email}</td>
                                    <td>{p.banned_at || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                                className="admin-btn-unban"
                                                onClick={() => unbanSingleUser(p.id)}
                                                disabled={actionLoading}
                                            >
                                                <FaUnlock /> Unban
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                                        <FaBan style={{ fontSize: '2rem', display: 'block', margin: '0 auto 15px', opacity: 0.1 }} />
                                        {data.total_banned === 0 ? "No banned users in this event." : `No banned users found matching "${searchTerm}"`}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default AdminEventBannedUsers;
