import { Shield, Lock, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function TrustBadges() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="bg-white py-6 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <motion.div 
          className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="flex items-center" variants={itemVariants}>
            <Shield className="text-primary-600 w-8 h-8 mr-3" />
            <span className="text-gray-700 font-medium">Encrypted Connection</span>
          </motion.div>
          
          <motion.div className="flex items-center" variants={itemVariants}>
            <Lock className="text-primary-600 w-8 h-8 mr-3" />
            <span className="text-gray-700 font-medium">Your Consent Recorded</span>
          </motion.div>
          
          <motion.div className="flex items-center" variants={itemVariants}>
            <CheckCircle className="text-primary-600 w-8 h-8 mr-3" />
            <span className="text-gray-700 font-medium">Opt Out Anytime</span>
          </motion.div>
          
          <motion.div className="flex items-center" variants={itemVariants}>
            <Clock className="text-primary-600 w-8 h-8 mr-3" />
            <span className="text-gray-700 font-medium">No Government Affiliation</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
