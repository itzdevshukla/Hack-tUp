import React, { useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthContext from '../context/AuthContext';
import { FaUserShield, FaEnvelope, FaCalendarAlt, FaStar, FaTrophy, FaCalendarCheck, FaKey, FaTrashAlt, FaTimes } from 'react-icons/fa';
import ActivityHeatmap from './ActivityHeatmap'; // Import the new Heatmap
import './Dashboard.css';
import { getCsrfToken } from '../utils/csrf';

// Helper to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const Profile = () => {
    const { logoutUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('identity');

    // Modal States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Form States
    const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
    const [delForm, setDelForm] = useState({ password: '' });

    // Feedback
    const [msg, setMsg] = useState({ text: '', type: '' }); // type: 'success' | 'error'

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [userRes, statsRes] = await Promise.all([
                    fetch('/api/auth/status/'),
                    fetch('/api/dashboard/overview/')
                ]);

                const userData = await userRes.json();
                const statsData = await statsRes.json();

                if (userData.is_authenticated) {
                    setUser(userData.user);
                }
                setStats(statsData);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load profile data:", error);
                setLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMsg({ text: '', type: '' });

        if (pwdForm.new_password !== pwdForm.confirm_password) {
            setMsg({ text: "New passwords don't match.", type: 'error' });
            return;
        }

        try {
            const res = await fetch('/api/auth/change-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    old_password: pwdForm.old_password,
                    new_password: pwdForm.new_password
                })
            });
            const data = await res.json();
            if (data.success) {
                setMsg({ text: "Password successfully updated. Secure link established.", type: 'success' });
                setPwdForm({ old_password: '', new_password: '', confirm_password: '' });
                setTimeout(() => setShowPasswordModal(false), 2000);
            } else {
                setMsg({ text: data.message || "Failed to change password.", type: 'error' });
            }
        } catch (err) {
            setMsg({ text: "Network anomaly detected.", type: 'error' });
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setMsg({ text: '', type: '' });

        try {
            const res = await fetch('/api/auth/delete-account/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ password: delForm.password })
            });
            const data = await res.json();
            if (data.success) {
                setMsg({ text: "Identity scrubbed from servers. Disconnecting...", type: 'success' });
                setTimeout(() => {
                    logoutUser(); // Let context handle the redirect cleanup
                    window.location.href = '/login';
                }, 1500);
            } else {
                setMsg({ text: data.message || "Authentication failed.", type: 'error' });
            }
        } catch (err) {
            setMsg({ text: "Network anomaly detected.", type: 'error' });
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#9ACD32', fontSize: '1.2rem', fontFamily: "'Share Tech Mono', monospace" }}>
                DECRYPTING PROFILE DATA...
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="dashboard-premium-container"
            style={{
                paddingTop: '0.5rem',
                minHeight: '100vh',
                position: 'relative'
            }}
        >
            {/* TAB NAVIGATION */}
            <div className="glass-panel" style={{
                display: 'flex',
                gap: '8px',
                padding: 'clamp(6px, 1.5vw, 10px)',
                marginBottom: 'clamp(1.5rem, 4vw, 3rem)',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                {['overview', 'activity'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: activeTab === tab || (activeTab === 'identity' && tab === 'overview') ? 'rgba(154, 205, 50, 0.15)' : 'transparent',
                            border: activeTab === tab || (activeTab === 'identity' && tab === 'overview') ? '1px solid rgba(154, 205, 50, 0.3)' : '1px solid transparent',
                            color: activeTab === tab || (activeTab === 'identity' && tab === 'overview') ? '#9ACD32' : '#888',
                            fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
                            fontWeight: activeTab === tab || (activeTab === 'identity' && tab === 'overview') ? 'bold' : 'normal',
                            textTransform: 'uppercase',
                            letterSpacing: 'clamp(0.5px, 0.1vw, 1px)',
                            cursor: 'pointer',
                            padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 3vw, 24px)',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {tab === 'overview' ? 'COMMAND CENTER' : 'MISSION ACTIVITY'}
                        {(activeTab === tab || (activeTab === 'identity' && tab === 'overview')) && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#9ACD32',
                                    boxShadow: '0 0 10px #9ACD32'
                                }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                {(activeTab === 'overview' || activeTab === 'identity') && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}
                    >
                        {/* Identity Card */}
                        <motion.div
                            className="glass-panel"
                            whileHover={{ y: -5, boxShadow: '0 10px 40px rgba(154, 205, 50, 0.15)', borderColor: 'rgba(154, 205, 50, 0.5)' }}
                            style={{
                                padding: 'clamp(1.2rem, 3vw, 3rem)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'clamp(1rem, 2.5vw, 2rem)',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(1rem, 2.5vw, 2rem)', flexWrap: 'wrap' }}>
                                <div style={{
                                    width: 'clamp(70px, 12vw, 120px)',
                                    height: 'clamp(70px, 12vw, 120px)',
                                    borderRadius: '50%',
                                    border: '3px solid #9ACD32',
                                    padding: '4px',
                                    boxShadow: '0 0 20px rgba(154, 205, 50, 0.3)',
                                    flexShrink: 0
                                }}>
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${user?.username || 'G'}&background=141414&color=9ACD32&size=150&bold=true`}
                                        alt="Avatar"
                                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                                    />
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                    <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 2.5rem)', color: '#fff', margin: '0 0 0.5rem 0', textTransform: 'uppercase', letterSpacing: 'clamp(1px, 0.2vw, 2px)', wordBreak: 'break-word' }}>
                                        {user?.username || 'GUEST'}
                                    </h2>

                                    <div style={{
                                        display: 'inline-block',
                                        background: 'rgba(154, 205, 50, 0.15)',
                                        color: '#9ACD32',
                                        padding: '0.4rem 1rem',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        letterSpacing: '1px',
                                        border: '1px solid rgba(154, 205, 50, 0.3)',
                                        marginBottom: '1rem'
                                    }}>
                                        {user?.is_superuser ? 'SYSTEM ADMIN' : user?.has_admin_access ? 'EVENT MANAGER' : 'OPERATIVE'}
                                    </div>

                                    <div style={{ display: 'flex', gap: 'clamp(0.8rem, 2vw, 2rem)', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FaEnvelope style={{ color: '#9ACD32' }} />
                                            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>{user?.email || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <FaCalendarAlt style={{ color: '#9ACD32' }} />
                                            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>Joined {user?.date_joined || 'Unknown'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.8rem', flexDirection: 'column', minWidth: 'clamp(140px, 25vw, 200px)', width: '100%', maxWidth: '250px' }}>
                                    <button
                                        onClick={() => { setMsg({ text: '', type: '' }); setShowPasswordModal(true); }}
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            color: '#9ACD32',
                                            border: '1px solid rgba(154, 205, 50, 0.5)',
                                            padding: '0.8rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'all 0.3s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(154, 205, 50, 0.1)'; e.currentTarget.style.borderColor = '#9ACD32'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(154, 205, 50, 0.5)'; }}
                                    >
                                        <FaKey /> KEY CONFIG
                                    </button>

                                    <button
                                        onClick={() => { setMsg({ text: '', type: '' }); setShowDeleteModal(true); }}
                                        style={{
                                            width: '100%',
                                            background: 'transparent',
                                            color: '#ff4d4d',
                                            border: '1px solid rgba(255, 77, 77, 0.3)',
                                            padding: '0.8rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            transition: 'all 0.3s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)'; e.currentTarget.style.borderColor = '#ff4d4d'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.3)'; }}
                                    >
                                        <FaTrashAlt /> BURN IDENTITY
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Combat Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 'clamp(1rem, 2vw, 2rem)' }}>
                            {/* Stat Card 1: Score */}
                            <motion.div
                                className="glass-panel"
                                whileHover={{ y: -5, borderColor: '#9ACD32', boxShadow: '0 10px 20px rgba(154,205,50,0.15)' }}
                                style={{
                                    padding: 'clamp(1rem, 2.5vw, 2rem)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'clamp(1rem, 2vw, 2rem)'
                                }}
                            >
                                <div style={{ background: 'rgba(154,205,50,0.1)', padding: 'clamp(0.8rem, 2vw, 1.5rem)', borderRadius: '50%', border: '1px solid rgba(154,205,50,0.3)', flexShrink: 0 }}>
                                    <FaStar style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#9ACD32' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Total XP Score</div>
                                    <div style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: '900', color: '#fff', textShadow: '0 0 15px rgba(154,205,50,0.5)' }}>
                                        {stats?.total_score || 0}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Stat Card 2: Flags Captured */}
                            <motion.div
                                className="glass-panel"
                                whileHover={{ y: -5, borderColor: '#9ACD32', boxShadow: '0 10px 20px rgba(154,205,50,0.15)' }}
                                style={{
                                    padding: 'clamp(1rem, 2.5vw, 2rem)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'clamp(1rem, 2vw, 2rem)'
                                }}
                            >
                                <div style={{ background: 'rgba(154,205,50,0.1)', padding: 'clamp(0.8rem, 2vw, 1.5rem)', borderRadius: '50%', border: '1px solid rgba(154,205,50,0.3)', flexShrink: 0 }}>
                                    <FaTrophy style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#9ACD32' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Challenges Solved</div>
                                    <div style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: '900', color: '#fff', textShadow: '0 0 15px rgba(154,205,50,0.5)' }}>
                                        {stats?.challenges_solved || 0}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Stat Card 3: Events Participated */}
                            <motion.div
                                className="glass-panel"
                                whileHover={{ y: -5, borderColor: '#9ACD32', boxShadow: '0 10px 20px rgba(154,205,50,0.15)' }}
                                style={{
                                    padding: 'clamp(1rem, 2.5vw, 2rem)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'clamp(1rem, 2vw, 2rem)'
                                }}
                            >
                                <div style={{ background: 'rgba(154,205,50,0.1)', padding: 'clamp(0.8rem, 2vw, 1.5rem)', borderRadius: '50%', border: '1px solid rgba(154,205,50,0.3)', flexShrink: 0 }}>
                                    <FaCalendarCheck style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: '#9ACD32' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Events Registered</div>
                                    <div style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: '900', color: '#fff', textShadow: '0 0 15px rgba(154,205,50,0.5)' }}>
                                        {stats?.events_registered || 0}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'activity' && (
                    <motion.div
                        key="activity"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                    >
                        <ActivityHeatmap />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {(showPasswordModal || showDeleteModal) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(5px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            style={{
                                background: '#111',
                                border: '1px solid',
                                borderColor: showDeleteModal ? '#ff4d4d' : '#9ACD32',
                                borderRadius: '12px',
                                padding: 'clamp(1.5rem, 4vw, 2.5rem)',
                                width: 'calc(100% - 2rem)',
                                maxWidth: '400px',
                                margin: '0 1rem',
                                position: 'relative',
                                boxSizing: 'border-box',
                                boxShadow: `0 0 40px ${showDeleteModal ? 'rgba(255, 77, 77, 0.2)' : 'rgba(154, 205, 50, 0.2)'}`
                            }}
                        >
                            <button
                                onClick={() => { setShowPasswordModal(false); setShowDeleteModal(false); setMsg({ text: '', type: '' }); }}
                                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <FaTimes size={20} />
                            </button>

                            <h3 style={{ margin: '0 0 1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {showPasswordModal ? <><FaKey style={{ color: '#9ACD32' }} /> Change Logon Key</> : <><FaTrashAlt style={{ color: '#ff4d4d' }} /> Burn Identity</>}
                            </h3>

                            {msg.text && (
                                <div style={{
                                    padding: '10px',
                                    marginBottom: '1rem',
                                    borderRadius: '4px',
                                    background: msg.type === 'error' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(154, 205, 50, 0.1)',
                                    color: msg.type === 'error' ? '#ff4d4d' : '#9ACD32',
                                    border: `1px solid ${msg.type === 'error' ? 'rgba(255, 77, 77, 0.3)' : 'rgba(154, 205, 50, 0.3)'}`,
                                    fontSize: '0.9rem'
                                }}>
                                    {msg.text}
                                </div>
                            )}

                            {showPasswordModal && (
                                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <input
                                        type="password" placeholder="Current Password" required
                                        value={pwdForm.old_password} onChange={(e) => setPwdForm({ ...pwdForm, old_password: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff' }}
                                    />
                                    <input
                                        type="password" placeholder="New Password" required
                                        value={pwdForm.new_password} onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff' }}
                                    />
                                    <input
                                        type="password" placeholder="Confirm New Password" required
                                        value={pwdForm.confirm_password} onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff' }}
                                    />
                                    <button type="submit" style={{ width: '100%', padding: '12px', background: '#9ACD32', border: 'none', borderRadius: '4px', color: '#000', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                                        UPDATE KEY
                                    </button>
                                </form>
                            )}

                            {showDeleteModal && (
                                <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '10px', lineHeight: 1.5 }}>
                                        WARNING: This action is irreversible. All captured flags and standing will be eradicated.
                                    </p>
                                    <input
                                        type="password" placeholder="Verify Password" required
                                        value={delForm.password} onChange={(e) => setDelForm({ password: e.target.value })}
                                        style={{ width: '100%', padding: '12px', background: 'rgba(255, 77, 77, 0.05)', border: '1px solid rgba(255, 77, 77, 0.2)', borderRadius: '4px', color: '#fff' }}
                                    />
                                    <button type="submit" style={{ width: '100%', padding: '12px', background: '#ff4d4d', border: 'none', borderRadius: '4px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                                        CONFIRM ERADICATION
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Profile;
