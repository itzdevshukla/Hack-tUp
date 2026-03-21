import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaPlus, FaSignInAlt, FaKey, FaCopy, FaCheck, FaUserMinus, FaSkull, FaChevronRight, FaArrowLeft, FaClock, FaTimes, FaUserPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { postJson } from '../utils/csrf';

// ─────────────────────────────────────────────────────────
// TEAM CARD — Shown when user already has a team
// ─────────────────────────────────────────────────────────
const TeamCard = ({ team, eventId, currentUsername, onUpdate }) => {
    const [copied, setCopied] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [kicking, setKicking] = useState(null);
    const [error, setError] = useState('');

    const isCaptain = team.captain === currentUsername;

    const copyCode = () => {
        navigator.clipboard.writeText(team.invite_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLeave = async () => {
        const result = await Swal.fire({
            title: isCaptain ? 'Disband Team?' : 'Leave Team?',
            text: isCaptain
                ? "You are the captain. If you are the only member, the team will run out of existence. Otherwise, leadership passes to the next oldest member."
                : "Are you sure you want to leave this team?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d',
            cancelButtonColor: '#333',
            confirmButtonText: isCaptain ? 'Yes, let me out' : 'Yes, leave team',
            background: '#1a1a1a',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        setLeaving(true);
        setError('');
        try {
            const data = await postJson(`/api/teams/${team.id}/leave/`);
            if (data.success) {
                Swal.fire({
                    title: 'Left Team',
                    text: data.message || 'You have successfully left the team.',
                    icon: 'success',
                    background: '#1a1a1a',
                    color: '#fff',
                    confirmButtonColor: '#9ACD32',
                    timer: 2000,
                    showConfirmButton: false
                });
                onUpdate(null);
            } else {
                setError(data.error || 'Failed to leave team.');
            }
        } catch {
            setError('Connection error. Try again.');
        } finally {
            setLeaving(false);
        }
    };

    const handleKick = async (username) => {
        const result = await Swal.fire({
            title: `Kick ${username}?`,
            text: "They will be removed from your team roster.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4d4d',
            cancelButtonColor: '#333',
            confirmButtonText: 'Yes, kick them!',
            background: '#1a1a1a',
            color: '#fff'
        });

        if (!result.isConfirmed) return;

        setKicking(username);
        setError('');
        try {
            const data = await postJson(`/api/teams/${team.id}/kick/`, { username });
            if (data.success) {
                onUpdate({ ...team, members: team.members.filter(m => m.username !== username) });
            } else {
                setError(data.error || 'Failed to kick member.');
            }
        } catch {
            setError('Connection error. Try again.');
        } finally {
            setKicking(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: "easeOut", duration: 0.4 }}
            style={{
                width: '100%',
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '2.5rem',
                padding: '2rem'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2rem' }}>
                <div>
                    <div style={{ fontSize: '0.9rem', color: '#9ACD32', letterSpacing: '3px', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>Active Squadron</div>
                    <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#fff', letterSpacing: '2px', fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px rgba(154,205,50,0.2)' }}>{team.name}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.8rem', color: '#777', letterSpacing: '2px', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 700 }}>Capacity</div>
                    <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 800, background: 'rgba(154,205,50,0.1)', padding: '8px 24px', borderRadius: '12px', border: '1px solid rgba(154,205,50,0.3)', boxShadow: '0 0 15px rgba(154,205,50,0.1)' }}>
                        {team.member_count} <span style={{ color: '#666', fontSize: '1rem', margin: '0 4px' }}>/</span> {team.max_team_size || '—'}
                    </div>
                </div>
            </div>

            {/* Invite code */}
            {isCaptain && (
                <div style={{ padding: '1.8rem 2.5rem', background: 'linear-gradient(90deg, rgba(154,205,50,0.1), rgba(10,10,10,0.6))', borderRadius: '16px', border: '1px solid rgba(154,205,50,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#9ACD32', boxShadow: '0 0 15px #9ACD32' }} />
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#888', letterSpacing: '3px', marginBottom: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Classification Key (Invite Code)</div>
                        <code style={{ fontSize: '1.8rem', color: '#fff', fontFamily: 'monospace', letterSpacing: '5px', fontWeight: 700, textShadow: '0 0 15px rgba(154,205,50,0.4)' }}>
                            {team.invite_code}
                        </code>
                    </div>
                    <button
                        onClick={copyCode}
                        title="Copy invite code"
                        style={{
                            background: copied ? 'rgba(154,205,50,0.2)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${copied ? 'rgba(154,205,50,0.5)' : 'rgba(255,255,255,0.1)'}`,
                            color: copied ? '#9ACD32' : '#aaa',
                            padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700, letterSpacing: '1px'
                        }}
                        onMouseEnter={e => { if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                        onMouseLeave={e => { if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    >
                        {copied ? <FaCheck size={18} /> : <FaCopy size={18} />} {copied ? 'COPIED' : 'COPY KEY'}
                    </button>
                </div>
            )}

            {/* Members List */}
            <div>
                <div style={{ fontSize: '1.1rem', color: '#fff', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '24px' }}>
                    Operatives Roster
                    <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(154,205,50,0.3), transparent)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                    {team.members.map((m, i) => (
                        <motion.div
                            key={m.username}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, ease: "easeOut" }}
                            style={{
                                background: m.is_me ? 'linear-gradient(180deg, rgba(154,205,50,0.05), rgba(16,16,16,0.95))' : 'linear-gradient(180deg, rgba(22,22,22,0.8), rgba(12,12,12,0.95))',
                                border: `1px solid ${m.is_me ? 'rgba(154,205,50,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                borderTop: `2px solid ${m.is_me ? 'rgba(154,205,50,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '24px',
                                padding: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                gap: '1.5rem',
                                transition: 'all 0.3s ease',
                                boxShadow: m.is_me ? '0 10px 30px rgba(0,0,0,0.5), inset 0 0 10px rgba(154,205,50,0.02)' : '0 10px 20px rgba(0,0,0,0.4)',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'default'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = m.is_me ? '0 15px 35px rgba(0,0,0,0.6), inset 0 0 15px rgba(154,205,50,0.05)' : '0 12px 25px rgba(0,0,0,0.5)';
                                e.currentTarget.style.borderColor = m.is_me ? 'rgba(154,205,50,0.3)' : 'rgba(255,255,255,0.08)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = m.is_me ? '0 10px 30px rgba(0,0,0,0.5), inset 0 0 10px rgba(154,205,50,0.02)' : '0 10px 20px rgba(0,0,0,0.4)';
                                e.currentTarget.style.borderColor = m.is_me ? 'rgba(154,205,50,0.2)' : 'rgba(255,255,255,0.05)';
                            }}
                        >
                            {/* Glowing Orb Background */}
                            <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '150px', height: '150px', background: m.is_me ? 'radial-gradient(circle, rgba(154,205,50,0.08) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)', pointerEvents: 'none' }} />

                            {/* Badges container */}
                            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                                {m.is_captain && <span style={{ background: 'rgba(240, 165, 0, 0.15)', color: '#f0a500', padding: '4px 12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px', borderRadius: '6px', border: '1px solid rgba(240, 165, 0, 0.4)', boxShadow: '0 0 10px rgba(240,165,0,0.2)' }}>LEADER</span>}
                                {m.is_me && <span style={{ background: 'rgba(154, 205, 50, 0.15)', color: '#9ACD32', padding: '4px 12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '2px', borderRadius: '6px', border: '1px solid rgba(154, 205, 50, 0.4)', boxShadow: '0 0 10px rgba(154,205,50,0.2)' }}>YOU</span>}
                            </div>

                            {/* Avatar */}
                            <div style={{
                                width: '90px', height: '90px', borderRadius: '24px',
                                background: `linear-gradient(135deg, hsl(${m.username.charCodeAt(0) * 13 % 360}, 70%, 50%), hsl(${m.username.charCodeAt(0) * 23 % 360}, 60%, 30%))`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2rem', fontWeight: '800', color: '#fff',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                                zIndex: 1
                            }}>
                                {m.username[0].toUpperCase()}
                            </div>

                            {/* Name & Role */}
                            <div style={{ zIndex: 1, width: '100%' }}>
                                <div style={{ color: '#eee', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '1px', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {m.username}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>
                                    {m.is_captain ? 'Squadron Command' : 'Active Operative'}
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ width: '80%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

                            {/* Stats & Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1rem', zIndex: 1 }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#666', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>Score</div>
                                    <div style={{ color: m.is_me ? '#9ACD32' : '#e0e0e0', fontWeight: 800, fontSize: '1.4rem', fontFamily: 'Inter, sans-serif' }}>
                                        {m.points || 0} <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 600 }}>PTS</span>
                                    </div>
                                </div>

                                {isCaptain && !m.is_captain && (
                                    <button
                                        onClick={() => handleKick(m.username)}
                                        disabled={kicking === m.username}
                                        title={`Revoke access for ${m.username}`}
                                        style={{
                                            background: 'rgba(255,50,50,0.05)', border: '1px solid rgba(255,50,50,0.2)',
                                            color: '#ff4d4d', padding: '12px 20px', borderRadius: '12px',
                                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px',
                                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', letterSpacing: '2px', textTransform: 'uppercase', width: '100%', justifyContent: 'center'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,50,50,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,50,50,0.5)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(255,50,50,0.2)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,50,50,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,50,50,0.2)'; e.currentTarget.style.boxShadow = 'none' }}
                                    >
                                        {kicking === m.username ? '...' : <><FaUserMinus size={16} /> ELIMINATE</>}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Captain: Pending Join Requests Panel */}
            {isCaptain && team.pending_requests && team.pending_requests.length > 0 && (
                <div>
                    <div style={{ fontSize: '1rem', color: '#f0a500', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <FaClock size={16} /> Join Requests
                        <span style={{ background: 'rgba(240,165,0,0.15)', color: '#f0a500', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid rgba(240,165,0,0.4)' }}>{team.pending_requests.length}</span>
                        <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(240,165,0,0.3), transparent)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {team.pending_requests.map(req => (
                            <JoinRequestRow
                                key={req.id}
                                req={req}
                                teamId={team.id}
                                onHandled={(action, username) => {
                                    if (action === 'approve') {
                                        onUpdate({ ...team, pending_requests: team.pending_requests.filter(r => r.id !== req.id) });
                                        window.location.reload();
                                    } else {
                                        onUpdate({ ...team, pending_requests: team.pending_requests.filter(r => r.id !== req.id) });
                                    }
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: '#ff4d4d', fontSize: '1rem', padding: '12px 18px', borderLeft: '4px solid #ff4d4d', background: 'rgba(255,77,77,0.08)', borderRadius: '8px' }}>
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Leave button */}
            <button
                onClick={handleLeave}
                disabled={leaving}
                style={{
                    width: '100%', padding: '1.4rem',
                    background: 'linear-gradient(135deg, rgba(255,50,50,0.08), rgba(0,0,0,0))',
                    border: '1px solid rgba(255,50,50,0.2)',
                    color: '#ff4d4d', borderRadius: '16px', fontWeight: '800', fontSize: '1rem', letterSpacing: '3px', textTransform: 'uppercase',
                    cursor: leaving ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                    marginTop: '1rem'
                }}
                onMouseEnter={e => {
                    if (!leaving) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,50,50,0.15), rgba(255,50,50,0.05))';
                        e.currentTarget.style.borderColor = 'rgba(255,50,50,0.5)';
                        e.currentTarget.style.boxShadow = '0 0 25px rgba(255,50,50,0.2)';
                    }
                }}
                onMouseLeave={e => {
                    if (!leaving) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,50,50,0.08), rgba(0,0,0,0))';
                        e.currentTarget.style.borderColor = 'rgba(255,50,50,0.2)';
                        e.currentTarget.style.boxShadow = 'none';
                    }
                }}
            >
                <FaSkull size={18} />
                {leaving ? 'INITIATING EXIT...' : isCaptain ? 'DISBAND SQUAD / EXIT' : 'ABANDON SQUAD'}
            </button>
        </motion.div>
    );
};

// ─────────────────────────────────────────────────────────
// TEAM PANEL — Borderless 3D Float Redesign (No Central Box)
// ─────────────────────────────────────────────────────────
const TeamPanel = ({ eventId, maxTeamSize, onTeamJoined }) => {
    const [mode, setMode] = useState(null); // 'create' | 'join' | null
    const [teamName, setTeamName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hoveredCard, setHoveredCard] = useState(null);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!teamName.trim()) { setError('Team name is required.'); return; }
        setLoading(true); setError('');
        try {
            const data = await postJson(`/api/teams/event/${eventId}/create/`, { name: teamName.trim() });
            if (data.success) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Team Created!', showConfirmButton: false, timer: 3000, background: '#1a1a1a', color: '#9ACD32' });
                window.location.reload();
            } else {
                setError(data.error || 'Failed to create team.');
            }
        } catch {
            setError('Connection error. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) { setError('Invite code is required.'); return; }
        setLoading(true); setError('');
        try {
            const data = await postJson(`/api/teams/event/${eventId}/join/`, { invite_code: inviteCode.trim() });
            if (data.success && data.pending) {
                // Request created — reload so TeamSection shows PendingRequestCard
                window.location.reload();
            } else if (data.success) {
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Joined Team!', showConfirmButton: false, timer: 3000, background: '#1a1a1a', color: '#9ACD32' });
                window.location.reload();
            } else {
                setError(data.error || 'Invalid invite code.');
            }
        } catch {
            setError('Connection error. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setMode(null);
        setError('');
        setTeamName('');
        setInviteCode('');
    };

    // Very dark, soft, easy-on-the-eyes 3D background
    return (
        <div style={{
            minHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#050505', // Deep black base
        }}>
            {/* Soft, non-intrusive 3D background elements */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                background: 'radial-gradient(circle at 50% -20%, rgba(154,205,50,0.06) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(0,191,255,0.03) 0%, transparent 50%)',
            }} />

            {/* Subtle floating 3D grid line illusion (perspective) */}
            <div style={{
                position: 'absolute', bottom: '-50%', left: '-50%', right: '-50%', height: '100%',
                backgroundImage: 'linear-gradient(transparent 95%, rgba(255,255,255,0.02) 100%), linear-gradient(90deg, transparent 95%, rgba(255,255,255,0.02) 100%)',
                backgroundSize: '50px 50px',
                transform: 'perspective(500px) rotateX(75deg)',
                transformOrigin: 'top center',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.6
            }} />

            {/* Content Wrapper (No enclosing border box, directly floating) */}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {/* Floating Header */}
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} style={{ textAlign: 'center', marginBottom: '5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#9ACD32', marginBottom: '1.2rem', filter: 'drop-shadow(0 0 20px rgba(154,205,50,0.3))' }}>
                        <FaUsers size={48} />
                    </div>
                    <h1 style={{ margin: '0 0 8px', fontSize: '3.2rem', fontFamily: 'Orbitron, sans-serif', color: '#fff', letterSpacing: '4px', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                        TEAM PROTOCOL
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                        <span style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, transparent, rgba(154,205,50,0.4))' }} />
                        <span style={{ color: '#888', fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', fontWeight: 400, letterSpacing: '2px', textTransform: 'uppercase' }}>
                            Capacity: <strong style={{ color: '#ccc', fontWeight: 600 }}>{maxTeamSize} Combatants</strong>
                        </span>
                        <span style={{ height: '1px', width: '60px', background: 'linear-gradient(270deg, transparent, rgba(154,205,50,0.4))' }} />
                    </div>
                </motion.div>

                {/* Interactive State Area */}
                <div style={{ width: '100%' }}>
                    <AnimatePresence mode="wait">
                        {!mode ? (
                            <motion.div
                                key="selection"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }} transition={{ duration: 0.4 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', perspective: '1200px' }}
                            >
                                {/* Floating 3D Create Card */}
                                <div
                                    onClick={() => { setMode('create'); setError(''); }}
                                    onMouseEnter={() => setHoveredCard('create')}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(15,15,15,0.9), rgba(5,5,5,0.95))',
                                        backdropFilter: 'blur(20px)',
                                        borderTop: `1px solid ${hoveredCard === 'create' ? 'rgba(154,205,50,0.6)' : 'rgba(255,255,255,0.06)'}`,
                                        borderLeft: `1px solid ${hoveredCard === 'create' ? 'rgba(154,205,50,0.2)' : 'rgba(255,255,255,0.02)'}`,
                                        borderRight: '1px solid rgba(255,255,255,0.02)',
                                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                                        borderRadius: '24px',
                                        padding: '4rem 3rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        transform: hoveredCard === 'create' ? 'translateY(-15px) rotateX(4deg) scale(1.03)' : 'translateY(0) rotateX(0deg) scale(1)',
                                        boxShadow: hoveredCard === 'create'
                                            ? '0 40px 80px rgba(0,0,0,0.95), 0 0 40px rgba(154,205,50,0.1)'
                                            : '0 25px 50px rgba(0,0,0,0.8)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle at top right, rgba(154,205,50,0.05), transparent 70%)', pointerEvents: 'none' }} />

                                    <div style={{
                                        color: hoveredCard === 'create' ? '#9ACD32' : '#666',
                                        marginBottom: '1.5rem',
                                        transition: 'all 0.4s ease',
                                        filter: hoveredCard === 'create' ? 'drop-shadow(0 0 15px rgba(154,205,50,0.4))' : 'none'
                                    }}>
                                        <FaPlus size={40} />
                                    </div>
                                    <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: '1.6rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px' }}>CREATE SQUAD</h3>
                                    <p style={{ color: '#888', fontSize: '1.05rem', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>Forge a new path. Stand as the leader and invite allies to your customized squadron.</p>

                                    <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: hoveredCard === 'create' ? '#9ACD32' : '#444', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.3s' }}>
                                        Initialize <FaChevronRight size={12} style={{ transform: hoveredCard === 'create' ? 'translateX(5px)' : 'translateX(0)', transition: 'all 0.3s' }} />
                                    </div>
                                </div>

                                {/* Floating 3D Join Card */}
                                <div
                                    onClick={() => { setMode('join'); setError(''); }}
                                    onMouseEnter={() => setHoveredCard('join')}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    style={{
                                        background: 'linear-gradient(180deg, rgba(15,15,15,0.9), rgba(5,5,5,0.95))',
                                        backdropFilter: 'blur(20px)',
                                        borderTop: `1px solid ${hoveredCard === 'join' ? 'rgba(0,191,255,0.6)' : 'rgba(255,255,255,0.06)'}`,
                                        borderLeft: `1px solid ${hoveredCard === 'join' ? 'rgba(0,191,255,0.2)' : 'rgba(255,255,255,0.02)'}`,
                                        borderRight: '1px solid rgba(255,255,255,0.02)',
                                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                                        borderRadius: '24px',
                                        padding: '4rem 3rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        transform: hoveredCard === 'join' ? 'translateY(-15px) rotateX(4deg) scale(1.03)' : 'translateY(0) rotateX(0deg) scale(1)',
                                        boxShadow: hoveredCard === 'join'
                                            ? '0 40px 80px rgba(0,0,0,0.95), 0 0 40px rgba(0,191,255,0.1)'
                                            : '0 25px 50px rgba(0,0,0,0.8)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle at top right, rgba(0,191,255,0.05), transparent 70%)', pointerEvents: 'none' }} />

                                    <div style={{
                                        color: hoveredCard === 'join' ? '#00bfff' : '#666',
                                        marginBottom: '1.5rem',
                                        transition: 'all 0.4s ease',
                                        filter: hoveredCard === 'join' ? 'drop-shadow(0 0 15px rgba(0,191,255,0.4))' : 'none'
                                    }}>
                                        <FaSignInAlt size={40} style={{ marginLeft: '4px' }} />
                                    </div>
                                    <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: '1.6rem', fontFamily: 'Orbitron, sans-serif', letterSpacing: '1px' }}>JOIN SQUAD</h3>
                                    <p style={{ color: '#888', fontSize: '1.05rem', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>Have an encrypted key? Skip configuration and directly reinforce an active combat unit.</p>

                                    <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: hoveredCard === 'join' ? '#00bfff' : '#444', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', transition: 'all 0.3s' }}>
                                        Authenticate <FaChevronRight size={12} style={{ transform: hoveredCard === 'join' ? 'translateX(5px)' : 'translateX(0)', transition: 'all 0.3s' }} />
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.form
                                key={mode}
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20, filter: 'blur(10px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                onSubmit={mode === 'create' ? handleCreate : handleJoin}
                                style={{
                                    background: 'linear-gradient(180deg, rgba(15,15,15,0.95), rgba(5,5,5,0.98))',
                                    backdropFilter: 'blur(30px)',
                                    borderTop: `1px solid ${mode === 'create' ? 'rgba(154,205,50,0.5)' : 'rgba(0,191,255,0.5)'}`,
                                    borderLeft: '1px solid rgba(255,255,255,0.05)',
                                    borderRight: '1px solid rgba(255,255,255,0.02)',
                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                    borderRadius: '20px',
                                    padding: '4rem 3.5rem',
                                    maxWidth: '600px',
                                    width: '100%',
                                    margin: '0 auto',
                                    boxShadow: `0 40px 100px rgba(0,0,0,0.9), 0 0 40px ${mode === 'create' ? 'rgba(154,205,50,0.05)' : 'rgba(0,191,255,0.05)'}`,
                                    position: 'relative'
                                }}
                            >
                                <button
                                    type="button" onClick={goBack}
                                    style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'transparent', border: 'none', color: '#666', padding: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#666'}
                                >
                                    <FaArrowLeft size={14} /> 返回 Selection
                                </button>

                                <div style={{ textAlign: 'center', marginBottom: '3rem', mt: '1rem' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: mode === 'create' ? '#9ACD32' : '#00bfff', marginBottom: '1.2rem', filter: mode === 'create' ? 'drop-shadow(0 0 10px rgba(154,205,50,0.3))' : 'drop-shadow(0 0 10px rgba(0,191,255,0.3))' }}>
                                        {mode === 'create' ? <FaPlus size={36} /> : <FaSignInAlt size={36} />}
                                    </div>
                                    <h2 style={{ margin: 0, color: '#fff', fontFamily: 'Orbitron, sans-serif', fontSize: '2rem', letterSpacing: '2px' }}>
                                        {mode === 'create' ? 'NEW SQUADRON' : 'ENTER KEY'}
                                    </h2>
                                </div>

                                <div style={{ marginBottom: '3rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', letterSpacing: '3px', marginBottom: '12px', textTransform: 'uppercase', fontWeight: 500 }}>
                                        {mode === 'create' ? 'Squadron Designation' : 'Access Code'}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        {mode === 'join' && <FaKey style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: '1.2rem', pointerEvents: 'none' }} />}
                                        <input
                                            type="text"
                                            value={mode === 'create' ? teamName : inviteCode}
                                            onChange={e => mode === 'create' ? setTeamName(e.target.value) : setInviteCode(e.target.value.toUpperCase())}
                                            placeholder={mode === 'create' ? "e.g. Phantom Operatives" : "TEAM-XXXXXXXX"}
                                            maxLength={100}
                                            autoFocus
                                            style={{
                                                width: '100%', padding: mode === 'join' ? '22px 22px 22px 65px' : '22px 25px',
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderBottom: `2px solid rgba(255,255,255,0.1)`,
                                                color: '#fff',
                                                borderRadius: '12px',
                                                fontSize: '1.2rem', outline: 'none', transition: 'all 0.3s ease',
                                                boxSizing: 'border-box', fontFamily: mode === 'join' ? 'monospace' : 'Orbitron, sans-serif',
                                                letterSpacing: mode === 'join' ? '5px' : '2px'
                                            }}
                                            onFocus={e => {
                                                e.currentTarget.style.borderBottomColor = mode === 'create' ? '#9ACD32' : '#00bfff';
                                                e.currentTarget.style.borderColor = mode === 'create' ? 'rgba(154,205,50,0.3)' : 'rgba(0,191,255,0.3)';
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                                e.currentTarget.style.boxShadow = mode === 'create' ? '0 10px 30px rgba(154,205,50,0.05)' : '0 10px 30px rgba(0,191,255,0.05)';
                                            }}
                                            onBlur={e => {
                                                e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.1)';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -5, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '2.5rem' }}>
                                            <div style={{ color: '#ff6b6b', fontSize: '0.95rem', padding: '14px 18px', borderRadius: '10px', background: 'rgba(255,107,107,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <FaSkull size={16} /> {error}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit" disabled={loading}
                                    style={{
                                        width: '100%', padding: '22px',
                                        background: mode === 'create' ? 'linear-gradient(135deg, rgba(154,205,50,0.2), rgba(154,205,50,0.05))' : 'linear-gradient(135deg, rgba(0,191,255,0.2), rgba(0,191,255,0.05))',
                                        border: `1px solid ${mode === 'create' ? 'rgba(154,205,50,0.4)' : 'rgba(0,191,255,0.4)'}`,
                                        color: mode === 'create' ? '#9ACD32' : '#00bfff',
                                        borderRadius: '14px', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '3px', textTransform: 'uppercase',
                                        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                                        transition: 'all 0.3s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px',
                                    }}
                                    onMouseEnter={e => {
                                        if (!loading) {
                                            e.currentTarget.style.background = mode === 'create' ? 'linear-gradient(135deg, rgba(154,205,50,0.3), rgba(154,205,50,0.1))' : 'linear-gradient(135deg, rgba(0,191,255,0.3), rgba(0,191,255,0.1))';
                                            e.currentTarget.style.color = '#fff';
                                            e.currentTarget.style.boxShadow = mode === 'create' ? '0 10px 30px rgba(154,205,50,0.3)' : '0 10px 30px rgba(0,191,255,0.3)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.borderColor = mode === 'create' ? 'rgba(154,205,50,0.8)' : 'rgba(0,191,255,0.8)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!loading) {
                                            e.currentTarget.style.background = mode === 'create' ? 'linear-gradient(135deg, rgba(154,205,50,0.2), rgba(154,205,50,0.05))' : 'linear-gradient(135deg, rgba(0,191,255,0.2), rgba(0,191,255,0.05))';
                                            e.currentTarget.style.color = mode === 'create' ? '#9ACD32' : '#00bfff';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.borderColor = mode === 'create' ? 'rgba(154,205,50,0.4)' : 'rgba(0,191,255,0.4)';
                                        }
                                    }}
                                >
                                    {loading && <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'currentColor', borderRadius: '50%', animation: 'fa-spin 1s linear infinite' }} />}
                                    {loading ? 'PROCESSING...' : (mode === 'create' ? 'INITIALIZE SQUAD' : 'VERIFY & ENTER')}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div >
    );
};

// ─────────────────────────────────────────────────────────
// JOIN REQUEST ROW — Shown to captain for each pending request
// ─────────────────────────────────────────────────────────
const JoinRequestRow = ({ req, teamId, onHandled }) => {
    const [acting, setActing] = useState(null);
    const handleAction = async (action) => {
        setActing(action);
        try {
            const data = await postJson(`/api/teams/${teamId}/requests/${req.id}/`, { action });
            if (data.success) onHandled(action, req.username);
        } catch { /* ignore */ }
        finally { setActing(null); }
    };
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(240,165,0,0.05)', border: '1px solid rgba(240,165,0,0.15)', borderRadius: '12px', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, hsl(${req.username.charCodeAt(0) * 13 % 360},70%,50%), hsl(${req.username.charCodeAt(0) * 23 % 360},60%,30%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>
                    {req.username[0].toUpperCase()}
                </div>
                <div>
                    <div style={{ color: '#fff', fontWeight: 700 }}>{req.username}</div>
                    <div style={{ color: '#666', fontSize: '0.78rem' }}>Wants to join your squad</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleAction('approve')} disabled={!!acting}
                    style={{ padding: '8px 18px', background: 'rgba(154,205,50,0.1)', border: '1px solid rgba(154,205,50,0.4)', color: '#9ACD32', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(154,205,50,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(154,205,50,0.1)'}
                >
                    {acting === 'approve' ? '...' : <><FaCheck size={12} /> Approve</>}
                </button>
                <button onClick={() => handleAction('reject')} disabled={!!acting}
                    style={{ padding: '8px 18px', background: 'rgba(255,77,77,0.05)', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,77,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,77,77,0.05)'}
                >
                    {acting === 'reject' ? '...' : <><FaTimes size={12} /> Reject</>}
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// PENDING REQUEST CARD — Shown to user while waiting for captain
// ─────────────────────────────────────────────────────────
const PendingRequestCard = ({ request, onCancel }) => {
    const [cancelling, setCancelling] = useState(false);
    const handleCancel = async () => {
        setCancelling(true);
        try {
            const data = await postJson(`/api/teams/requests/${request.id}/cancel/`);
            if (data.success) onCancel();
        } catch { /* ignore */ }
        finally { setCancelling(false); }
    };
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
            <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#f0a500', marginBottom: '2rem', filter: 'drop-shadow(0 0 20px rgba(240,165,0,0.4))' }}>
                    <FaClock size={56} />
                </motion.div>
                <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: '#fff', fontSize: '2rem', letterSpacing: '2px', marginBottom: '0.5rem' }}>PENDING APPROVAL</h2>
                <p style={{ color: '#888', marginBottom: '0.5rem', fontSize: '1.05rem' }}>Your request to join</p>
                <p style={{ color: '#f0a500', fontWeight: 700, fontSize: '1.3rem', fontFamily: 'Orbitron, sans-serif', marginBottom: '1.5rem' }}>{request.team_name}</p>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '3rem' }}>is awaiting the captain's approval. You'll be able to access the event once approved.</p>
                <button onClick={handleCancel} disabled={cancelling}
                    style={{ padding: '14px 32px', background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.3)', color: '#ff4d4d', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '1px', display: 'inline-flex', alignItems: 'center', gap: '10px', transition: 'all 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,77,77,0.6)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,77,77,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,77,77,0.3)'; }}
                >
                    <FaTimes size={14} /> {cancelling ? 'Cancelling...' : 'Cancel Request'}
                </button>
            </div>
        </motion.div>
    );
};

// ─────────────────────────────────────────────────────────
// TEAM SECTION — Main export — wraps all states
// ─────────────────────────────────────────────────────────
const TeamSection = ({ eventId, maxTeamSize, currentUsername }) => {
    const [team, setTeam] = useState(undefined);
    const [pendingRequest, setPendingRequest] = useState(undefined);
    const [rejectedInfo, setRejectedInfo] = useState(null);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const fetchMyTeam = async () => {
            try {
                const res = await fetch(`/api/teams/event/${eventId}/my-team/`, { credentials: 'include' });
                const data = await res.json();
                setTeam(data.team ?? null);
                setPendingRequest(data.pending_request ?? null);
                setRejectedInfo(data.rejected_request ?? null);
            } catch {
                setLoadError('Failed to load team info.');
                setTeam(null);
                setPendingRequest(null);
            }
        };
        fetchMyTeam();
    }, [eventId]);

    if (team === undefined) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontFamily: 'monospace' }}>LOADING TEAM DATA...</div>;
    }

    if (loadError) return <div style={{ color: '#ff4d4d', padding: '1rem' }}>{loadError}</div>;

    if (team) {
        return (
            <TeamCard
                team={{ ...team, max_team_size: maxTeamSize }}
                eventId={eventId}
                currentUsername={currentUsername}
                onUpdate={setTeam}
            />
        );
    }

    if (pendingRequest) {
        return <PendingRequestCard request={pendingRequest} onCancel={() => { setPendingRequest(null); setRejectedInfo(null); }} />;
    }

    return (
        <TeamPanel
            eventId={eventId}
            maxTeamSize={maxTeamSize}
            onTeamJoined={setTeam}
            rejectedInfo={rejectedInfo}
        />
    );
};

export default TeamSection;
