import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';
import { getCsrfToken } from '../utils/csrf';

const AdminEventRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await fetch("/api/admin/event-requests/", {
                headers: {
                    'X-CSRFToken': getCsrfToken()
                }
            });
            const data = await res.json();
            if (res.ok) {
                setRequests(data.requests || []);
            } else {
                console.error("Failed to fetch requests:", data.error);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);


    if (loading) {
        return <div className="admin-loading" style={{ color: "white", padding: "20px" }}>Loading requests...</div>;
    }

    return (
        <div className="admin-events-list">
            <h2 className="admin-section-title">Pending Event Requests</h2>

            {requests.length === 0 ? (
                <div style={{ color: "#aaa", marginTop: "20px" }}>No pending requests at this time.</div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Requested By</th>
                                <th>Date</th>
                                <th>Capacity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: "#fff" }}>{req.event_name}</div>
                                        <div style={{ fontSize: "0.8rem", color: "#aaa" }}>{req.ctf_type} | {req.venue}</div>
                                    </td>
                                    <td>{req.created_by}</td>
                                    <td>{req.start_date}</td>
                                    <td>{req.max_participants}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <Link
                                                to={`/administration/event/${req.id}/edit`}
                                                className="admin-btn-primary"
                                                style={{ padding: '8px 12px', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                                            >
                                                <FaEdit /> Review Request
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminEventRequests;
