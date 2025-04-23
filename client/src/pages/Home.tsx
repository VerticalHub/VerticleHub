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
        <title>HealthCare Connect | Find Affordable Insurance Coverage Options</title>
        <meta name="description" content="Find affordable healthcare coverage options including ACA/Obamacare, Medicare, and Final Expense/Life Insurance. Get personalized quotes from trusted providers." />
        <meta name="og:title" content="HealthCare Connect | Find Affordable Insurance Coverage Options" />
        <meta name="og:description" content="Find personalized healthcare coverage options. Compare quotes for Obamacare, Medicare, and Final Expense insurance." />
        <meta name="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="HealthCare Connect | Affordable Healthcare Options" />
        <meta name="twitter:description" content="Find personalized healthcare coverage options from trusted providers." />
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
