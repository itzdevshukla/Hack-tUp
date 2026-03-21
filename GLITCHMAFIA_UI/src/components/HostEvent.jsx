import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert from './CustomAlert';


const HostEvent = () => {
    const [formData, setFormData] = useState({
        eventName: '',
        venue: '',
        description: '',
        ctfType: 'Jeopardy Style',
        participants: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        registrationStartDate: '',
        registrationStartTime: '',
        registrationEndDate: '',
        registrationEndTime: '',
        isTeamMode: false,
        maxTeamSize: 4
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Alert State
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    const handleNext = (e) => {
        e.preventDefault();
        // Move to summary
        setStep(2);
    };

    const handleBack = () => {
        setStep(1);
    };

    const triggerSubmitConfirm = () => {
        setAlertConfig({
            title: `Confirm Event Request`,
            message: `Are you sure you want to submit the request for "${formData.eventName}"? It will be sent to the Admins for review.`,
            type: 'info',
            confirmText: 'SUBMIT REQUEST',
            onConfirm: () => {
                setAlertOpen(false);
                submitForm();
            },
            onCancel: () => setAlertOpen(false)
        });
        setAlertOpen(true);
    };

    const submitForm = async () => {
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/request-event/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                setAlertConfig({
                    title: 'Success',
                    message: 'Event Requested Successfully! An administrator will review your request shortly.',
                    type: 'info',
                    confirmText: 'OK',
                    onConfirm: () => setAlertOpen(false),
                    onCancel: null
                });
                setAlertOpen(true);

                setFormData({
                    eventName: '', venue: '', description: '', ctfType: 'Jeopardy Style', participants: '',
                    startDate: '', startTime: '', endDate: '', endTime: '',
                    registrationStartDate: '', registrationStartTime: '', registrationEndDate: '', registrationEndTime: '',
                    isTeamMode: false, maxTeamSize: 4
                });
                setStep(1);
            } else {
                setAlertConfig({
                    title: 'Error',
                    message: data.message || 'Failed to request event',
                    type: 'danger',
                    confirmText: 'OK',
                    onConfirm: () => setAlertOpen(false),
                    onCancel: null
                });
                setAlertOpen(true);
            }
        } catch (error) {
            console.error('Error requesting event:', error);
            setAlertConfig({
                title: 'Error',
                message: 'An error occurred while requesting the event.',
                type: 'danger',
                confirmText: 'OK',
                onConfirm: () => setAlertOpen(false),
                onCancel: null
            });
            setAlertOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ padding: '2rem 0 60px 0', minHeight: '100vh', height: 'auto' }}>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ maxWidth: '800px', width: '100%' }}
            >
                <div className="auth-header">
                    <h2 className="auth-title">HOST EVENT</h2>
                    <p className="auth-subtitle">Initialize a new operation.</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form
                            key="form-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleNext}
                            className="auth-form"
                        >
                            {/* Event Info Section */}
                            <div className="form-section" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ color: '#39FF14', marginBottom: '1rem', fontSize: '1.2rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(57, 255, 20, 0.2)', paddingBottom: '0.5rem' }}>
                                    Event Info
                                </h3>
                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Event Name</label>
                                        <input
                                            type="text"
                                            name="eventName"
                                            className="form-input"
                                            placeholder="Operation Glitch"
                                            value={formData.eventName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Venue</label>
                                        <input
                                            type="text"
                                            name="venue"
                                            className="form-input"
                                            placeholder="Online / Physical Location"
                                            value={formData.venue}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Description</label>
                                        <textarea
                                            name="description"
                                            className="form-input"
                                            placeholder="Briefing details..."
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="4"
                                            style={{ resize: 'vertical' }}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Config Section */}
                            <div className="form-section" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ color: '#39FF14', marginBottom: '1rem', fontSize: '1.2rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(57, 255, 20, 0.2)', paddingBottom: '0.5rem' }}>
                                    Config
                                </h3>
                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">CTF Type</label>
                                        <select
                                            name="ctfType"
                                            className="form-input"
                                            value={formData.ctfType}
                                            onChange={handleChange}
                                            style={{ backgroundColor: 'rgba(10, 10, 10, 0.6)', color: 'white' }}
                                        >
                                            <option value="Jeopardy Style">Jeopardy</option>
                                            <option value="Attack-Defense">Attack-Defense</option>
                                            <option value="Mixed">Mixed</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Participants (Max)</label>
                                        <input
                                            type="number"
                                            name="participants"
                                            className="form-input"
                                            placeholder="100"
                                            value={formData.participants}
                                            onChange={handleChange}
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.5rem', padding: '1.5rem', background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.2)', borderRadius: '8px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" style={{ display: 'block', color: '#9ACD32', fontWeight: 'bold', marginBottom: '8px' }}>Event Mode</label>
                                        <select
                                            name="isTeamMode"
                                            className="form-input"
                                            value={formData.isTeamMode}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isTeamMode: e.target.value === 'true' }))}
                                            style={{ backgroundColor: 'rgba(10, 10, 10, 0.6)', color: 'white', cursor: 'pointer' }}
                                        >
                                            <option value="false">Solo</option>
                                            <option value="true">Team Based</option>
                                        </select>
                                    </div>

                                    <AnimatePresence>
                                        {formData.isTeamMode && (
                                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ display: 'block', color: '#9ACD32', fontWeight: 'bold', marginBottom: '8px' }}>Max Team Size</label>
                                                    <input
                                                        type="number"
                                                        name="maxTeamSize"
                                                        className="form-input"
                                                        value={formData.maxTeamSize}
                                                        onChange={handleChange}
                                                        min="2"
                                                        max="100"
                                                        required={formData.isTeamMode}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Registration Window Section */}
                            <div className="form-section" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ color: '#39FF14', marginBottom: '1rem', fontSize: '1.2rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(57, 255, 20, 0.2)', paddingBottom: '0.5rem' }}>
                                    Registration Window
                                </h3>
                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Reg. Start Date</label>
                                        <input
                                            type="date"
                                            name="registrationStartDate"
                                            className="form-input"
                                            value={formData.registrationStartDate}
                                            onChange={handleChange}
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Reg. Start Time</label>
                                        <input
                                            type="time"
                                            name="registrationStartTime"
                                            className="form-input"
                                            value={formData.registrationStartTime}
                                            onChange={handleChange}
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Reg. End Date</label>
                                        <input
                                            type="date"
                                            name="registrationEndDate"
                                            className="form-input"
                                            value={formData.registrationEndDate}
                                            onChange={handleChange}
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Reg. End Time</label>
                                        <input
                                            type="time"
                                            name="registrationEndTime"
                                            className="form-input"
                                            value={formData.registrationEndTime}
                                            onChange={handleChange}
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Section */}
                            <div className="form-section" style={{ marginBottom: '2rem' }}>
                                <h3 style={{ color: '#39FF14', marginBottom: '1rem', fontSize: '1.2rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(57, 255, 20, 0.2)', paddingBottom: '0.5rem' }}>
                                    Schedule
                                </h3>
                                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Start Date</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            className="form-input"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            required
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Start Time</label>
                                        <input
                                            type="time"
                                            name="startTime"
                                            className="form-input"
                                            value={formData.startTime}
                                            onChange={handleChange}
                                            required
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            className="form-input"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                            required
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Time</label>
                                        <input
                                            type="time"
                                            name="endTime"
                                            className="form-input"
                                            value={formData.endTime}
                                            onChange={handleChange}
                                            required
                                            style={{ colorScheme: 'dark' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="auth-btn" style={{ marginTop: '1rem' }}>
                                Review Details
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="summary-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="auth-form"
                        >
                            <h3 style={{ color: '#39FF14', marginBottom: '1.5rem', fontSize: '1.3rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(57, 255, 20, 0.2)', paddingBottom: '0.5rem' }}>
                                Request Summary
                            </h3>

                            <div style={{ background: 'rgba(10, 10, 10, 0.6)', border: '1px solid #333', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', color: '#ccc', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Event Name</p>
                                        <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>{formData.eventName || '—'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Venue</p>
                                        <p style={{ color: '#fff', fontSize: '1.1rem' }}>{formData.venue || '—'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>CTF Type</p>
                                        <p style={{ color: '#00ff41', fontSize: '1.1rem' }}>{formData.ctfType || '—'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Capacity</p>
                                        <p style={{ color: '#fff', fontSize: '1.1rem' }}>{formData.participants || '—'} participants</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Team Mode</p>
                                        <p style={{ color: formData.isTeamMode ? '#666' : '#888', fontSize: '1.1rem' }}>
                                            {formData.isTeamMode ? `Enabled (Max ${formData.maxTeamSize})` : 'Disabled'}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #222', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '20px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: '#39FF14', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Event Timings</p>
                                        <p style={{ marginBottom: '5px', fontSize: '0.9rem' }}><span style={{ color: '#888' }}>Starts:</span> {formData.startDate} @ {formData.startTime}</p>
                                        <p style={{ marginBottom: '0', fontSize: '0.9rem' }}><span style={{ color: '#888' }}>Ends:</span> {formData.endDate} @ {formData.endTime}</p>
                                    </div>

                                    {(formData.registrationStartDate || formData.registrationEndDate) ? (
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: '#39FF14', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Registration Window</p>
                                            <p style={{ marginBottom: '5px', fontSize: '0.9rem' }}><span style={{ color: '#888' }}>Starts:</span> {formData.registrationStartDate} @ {formData.registrationStartTime}</p>
                                            <p style={{ marginBottom: '0', fontSize: '0.9rem' }}><span style={{ color: '#888' }}>Ends:</span> {formData.registrationEndDate} @ {formData.registrationEndTime}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Registration Window</p>
                                            <p style={{ color: '#555', fontSize: '0.9rem', fontStyle: 'italic' }}>Open instantly</p>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #222' }}>
                                    <p style={{ fontSize: '0.8rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Description</p>
                                    <p style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.5', backgroundColor: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', border: '1px solid #222' }}>
                                        {formData.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="auth-btn"
                                    style={{ background: 'transparent', border: '1px solid #333', color: '#fff' }}
                                    onClick={handleBack}
                                    disabled={isLoading}
                                >
                                    Back to Edit
                                </button>
                                <button
                                    type="button"
                                    className="auth-btn"
                                    onClick={triggerSubmitConfirm}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Processing...' : 'Submit Final Request'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default HostEvent;
