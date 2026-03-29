import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';
import BackgroundParticles from './BackgroundParticles';
import { getCsrfToken } from '../utils/csrf';

const TOTPVerify = ({ onComplete, onCancel }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (code.length !== 6) return setError('Enter the 6-digit code from your authenticator app.');
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/totp/verify/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (res.status === 429) {
                setError('Too many attempts. Wait 1 minute and try again.');
            } else if (data.success) {
                onComplete(data.user);
            } else {
                setError(data.error || 'Invalid code. Try again.');
                setCode('');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <BackgroundParticles />
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ maxWidth: '400px', width: '100%' }}
            >
                <div className="auth-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'rgba(154,205,50,0.08)', border: '2px solid rgba(154,205,50,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(154,205,50,0.15)'
                        }}>
                            <FaShieldAlt color="#9ACD32" size={22} />
                        </div>
                    </div>
                    <h2 className="auth-title" style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>2FA VERIFICATION</h2>
                    <p className="auth-subtitle" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        Open Google Authenticator or Authy and enter the current 6-digit code for <strong>Hack!tUp</strong>.
                    </p>
                </div>

                <form onSubmit={handleVerify} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Authentication Code</label>
                        <input
                            type="text"
                            className="form-input"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="000000"
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                            autoFocus
                            style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '10px', fontFamily: 'monospace', padding: '16px' }}
                        />
                        <div style={{ color: '#555', fontSize: '11px', marginTop: '6px', textAlign: 'center' }}>
                            Code refreshes every 30 seconds
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: '6px', fontSize: '13px',
                            background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.25)',
                            color: '#ff6b6b', marginBottom: '0.5rem'
                        }}>{error}</div>
                    )}

                    <button
                        type="submit"
                        className={`auth-btn ${loading ? 'loading' : ''}`}
                        disabled={loading || code.length !== 6}
                    >
                        {loading ? 'Verifying...' : 'Verify & Access Admin'}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            marginTop: '8px', width: '100%', background: 'transparent',
                            border: 'none', color: '#555', cursor: 'pointer',
                            fontSize: '13px', fontFamily: "'Share Tech Mono', monospace"
                        }}
                    >
                        ← Back to Login
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default TOTPVerify;
