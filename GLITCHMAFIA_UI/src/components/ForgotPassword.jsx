import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaKey, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import BackgroundParticles from './BackgroundParticles';
import { getCsrfToken } from '../utils/csrf';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1 = email, 2 = otp + new password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null); // { msg, type: 'error' | 'success' }
    const [resendTimer, setResendTimer] = useState(0);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 5000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    // Resend countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [resendTimer]);

    const showToast = (msg, type = 'error') => setToast({ msg, type });

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email.trim()) return showToast('Email is required.');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password/send-otp/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            });
            const data = await res.json();
            if (res.status === 429) {
                showToast(data.error || 'Too many requests. Try after 1 hour.');
            } else if (data.success) {
                showToast('OTP sent! Check your inbox.', 'success');
                setStep(2);
                setResendTimer(60);
            } else {
                showToast(data.error || 'Failed to send OTP.');
            }
        } catch {
            showToast('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password/send-otp/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            });
            const data = await res.json();
            if (data.success) {
                showToast('OTP resent successfully.', 'success');
                setResendTimer(60);
            } else {
                showToast(data.error || 'Failed to resend OTP.');
            }
        } catch {
            showToast('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp.trim()) return showToast('OTP is required.');
        if (!newPassword) return showToast('New password is required.');
        if (newPassword !== confirmPassword) return showToast('Passwords do not match.');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password/reset/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim(), new_password: newPassword })
            });
            const data = await res.json();
            if (res.status === 429) {
                showToast(data.error || 'Too many attempts. Try after 1 minute.');
            } else if (data.success) {
                showToast('Password reset successfully! Redirecting to login...', 'success');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                showToast(data.error || 'Reset failed. Please try again.');
            }
        } catch {
            showToast('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(154,205,50,0.2)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '0.95rem',
        fontFamily: "'Share Tech Mono', monospace",
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box'
    };

    return (
        <div className="auth-container">
            <BackgroundParticles />

            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ maxWidth: '420px', width: '100%' }}
            >
                {/* Header */}
                <div className="auth-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: 'rgba(154,205,50,0.1)', border: '1px solid rgba(154,205,50,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {step === 1 ? <FaEnvelope color="#9ACD32" /> : <FaKey color="#9ACD32" />}
                        </div>
                    </div>
                    <h2 className="auth-title">
                        {step === 1 ? 'RECOVER ACCESS' : 'RESET KEY'}
                    </h2>
                    <p className="auth-subtitle" style={{ fontSize: '0.85rem' }}>
                        {step === 1
                            ? 'Enter your registered email to receive a verification code.'
                            : `OTP sent to ${email}. Enter it below with your new password.`}
                    </p>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '1rem' }}>
                        {[1, 2].map(s => (
                            <div key={s} style={{
                                width: s === step ? '28px' : '8px',
                                height: '8px',
                                borderRadius: '4px',
                                background: s <= step ? '#9ACD32' : 'rgba(154,205,50,0.2)',
                                transition: 'all 0.3s ease'
                            }} />
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleSendOtp}
                            className="auth-form"
                        >
                            <div className="form-group">
                                <label className="form-label">Registered Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="agent@hackitup.io"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className={`auth-btn ${loading ? 'loading' : ''}`}
                                disabled={loading}
                            >
                                {loading ? 'Transmitting...' : 'Send OTP'}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleResetPassword}
                            className="auth-form"
                        >
                            <div className="form-group">
                                <label className="form-label">Verification Code (OTP)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter 6-character OTP"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.toUpperCase())}
                                    maxLength={8}
                                    required
                                    autoFocus
                                    style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.1rem' }}
                                />
                                <div style={{ textAlign: 'right', marginTop: '6px' }}>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resendTimer > 0 || loading}
                                        style={{
                                            background: 'none', border: 'none', cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                                            color: resendTimer > 0 ? '#555' : '#9ACD32',
                                            fontSize: '0.8rem', fontFamily: "'Share Tech Mono', monospace"
                                        }}
                                    >
                                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="8-16 chars, upper, lower, special"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)} tabIndex="-1">
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex="-1">
                                        {showConfirm ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={`auth-btn ${loading ? 'loading' : ''}`}
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : 'Reset Password'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                                    width: '100%', background: 'transparent', border: 'none',
                                    color: '#666', cursor: 'pointer', fontSize: '0.85rem', marginTop: '4px',
                                    fontFamily: "'Share Tech Mono', monospace"
                                }}
                            >
                                <FaArrowLeft size={12} /> Change email
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="auth-footer">
                    Remembered your key?
                    <Link to="/login" className="auth-link"> Login</Link>
                </div>
            </motion.div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="fp-toast"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setToast(null)}
                        style={{
                            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
                            background: '#0a0a0a',
                            border: `1px solid ${toast.type === 'success' ? 'rgba(154,205,50,0.4)' : 'rgba(255,77,77,0.4)'}`,
                            borderRadius: '8px', padding: '14px 22px',
                            color: toast.type === 'success' ? '#9ACD32' : '#ff6b6b',
                            fontSize: '14px', minWidth: '320px', cursor: 'pointer',
                            boxShadow: `0 4px 24px ${toast.type === 'success' ? 'rgba(154,205,50,0.15)' : 'rgba(255,77,77,0.15)'}`,
                            fontFamily: "'Share Tech Mono', monospace"
                        }}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ForgotPassword;
