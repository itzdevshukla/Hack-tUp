import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaSpinner, FaKey, FaCopy } from 'react-icons/fa';
import CustomAlert from './CustomAlert';
import { getCsrfToken } from '../utils/csrf';

function AdminEditEvent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [accessCode, setAccessCode] = useState('');
    const [copiedCode, setCopiedCode] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const [formData, setFormData] = useState({
        event_name: '',
        venue: '',
        description: '',
        ctf_type: 'Jeopardy Style',
        max_participants: '',
        access_code: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        reg_start_date: '',
        reg_start_time: '',
        reg_end_date: '',
        reg_end_time: '',
        is_team_mode: false,
        max_team_size: 4
    });

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const response = await fetch(`/api/admin/event/${id}/`, {
                    headers: {
                    'X-CSRFToken': getCsrfToken()
                }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch event details');
                }

                const data = await response.json();
                const ev = data.event;

                setAccessCode(ev.access_code);
                setIsPending(ev.is_approved === false && ev.is_rejected === false);

                setFormData({
                    event_name: ev.name || '',
                    venue: ev.venue || '',
                    description: ev.description || '',
                    ctf_type: ev.ctf_type || 'Jeopardy Style',
                    max_participants: ev.max_participants || 0,
                    access_code: ev.access_code || '',
                    start_date: ev.start_date || '',
                    start_time: ev.start_time ? ev.start_time.substring(0, 5) : '',
                    end_date: ev.end_date || '',
                    end_time: ev.end_time ? ev.end_time.substring(0, 5) : '',
                    reg_start_date: ev.reg_start_date || '',
                    reg_start_time: ev.reg_start_time ? ev.reg_start_time.substring(0, 5) : '',
                    reg_end_date: ev.reg_end_date || '',
                    reg_end_time: ev.reg_end_time ? ev.reg_end_time.substring(0, 5) : '',
                    is_team_mode: ev.is_team_mode || false,
                    max_team_size: ev.max_team_size || 4
                });

            } catch (err) {
                setAlertConfig({
                    title: 'Error',
                    message: err.message,
                    type: 'danger',
                    onConfirm: () => navigate(`/administration/event/${id}`),
                    onCancel: null
                });
                setAlertOpen(true);
            } finally {
                setFetching(false);
            }
        };

        fetchEventDetails();
    }, [id, navigate]);

    const handleCopyCode = () => {
        if (!accessCode) return;
        navigator.clipboard.writeText(accessCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/admin/event/${id}/edit/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),

                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update event');
            }

            setAlertConfig({
                title: 'Success',
                message: `Event "${formData.event_name}" updated successfully!`,
                type: 'info',
                onConfirm: () => {
                    setAlertOpen(false);
                    navigate(`/administration/event/${id}`);
                },
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
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (actionStr) => {
        setAlertConfig({
            title: `Confirm ${actionStr.charAt(0).toUpperCase() + actionStr.slice(1)}`,
            message: `Are you sure you want to ${actionStr} this event request?`,
            type: 'warning',
            onConfirm: () => performAction(actionStr),
            onCancel: () => setAlertOpen(false)
        });
        setAlertOpen(true);
    };

    const performAction = async (actionStr) => {
        setAlertOpen(false);
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/event-request/${id}/${actionStr}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setAlertConfig({
                    title: 'Success',
                    message: `Event ${actionStr}d successfully!`,
                    type: 'success',
                    onConfirm: () => navigate('/administration/event-requests'),
                    onCancel: null
                });
                setAlertOpen(true);
            } else {
                throw new Error(data.error || `Failed to process ${actionStr}`);
            }
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
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="loading-text" style={{ padding: '50px', textAlign: 'center', color: '#00ff41', fontFamily: 'Orbitron' }}>Loading Event Data...</div>;
    }

    return (
        <>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />

            <div className="admin-content-header" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p className="admin-content-subtitle" style={{ margin: 0 }}>
                    <Link to={`/administration/event/${id}`} style={{ color: '#00ff41', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <FaArrowLeft /> Back to Details
                    </Link>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.1rem, 3.5vw, 2rem)' }}>Edit Event</h1>

                    {accessCode && (
                        <div
                            onClick={handleCopyCode}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'rgba(0, 255, 65, 0.1)',
                                border: '1px solid #00ff41',
                                padding: '8px 15px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                            title="Copy Access Code"
                        >
                            <FaKey style={{ color: copiedCode ? '#fff' : '#00ff41' }} />
                            <span style={{ fontFamily: 'Orbitron', fontWeight: 'bold', letterSpacing: '2px', color: copiedCode ? '#fff' : '#00ff41' }}>{accessCode}</span>
                            <FaCopy style={{ color: copiedCode ? '#fff' : '#666', fontSize: '0.9rem' }} />

                            {copiedCode && (
                                <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', background: '#00ff41', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                    Copied!
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="admin-table-container" style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(8, 8, 8, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid #222',
                borderRadius: '12px',
                padding: 'clamp(16px, 3vw, 30px)'
            }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                    {/* Event Core Data */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="admin-form-group" style={{ marginBottom: 0 }}>
                            <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Event Name *</label>
                            <input type="text" className="admin-search-input" name="event_name" value={formData.event_name} onChange={handleChange} style={{ fontSize: '1.1rem', padding: '15px' }} required />
                        </div>
                        <div className="admin-form-group" style={{ marginBottom: 0 }}>
                            <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Venue *</label>
                            <input type="text" className="admin-search-input" name="venue" value={formData.venue} onChange={handleChange} style={{ padding: '15px' }} required />
                        </div>
                        <div className="admin-form-group" style={{ marginBottom: 0 }}>
                            <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Description *</label>
                            <textarea className="admin-search-input" name="description" value={formData.description} onChange={handleChange} rows="4" style={{ resize: 'vertical', padding: '15px' }} required />
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 220px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Edit Access Code</label>
                                <input type="text" className="admin-search-input" name="access_code" value={formData.access_code} onChange={handleChange} style={{ padding: '15px', fontFamily: 'Orbitron', letterSpacing: '1px' }} />
                                <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Changes are synced dynamically when saved</small>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 200px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>CTF Type *</label>
                                <select className="admin-form-select" name="ctf_type" value={formData.ctf_type} onChange={handleChange} style={{ padding: '15px', height: 'auto' }} required>
                                    <option value="Jeopardy Style">Jeopardy Style</option>
                                    <option value="Attack-Defense">Attack-Defense</option>
                                    <option value="Mixed">Mixed</option>
                                    <option value="Red Team">Red Team</option>
                                </select>
                            </div>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 200px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Max Participants</label>
                                <input type="number" className="admin-search-input" name="max_participants" value={formData.max_participants} onChange={handleChange} min="1" max="9999" style={{ padding: '15px' }} placeholder="Max capacity (4 digits)" />
                            </div>
                        </div>

                        {/* Team Settings */}
                        <div style={{ display: 'flex', gap: '20px', background: 'rgba(0, 255, 65, 0.05)', border: '1px solid rgba(0, 255, 65, 0.2)', padding: '20px', borderRadius: '10px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 200px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Event Mode *</label>
                                <select className="admin-form-select" name="is_team_mode" value={formData.is_team_mode} onChange={(e) => setFormData({ ...formData, is_team_mode: e.target.value === 'true' })} style={{ padding: '15px', height: 'auto' }} required>
                                    <option value="false">Solo</option>
                                    <option value="true">Team Based</option>
                                </select>
                            </div>

                            {formData.is_team_mode && (
                                <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 200px)', marginBottom: 0 }}>
                                    <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Max Team Size *</label>
                                    <input type="number" className="admin-search-input" name="max_team_size" value={formData.max_team_size} onChange={handleChange} min="2" max="100" style={{ padding: '15px' }} required={formData.is_team_mode} />
                                </div>
                            )}
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #222', margin: '10px 0' }} />

                    {/* Event Window */}
                    <div>
                        <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', marginBottom: '20px' }}>Event Timeline</h3>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 160px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Start Date *</label>
                                <input type="date" className="admin-search-input" name="start_date" value={formData.start_date} onChange={handleChange} min={today} style={{ padding: '15px', colorScheme: 'dark' }} required />
                            </div>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 160px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Start Time *</label>
                                <input type="time" className="admin-search-input" name="start_time" value={formData.start_time} onChange={handleChange} style={{ padding: '15px', colorScheme: 'dark' }} required />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 160px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>End Date *</label>
                                <input type="date" className="admin-search-input" name="end_date" value={formData.end_date} onChange={handleChange} min={formData.start_date || today} style={{ padding: '15px', colorScheme: 'dark' }} required />
                            </div>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 160px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>End Time *</label>
                                <input type="time" className="admin-search-input" name="end_time" value={formData.end_time} onChange={handleChange} style={{ padding: '15px', colorScheme: 'dark' }} required />
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #222', margin: '10px 0' }} />

                    {/* Registration Window */}
                    <div>
                        <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', marginBottom: '20px' }}>Registration Window <span style={{ color: '#666', fontSize: '0.8rem', fontFamily: 'Inter' }}>(Optional)</span></h3>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 160px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Reg Start Date</label>
                                <input type="date" className="admin-search-input" name="reg_start_date" value={formData.reg_start_date} onChange={handleChange} min={today} style={{ padding: '15px', colorScheme: 'dark' }} />
                            </div>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 160px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Reg Start Time</label>
                                <input type="time" className="admin-search-input" name="reg_start_time" value={formData.reg_start_time} onChange={handleChange} style={{ padding: '15px', colorScheme: 'dark' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 160px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Reg End Date</label>
                                <input type="date" className="admin-search-input" name="reg_end_date" value={formData.reg_end_date} onChange={handleChange} min={formData.reg_start_date || today} style={{ padding: '15px', colorScheme: 'dark' }} />
                            </div>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 160px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Reg End Time</label>
                                <input type="time" className="admin-search-input" name="reg_end_time" value={formData.reg_end_time} onChange={handleChange} style={{ padding: '15px', colorScheme: 'dark' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px', flexWrap: 'wrap' }}>
                        <button type="submit" className="admin-btn-primary" disabled={loading} style={{ flex: isPending ? 1 : '1 1 100%', justifyContent: 'center', background: 'linear-gradient(145deg, #333, #111)', border: '1px solid #555', color: '#fff', boxShadow: '0 4px 8px rgba(0,0,0,0.4)', padding: '15px' }}>
                            {loading ? <FaSpinner className="fa-spin" /> : <><FaSave /> Save Changes</>}
                        </button>

                        {isPending && (
                            <>
                                <button type="button" onClick={() => handleAction('approve')} className="admin-btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center', padding: '15px', background: 'rgba(57, 255, 20, 0.15)', border: '1px solid #39ff14', color: '#39ff14', boxShadow: '0 4px 8px rgba(0,255,0,0.1)' }}>
                                    {loading ? <FaSpinner className="fa-spin" /> : 'Approve Request'}
                                </button>
                                <button type="button" onClick={() => handleAction('decline')} className="admin-btn-danger" disabled={loading} style={{ flex: 1, justifyContent: 'center', padding: '15px', backgroundColor: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', border: '1px solid currentColor', boxShadow: '0 4px 8px rgba(255,0,0,0.1)' }}>
                                    {loading ? <FaSpinner className="fa-spin" /> : 'Decline Request'}
                                </button>
                            </>
                        )}
                    </div>

                </form>
            </div>
        </>
    );
}

export default AdminEditEvent;
