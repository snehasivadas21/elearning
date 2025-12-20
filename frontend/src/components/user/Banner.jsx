const HeroBanner = () => {
  return (
    <section className="relative w-full h-[500px] md:h-[600px]">
      {/* Background Image */}
      <img
        src="/AdobeStock_400776431_Preview.jpeg"
        alt="E-learning Banner"
        className="absolute inset-0 w-full h-full object-fill"
      />
      <div className="absolute top-5 left-5 bg-white rounded-lg shadow-lg p-6 animate-bounce">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xl font-medium">Live Session</span>
          </div>
      </div>
      {/* Text Content */}
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
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
              Explore Courses
            </button>
            <button className="px-6 py-3 border border-white text-white font-semibold rounded-md hover:bg-white hover:text-black">
              Watch how it works
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;