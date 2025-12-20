import Banner from "../../components/user/Banner"
import Achievements from "../../components/user/Achievements";
import Features from "../../components/user/Features";
import Testimonials from "../../components/user/Testimonials";

const Home = () => {
  return (
    <>
      <Banner/>
      <Features/>
      <Testimonials/>
      <Achievements />
    </>
  );
};

export default Home;