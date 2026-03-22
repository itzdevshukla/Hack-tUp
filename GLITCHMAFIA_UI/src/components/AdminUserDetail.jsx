import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaTrophy, FaPuzzlePiece, FaBullseye, FaCalendarAlt } from 'react-icons/fa';
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

    return (
        <>
            <div className="admin-content-header">
                <h1 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', fontSize: 'clamp(1.1rem, 3.5vw, 2rem)' }}>User: {user.username}</h1>
                <p className="admin-content-subtitle">
                    <Link to="/administration/users" style={{ color: '#fff', textDecoration: 'none' }}>← Back to Users</Link>
                </p>
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
                        {events.length === 0 && <tr><td colSpan="3">No events joined.</td></tr>}
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
                        {solved_challenges.length === 0 && <tr><td colSpan="4">No challenges solved yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </>
    );
}

export default AdminUserDetail;
