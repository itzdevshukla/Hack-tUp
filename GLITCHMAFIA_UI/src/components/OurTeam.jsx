import { motion } from 'framer-motion';
import { FaShieldAlt, FaCode, FaTrophy } from 'react-icons/fa';

const OurTeam = () => {
    const mentors = [
        {
            name: "Nitin Sikarwar",
            role: "Ethical Hacker",
            image: new URL('../assets/team/mentor1.png', import.meta.url).href,
            desc: "Master of zero-day exploits and system hardening. Guiding the next generation of white hats."
        },
        {
            name: "Kapil Patel",
            role: "Web Exploitation Expert",
            image: new URL('../assets/team/mentor2.png', import.meta.url).href,
            desc: "Web Exploitation Specialist uncovering vulnerabilities and building resilient, secure systems."
        },
        {
            name: "Piyush Kumar",
            role: "IOT Hacker",
            image: new URL('../assets/team/mentor3.png', import.meta.url).href,
            desc: "IoT Security Researcher breaking smart devices to make them safer."
        }
    ];

    const founders = [
        {
            name: "Dev Shukla",
            role: "Founder",
            image: new URL('../assets/team/founder1.png', import.meta.url).href,
            desc: "The visionary behind Hack!t. Orchestrating the digital revolution."
        },
        {
            name: "Abhiraj Singh",
            role: "Co-Founder",
            image: new URL('../assets/team/founder2.png', import.meta.url).href,
            desc: "Architect of the core infrastructure. Ensuring the grid never sleeps."
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    return (
        <section id="our-team" className="about">
            <div className="container">
                {/* Mentors Section */}
                <div className="section-header">
                    <motion.h2
                        className="section-title neon-text"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        The Mentors
                    </motion.h2>
                    <p className="section-desc">Guiding you through the digital abyss</p>
                </div>

                <motion.div
                    className="about-grid mentors-grid"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {mentors.map((mentor, index) => (
                        <motion.div
                            key={index}
                            className="profile-card"
                            variants={cardVariants}
                            whileHover={{ y: -10, borderColor: '#39FF14', boxShadow: '0 10px 30px rgba(57, 255, 20, 0.2)' }}
                        >
                            <div className="profile-image-container">
                                <img src={mentor.image} alt={mentor.name} className="profile-image" />
                                <div className="profile-glitch-overlay"></div>
                            </div>
                            <h3 className="profile-name">{mentor.name}</h3>
                            <div className="profile-role">{mentor.role}</div>
                            <p className="profile-desc">{mentor.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Founders Section */}
                <div className="section-header" style={{ marginTop: '6rem' }}>
                    <motion.h2
                        className="section-title neon-text"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        The Inventors
                    </motion.h2>
                    <p className="section-desc">Architects of the simulation</p>
                </div>

                <motion.div
                    className="about-grid founders-grid"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {founders.map((founder, index) => (
                        <motion.div
                            key={index}
                            className="profile-card founder-card"
                            variants={cardVariants}
                            whileHover={{ y: -10, borderColor: '#39FF14', boxShadow: '0 10px 30px rgba(57, 255, 20, 0.2)' }}
                        >
                            <div className="profile-image-container">
                                <img src={founder.image} alt={founder.name} className="profile-image" />
                                <div className="profile-glitch-overlay"></div>
                            </div>
                            <h3 className="profile-name">{founder.name}</h3>
                            <div className="profile-role">{founder.role}</div>
                            <p className="profile-desc">{founder.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default OurTeam;
