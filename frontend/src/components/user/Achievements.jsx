import { Users, GraduationCap, Award, Layers } from "lucide-react";

const achievements = [
  { count: "10K+", label: "Students Enrolled", icon: Users },
  { count: "500+", label: "Expert Instructors", icon: GraduationCap },
  { count: "1.2K+", label: "Certifications Issued", icon: Award },
  { count: "150+", label: "Courses Available", icon: Layers },
];

const Achievements = () => {
  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-30">
        <img
          src="/AdobeStock_387713997_Preview.jpeg"
          alt="E-learning background"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Our Achievements
          </h2>
          <p className="text-2xl text-gray-900 max-w-2xl mx-auto">
            Join thousands of learners who have transformed their careers with our platform
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {achievements.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div 
                key={index}
                className="text-center p-6 rounded-xl  shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-blue-600 mb-2">{item.count}</h3>
                <p className="text-gray-900 font-medium">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Achievements;