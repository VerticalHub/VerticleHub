import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
  const faqs = [
    {
      question: "How does your service work?",
      answer: "We collect basic information about your healthcare needs and preferences. Our advanced system, powered by Perplexity AI, then matches you with the most suitable insurance options from our network of trusted providers. You'll receive personalized quotes and can speak with a licensed agent to discuss your options in detail."
    },
    {
      question: "Is there a fee for your service?",
      answer: "Our service is completely free to use. There are no fees or obligations when you request quotes through our platform. We're compensated by the insurance providers when you choose to purchase a plan through our service."
    },
    {
      question: "What information do I need to provide?",
      answer: "To get accurate quotes, we need basic contact information (name, phone, email), your location (zip code and state), and what type of coverage you're interested in (ACA/Obamacare, Medicare, or Final Expense/Life Insurance). For more personalized quotes, additional information may be requested by the insurance providers."
    },
    {
      question: "Is my information secure?",
      answer: "Yes, we take data security very seriously. Our platform is HIPAA compliant and uses 256-bit encryption to protect your personal information. We adhere to strict privacy policies and never sell your data to unauthorized third parties. Your information is only shared with the insurance providers you're matched with to provide you with accurate quotes."
    },
    {
      question: "How quickly will I receive quotes?",
      answer: "After submitting your information, you'll typically receive initial quotes and options within 24 hours. A licensed agent will also contact you to discuss your options in more detail and answer any questions you may have about the coverage options."
    },
    {
      question: "Am I eligible for ACA subsidies?",
      answer: "Eligibility for ACA subsidies depends on your income, household size, and the cost of plans in your area. Most individuals and families with income between 100% and 400% of the federal poverty level qualify for some level of premium tax credits. We'll help determine your potential eligibility during the quote process."
    },
    {
      question: "When can I enroll in health insurance?",
      answer: "You can enroll during the annual Open Enrollment Period (typically November to January) or if you qualify for a Special Enrollment Period (SEP) due to certain life events like losing coverage, moving, getting married, having a baby, or adopting a child. Medicare has its own separate enrollment periods."
    }
  ];

  // Add FAQ structured data to the page for SEO
  useEffect(() => {
    // Create the FAQPage structured data
    const faqStructuredData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    // Add the structured data to the head
    const existingScript = document.getElementById("faq-structured-data");
    if (existingScript) {
      existingScript.innerHTML = JSON.stringify(faqStructuredData);
    } else {
      const script = document.createElement("script");
      script.id = "faq-structured-data";
      script.type = "application/ld+json";
      script.innerHTML = JSON.stringify(faqStructuredData);
      document.head.appendChild(script);
    }

    // Cleanup on component unmount
    return () => {
      const script = document.getElementById("faq-structured-data");
      if (script) {
        script.remove();
      }
    };
  }, [faqs]);

  return (
    <section id="faq" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2 
            className="font-heading text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Get answers to common questions about our service and insurance options.
          </motion.p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <AccordionItem 
                  value={`item-${index}`}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none flex justify-between items-center transition">
                    <span className="font-medium text-gray-800">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
