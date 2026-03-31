import { motion } from 'framer-motion';
import { FaBolt, FaArrowRight, FaPlay, FaChevronDown } from 'react-icons/fa';
import CountUp from 'react-countup';
import Omnitrix from './Omnitrix';
import { useEffect, useState } from 'react';
import Particles from '@tsparticles/react';
import { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const Hero = () => {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesOptions = {
        background: {
            color: { value: "transparent" },
        },
        fpsLimit: 120,
        interactivity: {
            events: {
                onHover: { enable: true, mode: "repulse" },
            },
            modes: {
                repulse: { distance: 100, duration: 0.4 },
            },
        },
        particles: {
            color: { value: "#39FF14" },
            links: {
                color: "#39FF14",
                distance: 150,
                enable: true,
                opacity: 0.2,
                width: 1,
            },
            move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 1,
                straight: false,
            },
            number: { density: { enable: true, area: 800 }, value: 40 },
            opacity: { value: 0.3 },
            shape: { type: "circle" },
            size: { value: { min: 1, max: 3 } },
        },
        detectRetina: true,
    };

    return (
        <section id="hero" className="hero">
            {init && <Particles id="tsparticles" options={particlesOptions} className="particle-bg" />}

            <div className="container">
                <div className="hero-grid">
                    <motion.div
                        className="hero-content"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="hero-badge">
                            <FaBolt />
                            <span>It's Hero Time</span>
                        </div>
                        <h1 className="hero-title">
                            WELCOME TO<br />
                            <span className="neon-text glitch" data-text="HACK!T">HACK!T</span>UP
                        </h1>
                        <p className="hero-subtitle">
                            Unlock alien technologies. Decrypt the secrets. Dominate the leaderboard.
                        </p>

                        <div className="hero-stats">
                            <div className="stat-item">
                                <div className="stat-number">
                                    <CountUp end={1337} duration={2.5} separator="," prefix="" />
                                </div>
                                <div className="stat-label">Active Agents</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">
                                    <CountUp end={150} duration={2.5} suffix="+" />
                                </div>
                                <div className="stat-label">Missions</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">
                                    <CountUp end={99.9} decimals={1} duration={2.5} suffix="%" />
                                </div>
                                <div className="stat-label">Success Rate</div>
                            </div>
                        </div>

                        <div className="hero-actions">
                            <motion.a
                                href="/login"
                                className="btn-primary"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span>Start Hacking</span>
                                <FaArrowRight />
                            </motion.a>
                        </div>
                    </motion.div>

                    <motion.div
                        className="hero-visual"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Omnitrix />
                    </motion.div>
                </div>
            </div>

            <motion.div
                className="scroll-indicator"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <FaChevronDown />
            </motion.div>
        </section>
    );
};

export default Hero;
