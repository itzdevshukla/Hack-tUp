import { useState, useEffect, useContext, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUserAstronaut, FaSignOutAlt, FaCogs } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logoutUser } = useContext(AuthContext);
    const location = useLocation();

    // 🗓️ Event Status State
    const [eventStatus, setEventStatus] = useState(null);
    const [isTeamMode, setIsTeamMode] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 🕵️ Detect Event Mode & Fetch Status
    useEffect(() => {
        const match = location.pathname.match(/^\/event\/([a-zA-Z0-9-]+)/);
        if (match) {
            const eventId = match[1];

            // Only fetch if we switched events or haven't fetched yet
            if (eventId !== currentEventId) {
                fetch(`/api/dashboard/event/${eventId}/`)
                    .then(res => res.json())
                    .then(data => {
                        setEventStatus(data.status);
                        setIsTeamMode(data.is_team_mode || false);
                        setCurrentEventId(eventId);
                    })
                    .catch(err => console.error("Failed to fetch event status", err));
            }
        } else {
            // Reset if leaving event pages
            setEventStatus(null);
            setIsTeamMode(false);
            setCurrentEventId(null);
        }
    }, [location.pathname, currentEventId]);

    // 🧑‍💻 User Dropdown State
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
        };
    }, []);

    // 🧭 Determine Navigation Mode
    const matchEvent = location.pathname.match(/^\/event\/([a-zA-Z0-9-]+)/);
    const eventIdFromUrl = matchEvent ? matchEvent[1] : null;
    const isEventPage = !!eventIdFromUrl;

    // Arena pages are any /event/:id/* sub-routes (challenges, leaderboard, etc.)
    const isArenaPage = isEventPage && location.pathname !== `/event/${eventIdFromUrl}`;

    const isDashboardPage =
        location.pathname.startsWith('/dashboard') ||
        location.pathname === '/profile';

    const isAdminPage = location.pathname.startsWith('/administration');


    // 🔗 Define Link Sets
    let currentLinks = [];

    if (isAdminPage) {
        currentLinks = []; // Hide standard links on admin dashboard
    } else if (isArenaPage || isEventPage) {
        // Navigation inside the arena
        currentLinks = [
            { name: 'Challenges', href: `/event/${eventIdFromUrl}/challenges`, isPage: true },
            { name: 'Leaderboard', href: `/event/${eventIdFromUrl}/leaderboard`, isPage: true },
            { name: 'WriteUps', href: `/event/${eventIdFromUrl}/writeups`, isPage: true },
        ];
        if (isTeamMode) {
            currentLinks.push({ name: 'My Team', href: `/event/${eventIdFromUrl}/team`, isPage: true });
        }
        currentLinks.push({ name: 'Exit Event', href: '/dashboard', isPage: true });
    } else if (isDashboardPage) {
        currentLinks = [
            { name: 'Dashboard', href: '/dashboard', isPage: true },
            { name: 'Explore Events', href: '/dashboard/explore', isPage: true },
            { name: 'Host Event', href: '/dashboard/host-event', isPage: true },
            { name: 'Leaderboard', href: '/leaderboard', isPage: true }
        ];
    } else {
        currentLinks = [
            { name: 'Home', href: '/', isPage: true },
            { name: 'About Us', href: '/about', isPage: true },
            { name: 'Our Team', href: '/our-team', isPage: true },
            // Login/Register are in CTA, Dashboard is in CTA
        ];
    }

    const handleNavClick = (e, link) => {
        if (link.isPage) {
            setMobileOpen(false);
        } else {
            e.preventDefault();
            const element = document.querySelector(link.href);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                setMobileOpen(false);
            }
        }
    };

    return (
        <nav className={`premium-navbar ${scrolled ? 'scrolled' : ''} ${isAdminPage ? 'admin-mode' : ''}`}>
            <div className="premium-nav-container">
                <div className="premium-logo">
                    <Link to="/">
                        <span style={{ color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>HACK!T</span>
                        <span style={{ color: '#9ACD32', textShadow: '0 0 10px rgba(154,205,50,0.5)' }}>UP</span>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <ul className="premium-nav-links">
                    {currentLinks.map((link) => (
                        <li key={link.name}>
                            {link.isPage ? (
                                <Link
                                    to={link.href}
                                    className={`premium-nav-item ${location.pathname === link.href ? 'active' : ''}`}
                                >
                                    {link.name}
                                </Link>
                            ) : (
                                <a
                                    href={link.href}
                                    className="premium-nav-item"
                                    onClick={(e) => handleNavClick(e, link)}
                                >
                                    {link.name}
                                </a>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="premium-nav-cta">
                    {user ? (
                        <div
                            ref={dropdownRef}
                            style={{ position: 'relative' }}
                        >
                            <button className="premium-user-btn" onClick={() => setDropdownOpen(o => !o)} aria-expanded={dropdownOpen}>
                                <FaUserAstronaut />
                                <span>{user.username || 'Hacker'}</span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>▼</span>
                            </button>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="premium-dropdown-menu"
                                    >
                                        <Link to="/profile" className="premium-dropdown-item">
                                            <FaUserAstronaut style={{ color: '#9ACD32' }} />
                                            <span>My Profile</span>
                                        </Link>
                                        {!isAdminPage && user.is_staff && (
                                            <Link to="/administration" className="premium-dropdown-item">
                                                <FaCogs style={{ color: '#9ACD32' }} />
                                                <span>Admin Panel</span>
                                            </Link>
                                        )}
                                        <button onClick={logoutUser} className="premium-dropdown-item logout">
                                            <FaSignOutAlt />
                                            <span>Abort Session</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <Link to="/login" className="premium-nav-item">Login</Link>
                            <Link to="/register" className="nav-btn-primary">Register</Link>
                        </div>
                    )}
                </div>

                {/* Mobile Hamburger Toggle */}
                <button
                    className="premium-mobile-toggle"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label="Toggle Menu"
                >
                    {mobileOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="premium-mobile-menu"
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                        {currentLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.href}
                                className="premium-mobile-nav-item"
                                onClick={() => setMobileOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                        <div className="premium-mobile-footer">
                            {user ? (
                                <>
                                    <Link to="/profile" className="premium-mobile-nav-item" style={{ fontSize: '1.2rem', padding: '0.8rem' }} onClick={() => setMobileOpen(false)}>Profile</Link>
                                    {!isAdminPage && user.is_staff && (
                                        <Link to="/administration" className="premium-mobile-nav-item" style={{ fontSize: '1.2rem', padding: '0.8rem' }} onClick={() => setMobileOpen(false)}>Admin Panel</Link>
                                    )}
                                    <button
                                        onClick={() => { logoutUser(); setMobileOpen(false); }}
                                        className="premium-mobile-nav-item"
                                        style={{ fontSize: '1.2rem', padding: '0.8rem', color: '#ff4c4c', marginTop: '1rem', border: '1px solid #ff4c4c', background: 'transparent' }}
                                    >
                                        LOGOUT
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="premium-mobile-nav-item" onClick={() => setMobileOpen(false)}>Login</Link>
                                    <Link to="/register" className="nav-btn-primary" onClick={() => setMobileOpen(false)} style={{ marginTop: '1rem', fontSize: '1.2rem', padding: '1rem 2.5rem' }}>Register</Link>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
