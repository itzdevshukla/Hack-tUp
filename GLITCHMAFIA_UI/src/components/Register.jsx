import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Focus next input
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handleRegister = (e) => {
        e.preventDefault();
        // Simulate sending OTP
        console.log('Sending OTP to:', formData.email);
        setStep(2);
    };

    const handleVerify = (e) => {
        e.preventDefault();
        // Verify OTP
        console.log('Verifying OTP (Frontend Simulation):', otp.join(''));
        // Simulate successful verification and login
        navigate('/dashboard');
    };

    return (
        <div className="auth-container">
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
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    className="form-input"
                                    placeholder="Agent Name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    placeholder="agent@glitch.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <button type="submit" className="auth-btn">
                                Send Verification Code
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
                                        />
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="auth-btn">
                                Verify & Access
                            </button>

                            <button
                                type="button"
                                className="auth-btn"
                                style={{ background: 'transparent', border: '1px solid #333', color: '#888', marginTop: '1rem' }}
                                onClick={() => setStep(1)}
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
