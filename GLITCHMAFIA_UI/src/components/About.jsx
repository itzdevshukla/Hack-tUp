import React, { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { FaTerminal, FaShieldAlt, FaCrosshairs, FaSkull, FaServer, FaNetworkWired, FaGlobe, FaUserSecret, FaCode } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Counter = ({ from, to, duration, symbol = "" }) => {
    const nodeRef = useRef();
    const isInView = useInView(nodeRef, { once: true, margin: "-100px" });

    useEffect(() => {
        if (!isInView) return;

        const node = nodeRef.current;
        let startTimestamp = null;
        
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // easeOutQuart
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentCount = Math.floor(easeProgress * (to - from) + from);
            node.textContent = currentCount + symbol;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        
        window.requestAnimationFrame(step);
    }, [isInView, from, to, duration, symbol]);

    return <span ref={nodeRef} style={{ display: 'inline-block', minWidth: '80px' }}>{from}{symbol}</span>;
};

const About = () => {
    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 1], [0, 200]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    const philosophies = [
        {
            icon: <FaCrosshairs />,
            title: "Offensive Mindset",
            desc: "We train operators to think like adversaries, anticipating attacks before they breach the perimeter.",
            color: "#ff3b30",
            glow: "rgba(255, 59, 48, 0.4)"
        },
        {
            icon: <FaShieldAlt />,
            title: "Defensive Mastery",
            desc: "Building impregnable architectures requires understanding exact methodologies used to dismantle them.",
            color: "#39aaff",
            glow: "rgba(57, 170, 255, 0.4)"
        },
        {
            icon: <FaCode />,
            title: "Zero Compromise",
            desc: "No training wheels. Our environments mirror real-world chaotic network topologies and vulnerable systems.",
            color: "#f59e0b",
            glow: "rgba(245, 158, 11, 0.4)"
        }
    ];

    const stats = [
        { icon: <FaTerminal />, number: 50, symbol: "+", label: "Live Nodes" },
        { icon: <FaUserSecret />, number: 10, symbol: "K+", label: "Elite Operators" },
        { icon: <FaShieldAlt />, number: 99, symbol: "%", label: "Uptime" },
        { icon: <FaGlobe />, number: 24, symbol: "/7", label: "Global Reach" }
    ];

    return (
        <div style={{
            background: '#050505',
            color: '#e0e0e0',
            fontFamily: "'Outfit', sans-serif",
            overflow: 'hidden',
            position: 'relative',
            minHeight: '100vh'
        }}>
            {/* Background Effects */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'linear-gradient(rgba(154, 205, 50, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(154, 205, 50, 0.03) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                zIndex: 0, pointerEvents: 'none'
            }}></div>
            <div style={{
                position: 'fixed', top: '10%', left: '20%', width: '50vw', height: '50vw',
                background: 'radial-gradient(circle, rgba(154,205,50,0.05) 0%, transparent 60%)',
                filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none', borderRadius: '50%'
            }}></div>
            <div style={{
                position: 'fixed', bottom: '10%', right: '10%', width: '40vw', height: '40vw',
                background: 'radial-gradient(circle, rgba(57,255,20,0.03) 0%, transparent 60%)',
                filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none', borderRadius: '50%'
            }}></div>

            {/* Hero Section */}
            <motion.section 
                style={{ y: yHero, opacity: opacityHero, minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '120px 20px 80px', textAlign: 'center' }}
            >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 20px', background: 'rgba(154,205,50,0.1)', border: '1px solid rgba(154,205,50,0.3)', borderRadius: '30px', marginBottom: '30px' }}>
                    <FaServer style={{ color: '#9ACD32' }} />
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#9ACD32', fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>System Initialization Complete</span>
                </div>
                
                <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '4px', color: '#fff' }}>
                    Beyond The <br />
                    <span style={{ color: '#9ACD32', textShadow: '0 0 30px rgba(154,205,50,0.6)' }}>Terminal</span>
                </h1>
                
                <p style={{ fontFamily: "'Outift', sans-serif", fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', color: '#a0a0a0', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
                    We do not just simulate cyber warfare. We define it. Hack!tUp is the premier staging ground for offensive and defensive operations, built by hackers for hackers.
                </p>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.3)' }}
                >
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase' }}>Scroll to Descend</span>
                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: '2px', height: '30px', background: 'linear-gradient(to bottom, #9ACD32, transparent)' }}></motion.div>
                </motion.div>
            </motion.section>

            {/* The Origin Story */}
            <section style={{ padding: '80px 5%', position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto' }}>
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    style={{ 
                        background: 'linear-gradient(135deg, rgba(20,20,20,0.8) 0%, rgba(10,10,10,0.9) 100%)',
                        backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)',
                        borderLeft: '4px solid #9ACD32', borderRadius: '16px', padding: 'clamp(30px, 5vw, 60px)',
                        display: 'flex', flexDirection: 'column', gap: '30px', position: 'relative', overflow: 'hidden'
                    }}
                >
                    <FaNetworkWired style={{ position: 'absolute', right: '-50px', top: '-50px', fontSize: '250px', color: 'rgba(255,255,255,0.02)' }} />
                    <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        The Genesis
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', fontSize: '1.1rem', color: '#b0b0b0', lineHeight: 1.8 }}>
                        <p>
                            Born from the frustration of sterile, unrealistic lab environments, Hack!tUp was engineered to bridge the deadly gap between academic theory and real-world exploitation. We saw an industry teaching from textbooks while adversaries were writing new rules in the wild.
                        </p>
                        <p>
                            Our platform is a living, breathing network. Every subnet, every endpoint, and every challenge is meticulously crafted to mimic enterprise architectures. We provide the tools, the targets, and the chaos. You provide the skill.
                        </p>
                    </div>
                </motion.div>
            </section>

            {/* Core Philosophy */}
            <section style={{ padding: '80px 5%', position: 'relative', zIndex: 2, maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff', marginBottom: '15px' }}>Core Directives</h2>
                    <p style={{ color: '#888', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>The fundamental principles that govern the Hack!tUp ecosystem.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    {philosophies.map((phil, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: idx * 0.2 }}
                            whileHover={{ y: -10, boxShadow: `0 20px 40px ${phil.glow}`, borderColor: phil.color }}
                            style={{ 
                                background: 'rgba(15,15,15,0.7)', backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px',
                                padding: '40px 30px', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}
                        >
                            <div style={{ 
                                width: '60px', height: '60px', borderRadius: '12px', background: `rgba(${parseInt(phil.color.slice(1,3),16)},${parseInt(phil.color.slice(3,5),16)},${parseInt(phil.color.slice(5,7),16)},0.1)`, 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: phil.color, marginBottom: '25px',
                                border: `1px solid ${phil.glow}`
                            }}>
                                {phil.icon}
                            </div>
                            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.5rem', color: '#fff', marginBottom: '15px' }}>{phil.title}</h3>
                            <p style={{ color: '#a0a0a0', lineHeight: 1.6 }}>{phil.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Global Metrics */}
            <section style={{ padding: '80px 5%', position: 'relative', zIndex: 2, background: 'linear-gradient(to right, rgba(10,10,10,0.9), rgba(20,20,20,0.9))', borderTop: '1px solid rgba(154,205,50,0.1)', borderBottom: '1px solid rgba(154,205,50,0.1)', margin: '40px 0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
                    {stats.map((stat, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
                        >
                            <div style={{ fontSize: '2.5rem', color: 'rgba(154,205,50,0.5)' }}>{stat.icon}</div>
                            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '3.5rem', fontWeight: 800, color: '#fff', textShadow: '0 0 20px rgba(154,205,50,0.3)' }}>
                                <Counter from={0} to={stat.number} duration={2000} symbol={stat.symbol} />
                            </div>
                            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', color: '#9ACD32', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '100px 5%', position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div style={{ display: 'inline-block', marginBottom: '20px' }}>
                        <FaSkull style={{ fontSize: '3rem', color: '#9ACD32', filter: 'drop-shadow(0 0 15px rgba(154,205,50,0.5))' }} />
                    </div>
                    <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#fff', marginBottom: '20px', textTransform: 'uppercase' }}>
                        Are You Ready?
                    </h2>
                    <p style={{ color: '#a0a0a0', fontSize: '1.2rem', marginBottom: '40px', lineHeight: 1.6 }}>
                        The grids are online. The flags are planted. Join thousands of operators ascending the ranks.
                    </p>
                    <Link to="/register" style={{ textDecoration: 'none' }}>
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(154,205,50,0.6)' }}
                            whileTap={{ scale: 0.95 }}
                            style={{ 
                                background: '#9ACD32', color: '#000', border: 'none', padding: '15px 40px', 
                                fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.2rem', fontWeight: 700, 
                                textTransform: 'uppercase', letterSpacing: '2px', borderRadius: '4px', cursor: 'pointer',
                                clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)'
                            }}
                        >
                            Initialize Connection
                        </motion.button>
                    </Link>
                </motion.div>
            </section>
        </div>
    );
};

export default About;
