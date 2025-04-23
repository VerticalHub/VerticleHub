import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function CoverageOptions() {
  const coverageOptions = [
    {
      title: "ACA/Obamacare Plans",
      image: "https://images.unsplash.com/photo-1497124401559-3e75ec2ed794?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      imageAlt: "Family discussing healthcare options",
      benefits: [
        "May qualify for premium subsidies",
        "Tax credits available for eligible applicants",
        "Plans cover essential health benefits",
        "Options for various income levels"
      ],
      ctaText: "Check Eligibility for ACA Plans"
    },
    {
      title: "Medicare Plans",
      image: "https://images.unsplash.com/photo-1521790797524-b2497295b8a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      imageAlt: "Senior couple consulting with healthcare advisor",
      benefits: [
        "Medicare options for eligible individuals",
        "Medicare Advantage plans for those who qualify",
        "Part D plans for qualifying participants",
        "Supplement plans for eligible Medicare enrollees"
      ],
      ctaText: "Check Medicare Eligibility"
    },
    {
      title: "Final Expense/Life Insurance",
      image: "https://images.unsplash.com/photo-1556745753-b2904692b3cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      imageAlt: "Family planning for the future",
      benefits: [
        "Policies for those who may qualify",
        "Various premium options available",
        "Plans with different coverage amounts",
        "Options for different health situations"
      ],
      ctaText: "Explore Final Expense Options"
    }
  ];

  return (
    <section id="options" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2 
            className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Coverage Options We Offer
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Check if you may qualify for health insurance coverage options, including ACA plans with potential premium subsidies and tax credits, Medicare for eligible individuals, and Final Expense options.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {coverageOptions.map((option, index) => (
            <motion.div 
              key={index}
              className="bg-gradient-to-b from-blue-50 to-white border border-blue-100 rounded-xl overflow-hidden shadow-md"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="h-48 bg-blue-600 flex items-center justify-center">
                <img 
                  src={option.image} 
                  alt={option.imageAlt} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-heading text-2xl font-bold text-gray-800 mb-3">{option.title}</h3>
                <ul className="space-y-2 mb-6">
                  {option.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-start">
                      <CheckCircle className="text-green-500 h-5 w-5 mr-2 mt-1 flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                <a 
                  href="#get-quotes" 
                  className="block text-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md transition"
                >
                  {option.ctaText}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
