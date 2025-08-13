import Banner from "../../components/user/Banner"
import CourseSection from "../../components/user/CourseSection";
import Achievements from "../../components/user/Achievements";
import Features from "../../components/user/Features";
import Testimonials from "../../components/user/Testimonials";

const Home = () => {
  return (
    <>
      <Banner/>
      <CourseSection/>
      <Features/>
      <Testimonials/>
      <Achievements />
    </>
  );
};

export default Home;