import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Jessica Martinez",
    role: "Frontend Developer",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    comment: "The web development course completely transformed my career. The instructors are amazing and the hands-on projects helped me build a strong portfolio.",
    rating: 5,
    course: "Complete Web Development Bootcamp"
  },
  {
    name: "David Kim",
    role: "Data Analyst",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    comment: "I landed my dream job in data science just 3 months after completing the Python course. The practical approach and real-world examples made all the difference.",
    rating: 5,
    course: "Python for Data Science"
  },
  {
    name: "Tom Rodriguez",
    role: "Full Stack Developer",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    comment: "The React & Node.js course gave me the skills to build full-stack applications. Now I'm working as a senior developer at a tech startup!",
    rating: 5,
    course: "React & Node.js Full Stack"
  }
];

const Testimonials = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            What Our Learners Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from thousands of students who have transformed their careers through our courses
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center mb-4">
                <Quote className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
              
              <p className="text-gray-700 mb-6 italic">"{testimonial.comment}"</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                  ))}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-blue-600 font-medium">{testimonial.course}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;