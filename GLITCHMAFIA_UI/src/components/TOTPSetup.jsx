import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaMobileAlt, FaKey, FaCopy, FaCheck } from 'react-icons/fa';
import BackgroundParticles from './BackgroundParticles';
import { getCsrfToken } from '../utils/csrf';

const TOTPSetup = ({ onComplete }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState('loading'); // loading | scan | verify
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchSetupData();
    }, []);

    const fetchSetupData = async () => {
        try {
            const res = await fetch('/api/auth/totp/setup/');
            const data = await res.json();
            if (data.success) {
                setQrCode(data.qr_code);
                setSecret(data.secret);
                setStep('scan');
            } else {
                setError('Failed to load setup. Please try again.');
                setStep('scan');
            }
        } catch {
            setError('Network error. Please refresh and try again.');
            setStep('scan');
        }
    };

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEnable = async (e) => {
        e.preventDefault();
        if (code.length !== 6) return setError('Enter the 6-digit code from your app.');
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/totp/enable/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (data.success) {
                if (onComplete) {
                    onComplete(data.user);
                }
            } else {
                setError(data.error || 'Invalid code. Try again.');
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
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ maxWidth: '480px', width: '100%' }}
            >
                <div className="auth-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '50%',
                            background: 'rgba(154,205,50,0.1)', border: '1px solid rgba(154,205,50,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <FaShieldAlt color="#9ACD32" size={18} />
                        </div>
                    </div>
                    <h2 className="auth-title" style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>SETUP 2FA</h2>
                    <p className="auth-subtitle" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        Two-factor authentication is required for admin access.<br />
                        Scan the QR code with Google Authenticator or Authy.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'loading' && (
                        <motion.div key="loading" style={{ textAlign: 'center', padding: '2rem', color: '#9ACD32', fontFamily: 'monospace' }}>
                            Generating secure key...
                        </motion.div>
                    )}

                    {step === 'scan' && (
                        <motion.div
                            key="scan"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '0 0 1rem' }}
                        >
                            {/* Step indicators */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '0.5rem' }}>
                                {[
                                    { icon: <FaMobileAlt />, label: 'Install App' },
                                    { icon: <FaShieldAlt />, label: 'Scan QR' },
                                    { icon: <FaKey />, label: 'Verify' }
                                ].map((s, i) => (
                                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '50%', margin: '0 auto 6px',
                                            background: 'rgba(154,205,50,0.1)', border: '1px solid rgba(154,205,50,0.4)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#9ACD32', fontSize: '14px'
                                        }}>{s.icon}</div>
                                        <div style={{ color: '#666', fontSize: '10px', letterSpacing: '1px' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* QR Code */}
                            {qrCode && (
                                <div style={{
                                    background: '#fff', borderRadius: '12px', padding: '16px',
                                    display: 'flex', justifyContent: 'center',
                                    border: '2px solid rgba(154,205,50,0.3)'
                                }}>
                                    <img src={qrCode} alt="TOTP QR Code" style={{ width: '180px', height: '180px' }} />
                                </div>
                            )}

                            {/* Manual secret */}
                            <div>
                                <div style={{ color: '#666', fontSize: '11px', letterSpacing: '1px', marginBottom: '6px' }}>
                                    CAN'T SCAN? ENTER MANUALLY:
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: 'rgba(154,205,50,0.05)', border: '1px solid rgba(154,205,50,0.2)',
                                    borderRadius: '8px', padding: '10px 14px'
                                }}>
                                    <span style={{ color: '#9ACD32', fontFamily: 'monospace', fontSize: '13px', flex: 1, wordBreak: 'break-all' }}>
                                        {secret}
                                    </span>
                                    <button onClick={handleCopySecret} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#9ACD32' : '#555' }}>
                                        {copied ? <FaCheck /> : <FaCopy />}
                                    </button>
                                </div>
                            </div>

                            {/* Verify form */}
                            <form onSubmit={handleEnable} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Enter 6-digit code from your app</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={code}
                                        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                                        style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: '8px', fontFamily: 'monospace' }}
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <div style={{
                                        padding: '10px 14px', borderRadius: '6px', fontSize: '13px',
                                        background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.25)',
                                        color: '#ff6b6b'
                                    }}>{error}</div>
                                )}

                                <button
                                    type="submit"
                                    className={`auth-btn ${loading ? 'loading' : ''}`}
                                    disabled={loading || code.length !== 6}
                                >
                                    {loading ? 'Verifying...' : 'Enable 2FA & Continue'}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default TOTPSetup;
