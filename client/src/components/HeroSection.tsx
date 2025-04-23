import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-r from-primary-800 to-primary-700 text-white py-20">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center">
        <motion.div 
          className="w-full md:w-1/2 mb-10 md:mb-0"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4 leading-tight">
            See If You Qualify For Affordable Health Insurance
          </h1>
          <p className="text-xl mb-8 text-blue-100">
            You may be eligible for premium subsidies and tax credits on ACA health insurance plans. Compare options for Affordable Care Act, Medicare, and Final Expense/Life Insurance.
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <a 
              href="#get-quotes" 
              className="bg-white text-primary-700 hover:bg-gray-100 font-medium px-6 py-3 rounded-md text-center shadow-lg transition transform hover:-translate-y-1"
            >
              Check Your Eligibility
            </a>
            <a 
              href="#options" 
              className="border border-white text-white hover:bg-white hover:text-primary-700 font-medium px-6 py-3 rounded-md text-center transition"
            >
              Learn More
            </a>
          </div>
        </motion.div>
        
        <motion.div 
          className="w-full md:w-1/2"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
            alt="Healthcare professionals discussing insurance options" 
            className="rounded-lg shadow-2xl mx-auto" 
            width="600" 
            height="400"
          />
        </motion.div>
      </div>
    </section>
  );
}
