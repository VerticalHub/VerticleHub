import { useState } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-primary-700 text-2xl font-heading font-bold">
              HealthCare<span className="text-primary-500">Connect</span>
            </span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <a 
            href="#benefits" 
            className="text-gray-700 hover:text-primary-600 font-medium transition"
            onClick={closeMobileMenu}
          >
            Benefits
          </a>
          <a 
            href="#options" 
            className="text-gray-700 hover:text-primary-600 font-medium transition"
            onClick={closeMobileMenu}
          >
            Coverage Options
          </a>
          <a 
            href="#testimonials" 
            className="text-gray-700 hover:text-primary-600 font-medium transition"
            onClick={closeMobileMenu}
          >
            Testimonials
          </a>
          <a 
            href="#faq" 
            className="text-gray-700 hover:text-primary-600 font-medium transition"
            onClick={closeMobileMenu}
          >
            FAQs
          </a>
        </nav>
        
        {/* Mobile Navigation Button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
        
        <a 
          href="#get-quotes" 
          className="hidden md:block bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2 rounded-md shadow-sm transition"
        >
          Get Coverage Options
        </a>
      </div>
      
      {/* Mobile Menu with Animation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t absolute w-full"
          >
            <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
              <a 
                href="#benefits" 
                className="text-gray-700 py-2 border-b border-gray-100"
                onClick={closeMobileMenu}
              >
                Benefits
              </a>
              <a 
                href="#options" 
                className="text-gray-700 py-2 border-b border-gray-100"
                onClick={closeMobileMenu}
              >
                Coverage Options
              </a>
              <a 
                href="#testimonials" 
                className="text-gray-700 py-2 border-b border-gray-100"
                onClick={closeMobileMenu}
              >
                Testimonials
              </a>
              <a 
                href="#faq" 
                className="text-gray-700 py-2 border-b border-gray-100"
                onClick={closeMobileMenu}
              >
                FAQs
              </a>
              <a 
                href="#get-quotes" 
                className="bg-primary-600 text-white text-center font-medium py-3 rounded-md"
                onClick={closeMobileMenu}
              >
                Get Coverage Options
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
