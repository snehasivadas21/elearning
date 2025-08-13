import { BookOpen, Users, Award, Clock, Globe, Headphones } from "lucide-react";



const AboutPage = () => {
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
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          About PyTech
        </h1>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          PyTech is your gateway to mastering technology. Whether you're a beginner exploring coding or a professional upskilling in AI, we bring high-quality learning to your fingertips.
        </p>
      </div>

      {/* 3 Columns - Mission, Vision, Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-blue-600 mb-2">🎯 Our Mission</h3>
          <p className="text-gray-700">
            Empower learners with flexible, accessible, and practical education in tech and development.
          </p>
        </div>
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-blue-600 mb-2">🌍 Our Vision</h3>
          <p className="text-gray-700">
            To become the go-to platform for quality online tech education for students and professionals worldwide.
          </p>
        </div>
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-blue-600 mb-2">💡 Our Values</h3>
          <p className="text-gray-700">
            Innovation, Accessibility, Excellence, and Lifelong Learning.
          </p>
        </div>
      </div>
  
    
      <section className="py-20 px-4 sm:px-6 lg:px-8 ">
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


      {/* CTA */}
      <div className="mt-16 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Join Thousands of Learners on PyTech Today!
        </h3>
        <p className="text-gray-600 mb-6">Start your journey in tech. Grow with us.</p>
        <a
          href="/courses"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Browse Courses
        </a>
      </div>
    </div>
  );
};

export default AboutPage;