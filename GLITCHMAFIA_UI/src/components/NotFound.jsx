import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

function NotFound() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100%',
            backgroundColor: '#050505',
            color: '#00ff41',
            fontFamily: '"Share Tech Mono", monospace',
            textAlign: 'center',
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <FaExclamationTriangle style={{
                fontSize: 'clamp(4rem, 10vw, 6rem)',
                marginBottom: '20px',
                color: '#ff3b30',
                filter: 'drop-shadow(0 0 10px rgba(255, 59, 48, 0.5))'
            }} />

            <h1 style={{
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                margin: '0',
                textTransform: 'uppercase',
                letterSpacing: 'clamp(2px, 2vw, 5px)',
                textShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
            }}>
                404
            </h1>

            <h2 style={{
                fontSize: 'clamp(1.2rem, 4vw, 2rem)',
                margin: '10px 0 30px 0',
                color: '#aaa',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}>
                Page Not Found
            </h2>

            <p style={{
                fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                color: '#888',
                maxWidth: '600px',
                lineHeight: '1.6',
                marginBottom: '40px',
                padding: '0 10px'
            }}>
                The endpoint you are trying to access does not exist in the system architecture.
                It may have been moved, deleted, or you might have typed the URL incorrectly.
            </p>

            <Link to="/" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 25px',
                backgroundColor: 'transparent',
                border: '1px solid #00ff41',
                color: '#00ff41',
                textDecoration: 'none',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                letterSpacing: '1px',
                borderRadius: '4px',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 15px rgba(0, 255, 65, 0.1) inset',
                fontSize: 'clamp(0.8rem, 2vw, 1rem)'
            }}
                onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 255, 65, 0.1)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 65, 0.3) inset, 0 0 10px rgba(0, 255, 65, 0.2)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 65, 0.1) inset';
                }}
            >
                <FaHome style={{ fontSize: '1.2rem' }} /> Return to Base Route
            </Link>
        </div>
    );
}

export default NotFound;
