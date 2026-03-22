import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import CustomAlert from './CustomAlert';
import { FaPlusCircle, FaTrash, FaPlay, FaPause, FaWater, FaChevronDown, FaChevronUp, FaCheck, FaLock, FaBolt } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

// ── Category colour map ──────────────────────────────────────────
const CAT_STYLE = {
    'Web': { bg: 'rgba(0,122,255,0.15)', border: '#007aff', color: '#007aff' },
    'Crypto': { bg: 'rgba(48,209,88,0.12)', border: '#30d158', color: '#30d158' },
    'Reverse Engineering': { bg: 'rgba(255,159,10,0.12)', border: '#ff9f0a', color: '#ff9f0a' },
    'Forensics': { bg: 'rgba(100,210,255,0.12)', border: '#64d2ff', color: '#64d2ff' },
    'Pwn': { bg: 'rgba(255,69,58,0.12)', border: '#ff453a', color: '#ff453a' },
    'Misc': { bg: 'rgba(191,90,242,0.12)', border: '#bf5af2', color: '#bf5af2' },
    'OSINT': { bg: 'rgba(255,214,10,0.12)', border: '#ffd60a', color: '#ffd60a' },
};
const getCat = (cat) => CAT_STYLE[cat] || { bg: 'rgba(255,255,255,0.05)', border: '#444', color: '#aaa' };

// ── Inline style helpers ─────────────────────────────────────────
const glass = {
    background: 'rgba(10,10,10,0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
};

export default function AdminEventWaves() {
    const { id } = useParams();
    const [waves, setWaves] = useState([]);
    const [allChallenges, setAllChallenges] = useState([]);
    const [eventName, setEventName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newWaveName, setNewWaveName] = useState('');
    const [creating, setCreating] = useState(false);
    const [expandedWave, setExpandedWave] = useState(null);
    const [pickingForWave, setPickingForWave] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [saving, setSaving] = useState(false);
    const [pickerLoading, setPickerLoading] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertConfig, setAlertConfig] = useState({});

    const H = {  };

    /* ── Data fetching ──────────────────────────────────────────── */
    const fetchWaves = useCallback(async () => {
        const r = await fetch(`/api/admin/event/${id}/waves/`, { headers: H });
        const d = await r.json();
        setWaves(d.waves || []);
    }, [id]);

    const fetchChallenges = useCallback(async (waveId) => {
        const r = await fetch(`/api/admin/event/${id}/wave/${waveId}/challenges/`, { headers: H });
        const d = await r.json();
        setAllChallenges(d.challenges || []);
    }, [id]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                await fetchWaves();
                const er = await fetch(`/api/admin/event/${id}/`, { headers: H });
                if (er.ok) {
                    const ed = await er.json();
                    setEventName(ed.event?.name || '');
                    setAllChallenges(ed.challenges || []);
                }
            } catch (e) { setError(e.message); }
            finally { setLoading(false); }
        })();
    }, [id]);

    /* ── Actions ────────────────────────────────────────────────── */
    const createWave = async (e) => {
        e.preventDefault();
        if (!newWaveName.trim()) return;
        setCreating(true);
        try {
            const r = await fetch(`/api/admin/event/${id}/waves/`, {
                method: 'POST',
                headers: { ...H, 'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify({ name: newWaveName.trim(), order: waves.length })
            });
            const w = await r.json();
            setWaves(p => [...p, { ...w, challenge_count: 0 }]);
            setNewWaveName('');
        } catch { setError('Failed to create wave'); }
        finally { setCreating(false); }
    };

    const toggleWave = (wave) => {
        const next = !wave.is_active;
        setAlertConfig({
            title: next ? '🌊 Release Wave?' : '🔒 Lock Wave?',
            message: next
                ? `Releasing "${wave.name}" will instantly make all ${wave.challenge_count} challenge(s) live for participants.`
                : `Locking "${wave.name}" will hide its challenges from participants.`,
            type: next ? 'info' : 'warning',
            confirmText: next ? 'RELEASE' : 'LOCK',
            onConfirm: async () => {
                setAlertOpen(false);
                await fetch(`/api/admin/event/${id}/wave/${wave.id}/`, {
                    method: 'PUT', headers: { ...H, 'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken() },
                    body: JSON.stringify({ is_active: next })
                });
                setWaves(p => p.map(w => w.id === wave.id ? { ...w, is_active: next } : w));
            },
            onCancel: () => setAlertOpen(false)
        });
        setAlertOpen(true);
    };

    const deleteWave = (wave) => {
        setAlertConfig({
            title: 'Delete Wave?',
            message: `"${wave.name}" will be deleted. Challenges inside will be unassigned (not deleted).`,
            type: 'danger', confirmText: 'DELETE',
            onConfirm: async () => {
                setAlertOpen(false);
                await fetch(`/api/admin/event/${id}/wave/${wave.id}/`, { method: 'DELETE', headers: H });
                setWaves(p => p.filter(w => w.id !== wave.id));
                if (pickingForWave === wave.id) setPickingForWave(null);
                if (expandedWave === wave.id) setExpandedWave(null);
            },
            onCancel: () => setAlertOpen(false)
        });
        setAlertOpen(true);
    };

    const openPicker = async (wave) => {
        // Show picker panel immediately with loading state
        setPickingForWave(wave.id);
        setAllChallenges([]);
        setSelectedIds(new Set());
        setPickerLoading(true);
        try {
            const r = await fetch(`/api/admin/event/${id}/wave/${wave.id}/challenges/`, { headers: H });
            const d = await r.json();
            const fresh = d.challenges || [];
            setAllChallenges(fresh);
            setSelectedIds(new Set(fresh.filter(c => c.wave_id === wave.id).map(c => c.id)));
        } catch {
            setError('Failed to load challenges');
        } finally {
            setPickerLoading(false);
        }
    };

    const closePicker = () => { setPickingForWave(null); setSelectedIds(new Set()); };

    const toggle = (cid) => setSelectedIds(p => { const s = new Set(p); s.has(cid) ? s.delete(cid) : s.add(cid); return s; });

    const saveAssignment = async () => {
        setSaving(true);
        try {
            await fetch(`/api/admin/event/${id}/wave/${pickingForWave}/challenges/`, {
                method: 'PUT', headers: { ...H, 'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify({ challenge_ids: Array.from(selectedIds) })
            });
            setWaves(p => p.map(w => w.id === pickingForWave ? { ...w, challenge_count: selectedIds.size } : w));
            // refresh
            const r = await fetch(`/api/admin/event/${id}/wave/${pickingForWave}/challenges/`, { headers: H });
            const d = await r.json();
            setAllChallenges(d.challenges || []);
            closePicker();
        } catch { setError('Failed to save assignment.'); }
        finally { setSaving(false); }
    };

    /* ── Derived ────────────────────────────────────────────────── */
    const liveCount = waves.filter(w => w.is_active).length;
    const assignedCount = waves.reduce((a, w) => a + w.challenge_count, 0);
    const challengesFor = (wid) => allChallenges.filter(c => c.wave_id === wid);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#333', fontFamily: 'monospace', flexDirection: 'column', gap: '12px' }}>
            <FaWater size="2em" color="#00ff41" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span>Loading Waves...</span>
        </div>
    );

    return (
        <div style={{ padding: 'clamp(16px, 3vw, 34px) clamp(14px, 3.5vw, 36px)', fontFamily: "'Inter','Segoe UI',sans-serif", maxWidth: '1000px' }}>
            <CustomAlert isOpen={alertOpen} {...alertConfig} />

            {/* ── Top header ──────────────────────────────────── */}
            <div style={{ marginBottom: '40px' }}>
                <Link to={`/administration/event/${id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#444', textDecoration: 'none', fontSize: '0.82rem', marginBottom: '22px', transition: 'color .2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#aaa'} onMouseLeave={e => e.currentTarget.style.color = '#444'}>
                    ← Back to Event
                </Link>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
                            {/* Icon halo */}
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,255,65,0.15)' }}>
                                <FaWater color="#00ff41" size="1.1em" />
                            </div>
                            <h1 style={{ margin: 0, color: '#fff', fontSize: 'clamp(1.2rem, 3.5vw, 2.2rem)', fontFamily: 'Orbitron', fontWeight: '600', letterSpacing: '-1px' }}>
                                Waves
                            </h1>
                            <span style={{ background: 'rgba(0,255,65,0.1)', border: '1px solid rgba(0,255,65,0.25)', color: '#00ff41', padding: '3px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700' }}>
                                {waves.length}
                            </span>
                        </div>
                        {eventName && <p style={{ margin: 0, color: '#383838', fontSize: '0.82rem', fontFamily: 'monospace' }}>{eventName}</p>}
                    </div>

                    {/* Stat pills */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Live', value: liveCount, accent: '#00ff41' },
                            { label: 'Locked', value: waves.length - liveCount, accent: '#555' },
                            { label: 'Assigned', value: assignedCount, accent: '#64d2ff' },
                        ].map(s => (
                            <div key={s.label} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '10px', padding: '10px 18px', textAlign: 'center' }}>
                                <div style={{ fontFamily: 'Orbitron', fontSize: '1.3rem', color: s.accent, fontWeight: '700' }}>{s.value}</div>
                                <div style={{ color: '#444', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {error && <div style={{ background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.35)', color: '#ff453a', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.88rem' }}>{error}</div>}

            {/* ── Create wave form ─────────────────────────────── */}
            <div style={{ ...glass, padding: '24px', marginBottom: '30px' }}>
                <p style={{ margin: '0 0 14px', color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Create New Wave</p>
                <form onSubmit={createWave} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                        value={newWaveName} onChange={e => setNewWaveName(e.target.value)}
                        placeholder="Wave name  —  e.g. Wave 1 · Day 2 Challenges · Advanced Round"
                        disabled={creating}
                        style={{ flex: 1, padding: '13px 16px', background: '#0d0d0d', border: '1px solid #222', color: '#fff', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', transition: 'border .2s' }}
                        onFocus={e => e.target.style.borderColor = '#333'} onBlur={e => e.target.style.borderColor = '#222'}
                    />
                    <button type="submit" disabled={creating || !newWaveName.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 22px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '0.9rem', cursor: newWaveName.trim() ? 'pointer' : 'not-allowed', background: newWaveName.trim() ? '#00ff41' : '#111', color: newWaveName.trim() ? '#000' : '#333', transition: 'all .2s', whiteSpace: 'nowrap' }}>
                        <FaPlusCircle /> {creating ? 'Creating…' : 'Add Wave'}
                    </button>
                </form>
            </div>

            {/* ── Unassigned warning ───────────────────────────── */}
            {allChallenges.length > 0 && allChallenges.filter(c => !c.wave_id).length > 0 && (
                <div style={{ background: 'rgba(255,159,10,0.06)', border: '1px solid rgba(255,159,10,0.18)', borderRadius: '10px', padding: '12px 18px', marginBottom: '22px', color: '#ff9f0a', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    ⚠ {allChallenges.filter(c => !c.wave_id).length} challenge(s) are not in any wave and will always be visible to participants.
                </div>
            )}

            {/* ── Wave list ────────────────────────────────────── */}
            {waves.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '70px 40px', ...glass }}>
                    <FaWater size="3em" color="#1a1a1a" style={{ marginBottom: '16px' }} />
                    <p style={{ color: '#333', margin: 0, fontSize: '1rem' }}>No waves yet.</p>
                    <p style={{ color: '#252525', fontSize: '0.82rem', marginTop: '6px' }}>Create your first wave above and assign challenges to it.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {waves.map((wave, idx) => {
                        const isPicking = pickingForWave === wave.id;
                        const isExpanded = expandedWave === wave.id;

                        return (
                            <div key={wave.id} style={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${wave.is_active ? 'rgba(0,255,65,0.25)' : 'rgba(255,255,255,0.05)'}`, background: '#080808', boxShadow: wave.is_active ? '0 0 30px rgba(0,255,65,0.07)' : 'none', transition: 'all .3s' }}>

                                {/* ── Wave header bar ─────────────────── */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 18px)', padding: 'clamp(14px, 2vw, 20px) clamp(14px, 2.5vw, 24px)', flexWrap: 'wrap' }}>

                                    {/* Order circle */}
                                    <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: '#111', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron', fontSize: '0.9rem', color: '#333', flexShrink: 0 }}>
                                        {idx + 1}
                                    </div>

                                    {/* Wave name + meta */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: '600', letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {wave.name}
                                        </div>
                                        <div style={{ color: '#383838', fontSize: '0.75rem', marginTop: '3px' }}>
                                            {wave.challenge_count} challenge{wave.challenge_count !== 1 ? 's' : ''}
                                        </div>
                                    </div>

                                    {/* Live / Locked badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 14px', borderRadius: '20px', border: `1px solid ${wave.is_active ? 'rgba(0,255,65,0.35)' : '#222'}`, background: wave.is_active ? 'rgba(0,255,65,0.08)' : '#0d0d0d', flexShrink: 0 }}>
                                        {wave.is_active ? (
                                            <>
                                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff41', boxShadow: '0 0 8px #00ff41', display: 'inline-block', animation: 'pulse 1.6s ease-in-out infinite' }} />
                                                <span style={{ color: '#00ff41', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaLock size="0.65em" color="#444" />
                                                <span style={{ color: '#444', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Locked</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Assign Challenges */}
                                    <button onClick={() => isPicking ? closePicker() : openPicker(wave)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 16px', borderRadius: '8px', border: `1px solid ${isPicking ? '#64d2ff' : '#222'}`, background: isPicking ? 'rgba(100,210,255,0.1)' : '#111', color: isPicking ? '#64d2ff' : '#777', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap', flexShrink: 0 }}
                                        onMouseEnter={e => { if (!isPicking) { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#ccc'; } }}
                                        onMouseLeave={e => { if (!isPicking) { e.currentTarget.style.borderColor = '#222'; e.currentTarget.style.color = '#777'; } }}>
                                        {isPicking ? '✕ Cancel' : <><FaPlusCircle size="0.85em" /> Assign Challenges</>}
                                    </button>

                                    {/* Release / Lock */}
                                    <button onClick={() => toggleWave(wave)}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '8px 18px', borderRadius: '8px', border: `1px solid ${wave.is_active ? 'rgba(255,159,10,0.4)' : 'rgba(0,255,65,0.35)'}`, background: wave.is_active ? 'rgba(255,159,10,0.08)' : 'rgba(0,255,65,0.08)', color: wave.is_active ? '#ff9f0a' : '#00ff41', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {wave.is_active ? <><FaPause size="0.75em" /> Lock</> : <><FaBolt size="0.75em" /> Release</>}
                                    </button>

                                    {/* Expand */}
                                    <button onClick={() => setExpandedWave(isExpanded ? null : wave.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'color .2s', flexShrink: 0 }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>
                                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>

                                    {/* Delete */}
                                    <button onClick={() => deleteWave(wave)}
                                        style={{ background: 'transparent', border: 'none', color: '#252525', cursor: 'pointer', padding: '8px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'all .2s', flexShrink: 0 }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#ff453a'; e.currentTarget.style.background = 'rgba(255,69,58,0.08)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = '#252525'; e.currentTarget.style.background = 'transparent'; }}>
                                        <FaTrash />
                                    </button>
                                </div>

                                {/* ── Challenge picker ─────────────────── */}
                                {isPicking && (
                                    <div style={{ borderTop: '1px solid #111', padding: '24px', background: 'rgba(6,6,6,0.98)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                                            <div>
                                                <p style={{ margin: '0 0 3px', color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>Select Challenges for {wave.name}</p>
                                                <p style={{ margin: 0, color: '#444', fontSize: '0.75rem' }}>{selectedIds.size} selected · click a card to toggle</p>
                                            </div>
                                            <button onClick={saveAssignment} disabled={saving}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: saving ? '#111' : '#00ff41', color: saving ? '#444' : '#000', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.88rem', transition: 'all .2s', opacity: saving ? 0.7 : 1 }}>
                                                <FaCheck /> {saving ? 'Saving…' : 'Save Assignment'}
                                            </button>
                                        </div>

                                        {allChallenges.length === 0 ? (
                                            <p style={{ color: '#333', fontStyle: 'italic' }}>No challenges in this event yet.</p>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: '14px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                                                {allChallenges.map(c => {
                                                    const sel = selectedIds.has(c.id);
                                                    const inOther = c.wave_id && c.wave_id !== wave.id;
                                                    const otherName = inOther ? waves.find(w => w.id === c.wave_id)?.name : null;
                                                    const cs = getCat(c.category);
                                                    return (
                                                        <div key={c.id} onClick={() => toggle(c.id)}
                                                            style={{ background: sel ? 'rgba(0,255,65,0.05)' : '#0d0d0d', border: `1px solid ${sel ? 'rgba(0,255,65,0.45)' : '#1a1a1a'}`, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '145px', transition: 'all .18s' }}
                                                            onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${sel ? 'rgba(0,255,65,0.65)' : cs.border}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${sel ? 'rgba(0,255,65,0.45)' : '#1a1a1a'}`; e.currentTarget.style.transform = 'translateY(0)'; }}>

                                                            <div style={{ height: '3px', background: sel ? '#00ff41' : cs.border, opacity: 0.85, flexShrink: 0 }} />

                                                            {sel && (
                                                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#00ff41', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,255,65,0.5)' }}>
                                                                    <FaCheck size="0.5em" color="#000" />
                                                                </div>
                                                            )}

                                                            <div style={{ padding: '14px 14px 12px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                    <span style={{ background: cs.bg, border: `1px solid ${cs.border}`, color: cs.color, padding: '2px 8px', borderRadius: '4px', fontSize: '0.62rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.category}</span>
                                                                    <span style={{ fontFamily: 'Orbitron', color: '#fff', fontSize: '0.83rem', fontWeight: '700' }}>{c.points}<span style={{ color: '#333', fontSize: '0.6rem', marginLeft: '2px' }}>pts</span></span>
                                                                </div>
                                                                <h4 style={{ margin: '0 0 6px', color: '#fff', fontSize: '0.88rem', fontFamily: 'Orbitron', fontWeight: '500', lineHeight: '1.4', wordBreak: 'break-word' }}>{c.title}</h4>
                                                                <p style={{ margin: 0, color: '#444', fontSize: '0.76rem', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textOverflow: 'ellipsis', flexGrow: 1 }}>{c.description || 'No description.'}</p>
                                                            </div>

                                                            {inOther && (
                                                                <div style={{ padding: '5px 14px', background: 'rgba(255,159,10,0.07)', borderTop: '1px solid rgba(255,159,10,0.18)', fontSize: '0.67rem', color: '#ff9f0a' }}>
                                                                    Already in: {otherName}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Expanded: challenge list ─────────── */}
                                {isExpanded && !isPicking && (
                                    <div style={{ borderTop: '1px solid #111', padding: '20px 24px', background: 'rgba(6,6,6,0.9)' }}>
                                        {challengesFor(wave.id).length === 0 ? (
                                            <p style={{ color: '#2a2a2a', fontStyle: 'italic', fontSize: '0.85rem', margin: 0 }}>No challenges assigned yet — click "Assign Challenges" above.</p>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '10px' }}>
                                                {challengesFor(wave.id).map(c => {
                                                    const cs = getCat(c.category);
                                                    return (
                                                        <div key={c.id} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '10px', overflow: 'hidden', minHeight: '100px', display: 'flex', flexDirection: 'column' }}>
                                                            <div style={{ height: '2px', background: cs.border, opacity: 0.7 }} />
                                                            <div style={{ padding: '12px 14px', flexGrow: 1 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                                    <span style={{ background: cs.bg, border: `1px solid ${cs.border}`, color: cs.color, padding: '1px 7px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase' }}>{c.category}</span>
                                                                    <span style={{ fontFamily: 'Orbitron', color: '#fff', fontSize: '0.78rem', fontWeight: '700' }}>{c.points}<span style={{ color: '#333', fontSize: '0.58rem', marginLeft: '2px' }}>pts</span></span>
                                                                </div>
                                                                <div style={{ color: '#ccc', fontSize: '0.82rem', fontFamily: 'Orbitron', fontWeight: '500', lineHeight: '1.4' }}>{c.title}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
