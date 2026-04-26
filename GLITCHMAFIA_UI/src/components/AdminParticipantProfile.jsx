import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaEnvelope, FaIdCard, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaTrophy, FaChartBar, FaGamepad } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

function AdminParticipantProfile() {
    const { id, userId } = useParams();
    
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`/api/admin/user/${userId}/`, {
                    headers: {
                        'X-CSRFToken': getCsrfToken()
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch participant details');
                }
                
                const data = await response.json();
                setUserData(data.user);
                setUserStats(data.stats);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    if (loading) return <div className="loading-text">Loading Participant Profile...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;
    if (!userData) return <div className="error-text">Participant not found.</div>;

    const fullName = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || 'No Name Provided';

    return (
        <div style={{ padding: '20px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            <Link to={`/administration/event/${id}/participants`} className="admin-back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#00ff41', textDecoration: 'none', marginBottom: '20px', fontWeight: 'bold' }}>
                <FaArrowLeft /> Back to Participants
            </Link>

            <div className="eud-header" style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginBottom: '30px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
                <div style={{
                    width: '80px', height: '80px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(0,255,65,0.2), rgba(0,255,65,0.05))',
                    border: '1px solid rgba(0,255,65,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', color: '#00ff41',
                    boxShadow: '0 0 20px rgba(0,255,65,0.1)'
                }}>
                    <FaUser />
                </div>
                
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontFamily: 'Orbitron, sans-serif', fontWeight: 900, letterSpacing: '1px' }}>
                            {fullName}
                        </h1>
                        {userData.is_active ? (
                            <span style={{ background: 'rgba(0,255,65,0.15)', color: '#00ff41', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(0,255,65,0.3)' }}>
                                <FaCheckCircle /> Active Account
                            </span>
                        ) : (
                            <span style={{ background: 'rgba(255,76,76,0.15)', color: '#ff4c4c', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,76,76,0.3)' }}>
                                <FaTimesCircle /> Inactive
                            </span>
                        )}
                        {userData.is_staff && (
                            <span style={{ background: 'rgba(0,191,255,0.15)', color: '#00bfff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(0,191,255,0.3)' }}>
                                Staff Member
                            </span>
                        )}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaIdCard /> @{userData.username}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                {/* Registration Details Card */}
                <div style={{
                    background: 'rgba(15,17,23,0.8)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '1.2rem', margin: '0 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                        <FaIdCard color="#00bfff" /> Registration Fields
                    </h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUser /> First Name</span>
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{userData.first_name || '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUser /> Last Name</span>
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{userData.last_name || '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaEnvelope /> Email Address</span>
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#00bfff' }}>{userData.email}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaCalendarAlt /> Joined Date</span>
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{userData.date_joined || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Platform Statistics Card */}
                {userStats && (
                    <div style={{
                        background: 'rgba(15,17,23,0.8)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '1.2rem', margin: '0 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                            <FaChartBar color="#ffb800" /> Platform Statistics
                        </h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div style={{ background: 'linear-gradient(145deg, rgba(255,184,0,0.1), rgba(255,184,0,0.02))', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,184,0,0.2)', textAlign: 'center' }}>
                                <FaTrophy style={{ fontSize: '2rem', color: '#ffb800', marginBottom: '10px' }} />
                                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: '#fff' }}>{userStats.total_points}</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Total Points</div>
                            </div>
                            
                            <div style={{ background: 'linear-gradient(145deg, rgba(0,255,65,0.1), rgba(0,255,65,0.02))', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,255,65,0.2)', textAlign: 'center' }}>
                                <FaCheckCircle style={{ fontSize: '2rem', color: '#00ff41', marginBottom: '10px' }} />
                                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: '#fff' }}>{userStats.challenges_solved}</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Challenges Solved</div>
                            </div>

                            <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(145deg, rgba(0,191,255,0.1), rgba(0,191,255,0.02))', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,191,255,0.2)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                                <FaGamepad style={{ fontSize: '2.5rem', color: '#00bfff' }} />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: '#fff', lineHeight: 1 }}>{userStats.events_joined}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Events Enrolled</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminParticipantProfile;
