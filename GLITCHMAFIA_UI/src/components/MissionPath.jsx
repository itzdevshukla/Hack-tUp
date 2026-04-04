import { motion } from 'framer-motion';
import { FaUserPlus, FaTerminal, FaTrophy, FaArrowRight } from 'react-icons/fa';
import './Landing.css';

const MissionPath = () => {
    const steps = [
        {
            title: 'Enlist as Agent',
            description: 'Create your identity in the Hack!tUP database. Secure your profile and gear up for operations.',
            icon: <FaUserPlus />,
            delay: 0.2
        },
        {
            title: 'Execute Hacks',
            description: 'Select your target from various domains. Break security, find the flag, and prove your skills.',
            icon: <FaTerminal />,
            delay: 0.4
        },
        {
            title: 'Claim Glory',
            description: 'Submit flags to gain points. Climb the ranks and establish dominance on the global leaderboard.',
            icon: <FaTrophy />,
            delay: 0.6
        }
    ];

    return (
        <section className="mission-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="section-header"
                >
                    <div className="hero-badge">
                        <span>Initiate Sequence</span>
                    </div>
                    <h2 className="section-title neon-text">THE MISSION PATH</h2>
                    <p className="section-desc">Follow the protocol. Dominate the network.</p>
                </motion.div>

                <div className="mission-grid">
                    {steps.map((step, index) => (
                        <div key={index} className="mission-step-wrapper">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: step.delay }}
                                className="mission-card"
                            >
                                <div className="mission-icon">
                                    {step.icon}
                                </div>
                                <h3 className="mission-title">{step.title}</h3>
                                <p className="mission-desc">{step.description}</p>
                            </motion.div>
                            
                            {index < steps.length - 1 && (
                                <motion.div 
                                    className="step-connector"
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: step.delay + 0.2 }}
                                >
                                    <FaArrowRight className="connector-icon" />
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MissionPath;
