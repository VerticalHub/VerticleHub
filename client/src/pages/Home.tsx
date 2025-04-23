import { useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TrustBadges from "@/components/TrustBadges";
import BenefitsSection from "@/components/BenefitsSection";
import CoverageOptions from "@/components/CoverageOptions";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import Testimonials from "@/components/Testimonials";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { Helmet } from "react-helmet";

export default function Home() {
  // Scroll to form if hash is present in URL
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Health Insurance Quotes | Compare ACA, Medicare & Life Insurance Plans</title>
        <meta name="description" content="Check if you qualify for premium subsidies and tax credits on ACA health insurance plans. Compare options for Medicare, Affordable Care Act, and Final Expense insurance." />
        <meta name="keywords" content="health insurance quotes, obamacare plans, medicare insurance, affordable care act, final expense insurance, healthcare subsidies, tax credits, special enrollment period" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://healthcareconnect.com/" />
        <meta property="og:title" content="Health Insurance Quotes | Compare ACA, Medicare & Life Insurance Plans" />
        <meta property="og:description" content="Check if you qualify for premium subsidies and tax credits on ACA health insurance plans. Compare options for Medicare, Affordable Care Act, and Final Expense insurance." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1576091160550-2173dba999ef" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://healthcareconnect.com/" />
        <meta name="twitter:title" content="Health Insurance Quotes | Compare ACA, Medicare & Life Insurance Plans" />
        <meta name="twitter:description" content="Check if you qualify for premium subsidies and tax credits on ACA health insurance plans. Compare options for Medicare, Affordable Care Act, and Final Expense insurance." />
        <meta name="twitter:image" content="https://images.unsplash.com/photo-1576091160550-2173dba999ef" />
        
        {/* Canonical Link */}
        <link rel="canonical" href="https://healthcareconnect.com/" />
        
        {/* Additional SEO metadata */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="HealthCare Connect" />
        <meta name="geo.region" content="US" />
        <meta name="geo.placename" content="United States" />
      </Helmet>

      <Header />
      
      <main>
        <HeroSection />
        <TrustBadges />
        <BenefitsSection />
        <CoverageOptions />
        
        <section id="get-quotes" className="py-16 bg-gradient-to-r from-primary-700 to-primary-800 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">Get Your Personalized Coverage Options</h2>
                <p className="text-xl text-blue-100 mb-2">Fill out the form below to receive quotes tailored to your needs.</p>
                <p className="text-sm text-blue-200">Your information is secure and protected by our privacy policy.</p>
              </div>
              
              <LeadCaptureForm />
            </div>
          </div>
        </section>
        
        <Testimonials />
        <FAQSection />
      </main>
      
      <Footer />
      <ScrollToTopButton />
    </>
  );
}
