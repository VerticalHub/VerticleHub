import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found | HealthCare Connect</title>
        <meta name="description" content="The page you're looking for could not be found. Please return to our homepage to find health insurance options and quotes." />
        <meta name="robots" content="noindex, follow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Page Not Found | HealthCare Connect" />
        <meta property="og:description" content="The page you're looking for could not be found. Please return to our homepage to find health insurance options and quotes." />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Page Not Found | HealthCare Connect" />
        <meta name="twitter:description" content="The page you're looking for could not be found. Please return to our homepage to find health insurance options and quotes." />
        
        {/* Canonical Link */}
        <link rel="canonical" href="https://healthcareconnect.com/404" />
      </Helmet>

      <Header />
      
      <main className="py-20 bg-gray-50 min-h-[70vh] flex items-center">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardContent className="pt-8 pb-8 px-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <AlertCircle className="w-10 h-10" />
              </div>
              
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-4">
                Page Not Found
              </h1>
              
              <p className="text-xl text-gray-600 mb-4">
                The page you're looking for doesn't exist or has been moved.
              </p>
              
              <p className="text-gray-600 mb-8">
                Please return to our homepage to find affordable health insurance options and request personalized quotes.
              </p>
              
              <Link href="/">
                <Button className="bg-primary-600 hover:bg-primary-700 flex items-center gap-2">
                  <Home size={18} />
                  Return to Homepage
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
