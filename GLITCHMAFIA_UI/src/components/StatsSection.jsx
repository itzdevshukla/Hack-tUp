import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import CountUp from 'react-countup';
import './Landing.css';

const StatsSection = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="stats-section" ref={ref}>
            <div className="stats-container container">
                <div className="terminal-window">
                    <div className="terminal-header">
                        <div className="terminal-dots">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                        </div>
                        <div className="terminal-title">root@hackitup:~# systat --live</div>
                    </div>
                    
                    <div className="terminal-body">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="terminal-content"
                        >
                            <div className="terminal-line typing">
                                <span className="prompt">root@hackitup:~#</span> Gathering intelligence...
                            </div>
                            <div className="terminal-line typing delay-1">
                                <span className="prompt">root@hackitup:~#</span> Accessing global metrics...
                            </div>
                            <div className="terminal-line typing delay-2">
                                <span className="prompt">root@hackitup:~#</span> [OK] Connection established.
                            </div>
                            
                            <div className="stats-grid">
                                <div className="stat-box">
                                    <div className="stat-value">
                                        {isInView && <CountUp end={5420} duration={2.5} separator="," />}+
                                    </div>
                                    <div className="stat-label">Flags Captured</div>
                                    <div className="stat-progress">
                                        <motion.div 
                                            className="progress-bar" 
                                            initial={{ width: 0 }} 
                                            animate={isInView ? { width: '85%' } : { width: 0 }} 
                                            transition={{ duration: 1.5, delay: 1 }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="stat-box">
                                    <div className="stat-value">
                                        {isInView && <CountUp end={280} duration={2.5} />}
                                    </div>
                                    <div className="stat-label">Active Node Missions</div>
                                    <div className="stat-progress">
                                        <motion.div 
                                            className="progress-bar" 
                                            initial={{ width: 0 }} 
                                            animate={isInView ? { width: '60%' } : { width: 0 }} 
                                            transition={{ duration: 1.5, delay: 1.2 }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="stat-box">
                                    <div className="stat-value">
                                        {isInView && <CountUp end={99.9} decimals={1} duration={2.5} />}%
                                    </div>
                                    <div className="stat-label">Grid Uptime</div>
                                    <div className="stat-progress">
                                        <motion.div 
                                            className="progress-bar" 
                                            initial={{ width: 0 }} 
                                            animate={isInView ? { width: '99%' } : { width: 0 }} 
                                            transition={{ duration: 1.5, delay: 1.4 }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="stat-box">
                                    <div className="stat-value">
                                        {isInView && <CountUp end={45} duration={2.5} />}K
                                    </div>
                                    <div className="stat-label">Global Operators</div>
                                    <div className="stat-progress">
                                        <motion.div 
                                            className="progress-bar" 
                                            initial={{ width: 0 }} 
                                            animate={isInView ? { width: '75%' } : { width: 0 }} 
                                            transition={{ duration: 1.5, delay: 1.6 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
