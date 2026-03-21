import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaCalendarAlt, FaClock, FaUsers, FaTrophy, FaGamepad, FaArrowLeft, FaKey
} from 'react-icons/fa';

const EventDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessCode, setAccessCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const [agreed, setAgreed] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(`/api/dashboard/event/${id}/`);
                if (res.ok) {
                    const data = await res.json();
                    setEvent(data);
                } else {
                    setError("Failed to locate target coordinates.");
                }
            } catch (err) {
                console.error(err);
                setError("Signal lost. Connection error.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleJoin = async (e) => {
        e.preventDefault();
        if (!accessCode.trim()) return;
        if (!agreed) {
            setError("You must accept the engagement terms.");
            return;
        }

        setJoining(true);
        setError('');

        try {
            const response = await fetch(`/api/dashboard/event/${id}/join/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1]
                },
                body: JSON.stringify({ accessCode })
            });
            const data = await response.json();

            if (data.success) {
                const res = await fetch(`/api/dashboard/event/${id}/`);
                const updated = await res.json();
                setEvent(updated);
            } else {
                setError(data.message || "Invalid Access Key sequence.");
            }
        } catch (err) {
            setError('Connection Terminated. Try again.');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#9ACD32', fontFamily: "'Share Tech Mono', monospace", fontSize: '1.2rem' }}>
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    ESTABLISHING SECURE CONNECTION...
                </motion.div>
            </div>
        );
    }

    if (!event) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#ff4d4d', fontFamily: "'Share Tech Mono', monospace", fontSize: '1.5rem', textTransform: 'uppercase' }}>
                <div>CRITICAL ERROR: OPERATION NOT FOUND</div>
            </div>
        );
    }

    const isLive = (event.status || '').toLowerCase() === 'live';
    const isUpcoming = (event.status || '').toLowerCase() === 'upcoming';
    const statusColor = isLive ? '#ff4d4d' : isUpcoming ? '#9ACD32' : '#888';

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at center, #141414 0%, #000 100%)',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            padding: 'clamp(0.5rem, 2vw, 0.5rem) clamp(1rem, 4vw, 2rem) 4rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decor */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(154,205,50,0.05) 0%, transparent 70%)', zIndex: 0, filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(154,205,50,0.03) 0%, transparent 70%)', zIndex: 0, filter: 'blur(60px)' }} />

            <div style={{ maxWidth: '100%', margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* Back Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ccc',
                        padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', transition: 'all 0.3s', fontSize: '0.9rem', fontWeight: 'bold'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#9ACD32'; e.currentTarget.style.borderColor = 'rgba(154,205,50,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#ccc'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                    <FaArrowLeft /> COMMAND CENTER
                </button>

                {/* Hero Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: `rgba(${isLive ? '255,77,77' : '154,205,50'}, 0.1)`, padding: '5px 15px', borderRadius: '20px', border: `1px solid ${statusColor}`, color: statusColor, fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}></span>
                        {event.status || 'UNKNOWN STATE'}
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 6vw, 3.5rem)', margin: '0 0 1rem 0', fontWeight: '900', letterSpacing: '1px', textShadow: '0 0 20px rgba(154,205,50,0.3)', color: '#fff', wordBreak: 'break-word' }}>
                        {event.title}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: '#aaa', maxWidth: '800px', lineHeight: '1.6', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {event.description}
                    </p>
                </motion.div>

                {/* Grid Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '2rem' }}>

                    {/* Left: Metadata */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        <div style={{ background: 'rgba(20, 20, 20, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(154, 205, 50, 0.2)', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <h2 style={{ fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem', color: '#9ACD32', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaCalendarAlt /> EXERCISE INTEL
                            </h2>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                                <DetailBox icon={<FaClock />} label="START DATE" value={event.start_date} subValue={`${event.start_time} GMT+5:30`} />
                                <DetailBox icon={<FaClock />} label="END DATE" value={event.end_date || "TBA"} subValue={event.end_date ? `${event.end_time || '00:00'} GMT+5:30` : ''} />
                                <DetailBox icon={<FaGamepad />} label="CHALLENGES" value={`${event.challenges_count} Available`} />
                                <DetailBox icon={<FaUsers />} label="PARTICIPANTS" value={`${event.participants_count} Registered`} />
                            </div>

                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', borderLeft: '3px solid #666', fontSize: '0.85rem', color: '#888' }}>
                                Timezone: Asia/Calcutta. <br />All times are shown in your local timezone for convenience.
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Action Panel */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <div style={{ background: 'linear-gradient(145deg, rgba(30, 30, 30, 0.8), rgba(15, 15, 15, 0.9))', backdropFilter: 'blur(10px)', border: '1px solid rgba(154, 205, 50, 0.3)', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 0 40px rgba(154,205,50,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(154,205,50,0.1)', padding: '1rem', borderRadius: '12px', color: '#9ACD32' }}>
                                    <FaTrophy size={24} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>REGISTER FOR EVENT</h2>
                                    <span style={{ fontSize: '0.85rem', color: '#888' }}>Enter the access code to participate.</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#888' }}>Registration:</span>
                                    <span style={{ color: event.is_registration_open ? '#9ACD32' : '#ff4d4d', fontWeight: 'bold' }}>{event.is_registration_open ? "OPEN" : "LOCKED"}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#888' }}>Organizer:</span>
                                    <span style={{ color: '#ccc' }}>{event.organizer}</span>
                                </div>
                            </div>

                            {event.is_registered ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div style={{ textAlign: 'center', color: '#9ACD32', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(154,205,50,0.1)', borderRadius: '8px', border: '1px solid rgba(154,205,50,0.3)' }}>
                                        ✓ CLEARANCE GRANTED
                                    </div>
                                    <button
                                        onClick={() => navigate(`/event/${event.id}/challenges`)}
                                        style={{ width: '100%', padding: '1.2rem', background: '#9ACD32', color: '#000', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 0 20px rgba(154,205,50,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 5px 25px rgba(154,205,50,0.6)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(154,205,50,0.4)'; }}
                                    >
                                        ENTER ARENA
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleJoin}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ACD32', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '1px' }}>
                                            ACCESS CODE *
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <FaKey style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                            <input
                                                type="text"
                                                value={accessCode}
                                                onChange={(e) => setAccessCode(e.target.value)}
                                                placeholder="Enter access code..."
                                                style={{ width: '100%', padding: '12px 12px 12px 45px', background: 'rgba(0,0,0,0.5)', border: '1px solid #333', color: '#fff', borderRadius: '8px', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }}
                                                onFocus={e => e.currentTarget.style.borderColor = '#9ACD32'}
                                                onBlur={e => e.currentTarget.style.borderColor = '#333'}
                                            />
                                        </div>
                                    </div>

                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', color: '#888', cursor: 'pointer', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                                        <input
                                            type="checkbox"
                                            checked={agreed}
                                            onChange={(e) => setAgreed(e.target.checked)}
                                            style={{ marginTop: '3px', accentColor: '#9ACD32', width: '16px', height: '16px' }}
                                        />
                                        <span>I agree to the Terms of Service. I agree to compete fairly and ethically according to the rules.</span>
                                    </label>

                                    <AnimatePresence>
                                        {error && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#ff4d4d', fontSize: '0.85rem', marginBottom: '1.5rem', padding: '10px', borderLeft: '3px solid #ff4d4d', background: 'rgba(255,77,77,0.1)' }}>
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        type="submit"
                                        disabled={joining || !event.is_registration_open}
                                        style={{ width: '100%', padding: '1.2rem', background: !event.is_registration_open ? '#333' : 'transparent', color: !event.is_registration_open ? '#666' : '#9ACD32', border: `2px solid ${!event.is_registration_open ? '#333' : '#9ACD32'}`, borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: !event.is_registration_open ? 'not-allowed' : 'pointer', transition: 'all 0.3s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                                        onMouseEnter={e => { if (event.is_registration_open) { e.currentTarget.style.background = 'rgba(154,205,50,0.1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(154,205,50,0.2)'; } }}
                                        onMouseLeave={e => { if (event.is_registration_open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; } }}
                                    >
                                        {joining ? 'VERIFYING...' : 'JOIN NOW'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media (max-width: 600px) {
                    .event-details-back-btn { margin-bottom: 1.2rem !important; }
                }
            `}} />
        </div>
    );
};

const DetailBox = ({ icon, label, value, subValue }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
        <div style={{ color: '#9ACD32', fontSize: '1.5rem', background: 'rgba(154,205,50,0.1)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(154,205,50,0.2)' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: 'bold', letterSpacing: '1px' }}>{label}</div>
            <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: '600', margin: '4px 0' }}>{value}</div>
            {subValue && <div style={{ fontSize: '0.85rem', color: '#aaa' }}>{subValue}</div>}
        </div>
    </div>
);

export default EventDetails;
