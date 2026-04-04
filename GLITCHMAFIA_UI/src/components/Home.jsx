import Hero from './Hero';
import ChallengeCategories from './ChallengeCategories';
import MissionPath from './MissionPath';
import Features from './Features';
import Footer from './Footer';

const Home = () => {
    return (
        <div className="home">
            <Hero />
            <ChallengeCategories />
            <MissionPath />
            <Features />
            <Footer />
        </div>
    );
};

export default Home;
