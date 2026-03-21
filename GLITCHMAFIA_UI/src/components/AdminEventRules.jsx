import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert from './CustomAlert';
import { FaSave, FaArrowLeft, FaGavel, FaEdit, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';

function AdminEventRules() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [rules, setRules] = useState('');
    const [editedRules, setEditedRules] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [eventName, setEventName] = useState('');

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    useEffect(() => {
        fetchEventData();
    }, [id]);

    const fetchEventData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/admin/event/${id}/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEventName(data.event.name);
                const existingRules = data.event.rules || '';
                setRules(existingRules);
                setEditedRules(existingRules);
            }
        } catch (err) {
            showAlert('Error', 'Failed to load event data.', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/event/${id}/rules/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ rules: editedRules })
            });

            if (response.ok) {
                setRules(editedRules);
                setIsEditing(false);
                showAlert('Saved!', 'Rules & Regulations updated successfully.', 'success');
            } else {
                showAlert('Error', 'Failed to save rules.', 'danger');
            }
        } catch (err) {
            showAlert('Error', 'An unexpected error occurred.', 'danger');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditedRules(rules);
        setIsEditing(false);
    };

    const showAlert = (title, message, type) => {
        setAlertConfig({ title, message, type, onConfirm: () => setAlertOpen(false), onCancel: null });
        setAlertOpen(true);
    };

    // Render markdown-like preview (simple parser)
    const renderRules = (text) => {
        if (!text) return null;
        return text.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i} style={{ color: '#9ACD32', fontSize: '1.6rem', margin: '1.2rem 0 0.5rem', borderBottom: '1px solid rgba(154,205,50,0.3)', paddingBottom: '0.5rem' }}>{line.slice(2)}</h1>;
            if (line.startsWith('## ')) return <h2 key={i} style={{ color: '#b5e853', fontSize: '1.2rem', margin: '1rem 0 0.4rem' }}>{line.slice(3)}</h2>;
            if (line.startsWith('### ')) return <h3 key={i} style={{ color: '#ccc', fontSize: '1rem', margin: '0.8rem 0 0.3rem' }}>{line.slice(4)}</h3>;
            if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} style={{ color: '#bbb', lineHeight: '1.7', listStyle: 'disc', marginLeft: '1.5rem' }}>{line.slice(2)}</li>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} style={{ color: '#bbb', lineHeight: '1.7', margin: '0.2rem 0' }}>{line}</p>;
        });
    };

    const containerStyle = {
        padding: '2rem 2rem 4rem',
        minHeight: '100vh',
        background: 'transparent',
    };

    const cardStyle = {
        background: 'rgba(15, 15, 15, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(154, 205, 50, 0.2)',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: '#9ACD32', fontSize: '1.2rem', letterSpacing: '2px' }}>
                Loading Rules...
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <FaGavel style={{ color: '#9ACD32', fontSize: '1.3rem' }} />
                        <h1 style={{ fontSize: '1.8rem', margin: 0, color: '#fff', fontWeight: '900' }}>Rules & Regulations</h1>
                    </div>
                    <p style={{ color: '#888', margin: 0, fontSize: '0.95rem' }}>Managing rules for <span style={{ color: '#9ACD32' }}>{eventName}</span></p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {isEditing ? (
                        <>
                            <button onClick={handleCancel}
                                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #555', color: '#aaa', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#888'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#555'}
                            >
                                <FaTimesCircle /> Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                style={{ padding: '10px 22px', background: '#9ACD32', border: 'none', color: '#000', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', fontSize: '0.95rem', opacity: saving ? 0.7 : 1, boxShadow: '0 0 20px rgba(154,205,50,0.4)', transition: 'all 0.2s' }}
                                onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = '0 0 30px rgba(154,205,50,0.6)'; }}
                                onMouseLeave={e => { if (!saving) e.currentTarget.style.boxShadow = '0 0 20px rgba(154,205,50,0.4)'; }}
                            >
                                <FaSave /> {saving ? 'Saving...' : 'Save Rules'}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)}
                            style={{ padding: '10px 22px', background: 'transparent', border: '1px solid rgba(154,205,50,0.5)', color: '#9ACD32', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(154,205,50,0.1)'; e.currentTarget.style.borderColor = '#9ACD32'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(154,205,50,0.5)'; }}
                        >
                            <FaEdit /> Edit Rules
                        </button>
                    )}
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {isEditing ? (
                    /* ---- Edit Mode ---- */
                    <motion.div key="editor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={cardStyle}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaEdit style={{ color: '#9ACD32' }} />
                            <span style={{ color: '#9ACD32', fontWeight: 'bold', letterSpacing: '1px', fontSize: '0.9rem' }}>EDIT MODE</span>
                            <span style={{ color: '#555', fontSize: '0.8rem', marginLeft: '8px' }}>Markdown formatting supported (e.g. # Heading, - bullet)</span>
                        </div>
                        <div style={{ padding: '1.5rem 2rem' }}>
                            <textarea
                                value={editedRules}
                                onChange={(e) => setEditedRules(e.target.value)}
                                placeholder={`# Event Rules\n\n## General Conduct\n- No cheating or flag sharing\n- Respect all participants\n\n## Scoring\n- Points are awarded per challenge solve\n...`}
                                style={{
                                    width: '100%', minHeight: '450px', padding: '1.2rem', background: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(154,205,50,0.3)', borderRadius: '10px', color: '#ddd',
                                    fontSize: '0.95rem', fontFamily: 'monospace', lineHeight: '1.6', resize: 'vertical',
                                    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = '#9ACD32'}
                                onBlur={e => e.currentTarget.style.borderColor = 'rgba(154,205,50,0.3)'}
                            />
                        </div>
                    </motion.div>
                ) : (
                    /* ---- View Mode ---- */
                    <motion.div key="viewer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={cardStyle}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaCheckCircle style={{ color: '#9ACD32' }} />
                            <span style={{ color: '#9ACD32', fontWeight: 'bold', letterSpacing: '1px', fontSize: '0.9rem' }}>PUBLISHED RULES</span>
                        </div>
                        <div style={{ padding: '2rem 2.5rem', minHeight: '300px' }}>
                            {rules ? (
                                <div style={{ fontFamily: 'inherit' }}>
                                    {renderRules(rules)}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '4rem 0', color: '#555' }}>
                                    <FaGavel style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} />
                                    <p style={{ fontSize: '1.1rem' }}>No rules have been added yet.</p>
                                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Click <strong style={{ color: '#9ACD32' }}>Edit Rules</strong> in the top right to add them.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default AdminEventRules;
