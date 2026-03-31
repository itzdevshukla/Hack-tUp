import { FaInstagram, FaDiscord, FaEnvelope, FaBolt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="cta-section">
                    <motion.div
                        className="cta-content"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2>Ready to Transform?</h2>
                        <p>Join the elite hackers and start your journey today.</p>
                        <a href="/register" className="btn-primary">
                            <FaBolt /> Join Hack!t
                        </a>
                    </motion.div>
                </div>

                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo">
                            <span className="neon-text">Hack!t</span>UP
                        </div>
                        <p>Elite CTF Platform for the next generation of cybersecurity experts.</p>
                        <div className="social-links">
                            <a href="https://www.instagram.com/hackitup_india/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                            <a href="https://discord.gg/rR5BQDaPC" target="_blank" rel="noopener noreferrer"><FaDiscord /></a>
                            <a href="mailto:info@hackitupnow.tech"><FaEnvelope /></a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <div className="footer-col">
                            <h4>Platform</h4>
                            <a href="#">Challenges</a>
                            <a href="#">Scoreboard</a>
                            <a href="#">Rules</a>
                        </div>
                        <div className="footer-col">
                            <h4>Resources</h4>
                            <a href="#">Blog</a>
                            <a href="#">Learn</a>
                            <a href="#">Community</a>
                        </div>
                        <div className="footer-col">
                            <h4>Legal</h4>
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                            <a href="#">Conduct</a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 Hack!t. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
