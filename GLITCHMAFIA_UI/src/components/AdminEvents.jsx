import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomAlert from './CustomAlert';
import { FaCalendarAlt, FaMapMarkerAlt, FaKey, FaCopy, FaEdit } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

function AdminEvents() {
    const [data, setData] = useState({ stats: {}, events: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Custom Alert State
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const [copiedEventId, setCopiedEventId] = useState(null);

    const handleCopyCode = (eventId, code) => {
        if (!code || code === 'N/A') return;
        navigator.clipboard.writeText(code);
        setCopiedEventId(eventId);
        setTimeout(() => setCopiedEventId(null), 2000);
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/admin/events/', {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (!response.ok) throw new Error('Failed to fetch events');
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (eventId, eventName) => {
        setAlertConfig({
            title: 'Delete Event?',
            message: `Are you entirely sure you want to delete the event "${eventName}"? All challenges and submissions linked to this event will be permanently deleted.`,
            type: 'danger',
            onConfirm: () => executeDelete(eventId, eventName),
            onCancel: () => setAlertOpen(false)
        });
        setAlertOpen(true);
    };

    const executeDelete = async (eventId, eventName) => {
        setAlertOpen(false);

        try {
            const res = await fetch(`/api/admin/event/${eventId}/delete/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to delete event');
            }

            setData(prev => ({
                ...prev,
                events: prev.events.filter(e => e.id !== eventId),
                stats: { ...prev.stats, total_events: prev.stats.total_events - 1 }
            }));

            setAlertConfig({
                title: 'Success',
                message: `Event ${eventName} has been deleted successfully.`,
                type: 'info',
                onConfirm: () => setAlertOpen(false),
                onCancel: null
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

    if (loading) return <div className="loading-text">Loading Events...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;

    return (
        <>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />

            <div className="admin-content-header">
                <h1>Event Management</h1>
                <p className="admin-content-subtitle">Manage all platform events</p>
            </div>

            <div className="admin-events-grid">
                {data.events.map(e => (
                    <div className="admin-event-card" key={e.id}>
                        <div className="admin-event-card-header">
                            <h3 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', paddingRight: '10px' }}>{e.name}</h3>
                            <span className={`admin-event-status ${e.status === 'live' ? 'live' : ''}`}>
                                {e.status}
                            </span>
                        </div>

                        <div className="admin-event-details">
                            <div className="admin-detail-row">
                                <FaMapMarkerAlt className="admin-detail-icon" />
                                <span>{e.venue || 'No Venue Specified'}</span>
                            </div>
                            <div className="admin-detail-row">
                                <FaCalendarAlt className="admin-detail-icon" />
                                <span>{e.start_date || 'Date TBD'}</span>
                            </div>
                        </div>

                        <div
                            className="admin-access-code-box"
                            onClick={() => handleCopyCode(e.id, e.access_code)}
                            style={{ cursor: e.access_code ? 'pointer' : 'default', transition: 'all 0.2s', position: 'relative' }}
                            title={e.access_code ? "Copy Access Code" : ""}
                        >
                            <label>Access Code</label>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span>{e.access_code || 'N/A'}</span>
                                {e.access_code && <FaCopy style={{ color: copiedEventId === e.id ? '#00ff41' : '#666', fontSize: '0.9rem' }} />}
                            </div>
                            {copiedEventId === e.id && (
                                <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#00ff41', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                    Copied!
                                </div>
                            )}
                        </div>

                        <div className="admin-event-card-actions">
                            <Link to={`/administration/event/${e.id}`} className="admin-btn-view" style={{ flex: 1, textAlign: 'center' }}>Manage</Link>
                            <button
                                className="admin-btn-delete"
                                onClick={() => confirmDelete(e.id, e.name)}
                                style={{ flex: 1 }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}

                {data.events.length === 0 && (
                    <div style={{ color: '#888', gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                        No events found.
                    </div>
                )}
            </div>
        </>
    );
}

export default AdminEvents;
