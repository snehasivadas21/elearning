import { BookOpen, Users, Award, Clock, Globe, Headphones } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Expert-Led Courses",
      description: "Learn from industry professionals with years of real-world experience in their fields."
    },
    {
      icon: Users,
      title: "Interactive Community",
      description: "Connect with fellow learners, share knowledge, and grow together in our vibrant community."
    },
    {
      icon: Award,
      title: "Certificates & Badges",
      description: "Earn recognized certificates and digital badges to showcase your newly acquired skills."
    },
    {
      icon: Clock,
      title: "Flexible Learning",
      description: "Study at your own pace with lifetime access to course materials and mobile compatibility."
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Access courses from anywhere in the world with subtitles in multiple languages."
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Get help whenever you need it with our dedicated support team and extensive FAQ."
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Choose PyTech?
          </h2>
          <p className="text-xl text-gray-900 max-w-3xl mx-auto">
            We provide everything you need to succeed in your learning journey, 
            from beginner-friendly courses to advanced certifications.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index} 
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;