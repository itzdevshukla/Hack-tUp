import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CustomAlert from './CustomAlert';
import { FaEdit, FaSave, FaTimes, FaPuzzlePiece, FaCheckCircle, FaExclamationCircle, FaPlusCircle } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

function AdminEventChallengeDetail() {
    const { id, challengeId } = useParams();
    const [challengeData, setChallengeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [waves, setWaves] = useState([]);

    useEffect(() => {
        fetch(`/api/admin/event/${id}/waves/`, {
            headers: {
                    'X-CSRFToken': getCsrfToken()
                }
        }).then(r => r.json()).then(d => setWaves(d.waves || [])).catch(() => { });
    }, [id]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        points: 0,
        flag: '',
        flag_format: 'Hack!tUp{...}',
        hints: [],
        url: '',
        wave_id: '',
        newFiles: []
    });

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    useEffect(() => {
        fetchChallengeDetail();
    }, [id, challengeId]);

    const fetchChallengeDetail = async () => {
        try {
            const response = await fetch(`/api/admin/event/${id}/challenge/${challengeId}/`, {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (!response.ok) throw new Error('Failed to fetch challenge details');
            const data = await response.json();
            setChallengeData(data);
            setFormData({
                title: data.title,
                description: data.description || '',
                category: data.category,
                points: data.points,
                flag_format: data.flag_format || 'Hack!tUp{...}',
                hints: data.hints || [],
                url: data.url || '',
                wave_id: data.wave_id ? String(data.wave_id) : '',
                newFiles: [],
                flag: ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaveLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('category', formData.category);
            submitData.append('points', formData.points);
            submitData.append('flag_format', formData.flag_format);
            submitData.append('url', formData.url);
            submitData.append('hints', JSON.stringify(formData.hints));
            if (formData.flag) {
                submitData.append('flag', formData.flag);
            }
            formData.newFiles.forEach((file, idx) => {
                submitData.append(`new_files_${idx}`, file);
            });

            const res = await fetch(`/api/admin/event/${id}/challenge/${challengeId}/`, {
                method: 'POST', // Use POST for multipart/form-data with Django
                headers: {
                    'X-CSRFToken': getCsrfToken()
                },
                body: submitData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update challenge');
            }

            // Reload data to get newly assigned attachments
            fetchChallengeDetail();

            setFormData(prev => ({ ...prev, flag: '', newFiles: [] }));
            setIsEditing(false);

            setAlertConfig({
                title: 'Success',
                message: 'Challenge details updated successfully.',
                type: 'info',
                confirmText: 'OK',
                onConfirm: () => setAlertOpen(false),
                onCancel: null
            });
            setAlertOpen(true);

        } catch (err) {
            setAlertConfig({
                title: 'Update Failed',
                message: err.message,
                type: 'danger',
                confirmText: 'OK',
                onConfirm: () => setAlertOpen(false),
                onCancel: null
            });
            setAlertOpen(true);
        } finally {
            setSaveLoading(false);
        }
    };

    const toggleEdit = () => {
        if (isEditing) {
            // Cancel clicked: Reset Form
            setFormData({
                title: challengeData.title,
                description: challengeData.description || '',
                category: challengeData.category,
                points: challengeData.points,
                flag_format: challengeData.flag_format || 'Hack!tUp{...}',
                hints: challengeData.hints || [],
                url: challengeData.url || '',
                newFiles: [],
                flag: ''
            });
        }
        setIsEditing(!isEditing);
    };

    const deleteFile = async (fileId) => {
        if (!window.confirm("Are you sure you want to delete this file map?")) return;
        try {
            const res = await fetch(`/api/admin/event/${id}/challenge/${challengeId}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken(),

                },
                body: JSON.stringify({ action: 'delete_file', file_id: fileId })
            });

            if (!res.ok) throw new Error('Failed to delete file');

            // Remove locally
            setChallengeData(prev => ({
                ...prev,
                attachments: prev.attachments.filter(a => a.id !== fileId)
            }));

            setAlertConfig({
                title: 'Deleted',
                message: 'File removed successfully.',
                type: 'info',
                confirmText: 'OK',
                onConfirm: () => setAlertOpen(false),
                onCancel: null
            });
            setAlertOpen(true);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="loading-text">Loading Challenge Info...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;
    if (!challengeData) return <div className="error-text">Challenge not found.</div>;

    return (
        <div className="admin-challenge-detail-page" style={{ maxWidth: '1000px', margin: '0 auto', color: '#eaeaea', width: '100%', boxSizing: 'border-box' }}>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '12px' }}>
                <Link to={`/administration/event/${id}/challenges`} style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#888'}>
                    ← Back
                </Link>

                <div style={{ display: 'flex', gap: '15px' }}>
                    {!isEditing ? (
                        <button
                            type="button"
                            onClick={toggleEdit}
                            style={{ background: 'transparent', border: '1px solid #333', color: '#ccc', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.1rem' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#222'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#555'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc'; e.currentTarget.style.borderColor = '#333'; }}
                            title="Edit Challenge"
                        >
                            <FaEdit />
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={toggleEdit}
                                style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.1rem' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#222'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aaa'; }}
                                title="Cancel"
                            >
                                <FaTimes />
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saveLoading}
                                style={{ background: '#fff', color: '#000', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1.1rem', opacity: saveLoading ? 0.5 : 1 }}
                                onMouseEnter={e => { if (!saveLoading) e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseLeave={e => { if (!saveLoading) e.currentTarget.style.transform = 'scale(1)'; }}
                                title="Save"
                            >
                                <FaSave />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 'clamp(24px, 5vw, 60px)' }}>

                {/* Main Content Form */}
                <div style={{ background: 'transparent' }}>
                    <form onSubmit={handleSave}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            {/* Title */}
                            <div>
                                <label style={{ display: 'block', color: '#666', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Challenge Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '15px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#fff', fontSize: '2rem', fontFamily: 'Orbitron', outline: 'none' }}
                                        required
                                        placeholder="Enter Name..."
                                    />
                                ) : (
                                    <h1 style={{ color: '#fff', fontSize: 'clamp(1.2rem, 3.5vw, 2.5rem)', margin: 0, fontFamily: 'Orbitron', fontWeight: '500', wordBreak: 'break-word' }}>
                                        {challengeData.title}
                                    </h1>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ display: 'block', color: '#666', marginBottom: '15px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</label>
                                {isEditing ? (
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '20px', background: '#0a0a0a', border: '1px solid #222', color: '#ccc', borderRadius: '8px', minHeight: '200px', fontSize: '1rem', lineHeight: '1.6', fontFamily: 'monospace', resize: 'vertical', outline: 'none' }}
                                        placeholder="Write challenge description here (HTML supported)..."
                                    />
                                ) : (
                                    <div style={{ color: '#bbb', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                                        {challengeData.description || <span style={{ color: '#555', fontStyle: 'italic' }}>No description provided.</span>}
                                    </div>
                                )}
                            </div>



                            {/* Wave Assignment */}
                            {waves.length > 0 && (
                                <div>
                                    <label style={{ display: 'block', color: '#666', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Wave</label>
                                    {isEditing ? (
                                        <select
                                            name="wave_id"
                                            value={formData.wave_id}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '12px', background: '#0d0d0d', border: '1px solid #333', color: '#fff', borderRadius: '6px', fontSize: '1rem', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="" style={{ background: '#111' }}>No Wave (Always Visible)</option>
                                            {waves.map(w => (
                                                <option key={w.id} value={String(w.id)} style={{ background: '#111' }}>
                                                    {w.name} {w.is_active ? '● Live' : '○ Locked'}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div style={{ color: '#fff', fontSize: '1rem', padding: '10px 0' }}>
                                            {formData.wave_id
                                                ? waves.find(w => String(w.id) === formData.wave_id)?.name || 'Unknown Wave'
                                                : <span style={{ color: '#555', fontStyle: 'italic' }}>No Wave (Always Visible)</span>
                                            }
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* URL */}
                            <div>
                                <label style={{ display: 'block', color: '#666', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Associated URL</label>
                                {isEditing ? (
                                    <input
                                        type="url"
                                        name="url"
                                        placeholder="https://chals.glitchmafia.com/..."
                                        value={formData.url}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '15px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#fff', fontSize: '1.2rem', fontFamily: 'monospace', outline: 'none' }}
                                    />
                                ) : (
                                    <div style={{ color: '#fff', fontSize: '1.2rem', padding: '10px 0', fontFamily: 'monospace' }}>
                                        {challengeData.url ? <a href={challengeData.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00ff41', textDecoration: 'none' }}>{challengeData.url}</a> : <span style={{ color: '#555', fontStyle: 'italic' }}>No URL provided.</span>}
                                    </div>
                                )}
                            </div>

                            {/* Files */}
                            <div>
                                <label style={{ display: 'block', color: '#666', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Attached Files</label>

                                {isEditing && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'inline-block', background: '#111', border: '1px dashed #444', color: '#888', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#00ff41'; }} onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#444'; }}>
                                            <FaPlusCircle style={{ marginRight: '5px' }} /> Select New Files To Upload
                                            <input
                                                type="file"
                                                multiple
                                                onChange={(e) => setFormData(prev => ({ ...prev, newFiles: [...prev.newFiles, ...Array.from(e.target.files)] }))}
                                                style={{ display: 'none' }}
                                            />
                                        </label>

                                        {formData.newFiles.length > 0 && (
                                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                {formData.newFiles.map((file, idx) => (
                                                    <div key={idx} style={{ color: '#00ff41', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span>+ {file.name}</span>
                                                        <FaTimes style={{ cursor: 'pointer', color: '#ff3b30' }} onClick={() => setFormData(prev => ({ ...prev, newFiles: prev.newFiles.filter((_, i) => i !== idx) }))} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {challengeData.attachments && challengeData.attachments.length > 0 ? challengeData.attachments.map(att => (
                                        <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '10px 15px', borderRadius: '4px' }}>
                                            <a href={att.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.95rem', wordBreak: 'break-all' }}>
                                                {att.file_name}
                                            </a>
                                            {isEditing && (
                                                <button onClick={() => deleteFile(att.id)} style={{ background: 'transparent', border: 'none', color: '#ff3b30', cursor: 'pointer', padding: '5px' }}>
                                                    <FaTimes />
                                                </button>
                                            )}
                                        </div>
                                    )) : (
                                        <span style={{ color: '#555', fontStyle: 'italic', fontSize: '0.9rem' }}>No files attached.</span>
                                    )}
                                </div>
                            </div>

                            {/* Flag Format */}
                            <div>
                                <label style={{ display: 'block', color: '#666', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Flag Format</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="flag_format"
                                        placeholder="Hack!tUp{...}"
                                        value={formData.flag_format}
                                        onChange={handleInputChange}
                                        style={{ width: '100%', padding: '15px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#fff', fontSize: '1.2rem', fontFamily: 'monospace', outline: 'none' }}
                                    />
                                ) : (
                                    <div style={{ color: '#fff', fontSize: '1.2rem', padding: '10px 0', fontFamily: 'monospace' }}>
                                        {challengeData.flag_format || 'Hack!tUp{...}'}
                                    </div>
                                )}
                            </div>

                            {/* Flag Field (Minimalist) */}
                            <div>
                                <label style={{ display: 'block', color: '#666', marginBottom: '15px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Flag</label>
                                {isEditing ? (
                                    <div>
                                        <input
                                            type="text"
                                            name="flag"
                                            placeholder="Update flag (leave blank to maintain current)"
                                            value={formData.flag}
                                            onChange={handleInputChange}
                                            style={{ width: '100%', padding: '15px', background: '#0a0a0a', border: '1px solid #222', color: '#fff', borderRadius: '8px', fontFamily: 'monospace', fontSize: '1rem', outline: 'none' }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
                                        <span style={{ color: '#444', fontSize: '1.2rem', letterSpacing: '4px', fontFamily: 'monospace' }}>••••••••••••••••</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Secured</span>
                                    </div>
                                )}
                            </div>

                        </div>
                    </form>
                </div>

                {/* Right Column / Meta Data */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingTop: '10px' }}>

                    {/* Category */}
                    <div>
                        <label style={{ display: 'block', color: '#666', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Category</label>
                        {isEditing ? (
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', fontSize: '1.1rem', outline: 'none', cursor: 'pointer' }}
                                required
                            >
                                <option value="" disabled style={{ color: '#888' }}>Select Category</option>
                                <option value="Web" style={{ background: '#111', color: '#fff' }}>Web</option>
                                <option value="Crypto" style={{ background: '#111', color: '#fff' }}>Crypto</option>
                                <option value="Reverse Engineering" style={{ background: '#111', color: '#fff' }}>Reverse Engineering</option>
                                <option value="Forensics" style={{ background: '#111', color: '#fff' }}>Forensics</option>
                                <option value="Pwn" style={{ background: '#111', color: '#fff' }}>Pwn</option>
                                <option value="Misc" style={{ background: '#111', color: '#fff' }}>Misc</option>
                                <option value="OSINT" style={{ background: '#111', color: '#fff' }}>OSINT</option>
                            </select>
                        ) : (
                            <div style={{ color: '#fff', fontSize: '1.2rem', padding: '5px 0' }}>{challengeData.category}</div>
                        )}
                    </div>

                    {/* Points */}
                    <div>
                        <label style={{ display: 'block', color: '#666', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Value</label>
                        {isEditing ? (
                            <input
                                type="number"
                                name="points"
                                value={formData.points}
                                onChange={handleInputChange}
                                onWheel={(e) => e.target.blur()}
                                style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', fontSize: '1.1rem', outline: 'none' }}
                                required
                            />
                        ) : (
                            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: '300' }}>{challengeData.points} <span style={{ fontSize: '0.9rem', color: '#666' }}>PTS</span></div>
                        )}
                    </div>

                    {/* Hints Section */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ display: 'block', color: '#666', margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Hints</label>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, hints: [...prev.hints, { content: '', cost: 0 }] }))}
                                    style={{ background: 'transparent', border: 'none', color: '#00ff41', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', textTransform: 'uppercase' }}
                                >
                                    <FaPlusCircle /> Add Hint
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {formData.hints.map((hint, index) => (
                                    <div key={index} style={{ background: '#0a0a0a', padding: '15px', borderRadius: '4px', border: '1px solid #222' }}>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', color: '#555', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '5px' }}>Cost (Points)</label>
                                                <input
                                                    type="number"
                                                    value={hint.cost}
                                                    onChange={(e) => {
                                                        const newHints = [...formData.hints];
                                                        newHints[index].cost = e.target.value;
                                                        setFormData({ ...formData, hints: newHints });
                                                    }}
                                                    onWheel={(e) => e.target.blur()}
                                                    style={{ width: '100%', padding: '5px', background: 'transparent', border: 'none', borderBottom: '1px solid #444', color: '#00ff41', outline: 'none', fontFamily: 'monospace' }}
                                                    min="0"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newHints = formData.hints.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, hints: newHints });
                                                }}
                                                style={{ background: 'transparent', border: 'none', color: '#ff3b30', cursor: 'pointer', marginTop: '15px' }}
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: '#555', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '5px' }}>Hint Text</label>
                                            <textarea
                                                value={hint.content}
                                                onChange={(e) => {
                                                    const newHints = [...formData.hints];
                                                    newHints[index].content = e.target.value;
                                                    setFormData({ ...formData, hints: newHints });
                                                }}
                                                style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid #222', color: '#ccc', resize: 'vertical', minHeight: '60px', outline: 'none', fontSize: '0.85rem' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {formData.hints.length === 0 && <div style={{ color: '#444', fontSize: '0.8rem', fontStyle: 'italic' }}>No hints added yet.</div>}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {challengeData.hints && challengeData.hints.length > 0 ? challengeData.hints.map((hint, index) => (
                                    <div key={index} style={{ background: '#0a0a0a', padding: '10px', borderRadius: '4px', border: '1px solid #1a1a1a', fontSize: '0.85rem' }}>
                                        <div style={{ color: '#00ff41', marginBottom: '5px', fontSize: '0.75rem', fontWeight: 'bold' }}>COST: {hint.cost} PTS</div>
                                        <div style={{ color: '#aaa' }}>{hint.content}</div>
                                    </div>
                                )) : (
                                    <div style={{ color: '#444', fontSize: '0.8rem', fontStyle: 'italic' }}>No hints available.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Solves */}
                    <div>
                        <label style={{ display: 'block', color: '#666', marginBottom: '10px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Solves</label>
                        <div style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1' }}>{challengeData.solves}</div>
                    </div>

                    {/* Status Indicator */}
                    <div style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: challengeData.has_flag ? 'rgba(255,255,255,0.05)' : 'rgba(255,59,48,0.1)',
                            border: `1px solid ${challengeData.has_flag ? '#222' : 'rgba(255,59,48,0.3)'}`,
                            color: challengeData.has_flag ? '#888' : '#ff3b30',
                            fontSize: '0.8rem',
                            letterSpacing: '0.5px'
                        }}>
                            {challengeData.has_flag ? <><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }}></span> Configured</> : <><FaExclamationCircle /> Missing Flag</>}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default AdminEventChallengeDetail;
