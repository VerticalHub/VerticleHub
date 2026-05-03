import { Link } from "wouter";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-heading font-bold mb-4">LeadHealth</h3>
            <p className="text-gray-400 mb-4">Helping Americans find affordable healthcare coverage options since 2010.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Linkedin size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition">
                <Instagram size={18} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Coverage Options</h3>
            <ul className="space-y-2">
              <li><a href="#options" className="text-gray-400 hover:text-white transition">ACA/Obamacare</a></li>
              <li><a href="#options" className="text-gray-400 hover:text-white transition">Medicare Plans</a></li>
              <li><a href="#options" className="text-gray-400 hover:text-white transition">Medicare Supplements</a></li>
              <li><a href="#options" className="text-gray-400 hover:text-white transition">Final Expense Insurance</a></li>
              <li><a href="#options" className="text-gray-400 hover:text-white transition">Life Insurance</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Insurance Guide</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Medicare Eligibility</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">ACA Subsidies</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Insurance Blog</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-white transition">FAQs</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Our Partners</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
          <p className="mb-2">© {new Date().getFullYear()} LeadHealth. All rights reserved.</p>
          <p>LeadHealth is not affiliated with any government entity or program. This is an advertisement for insurance. This website is a solicitation of insurance that may be matched with consumers interested in purchasing insurance. The service is not available in all states.</p>
        </div>
      </div>
    </footer>
  );
}
