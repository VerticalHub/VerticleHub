import { Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Testimonials() {
  const testimonials = [
    {
      quote: "I was overwhelmed trying to navigate Medicare options. LeadHealth made it simple and found me a plan that saves me over $200 a month on prescriptions.",
      author: "Margaret B.",
      position: "Medicare Advantage Client",
      initials: "MB"
    },
    {
      quote: "After losing my employer coverage, I needed an affordable ACA plan. The team at LeadHealth helped me get a subsidized plan that covers all my needs at a price I can afford.",
      author: "James T.",
      position: "ACA/Obamacare Client",
      initials: "JT"
    },
    {
      quote: "I wanted to make sure my family wouldn't struggle with expenses when I'm gone. The final expense policy I got through LeadHealth gives me peace of mind at an affordable monthly premium.",
      author: "Sandra C.",
      position: "Final Expense Client",
      initials: "SC"
    }
  ];

  return (
    <section id="testimonials" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2 
            className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            What Our Clients Say
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Hear from people who have found the perfect coverage through our service.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              className="bg-white p-8 rounded-lg shadow-md"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <blockquote className="text-gray-600 mb-6">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
                    <span className="font-medium text-lg">{testimonial.initials}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.position}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
