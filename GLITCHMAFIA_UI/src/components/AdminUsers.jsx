import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomAlert from './CustomAlert';
import { FaSearch, FaUserPlus, FaTimes, FaSpinner } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

function AdminUsers() {
    const [data, setData] = useState({ stats: {}, users: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Custom Alert State
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importEvents, setImportEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users/', {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (!response.ok) throw new Error('Failed to fetch users');
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (userId, username) => {
        setAlertConfig({
            title: 'Delete User?',
            message: `Are you entirely sure you want to delete the user "${username}"? All associated data will be wiped.`,
            type: 'danger',
            onConfirm: () => executeDelete(userId, username),
            onCancel: () => setAlertOpen(false)
        });
        setAlertOpen(true);
    };

    const executeDelete = async (userId, username) => {
        setAlertOpen(false); // Close confirmation modal immediately

        try {
            const res = await fetch(`/api/admin/user/${userId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete user');
            }

            setData(prev => ({
                ...prev,
                users: prev.users.filter(u => u.id !== userId),
                stats: { ...prev.stats, total_users: prev.stats.total_users - 1 }
            }));

            // Show success alert
            setAlertConfig({
                title: 'Success',
                message: `User ${username} has been deleted from the database.`,
                type: 'info',
                onConfirm: () => setAlertOpen(false),
                onCancel: null // No cancel button for info alert
            });
            setAlertOpen(true);
        } catch (err) {
            setAlertConfig({
                title: 'Error',
                message: err.message,
                type: 'danger',
                onConfirm: () => setAlertOpen(false),
                onCancel: null
            });
            setAlertOpen(true);
        }
    };

    const openImportModal = async () => {
        setIsImportModalOpen(true);
        setSelectedFile(null);
        try {
            const res = await fetch('/api/admin/users/import/', {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (res.ok) {
                const data = await res.json();
                setImportEvents(data.events || []);
                if (data.events && data.events.length > 0) {
                    setSelectedEventId(data.events[0].id);
                }
            }
        } catch (e) {
            console.error("Failed to load events for import", e);
        }
    };

    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            alert("Please select an Excel file.");
            return;
        }

        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (selectedEventId) {
            formData.append('event_id', selectedEventId);
        }

        try {
            const res = await fetch('/api/admin/users/import/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                },
                body: formData
            });

            if (!res.ok) {
                let errorMsg = `Server error (${res.status})`;
                try {
                    const contentType = res.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        const errorData = await res.json();
                        errorMsg = errorData.error || errorMsg;
                    } else if (res.status === 504 || res.status === 502) {
                        errorMsg = "Server timed out while importing. Please try with a smaller file or contact the admin.";
                    } else {
                        errorMsg = `Import failed with status ${res.status}. Please try again.`;
                    }
                } catch (_) { /* keep default errorMsg */ }
                throw new Error(errorMsg);
            }

            // Download the returned excel file
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "generated_credentials.xlsx";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            // Refresh
            fetchUsers();
            setIsImportModalOpen(false);
            setAlertConfig({
                title: 'Success',
                message: 'Users imported successfully. Credentials downloaded.',
                type: 'info',
                onConfirm: () => setAlertOpen(false),
                onCancel: null
            });
            setAlertOpen(true);
        } catch (err) {
            setAlertConfig({
                title: 'Import Error',
                message: err.message,
                type: 'danger',
                onConfirm: () => setAlertOpen(false),
                onCancel: null
            });
            setAlertOpen(true);
        } finally {
            setIsImporting(false);
            setSelectedFile(null);
        }
    };

    if (loading) return <div className="loading-text">Loading Users...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    const filteredUsers = data.users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />

            <div className="admin-content-header">
                <h1>User Management</h1>
                <p className="admin-content-subtitle">Manage all registered participants</p>
            </div>

            <div className="admin-controls">
                <div className="admin-search">
                    <FaSearch className="admin-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="admin-actions">
                    <button className="admin-btn-primary" onClick={openImportModal}>
                        <FaUserPlus /> Import Users
                    </button>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>S.No.</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u, index) => (
                            <tr key={u.id}>
                                <td>{index + 1}</td>
                                <td style={{ color: '#fff' }}>{u.username}</td>
                                <td>{u.email || '-'}</td>
                                <td>
                                    <span style={{ color: u.is_active ? '#fff' : '#888' }}>
                                        {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ color: u.is_staff ? '#ffeb3b' : '#a8f6ff' }}>
                                        {u.is_staff ? 'Admin' : 'Player'}
                                    </span>
                                </td>
                                <td>{u.date_joined}</td>
                                <td>
                                    <Link to={`/administration/user/${u.id}`} className="admin-btn-view">View</Link>
                                    <button
                                        className="admin-btn-delete"
                                        onClick={() => confirmDelete(u.id, u.username)}
                                        disabled={u.is_staff}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center' }}>No users found matching "{searchTerm}".</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isImportModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-content">
                        <div className="admin-modal-header">
                            <h2>Import Users</h2>
                            <button className="admin-modal-close" onClick={() => setIsImportModalOpen(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="admin-modal-body">
                            <p className="admin-modal-desc">
                                Upload an Excel file (.xlsx) with columns: <strong>Name, Email</strong>. <br />
                                Username is auto-generated from the full name. Credentials will be downloaded after import.
                            </p>
                            <form onSubmit={handleImportSubmit} className="admin-import-form">
                                <div className="admin-form-group">
                                    <label>Assign to Event (Optional)</label>
                                    <select
                                        value={selectedEventId}
                                        onChange={(e) => setSelectedEventId(e.target.value)}
                                        className="admin-form-select"
                                    >
                                        <option value="">-- No Event --</option>
                                        {importEvents.map(ev => (
                                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label>Upload Excel File</label>
                                    <input
                                        type="file"
                                        accept=".xlsx"
                                        onChange={(e) => setSelectedFile(e.target.files[0])}
                                        className="admin-form-file"
                                        disabled={isImporting}
                                    />
                                </div>
                                <button type="submit" className="admin-btn-primary admin-btn-block" disabled={isImporting || !selectedFile} style={{ justifyContent: 'center', marginTop: '20px' }}>
                                    {isImporting ? <><FaSpinner className="fa-spin" /> Importing...</> : "Upload & Generate"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminUsers;
