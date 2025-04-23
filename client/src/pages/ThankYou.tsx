import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export default function ThankYou() {
  return (
    <>
      <Helmet>
        <title>Thank You | HealthCare Connect</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />
      
      <main className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardContent className="pt-6 pb-8 px-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle className="w-10 h-10" />
              </div>
              
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-4">
                Thank You for Your Submission!
              </h1>
              
              <p className="text-xl text-gray-600 mb-4">
                We've received your information and will be contacting you shortly with personalized 
                insurance options.
              </p>
              
              <p className="text-gray-600 mb-8">
                One of our healthcare specialists will reach out to you within 24 hours to discuss
                your coverage options and answer any questions you may have.
              </p>
              
              <div className="bg-blue-50 p-6 rounded-lg mb-8">
                <h2 className="text-lg font-semibold text-blue-800 mb-2">What's Next?</h2>
                <ul className="text-left text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Review your email for confirmation of your request</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Expect a call from one of our licensed specialists</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Prepare any questions you may have about coverage options</span>
                  </li>
                </ul>
              </div>
              
              <Link href="/">
                <Button className="bg-primary-600 hover:bg-primary-700">
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
