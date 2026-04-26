import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaIdCard, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaTrophy, FaChartBar, FaGamepad, FaArrowLeft } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

function AdminUserDetail() {
    const { id } = useParams();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchUserDetail = async () => {
        try {
            const response = await fetch(`/api/admin/user/${id}/`, {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            if (!response.ok) throw new Error('Failed to fetch user details');
            const data = await response.json();
            setUserData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserDetail();
    }, [id]);

    if (loading) return <div className="loading-text">Loading User Data...</div>;
    if (error) return <div className="error-text">Error: {error}</div>;
    if (!userData) return <div className="error-text">User not found.</div>;

    const { user, stats, events, solved_challenges } = userData;
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'No Name Provided';

    return (
        <div style={{ padding: '0 20px', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
            <div className="admin-content-header" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '30px' }}>
                <Link to="/administration/users" className="admin-back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#00ff41', textDecoration: 'none', fontWeight: 'bold' }}>
                    <FaArrowLeft /> Back to Users
                </Link>
            </div>

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
                        {user.is_active ? (
                            <span style={{ background: 'rgba(0,255,65,0.15)', color: '#00ff41', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(0,255,65,0.3)' }}>
                                <FaCheckCircle /> Active Account
                            </span>
                        ) : (
                            <span style={{ background: 'rgba(255,76,76,0.15)', color: '#ff4c4c', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(255,76,76,0.3)' }}>
                                <FaTimesCircle /> Inactive
                            </span>
                        )}
                        {user.is_staff && (
                            <span style={{ background: 'rgba(0,191,255,0.15)', color: '#00bfff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(0,191,255,0.3)' }}>
                                Staff Member
                            </span>
                        )}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaIdCard /> @{user.username}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '40px' }}>
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
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{user.first_name || '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaUser /> Last Name</span>
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{user.last_name || '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaEnvelope /> Email Address</span>
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#00bfff' }}>{user.email}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}><FaCalendarAlt /> Joined Date</span>
                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{user.date_joined || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Platform Statistics Card */}
                {stats && (
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
                                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: '#fff' }}>{stats.total_points}</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Total Points</div>
                            </div>
                            
                            <div style={{ background: 'linear-gradient(145deg, rgba(0,255,65,0.1), rgba(0,255,65,0.02))', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,255,65,0.2)', textAlign: 'center' }}>
                                <FaCheckCircle style={{ fontSize: '2rem', color: '#00ff41', marginBottom: '10px' }} />
                                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: '#fff' }}>{stats.challenges_solved}</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Challenges Solved</div>
                            </div>

                            <div style={{ gridColumn: '1 / -1', background: 'linear-gradient(145deg, rgba(0,191,255,0.1), rgba(0,191,255,0.02))', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,191,255,0.2)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                                <FaGamepad style={{ fontSize: '2.5rem', color: '#00bfff' }} />
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Orbitron, sans-serif', color: '#fff', lineHeight: 1 }}>{stats.events_joined}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Events Enrolled</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="admin-table-container" style={{ marginBottom: '40px' }}>
                <h2 style={{ color: '#fff', marginBottom: '20px', fontFamily: 'Orbitron', fontSize: 'clamp(0.95rem, 2.5vw, 1.4rem)' }}>Joined Events</h2>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Event ID</th>
                            <th>Name</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(e => (
                            <tr key={e.id}>
                                <td>{e.id}</td>
                                <td>{e.name}</td>
                                <td>{e.status.toUpperCase()}</td>
                            </tr>
                        ))}
                        {events.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No events joined.</td></tr>}
                    </tbody>
                </table>
            </div>

            <div className="admin-table-container">
                <h2 style={{ color: '#fff', marginBottom: '20px', fontFamily: 'Orbitron', fontSize: 'clamp(0.95rem, 2.5vw, 1.4rem)' }}>Solved Challenges</h2>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Challenge</th>
                            <th>Event</th>
                            <th>Points</th>
                            <th>Solved At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {solved_challenges.map(sc => (
                            <tr key={sc.challenge_id}>
                                <td>{sc.title}</td>
                                <td>{sc.event}</td>
                                <td style={{ color: '#fff' }}>{sc.points}</td>
                                <td>{sc.submitted_at}</td>
                            </tr>
                        ))}
                        {solved_challenges.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No challenges solved yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminUserDetail;
