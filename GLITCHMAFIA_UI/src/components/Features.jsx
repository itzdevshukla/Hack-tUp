import { motion } from 'framer-motion';
import { FaShieldAlt, FaNetworkWired, FaChartLine, FaRobot, FaLockOpen, FaServer } from 'react-icons/fa';
import './Landing.css';

const Features = () => {
    const features = [
        {
            title: 'Dynamic Waves',
            desc: 'Challenges unlock in tactical waves. Adapt your strategy as new threats emerge and difficulty scales.',
            icon: <FaNetworkWired />
        },
        {
            title: 'Real-Time Telemetry',
            desc: 'Live scoreboard tracking every capture. Watch ranks shift in real-time as agents battle for dominance.',
            icon: <FaChartLine />
        },
        {
            title: 'Advanced Threat Simulation',
            desc: 'Experience real-world vulnerabilities across Web, Crypto, Pwn, Reverse Engineering, and more.',
            icon: <FaShieldAlt />
        },
        {
            title: 'Automated Infrastructure',
            desc: 'Spin up isolated challenge environments instantly. No waiting, pure hacking.',
            icon: <FaServer />
        },
        {
            title: 'Adaptive Difficulty',
            desc: 'From script kiddie to elite hacker, our challenges adapt to your skill level, pushing you further.',
            icon: <FaRobot />
        },
        {
            title: 'Zero-Day Scenarios',
            desc: 'Face exclusive, never-before-seen puzzles crafted by veteran offensive security engineers.',
            icon: <FaLockOpen />
        }
    ];

    return (
        <section className="features-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-header"
                >
                    <div className="hero-badge">
                        <span>Systems Online</span>
                    </div>
                    <h2 className="section-title neon-text">PLATFORM ARSENAL</h2>
                    <p className="section-desc">Equipped with state-of-the-art cyber warfare capabilities.</p>
                </motion.div>

                <div className="features-grid">
                    {features.map((feat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: idx * 0.1 }}
                            className="feature-card"
                            whileHover={{ y: -10, boxShadow: "0 10px 30px rgba(57, 255, 20, 0.15)" }}
                        >
                            <div className="feature-icon-container">
                                <div className="feature-icon">{feat.icon}</div>
                                <div className="icon-glow"></div>
                            </div>
                            <h3 className="feature-title">{feat.title}</h3>
                            <p className="feature-desc">{feat.desc}</p>
                            <div className="cyber-line"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
            
            {/* Background decorative elements */}
            <div className="grid-overlay"></div>
        </section>
    );
};

export default Features;
