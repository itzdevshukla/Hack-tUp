import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaTimes, FaSave, FaPuzzlePiece } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

const CATEGORIES = ['Web', 'Crypto', 'Reverse Engineering', 'Forensics', 'Pwn', 'Misc', 'OSINT'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const DIFF_COLORS = {
    easy: { bg: 'rgba(48,209,88,0.1)', border: '#30d158', color: '#30d158' },
    medium: { bg: 'rgba(255,159,10,0.1)', border: '#ff9f0a', color: '#ff9f0a' },
    hard: { bg: 'rgba(255,69,58,0.1)', border: '#ff453a', color: '#ff453a' },
};

const LABEL_STYLE = { display: 'block', color: '#555', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' };
const INPUT_STYLE = { width: '100%', padding: '12px 15px', background: '#0d0d0d', border: '1px solid #222', color: '#fff', borderRadius: '6px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border 0.2s' };
const TEXTAREA_STYLE = { ...INPUT_STYLE, resize: 'vertical', minHeight: '120px', lineHeight: '1.6' };
const FIELD_STYLE = { display: 'flex', flexDirection: 'column' };

function AdminEventChallengeCreate() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        category: '',
        difficulty: 'easy',
        points: 100,
        flag: '',
        flag_format: 'Hack!tUp{...}',
        url: '',
        hints: [],
        newFiles: []
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const addHint = () => setForm(prev => ({ ...prev, hints: [...prev.hints, { content: '', cost: 0 }] }));

    const updateHint = (index, field, value) => {
        const updated = [...form.hints];
        updated[index][field] = value;
        setForm(prev => ({ ...prev, hints: updated }));
    };

    const removeHint = (index) => setForm(prev => ({ ...prev, hints: prev.hints.filter((_, i) => i !== index) }));

    const handleFiles = (e) => setForm(prev => ({ ...prev, newFiles: [...prev.newFiles, ...Array.from(e.target.files)] }));
    const removeFile = (index) => setForm(prev => ({ ...prev, newFiles: prev.newFiles.filter((_, i) => i !== index) }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const payload = new FormData();
            payload.append('title', form.title);
            payload.append('description', form.description);
            payload.append('category', form.category);
            payload.append('difficulty', form.difficulty);
            payload.append('points', form.points);
            payload.append('flag', form.flag);
            payload.append('flag_format', form.flag_format);
            payload.append('url', form.url);
            payload.append('hints', JSON.stringify(form.hints));
            form.newFiles.forEach((file, idx) => payload.append(`new_files_${idx}`, file));

            const res = await fetch(`/api/admin/event/${id}/challenge/new/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCsrfToken()
                },
                body: payload
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create challenge');

            navigate(`/administration/event/${id}/challenge/${data.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const diffStyle = DIFF_COLORS[form.difficulty] || DIFF_COLORS.easy;

    return (
        <div style={{ padding: 'clamp(16px, 3vw, 30px)', minHeight: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif", maxWidth: '1100px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ marginBottom: '35px' }}>
                <Link
                    to={`/administration/event/${id}/challenges`}
                    style={{ color: '#555', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#555'}
                >
                    ← Back to Challenges
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <FaPuzzlePiece color="#00ff41" size="1.3em" />
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.1rem, 3vw, 2rem)', fontFamily: 'Orbitron', fontWeight: '500' }}>
                        New Challenge
                    </h1>
                </div>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.4)', color: '#ff453a', padding: '12px 16px', borderRadius: '6px', marginBottom: '25px', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '30px', alignItems: 'start' }}>

                    {/* LEFT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                        {/* Wrapper card */}
                        <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

                            {/* Title */}
                            <div style={FIELD_STYLE}>
                                <label style={LABEL_STYLE}>Challenge Title *</label>
                                <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. SQL Injection 101" style={INPUT_STYLE} onFocus={e => e.target.style.borderColor = '#444'} onBlur={e => e.target.style.borderColor = '#222'} />
                            </div>

                            {/* Description */}
                            <div style={FIELD_STYLE}>
                                <label style={LABEL_STYLE}>Description *</label>
                                <textarea name="description" value={form.description} onChange={handleChange} required placeholder="Describe the challenge, objective, and any relevant context..." style={TEXTAREA_STYLE} onFocus={e => e.target.style.borderColor = '#444'} onBlur={e => e.target.style.borderColor = '#222'} />
                            </div>

                            {/* Flag */}
                            <div style={FIELD_STYLE}>
                                <label style={LABEL_STYLE}>Flag *</label>
                                <input name="flag" value={form.flag} onChange={handleChange} required placeholder="Hack!tUp{s3cr3t_fl4g}" style={{ ...INPUT_STYLE, fontFamily: 'monospace' }} onFocus={e => e.target.style.borderColor = '#444'} onBlur={e => e.target.style.borderColor = '#222'} />
                                <span style={{ color: '#333', fontSize: '0.75rem', marginTop: '5px' }}>Flag will be hashed immediately on save.</span>
                            </div>

                            {/* Flag Format */}
                            <div style={FIELD_STYLE}>
                                <label style={LABEL_STYLE}>Flag Format</label>
                                <input name="flag_format" value={form.flag_format} onChange={handleChange} placeholder="Hack!tUp{...}" style={{ ...INPUT_STYLE, fontFamily: 'monospace' }} onFocus={e => e.target.style.borderColor = '#444'} onBlur={e => e.target.style.borderColor = '#222'} />
                            </div>

                            {/* URL */}
                            <div style={FIELD_STYLE}>
                                <label style={LABEL_STYLE}>Challenge URL</label>
                                <input name="url" value={form.url} type="url" onChange={handleChange} placeholder="https://chals.glitchmafia.com/..." style={{ ...INPUT_STYLE, fontFamily: 'monospace' }} onFocus={e => e.target.style.borderColor = '#444'} onBlur={e => e.target.style.borderColor = '#222'} />
                            </div>
                        </div>

                        {/* File Attachments */}
                        <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '22px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Attached Files</label>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px dashed #333', color: '#666', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff41'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#666'; }}
                                >
                                    <FaPlusCircle /> Select Files
                                    <input type="file" multiple onChange={handleFiles} style={{ display: 'none' }} />
                                </label>
                            </div>
                            {form.newFiles.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {form.newFiles.map((file, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#111', borderRadius: '4px', border: '1px solid #1a1a1a' }}>
                                            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{file.name}</span>
                                            <FaTimes onClick={() => removeFile(idx)} style={{ cursor: 'pointer', color: '#ff453a', fontSize: '0.85rem' }} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#333', fontSize: '0.8rem', fontStyle: 'italic' }}>No files attached.</div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                        {/* Core Metadata */}
                        <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

                            {/* Category */}
                            <div style={FIELD_STYLE}>
                                <label style={LABEL_STYLE}>Category *</label>
                                <select name="category" value={form.category} onChange={handleChange} required style={{ ...INPUT_STYLE, cursor: 'pointer' }}>
                                    <option value="" disabled style={{ background: '#111', color: '#888' }}>Select Category</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat} style={{ background: '#111', color: '#fff' }}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Difficulty */}
                            <div style={FIELD_STYLE}>
                                <label style={LABEL_STYLE}>Difficulty *</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {DIFFICULTIES.map(d => {
                                        const ds = DIFF_COLORS[d];
                                        const active = form.difficulty === d;
                                        return (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, difficulty: d }))}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 5px',
                                                    border: `1px solid ${active ? ds.border : '#222'}`,
                                                    background: active ? ds.bg : 'transparent',
                                                    color: active ? ds.color : '#555',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    textTransform: 'capitalize',
                                                    fontSize: '0.85rem',
                                                    fontWeight: active ? 'bold' : 'normal',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Points */}
                            <div style={FIELD_STYLE}>
                                <label style={LABEL_STYLE}>Points *</label>
                                <input
                                    name="points"
                                    type="number"
                                    min="0"
                                    value={form.points}
                                    onChange={handleChange}
                                    onWheel={(e) => e.target.blur()}
                                    required
                                    style={{ ...INPUT_STYLE, fontSize: '1.5rem', fontFamily: 'Orbitron', textAlign: 'center', padding: '10px' }}
                                    onFocus={e => e.target.style.borderColor = '#444'} onBlur={e => e.target.style.borderColor = '#222'}
                                />
                            </div>
                        </div>

                        {/* Hints */}
                        <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '22px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>Hints</label>
                                <button type="button" onClick={addHint} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'transparent', border: 'none', color: '#00ff41', cursor: 'pointer', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <FaPlusCircle /> Add Hint
                                </button>
                            </div>
                            {form.hints.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {form.hints.map((hint, index) => (
                                        <div key={index} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '14px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ color: '#444', fontSize: '0.7rem', textTransform: 'uppercase' }}>Hint #{index + 1}</span>
                                                <FaTimes onClick={() => removeHint(index)} style={{ cursor: 'pointer', color: '#ff453a' }} />
                                            </div>
                                            <div style={{ marginBottom: '8px' }}>
                                                <label style={{ ...LABEL_STYLE, color: '#444' }}>Cost (Points deducted)</label>
                                                <input
                                                    type="number" min="0"
                                                    value={hint.cost}
                                                    onChange={e => updateHint(index, 'cost', e.target.value)}
                                                    onWheel={(e) => e.target.blur()}
                                                    style={{ ...INPUT_STYLE, color: '#00ff41', background: '#0a0a0a', padding: '8px 12px', fontSize: '0.95rem' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ ...LABEL_STYLE, color: '#444' }}>Hint Text</label>
                                                <textarea
                                                    value={hint.content}
                                                    onChange={e => updateHint(index, 'content', e.target.value)}
                                                    placeholder="Write the hint here..."
                                                    style={{ ...TEXTAREA_STYLE, minHeight: '80px', background: '#0a0a0a', fontSize: '0.9rem', padding: '10px 12px' }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#333', fontSize: '0.8rem', fontStyle: 'italic' }}>No hints added yet.</div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: saving ? '#0a0a0a' : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
                                color: saving ? '#444' : '#e0e0e0',
                                border: `1px solid ${saving ? '#1a1a1a' : '#3a3a3a'}`,
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                letterSpacing: '0.5px',
                                boxShadow: saving ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.4)'
                            }}
                            onMouseEnter={e => { if (!saving) { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.6)'; } }}
                            onMouseLeave={e => { if (!saving) { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.color = '#e0e0e0'; e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.4)'; } }}
                        >
                            {saving ? 'Creating...' : <><FaSave /> Create Challenge</>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default AdminEventChallengeCreate;
