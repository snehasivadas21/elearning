const Courses = () => {
  const courses = [
    {
      id: 1,
      title: "Full Stack Web Development",
      description: "Master React, Django & APIs with real-world projects.",
      image: "https://source.unsplash.com/600x400/?coding,webdev",
    },
    {
      id: 2,
      title: "Data Structures & Algorithms",
      description: "Crack interviews with strong DSA concepts and practice.",
      image: "https://source.unsplash.com/600x400/?data,structure",
    },
    {
      id: 3,
      title: "Machine Learning Basics",
      description: "Get started with ML and Python libraries like scikit-learn.",
      image: "https://source.unsplash.com/600x400/?machine,learning",
    },
  ];

  return (
    <section id="courses" className="py-16 px-6 bg-gray-100">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8">Our Popular Courses</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img src={course.image} alt={course.title} className="w-full h-48 object-cover" />
              <div className="p-6 text-left">
                <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                <p className="text-gray-600">{course.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Courses;