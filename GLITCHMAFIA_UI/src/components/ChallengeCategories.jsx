import { motion } from 'framer-motion';
import { 
    FaSearch, FaCode, FaLock, FaBug, FaEye, FaGlobe, FaSkull, 
    FaStar, FaServer, FaTerminal, FaImage, FaMobileAlt, 
    FaMicrochip, FaCloud, FaLaptopCode, FaLink, FaVirus, FaBrain 
} from 'react-icons/fa';

const ChallengeCategories = () => {
    const categories = [
        {
            name: 'Web Exploitation',
            icon: <FaGlobe />,
            description: 'Find and exploit vulnerabilities in web applications'
        },
        {
            name: 'Cryptography',
            icon: <FaLock />,
            description: 'Break encryption and decode secret messages'
        },
        {
            name: 'Reverse Engineering',
            icon: <FaCode />,
            description: 'Analyze and understand compiled binaries'
        },
        {
            name: 'Binary Exploitation (Pwn)',
            icon: <FaSkull />,
            description: 'Exploit memory corruption and system vulnerabilities'
        },
        {
            name: 'Forensics',
            icon: <FaSearch />,
            description: 'Investigate digital evidence and uncover hidden data'
        },
        {
            name: 'OSINT',
            icon: <FaEye />,
            description: 'Gather intelligence from open sources'
        },
        {
            name: 'Miscellaneous',
            icon: <FaStar />,
            description: 'Miscellaneous challenges encompassing various domains'
        },
        {
            name: 'Networking',
            icon: <FaServer />,
            description: 'Analyze network protocols and traffic'
        },
        {
            name: 'Boot2Root (B2R)',
            icon: <FaTerminal />,
            description: 'Gain root access on vulnerable systems'
        },
        {
            name: 'Steganography',
            icon: <FaImage />,
            description: 'Uncover secrets hidden within digital media'
        },
        {
            name: 'Mobile Security',
            icon: <FaMobileAlt />,
            description: 'Analyze and exploit mobile applications'
        },
        {
            name: 'Hardware',
            icon: <FaMicrochip />,
            description: 'Investigate and exploit hardware devices'
        },
        {
            name: 'Cloud Security',
            icon: <FaCloud />,
            description: 'Secure and exploit cloud infrastructure'
        },
        {
            name: 'Programming',
            icon: <FaLaptopCode />,
            description: 'Solve complex algorithmic and coding challenges'
        },
        {
            name: 'Blockchain',
            icon: <FaLink />,
            description: 'Investigate smart contracts and decentralized systems'
        },
        {
            name: 'Malware Analysis',
            icon: <FaVirus />,
            description: 'Analyze and reverse engineer malicious software'
        },
        {
            name: 'AI',
            icon: <FaBrain />,
            description: 'Hacking and securing artificial intelligence systems'
        }
    ];

    return (
        <section className="challenge-categories-section">
            <div className="categories-container">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="categories-header"
                >
                    <h2 className="categories-title">Challenge Categories</h2>
                    <p className="categories-subtitle">Master diverse cybersecurity domains</p>
                </motion.div>

                <div className="categories-grid">
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="category-card"
                        >
                            <div className="category-icon">
                                {category.icon}
                            </div>
                            <h3 className="category-name">{category.name}</h3>
                            <p className="category-description">{category.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ChallengeCategories;
