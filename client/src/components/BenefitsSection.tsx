import { Search, Users, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";

export default function BenefitsSection() {
  const benefits = [
    {
      icon: <Search className="w-10 h-10" />,
      title: "Compare Multiple Options",
      description: "Get personalized quotes from leading providers to find the best coverage at the right price."
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Experienced Guidance",
      description: "Our licensed agents help you navigate complex coverage options to find what works for you."
    },
    {
      icon: <FileSpreadsheet className="w-10 h-10" />,
      title: "Simple Enrollment",
      description: "We streamline the application process so you can get covered quickly and easily."
    }
  ];

  return (
    <section id="benefits" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2 
            className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Why Choose HealthCare Connect?
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            We simplify the process of finding the right healthcare coverage for your unique needs.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index}
              className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="text-primary-600 mb-4">
                {benefit.icon}
              </div>
              <h3 className="font-heading text-xl font-semibold mb-3">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
