import { Search, Users, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";

export default function BenefitsSection() {
  // Get the current year for enrollment period information
  const currentYear = new Date().getFullYear();
  const benefits = [
    {
      icon: <Search className="w-10 h-10" />,
      title: "Premium Subsidies & Tax Credits",
      description: "You may qualify for government subsidies that can significantly reduce your monthly premium payments for ACA health insurance plans."
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Personalized Coverage Options",
      description: "Find health insurance plans that fit your specific needs and budget with options for individuals and families without employer coverage."
    },
    {
      icon: <FileSpreadsheet className="w-10 h-10" />,
      title: "Enrollment Period Assistance",
      description: `Navigate Open Enrollment or Special Enrollment Periods with expert guidance. Certain life events may qualify you for special enrollment outside standard periods.`
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
            Why Choose LeadHealth?
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
        
        {/* Enrollment Period Information */}
        <motion.div 
          className="mt-16 bg-white p-8 rounded-lg shadow-md border-l-4 border-primary-600"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="font-heading text-2xl font-semibold mb-4">Enrollment Period Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium mb-2">Open Enrollment Period</h4>
              <p className="text-gray-700">
                The annual Open Enrollment Period for ACA/Obamacare plans typically runs from November 1 to January 15. 
                During this time, anyone can enroll in a health insurance plan without requiring a qualifying life event.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Special Enrollment Period</h4>
              <p className="text-gray-700">
                If you've experienced qualifying life events such as losing health coverage, moving, getting married, 
                having a baby, or adopting a child, you may be eligible to enroll during a Special Enrollment Period.
              </p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Important: Eligibility for insurance plans depends on various factors including income, household size, and existing coverage. There is no guaranteed eligibility or qualification. Our agents can help determine if you qualify.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
