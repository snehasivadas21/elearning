import { useNavigate } from "react-router-dom";

const HeroBanner = () => {
  const navigate = useNavigate();
  return (
    <section className="relative w-full h-[500px] md:h-[600px]">
      
      <img
        src="/AdobeStock_400776431_Preview.jpeg"
        alt="E-learning Banner"
        className="absolute inset-0 w-full h-full object-fill"
      />
      
      <div className="relative z-10 max-w-7xl mx-auto h-full flex items-center px-6 md:px-10">
        <div className="w-full md:w-1/2 text-white space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Empower Your Learning Journey with <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PyTech</span>
          </h1>
          <p className="text-lg text-white">
            Learn from industry experts. Get certified. Build real-world skills with our interactive online courses.
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => navigate("/courses")}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
              Explore Courses
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;