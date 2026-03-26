import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import bannedHacker from '../assets/banned_hacker.png';
import './BannedAnimation.css';

const BannedAnimation = ({ message = "You are banned from this event. Contact the organizers for details." }) => {
    const navigate = useNavigate();
    const { id } = useParams();

    return (
        <motion.div
            className="banned-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {/* Dark Gradient Overlay */}
            <div className="dark-gradient-overlay" />

            {/* Red Pulsing Alerts */}
            <motion.div
                className="red-pulsing-alerts"
                animate={{ opacity: [0, 0.2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Realistic Prisoner Image in a "Cell" */}
            <motion.div
                className="prisoner-container"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                transition={{
                    duration: 1.5,
                    ease: "easeOut",
                    delay: 0.2
                }}
            >
                {/* The Image */}
                <motion.img
                    src={bannedHacker}
                    alt="Banned Hacker"
                    className="prisoner-image"
                    animate={{
                        filter: [
                            'drop-shadow(0 0 20px rgba(0,0,0,0.8)) brightness(0.7)',
                            'drop-shadow(0 0 40px rgba(255,0,0,0.2)) brightness(0.9)',
                            'drop-shadow(0 0 20px rgba(0,0,0,0.8)) brightness(0.7)'
                        ]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                />

                {/* Digital Overlay on Image */}
                <div className="digital-overlay" />

                {/* BANNED Stamped on Image */}
                <motion.div
                    className="banned-stamp"
                    initial={{ scale: 3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.8, rotate: -15 }}
                    transition={{ delay: 2.5, type: 'spring' }}
                >
                    BANNED
                </motion.div>
            </motion.div>

            {/* FULL SCREEN JAIL BARS COVERING EVERYTHING */}
            <div className="jail-bars-container">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="vertical-bar"
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                            delay: i * 0.05
                        }}
                    />
                ))}
            </div>

            {/* Horizontal Locking Bars - Full Screen */}
            <motion.div
                className="horizontal-lock-bar lock-bar-top"
                initial={{ transform: 'translateX(-100vw)' }}
                animate={{ transform: 'translateX(0)' }}
                transition={{ delay: 2.2, type: 'spring', stiffness: 200 }}
            />
            <motion.div
                className="horizontal-lock-bar lock-bar-bottom"
                initial={{ transform: 'translateX(100vw)' }}
                animate={{ transform: 'translateX(0)' }}
                transition={{ delay: 2.4, type: 'spring', stiffness: 200 }}
            />

            {/* Noise / CRT Texture */}
            <div className="noise-texture" />
        </motion.div>
    );
};

export default BannedAnimation;
