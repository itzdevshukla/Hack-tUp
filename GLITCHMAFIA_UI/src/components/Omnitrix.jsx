import { motion } from 'framer-motion';

const Omnitrix = () => {
    return (
        <div className="omnitrix-display">
            <motion.div
                className="omnitrix-ring"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                {[...Array(8)].map((_, i) => {
                    const angle = (i / 8) * 360;

                    // We map the translation in % of the container for responsive scaling
                    // 190 was previously the radius of a 500px container, so roughly 38%
                    const radiusPercent = 38;
                    const x = radiusPercent * Math.cos(angle * Math.PI / 180);
                    const y = radiusPercent * Math.sin(angle * Math.PI / 180);

                    return (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                width: '2%',
                                height: '2%',
                                minWidth: '4px',
                                minHeight: '4px',
                                background: 'var(--primary-green)',
                                borderRadius: '50%',
                                boxShadow: '0 0 10px var(--primary-green)',
                                left: `calc(50% + ${x}%)`,
                                top: `calc(50% + ${y}%)`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        />
                    );
                })}
                <div className="omnitrix-core"></div>
            </motion.div>
        </div>
    );
};

export default Omnitrix;
