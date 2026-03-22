import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserShield, FaPlus, FaTrash, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import CustomAlert from './CustomAlert';
import './Admin.css';
import { getCsrfToken } from '../utils/csrf';

function AdminEventRoles() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [roles, setRoles] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState('admin');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [eventName, setEventName] = useState('Loading...');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    // Alert State
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    // Add Role form
    const [newUsername, setNewUsername] = useState('');
    const [newRole, setNewRole] = useState('admin');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchEventDetails();
        fetchRoles();
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const response = await fetch(`/api/admin/event/${id}/`, {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (response.ok) {
                const data = await response.json();
                setEventName(data.event?.name || `Event #${id}`);
            }
        } catch (err) {
            console.error('Failed to fetch event name:', err);
        }
    };

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/event/${id}/roles/`, {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (!response.ok) {
                if (response.status === 403) {
                    navigate('/administration/events');
                    return;
                }
                throw new Error('Failed to fetch roles');
            }
            const data = await response.json();
            setRoles(data.roles || []);
            setCurrentUserRole(data.current_user_role || 'admin');
            setCurrentUserId(data.current_user_id || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRole = async (e) => {
        e.preventDefault();
        if (!newUsername.trim()) {
            setAlertConfig({
                title: 'Error',
                message: 'Username cannot be empty.',
                type: 'danger',
                onConfirm: () => setAlertOpen(false)
            });
            setAlertOpen(true);
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`/api/admin/event/${id}/roles/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),

                },
                body: JSON.stringify({
                    username: newUsername,
                    role: newRole
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to assign role');

            setNewUsername('');
            setNewRole('admin');
            await fetchRoles();

            setAlertConfig({
                title: 'Success',
                message: data.message,
                type: 'success',
                onConfirm: () => setAlertOpen(false)
            });
            setAlertOpen(true);
            setIsModalOpen(false);

        } catch (err) {
            setAlertConfig({
                title: 'Error Assigning Role',
                message: err.message,
                type: 'danger',
                onConfirm: () => setAlertOpen(false)
            });
            setAlertOpen(true);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDelete = (roleId, username) => {
        setAlertConfig({
            title: 'Remove Role',
            message: `Are you sure you want to remove ${username}'s access from this event?`,
            type: 'warning',
            confirmText: 'REMOVE ROLE',
            onConfirm: () => executeDelete(roleId),
            onCancel: () => setAlertOpen(false)
        });
        setAlertOpen(true);
    };

    const executeDelete = async (roleId) => {
        setAlertOpen(false);
        setActionLoading(true);
        try {
            const response = await fetch(`/api/admin/event/${id}/roles/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),

                },
                body: JSON.stringify({ role_id: roleId })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to remove role');

            await fetchRoles();
        } catch (err) {
            setAlertConfig({
                title: 'Error',
                message: err.message,
                type: 'danger',
                onConfirm: () => setAlertOpen(false),
                onCancel: null
            });
            setAlertOpen(true);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="fade-in" style={{ color: '#fff' }}>Loading Roles...</div>;
    if (error) return <div className="fade-in" style={{ color: '#ff3b30' }}>Error: {error}</div>;

    return (
        <div className="fade-in">
            <CustomAlert isOpen={alertOpen} {...alertConfig} />

            <Link to={`/administration/event/${id}`} className="admin-back-link" style={{ display: 'inline-flex', marginBottom: '20px', color: '#aaa', textDecoration: 'none', alignItems: 'center', gap: '5px', transition: 'color 0.2s' }}>
                <FaArrowLeft /> Back to Event
            </Link>

            <div className="admin-content-header" style={{ marginBottom: '20px', minWidth: 0, paddingRight: '20px', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <h1 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', margin: 0, fontSize: 'clamp(1.1rem, 3.5vw, 2rem)' }}>Event Roles: {eventName}</h1>
                    {currentUserRole === 'organizer' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <FaPlus /> Add Admin
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginTop: '15px' }}>
                    <div style={{ color: '#aaa', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '4px' }}>
                        Your Role: <span style={{ color: '#fff', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>{currentUserRole}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', alignItems: 'start' }}>

                {/* Roles Table Section */}
                <div className="admin-table-container" style={{ margin: 0 }}>
                    <h2 style={{ color: '#fff', marginBottom: '20px', fontFamily: 'Orbitron', display: 'flex', alignItems: 'center', gap: '10px', fontSize: 'clamp(0.95rem, 2.5vw, 1.4rem)' }}>
                        <FaUserShield color="#fff" /> Assigned Roles
                    </h2>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Added On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#888', padding: '30px' }}>No specific roles assigned yet.</td></tr>
                            ) : (
                                roles.map(r => (
                                    <tr key={r.id}>
                                        <td>
                                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.05rem' }}>{r.username}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '3px' }}>{r.email}</div>
                                        </td>
                                        <td>
                                            <span className={`admin-event-status`} style={{
                                                background: r.role === 'organizer' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                color: '#fff',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                padding: '4px 10px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {r.role}
                                            </span>
                                        </td>
                                        <td style={{ color: '#aaa', fontSize: '0.85rem' }}>{r.created_at}</td>
                                        <td>
                                            {currentUserRole === 'organizer' && (r.user_id !== currentUserId) && (
                                                <button
                                                    onClick={() => confirmDelete(r.id, r.username)}
                                                    className="admin-btn-delete"
                                                    disabled={actionLoading}
                                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                                >
                                                    <FaTrash /> Remove
                                                </button>
                                            )}
                                            {r.user_id === currentUserId && <span style={{ color: '#666', fontSize: '0.85rem', fontStyle: 'italic', paddingLeft: '10px' }}>(You)</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Assign Role Modal */}
                {isModalOpen && currentUserRole === 'organizer' && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setIsModalOpen(false)}>
                        <div className="admin-modal-content" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', margin: 0, padding: '25px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FaShieldAlt style={{ color: '#fff', fontSize: '1.2rem' }} />
                                    <h3 style={{ margin: 0, color: '#fff', fontFamily: 'Orbitron', fontSize: '1.2rem' }}>Add Admin</h3>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                            </div>

                            <form onSubmit={handleAddRole}>
                                <div className="admin-form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Username</label>
                                    <input
                                        type="text"
                                        className="admin-search-input"
                                        placeholder="Enter exact username"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        required
                                        style={{ background: '#111', width: '100%', border: '1px solid #333' }}
                                    />
                                    <small style={{ color: '#888', display: 'block', marginTop: '6px', fontSize: '0.8rem' }}>User must exist in the system first.</small>
                                </div>

                                <div className="admin-form-group" style={{ marginBottom: '25px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Role</label>
                                    <select
                                        className="admin-form-select"
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        style={{ background: '#111', width: '100%', border: '1px solid #333' }}
                                    >
                                        <option value="admin">Event Admin (Limited)</option>
                                        <option value="organizer">Event Organizer (Full Access)</option>
                                    </select>
                                    <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#aaa', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: '3px solid #555', lineHeight: '1.4' }}>
                                        {newRole === 'admin'
                                            ? "Admins can manage the event, view leaderboard, but CANNOT see submitted flags."
                                            : "Organizers have full control over the event, including adding other admins, editing events, and viewing true flag submissions."}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={actionLoading || !newUsername.trim()}
                                    style={{ marginTop: '10px', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', width: '100%', background: actionLoading || !newUsername.trim() ? '#333' : '#fff', color: actionLoading || !newUsername.trim() ? '#888' : '#000', border: 'none', borderRadius: '4px', cursor: actionLoading || !newUsername.trim() ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease' }}
                                >
                                    {actionLoading ? 'ADDING...' : <><FaPlus color="#000" /> ADD ADMIN</>}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminEventRoles;
