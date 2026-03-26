import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { postJson } from '../utils/csrf';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import BackgroundParticles from './BackgroundParticles';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    
    // Availability states
    const [usernameStatus, setUsernameStatus] = useState({ loading: false, available: null, error: '' });
    const [emailStatus, setEmailStatus] = useState({ loading: false, available: null, error: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError('');

        // Reset status when user types
        if (name === 'username') setUsernameStatus({ loading: false, available: null, error: '' });
        if (name === 'email') setEmailStatus({ loading: false, available: null, error: '' });
    };

    const checkUsername = async (username) => {
        if (username.length < 3) return;
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setUsernameStatus({ loading: false, available: false, error: 'Only letters, numbers and underscores allowed' });
            return;
        }

        setUsernameStatus({ loading: true, available: null, error: '' });
        try {
            const response = await fetch(`/api/auth/check-username/?username=${encodeURIComponent(username)}`);
            const data = await response.json();
            setUsernameStatus({ loading: false, available: data.available, error: data.available ? '' : 'Username already taken' });
        } catch (err) {
            setUsernameStatus({ loading: false, available: null, error: '' });
        }
    };

    const checkEmail = async (email) => {
        if (!email || !email.includes('@')) return;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setEmailStatus({ loading: false, available: false, error: 'Invalid email format' });
            return;
        }

        setEmailStatus({ loading: true, available: null, error: '' });
        try {
            const response = await fetch(`/api/auth/check-email/?email=${encodeURIComponent(email)}`);
            const data = await response.json();
            setEmailStatus({ loading: false, available: data.available, error: data.available ? '' : 'Email already registered' });
        } catch (err) {
            setEmailStatus({ loading: false, available: null, error: '' });
        }
    };

    const handleOtpChange = (element, index) => {
        const value = element.value.toUpperCase();
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Focus next input
        if (value && element.nextElementSibling) {
            element.nextElementSibling.focus();
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Final frontend validation
        if (usernameStatus.error || emailStatus.error) {
            setError('Please fix the errors before proceeding.');
            return;
        }

        if (usernameStatus.available === false || emailStatus.available === false) {
            setError('Username or email is already taken.');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/;
        if (!passwordRegex.test(formData.password)) {
            setError('Password must be 8-16 chars, with at least one uppercase, one lowercase, and one special character.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const data = await postJson('/api/auth/send-otp/', {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase()
            });

            if (data.success) {
                setStep(2);
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpString = otp.join('').toUpperCase();
        if (otpString.length < 6) {
            setError('Please enter the full 6-character code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await postJson('/api/auth/register/', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                otp: otpString
            });

            if (data.success) {
                // Successful registration logs the user in on the backend
                // The frontend should ideally refresh auth state or just navigate
                window.location.href = '/dashboard';
            } else {
                setError(data.error || 'Verification failed');
            }
        } catch (err) {
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <h2 className="auth-title">REGISTER</h2>
                    <p className="auth-subtitle">Join the glitched revolution.</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleRegister}
                            className="auth-form"
                        >
                            {error && (
                                <div style={{ color: '#ff4444', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    className={`form-input ${usernameStatus.error ? 'input-error' : usernameStatus.available ? 'input-success' : ''}`}
                                    placeholder="Agent Name"
                                    value={formData.username}
                                    onChange={handleChange}
                                    onBlur={(e) => checkUsername(e.target.value)}
                                    required
                                />
                                {usernameStatus.loading && <p className="status-msg">Checking...</p>}
                                {usernameStatus.error && <p className="status-msg error">{usernameStatus.error}</p>}
                                {usernameStatus.available === true && <p className="status-msg success">Username is available</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className={`form-input ${emailStatus.error ? 'input-error' : emailStatus.available ? 'input-success' : ''}`}
                                    placeholder="agent@glitch.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={(e) => checkEmail(e.target.value)}
                                    required
                                />
                                {emailStatus.loading && <p className="status-msg">Checking...</p>}
                                {emailStatus.error && <p className="status-msg error">{emailStatus.error}</p>}
                                {emailStatus.available === true && <p className="status-msg success">Email is available</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex="-1"
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div className="password-wrapper">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex="-1"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>


                            <button type="submit" className="auth-btn" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Verification Code'}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleVerify}
                            className="auth-form"
                        >
                            {error && (
                                <div style={{ color: '#ff4444', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    {error}
                                </div>
                            )}
                            <div className="form-group" style={{ textAlign: 'center' }}>
                                <label className="form-label">Enter Verification Code</label>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    We've sent a code to <span style={{ color: '#39FF14' }}>{formData.email}</span>
                                </p>

                                <div className="otp-container">
                                    {otp.map((data, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength="1"
                                            className="otp-input"
                                            value={data}
                                            onChange={e => handleOtpChange(e.target, index)}
                                            onFocus={e => e.target.select()}
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="auth-btn" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify & Access'}
                            </button>

                            <button
                                type="button"
                                className="auth-btn"
                                style={{ background: 'transparent', border: '1px solid #333', color: '#888', marginTop: '1rem' }}
                                onClick={() => { setStep(1); setError(''); }}
                                disabled={loading}
                            >
                                Back to Details
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <div className="auth-footer">
                    Already an agent?
                    <Link to="/login" className="auth-link">Login</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
