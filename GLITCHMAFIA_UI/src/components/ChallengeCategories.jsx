import { motion } from 'framer-motion';
import { FaSearch, FaCode, FaLock, FaKey, FaBug, FaEye } from 'react-icons/fa';

const ChallengeCategories = () => {
    const categories = [
        {
            name: 'Digital Forensics',
            icon: <FaSearch />,
            description: 'Investigate digital evidence and uncover hidden data'
        },
        {
            name: 'Web Exploitation',
            icon: <FaCode />,
            description: 'Find and exploit vulnerabilities in web applications'
        },
        {
            name: 'Reverse Engineering',
            icon: <FaBug />,
            description: 'Analyze and understand compiled binaries'
        },
        {
            name: 'Cryptography',
            icon: <FaLock />,
            description: 'Break encryption and decode secret messages'
        },
        {
            name: 'Binary Exploitation',
            icon: <FaKey />,
            description: 'Exploit memory corruption vulnerabilities'
        },
        {
            name: 'OSINT',
            icon: <FaEye />,
            description: 'Gather intelligence from open sources'
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
