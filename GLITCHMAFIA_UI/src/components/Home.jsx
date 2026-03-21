import Hero from './Hero';
import ChallengeCategories from './ChallengeCategories';
import Footer from './Footer';

const Home = () => {
    return (
        <div className="home">
            <Hero />
            <ChallengeCategories />
            <Footer />
        </div>
    );
};

export default Home;
