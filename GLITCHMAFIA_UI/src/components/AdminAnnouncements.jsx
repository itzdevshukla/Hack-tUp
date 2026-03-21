import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaBullhorn, FaPlus, FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaBan, FaTrash } from 'react-icons/fa';

function AdminAnnouncements() {
    const { id } = useParams();
    const [eventObj, setEventObj] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('info');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');

    // Delete modal state
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            };

            const [eventRes, annRes] = await Promise.all([
                fetch(`/api/admin/event/${id}/`, { headers }),
                fetch(`/api/event/${id}/announcements/`, { headers })
            ]);

            const eventData = await eventRes.json();
            const annData = await annRes.json();

            if (eventRes.ok) {
                setEventObj(eventData.event);
            } else {
                setError(eventData.error || 'Failed to load event details.');
            }

            if (annRes.ok) {
                setAnnouncements(annData.announcements);
            } else if (!annData.error?.includes('Forbidden')) {
                console.warn("Could not load announcements", annData);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Could not connect to server.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError('');
        setSubmitSuccess('');

        try {
            const res = await fetch(`/api/admin/event/${id}/announcements/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, content, type })
            });

            const data = await res.json();

            if (res.ok) {
                setSubmitSuccess('Announcement created successfully!');
                setAnnouncements([data.announcement, ...announcements]);
                setShowForm(false);
                setTitle('');
                setContent('');
                setType('info');

                setTimeout(() => setSubmitSuccess(''), 3000);
            } else {
                setSubmitError(data.error || 'Failed to create announcement.');
            }
        } catch (err) {
            console.error("Error creating announcement:", err);
            setSubmitError('Failed to connect to server.');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = (ann) => {
        setAnnouncementToDelete(ann);
    };

    const handleDeleteAnnouncement = async () => {
        if (!announcementToDelete) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/admin/event/${id}/announcements/${announcementToDelete.id}/delete/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (res.ok) {
                setAnnouncements(announcements.filter(a => a.id !== announcementToDelete.id));
                setAnnouncementToDelete(null);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete announcement.');
            }
        } catch (err) {
            console.error("Error deleting announcement:", err);
            alert('Failed to connect to server.');
        } finally {
            setDeleting(false);
        }
    };

    const getTypeIcon = (annType) => {
        switch (annType) {
            case 'danger': return <FaBan />;
            case 'warning': return <FaExclamationTriangle />;
            case 'success': return <FaCheckCircle />;
            case 'info':
            default: return <FaInfoCircle />;
        }
    };

    const getTypeColor = (annType) => {
        switch (annType) {
            case 'danger': return '#ff4c4c';
            case 'warning': return '#ffb84d';
            case 'success': return '#4cff4c';
            case 'info':
            default: return '#4da6ff';
        }
    };

    if (loading) return <div className="admin-loading">Loading Announcements...</div>;
    if (error) return <div className="admin-error"><FaTimes /> {error}</div>;

    return (
        <div className="admin-section" style={{ maxWidth: '900px', margin: '0', padding: '0 20px 20px 20px' }}>
            {/* Delete Confirmation Modal */}
            {announcementToDelete && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        border: '1px solid #ff4c4c',
                        borderTop: '4px solid #ff4c4c',
                        padding: '30px',
                        borderRadius: '8px',
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}>
                        <FaExclamationTriangle style={{ fontSize: '3rem', color: '#ff4c4c', margin: '0 auto 15px' }} />
                        <h3 style={{ color: '#fff', margin: '0 0 10px', fontFamily: '"Orbitron", sans-serif' }}>Are you sure you want to delete this?</h3>
                        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>
                            You are about to delete the broadcast <strong>"{announcementToDelete.title}"</strong>. This will permanently remove it from the system and participants' dashboards.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setAnnouncementToDelete(null)}
                                disabled={deleting}
                                style={{
                                    padding: '10px 20px',
                                    background: 'transparent',
                                    border: '1px solid #555',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    cursor: deleting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAnnouncement}
                                disabled={deleting}
                                style={{
                                    padding: '10px 20px',
                                    background: '#ff4c4c',
                                    border: 'none',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    cursor: deleting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    gap: '8px',
                                    alignItems: 'center'
                                }}
                            >
                                <FaTrash /> {deleting ? 'Deleting...' : 'Delete Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 0, flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontFamily: 'Orbitron', color: '#fff', fontSize: 'clamp(1.1rem, 3vw, 1.8rem)' }}>
                        <FaBullhorn style={{ color: '#ffb84d', filter: 'drop-shadow(0 0 5px rgba(255,184,77,0.5))' }} /> Event Announcements
                    </h2>
                    <p style={{ color: '#888', marginTop: '5px', fontSize: '0.95rem' }}>Broadcasting to <strong style={{ color: '#4da6ff' }}>{(eventObj?.name || eventObj?.event_name) || 'Loading Event...'}</strong></p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        background: showForm ? '#333' : 'linear-gradient(45deg, #ff6b6b, #ff8e53)',
                        border: showForm ? '1px solid #555' : 'none',
                        color: '#fff',
                        fontWeight: 'bold',
                        padding: '10px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '6px',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                    }}
                >
                    {showForm ? <><FaTimes /> Cancel</> : <><FaPlus /> New Announcement</>}
                </button>
            </div>

            {submitSuccess && (
                <div style={{ background: 'rgba(76, 255, 76, 0.1)', borderLeft: '4px solid #4cff4c', padding: '15px', borderRadius: '4px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', color: '#4cff4c' }}>
                    <FaCheck /> {submitSuccess}
                </div>
            )}

            {showForm && (
                <div style={{
                    background: 'rgba(20,20,20,0.8)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '25px',
                    marginBottom: '40px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', fontFamily: 'Orbitron' }}>Compose New Message</h3>

                    {submitError && <div style={{ background: 'rgba(255, 76, 76, 0.1)', padding: '10px', color: '#ff4c4c', marginBottom: '20px', borderRadius: '4px', borderLeft: '3px solid #ff4c4c' }}>{submitError}</div>}

                    <form onSubmit={handleCreateAnnouncement}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: '#aaa', marginBottom: '8px', fontSize: '0.9rem' }}>Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Wave 3 is now LIVE! or Security Warning"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    transition: 'border-color 0.3s',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={(e) => e.target.style.borderColor = getTypeColor(type)}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: '#aaa', marginBottom: '8px', fontSize: '0.9rem' }}>Type / Theme</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                {[
                                    { id: 'info', label: 'Info', icon: <FaInfoCircle /> },
                                    { id: 'warning', label: 'Warning', icon: <FaExclamationTriangle /> },
                                    { id: 'danger', label: 'Danger (Bans)', icon: <FaBan /> },
                                    { id: 'success', label: 'Success (Waves)', icon: <FaCheckCircle /> }
                                ].map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => setType(t.id)}
                                        style={{
                                            padding: '12px',
                                            background: type === t.id ? `rgba(${hexToRgb(getTypeColor(t.id))}, 0.15)` : 'rgba(0,0,0,0.3)',
                                            border: `1px solid ${type === t.id ? getTypeColor(t.id) : 'rgba(255,255,255,0.05)'}`,
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            color: type === t.id ? getTypeColor(t.id) : '#888',
                                            fontWeight: type === t.id ? 'bold' : 'normal',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <span style={{ fontSize: '1.1rem' }}>{t.icon}</span> {t.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', color: '#aaa', marginBottom: '8px', fontSize: '0.9rem' }}>Content / Message</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Write your announcement details here..."
                                required
                                rows="5"
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    borderRadius: '6px',
                                    outline: 'none',
                                    transition: 'border-color 0.3s',
                                    fontFamily: 'monospace',
                                    resize: 'vertical',
                                    lineHeight: '1.5',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = getTypeColor(type)}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: getTypeColor(type),
                                color: type === 'warning' ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                fontSize: '1.05rem',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                opacity: submitting ? 0.7 : 1,
                                transition: 'all 0.2s ease',
                                boxShadow: `0 4px 15px rgba(${hexToRgb(getTypeColor(type))}, 0.4)`
                            }}
                        >
                            <FaBullhorn /> {submitting ? 'Sending Transmission...' : 'Broadcast Announcement'}
                        </button>
                    </form>
                </div>
            )}

            <div>
                <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', color: '#fff', fontFamily: 'Orbitron', marginBottom: '20px' }}>Broadcast History</h3>

                {announcements.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(10,10,10,0.6)', borderRadius: '8px', border: '1px dashed #333' }}>
                        <FaBullhorn style={{ fontSize: '3rem', color: '#333', marginBottom: '15px' }} />
                        <h4 style={{ color: '#666', margin: '0 0 10px 0', fontFamily: 'Orbitron' }}>No Transmissions Sent</h4>
                        <p style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>Event participants have not received any alerts.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {announcements.map((ann) => (
                            <div key={ann.id} style={{
                                padding: '20px',
                                background: 'rgba(15,15,15,0.9)',
                                borderLeft: `4px solid ${getTypeColor(ann.type)}`,
                                borderRadius: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                borderTop: '1px solid rgba(255,255,255,0.03)',
                                borderRight: '1px solid rgba(255,255,255,0.03)',
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                transition: 'transform 0.2s ease',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                        <div style={{
                                            width: '36px', height: '36px',
                                            borderRadius: '50%',
                                            background: `rgba(${hexToRgb(getTypeColor(ann.type))}, 0.15)`,
                                            color: getTypeColor(ann.type),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.2rem',
                                            flexShrink: 0
                                        }}>
                                            {getTypeIcon(ann.type)}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{ann.title}</h4>
                                            <span style={{ fontSize: '0.8rem', color: '#777' }}>
                                                {new Date(ann.created_at).toLocaleString()} • Sent by {ann.author}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => confirmDelete(ann)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#666',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4c4c'; e.currentTarget.style.background = 'rgba(255,76,76,0.1)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#666'; e.currentTarget.style.background = 'transparent'; }}
                                        title="Delete Announcement"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                                <div style={{
                                    padding: '12px 15px',
                                    background: 'rgba(0,0,0,0.3)',
                                    borderRadius: '4px',
                                    color: '#ccc',
                                    fontFamily: 'monospace',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.5',
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {ann.content}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function to convert hex color to r,g,b format for rgba operations
function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return `${r}, ${g}, ${b}`;
}

export default AdminAnnouncements;
