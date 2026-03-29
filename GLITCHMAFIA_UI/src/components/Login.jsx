import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import BackgroundParticles from './BackgroundParticles';
import TOTPSetup from './TOTPSetup';
import TOTPVerify from './TOTPVerify';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [toast, setToast] = useState(null);
    const { loginUser, totpState, completeTotpLogin, cancelTotpLogin } = useContext(AuthContext);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Auto-dismiss toast after 4 seconds
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        e.target.username.value = e.target.username.value.trim();
        await loginUser(e, (msg) => {
            setToast(msg);
            setIsLoggingIn(false);
        });
    };

    // Show TOTP screens when admin login requires 2FA
    if (totpState === 'setup') {
        return <TOTPSetup onComplete={completeTotpLogin} />;
    }
    if (totpState === 'verify') {
        return <TOTPVerify onComplete={completeTotpLogin} onCancel={cancelTotpLogin} />;
    }

    return (
        <div className="auth-container">
            <BackgroundParticles />
            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <h2 className="auth-title">LOGIN</h2>
                    <p className="auth-subtitle">Welcome back, Agent.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            name="username"
                            className="form-input"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="form-input"
                                placeholder="Enter your password"
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

                    <button 
                        type="submit" 
                        className={`auth-btn ${isLoggingIn ? 'loading' : ''}`}
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? 'Accessing...' : 'Access System'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <Link to="/forgot-password" style={{ color: '#9ACD32', fontSize: '0.85rem', opacity: 0.8, textDecoration: 'none', fontFamily: "'Share Tech Mono', monospace" }}>
                        Forgot Password?
                    </Link>
                </div>

                <div className="auth-footer">
                    Don't have an account?
                    <Link to="/register" className="auth-link">Register</Link>
                </div>
            </motion.div>

            {/* Bottom-right toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="login-toast"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setToast(null)}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            zIndex: 9999,
                            background: '#000',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            padding: '14px 22px',
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: '15px',
                            minWidth: '360px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                        }}
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Login;
