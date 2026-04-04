import { motion } from 'framer-motion';
import { 
    FaSearch, FaCode, FaLock, FaBug, FaEye, FaGlobe, FaSkull, 
    FaStar, FaServer, FaTerminal, FaImage, FaMobileAlt, 
    FaMicrochip, FaCloud, FaLaptopCode, FaLink, FaVirus, FaBrain
} from 'react-icons/fa';
import './ChallengeCategories.css';

const ChallengeCategories = () => {
    const categories = [
        {
            name: 'Web Exploitation',
            icon: <FaGlobe />,
            description: 'Find and exploit vulnerabilities in web applications. Master SQLi, XSS, SSRF, and bypassing WAFs to compromise systems.'
        },
        {
            name: 'Cryptography',
            icon: <FaLock />,
            description: 'Break encryption and decode secret messages. Analyze ciphers, implement known attacks against RSA, AES, and custom crypto flows.'
        },
        {
            name: 'Reverse Engineering',
            icon: <FaCode />,
            description: 'Analyze and understand compiled binaries. Use disassemblers and debuggers to crack software and extract hidden flags.'
        },
        {
            name: 'Binary Exploitation (Pwn)',
            icon: <FaSkull />,
            description: 'Exploit memory corruption and system vulnerabilities. Drop shells using buffer overflows, ROP chains, and heap exploitation.'
        },
        {
            name: 'Forensics',
            icon: <FaSearch />,
            description: 'Investigate digital evidence. Recover deleted files, analyze memory dumps, network pcaps, and hidden data structures.'
        },
        {
            name: 'OSINT',
            icon: <FaEye />,
            description: 'Gather intelligence from open sources. Trace digital footprints, geolocate targets, and piece together public data.'
        },
        {
            name: 'Miscellaneous',
            icon: <FaStar />,
            description: 'Uncategorized paradigms encompassing various obscure domains, logical puzzles, and esoteric architectures.'
        },
        {
            name: 'Networking',
            icon: <FaServer />,
            description: 'Analyze complex network protocols and traffic. Forge packets, bypass firewalls, and hijack active sessions.'
        },
        {
            name: 'Boot2Root (B2R)',
            icon: <FaTerminal />,
            description: 'Gain absolute root access on hardened vulnerable systems simulating real-world infrastructure.'
        },
        {
            name: 'Steganography',
            icon: <FaImage />,
            description: 'Uncover cryptographic secrets hidden deeply inside innocuous digital media like audio, images, and video files.'
        },
        {
            name: 'Mobile Security',
            icon: <FaMobileAlt />,
            description: 'Reverse engineer APKs and IPAs, break SSL pinning, and exploit local data storage on mobile devices.'
        },
        {
            name: 'Hardware / IoT',
            icon: <FaMicrochip />,
            description: 'Investigate and exploit embedded hardware devices. Extract firmware via UART/SPI and dump flash memory.'
        },
        {
            name: 'Cloud Security',
            icon: <FaCloud />,
            description: 'Exploit misconfigured AWS, GCP, and Azure cloud infrastructure. Escalate privileges and compromise buckets.'
        },
        {
            name: 'Programming',
            icon: <FaLaptopCode />,
            description: 'Solve intensely fast algorithmic challenges requiring highly optimized programmatic scripts and automation.'
        },
        {
            name: 'Blockchain (Web3)',
            icon: <FaLink />,
            description: 'Investigate and exploit vulnerable smart contracts and decentralized finance protocols.'
        },
        {
            name: 'Malware Analysis',
            icon: <FaVirus />,
            description: 'Analyze and reverse engineer sophisticated malicious software payloads in highly secure sandboxed environments.'
        },
        {
            name: 'Artificial Intelligence',
            icon: <FaBrain />,
            description: 'Hack and secure LLMs and Machine Learning models. Perform prompt injections, model inversion, and data poisoning.'
        }
    ];

    return (
        <section className="challenge-categories-section">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="categories-header"
                >
                    <div className="hero-badge">
                        <span>Domain Knowledge</span>
                    </div>
                    <h2 className="categories-title neon-text">Mission Vectors</h2>
                    <p className="categories-subtitle">Identify your target vectors and initiate analysis.</p>
                </motion.div>

                <div className="bento-grid">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                            className="bento-card"
                        >
                            <div className="bento-icon-wrapper">
                                {cat.icon}
                            </div>
                            <div className="bento-content">
                                <h3 className="bento-title">{cat.name}</h3>
                                <p className="bento-desc">{cat.description}</p>
                            </div>
                            <div className="bento-glow"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ChallengeCategories;
