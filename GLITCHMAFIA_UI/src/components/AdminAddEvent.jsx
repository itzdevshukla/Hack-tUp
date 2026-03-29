import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import CustomAlert from './CustomAlert';
import { getCsrfToken } from '../utils/csrf';

function AdminAddEvent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        event_name: '',
        venue: '',
        description: '',
        ctf_type: 'Jeopardy Style',
        max_participants: '',
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
            const response = await fetch('/api/admin/event/new/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),

                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create event');
            }

            setAlertConfig({
                title: 'Success',
                message: `Event "${formData.event_name}" created successfully!\nAccess Code: ${result.access_code}`,
                type: 'info',
                onConfirm: () => {
                    setAlertOpen(false);
                    navigate('/administration/events');
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

    return (
        <>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />

            <div className="admin-content-header" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p className="admin-content-subtitle" style={{ margin: 0 }}>
                    <Link to="/administration/events" style={{ color: '#00ff41', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <FaArrowLeft /> Back to Events
                    </Link>
                </p>
                <h1 style={{ margin: 0 }}>Create New Event</h1>
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
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Max Participants *</label>
                                <input type="number" className="admin-search-input" name="max_participants" value={formData.max_participants} onChange={handleChange} min="1" max="9999" style={{ padding: '15px' }} required />
                            </div>
                        </div>

                        {/* Team Settings */}
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', background: 'rgba(0, 255, 65, 0.05)', border: '1px solid rgba(0, 255, 65, 0.2)', padding: 'clamp(14px, 2.5vw, 20px)', borderRadius: '10px' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 180px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Event Mode *</label>
                                <select className="admin-form-select" name="is_team_mode" value={formData.is_team_mode} onChange={(e) => setFormData({ ...formData, is_team_mode: e.target.value === 'true' })} style={{ padding: '15px', height: 'auto' }} required>
                                    <option value="false">Solo</option>
                                    <option value="true">Team Based</option>
                                </select>
                            </div>

                            {formData.is_team_mode && (
                                <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 180px)', marginBottom: 0 }}>
                                    <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Max Team Size *</label>
                                    <input type="number" className="admin-search-input" name="max_team_size" value={formData.max_team_size} onChange={handleChange} min="2" max="100" style={{ padding: '15px' }} required={formData.is_team_mode} />
                                </div>
                            )}
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #222', margin: '10px 0' }} />

                    {/* Event Window */}
                    <div>
                        <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)', marginBottom: '20px' }}>Event Timeline</h3>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 180px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Start Date *</label>
                                <input type="date" className="admin-search-input" name="start_date" value={formData.start_date} onChange={handleChange} min={today} style={{ padding: '15px', colorScheme: 'dark' }} required />
                            </div>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 180px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Start Time *</label>
                                <input type="time" className="admin-search-input" name="start_time" value={formData.start_time} onChange={handleChange} style={{ padding: '15px', colorScheme: 'dark' }} required />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 180px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>End Date *</label>
                                <input type="date" className="admin-search-input" name="end_date" value={formData.end_date} onChange={handleChange} min={formData.start_date || today} style={{ padding: '15px', colorScheme: 'dark' }} required />
                            </div>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 180px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>End Time *</label>
                                <input type="time" className="admin-search-input" name="end_time" value={formData.end_time} onChange={handleChange} style={{ padding: '15px', colorScheme: 'dark' }} required />
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #222', margin: '10px 0' }} />

                    {/* Registration Window */}
                    <div>
                        <h3 style={{ color: '#fff', fontFamily: 'Orbitron', fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)', marginBottom: '20px' }}>Registration Window <span style={{ color: '#666', fontSize: '0.8rem', fontFamily: 'Inter' }}>(Optional)</span></h3>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 180px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Reg Start Date</label>
                                <input type="date" className="admin-search-input" name="reg_start_date" value={formData.reg_start_date} onChange={handleChange} min={today} style={{ padding: '15px', colorScheme: 'dark' }} />
                            </div>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 180px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Reg Start Time</label>
                                <input type="time" className="admin-search-input" name="reg_start_time" value={formData.reg_start_time} onChange={handleChange} style={{ padding: '15px', colorScheme: 'dark' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 180px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Reg End Date</label>
                                <input type="date" className="admin-search-input" name="reg_end_date" value={formData.reg_end_date} onChange={handleChange} min={formData.reg_start_date || today} style={{ padding: '15px', colorScheme: 'dark' }} />
                            </div>
                            <div className="admin-form-group" style={{ flex: 1, minWidth: 'min(100%, 180px)', marginBottom: 0 }}>
                                <label style={{ color: '#aaa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Reg End Time</label>
                                <input type="time" className="admin-search-input" name="reg_end_time" value={formData.reg_end_time} onChange={handleChange} style={{ padding: '15px', colorScheme: 'dark' }} />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="admin-btn-primary admin-btn-block" disabled={loading} style={{ justifyContent: 'center', marginTop: '10px' }}>
                        {loading ? <FaSpinner className="fa-spin" /> : <><FaPlusCircle /> Create Event</>}
                    </button>

                </form>
            </div>
        </>
    );
}

export default AdminAddEvent;
