import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, TrendingUp, Star, Filter, DollarSign, MapPin, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

interface LeadListing {
  id: number;
  leadId: number;
  sellerId: number;
  price: string;
  qualityScore: number;
  timesResold: number;
  industry: string;
  geography: string;
  isActive: boolean;
  createdAt: string;
}

interface DemandPrediction {
  id: number;
  industry: string;
  geography: string;
  predictedDemand: number;
  confidence: string;
  factors: {
    seasonality: number;
    economic: number;
    regulatory: number;
    historical: number;
  };
  predictionDate: string;
  validUntil: string;
}

interface CreditAccount {
  id: number;
  userId: number;
  balance: string;
  totalPurchased: string;
}

interface CreditPackage {
  id: number;
  name: string;
  credits: number;
  price: string;
  discountPercentage: string;
  isActive: boolean;
}

export default function Marketplace() {
  const [filters, setFilters] = useState({
    industry: "",
    geography: "",
    minPrice: "",
    maxPrice: ""
  });
  const [selectedUserId] = useState(1); // Demo user ID
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lead listings
  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['lead-listings', filters],
    queryFn: () => apiRequest(`/api/lead-listings?${new URLSearchParams(filters).toString()}`),
  });

  // Fetch demand predictions
  const { data: predictions = [], isLoading: loadingPredictions } = useQuery({
    queryKey: ['demand-predictions'],
    queryFn: () => apiRequest('/api/demand-predictions'),
  });

  // Fetch credit account
  const { data: creditAccount } = useQuery({
    queryKey: ['credit-account', selectedUserId],
    queryFn: () => apiRequest(`/api/credits/${selectedUserId}`),
  });

  // Fetch credit packages
  const { data: creditPackages = [] } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: () => apiRequest('/api/credit-packages'),
  });

  // Purchase lead mutation
  const purchaseLeadMutation = useMutation({
    mutationFn: (listingId: number) => 
      apiRequest(`/api/lead-listings/${listingId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: selectedUserId })
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Lead purchased successfully!" });
      queryClient.invalidateQueries({ queryKey: ['lead-listings'] });
      queryClient.invalidateQueries({ queryKey: ['credit-account'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to purchase lead",
        variant: "destructive"
      });
    }
  });

  // Purchase credits mutation
  const purchaseCreditsMutation = useMutation({
    mutationFn: (packageData: { packageId: number; amount: string }) => 
      apiRequest('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUserId, 
          packageId: packageData.packageId,
          amount: packageData.amount
        })
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Credits purchased successfully!" });
      queryClient.invalidateQueries({ queryKey: ['credit-account'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to purchase credits",
        variant: "destructive"
      });
    }
  });

  // Generate prediction mutation
  const generatePredictionMutation = useMutation({
    mutationFn: (data: { industry: string; geography: string }) => 
      apiRequest('/api/demand-predictions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "AI prediction generated!" });
      queryClient.invalidateQueries({ queryKey: ['demand-predictions'] });
    }
  });

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" to empty string for API filtering
    const apiValue = value === "all" ? "" : value;
    setFilters(prev => ({ ...prev, [key]: apiValue }));
  };

  const getQualityBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getDemandBadgeColor = (demand: number) => {
    if (demand >= 80) return "bg-green-500";
    if (demand >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <>
      <Helmet>
        <title>Lead Marketplace | Buy & Sell Healthcare Leads</title>
        <meta name="description" content="Access our marketplace to buy and sell healthcare leads with quality scoring, AI predictions, and credit system for bulk purchases." />
      </Helmet>

      <Header />
      
      <main className="py-8 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lead Marketplace</h1>
            <p className="text-gray-600">Buy and sell healthcare leads with quality scoring and AI-powered demand predictions</p>
          </div>

          <Tabs defaultValue="marketplace" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="predictions">AI Predictions</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
            </TabsList>

            <TabsContent value="marketplace" className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select onValueChange={(value) => handleFilterChange('industry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Industries</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="medicare">Medicare</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select onValueChange={(value) => handleFilterChange('geography', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Geography" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      placeholder="Min Price"
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    />
                    
                    <Input
                      placeholder="Max Price"
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Credit Balance */}
              {creditAccount && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Available Credits</p>
                        <p className="text-2xl font-bold">${creditAccount.balance}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lead Listings */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loadingListings ? (
                  <div className="col-span-full text-center py-8">Loading listings...</div>
                ) : listings.length === 0 ? (
                  <div className="col-span-full text-center py-8">No leads available</div>
                ) : (
                  listings.map((listing: LeadListing) => (
                    <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">Lead #{listing.leadId}</CardTitle>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {listing.industry}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {listing.geography}
                            </p>
                          </div>
                          <Badge className={`${getQualityBadgeColor(listing.qualityScore)} text-white`}>
                            {listing.qualityScore}% Quality
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-green-600">${listing.price}</span>
                            <span className="text-sm text-gray-500">
                              Resold {listing.timesResold} times
                            </span>
                          </div>
                          
                          <Button 
                            onClick={() => purchaseLeadMutation.mutate(listing.id)}
                            disabled={purchaseLeadMutation.isPending}
                            className="w-full"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Purchase Lead
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="predictions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    AI Demand Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Select onValueChange={(value) => generatePredictionMutation.mutate({ industry: value, geography: 'CA' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Generate prediction for industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="medicare">Medicare</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      onClick={() => generatePredictionMutation.mutate({ industry: 'healthcare', geography: 'CA' })}
                      disabled={generatePredictionMutation.isPending}
                    >
                      Generate AI Prediction
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loadingPredictions ? (
                      <div className="col-span-full text-center py-8">Loading predictions...</div>
                    ) : predictions.length === 0 ? (
                      <div className="col-span-full text-center py-8">No predictions available</div>
                    ) : (
                      predictions.map((prediction: DemandPrediction) => (
                        <Card key={prediction.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{prediction.industry}</CardTitle>
                                <p className="text-sm text-gray-600">{prediction.geography}</p>
                              </div>
                              <Badge className={`${getDemandBadgeColor(prediction.predictedDemand)} text-white`}>
                                {prediction.predictedDemand}% Demand
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Confidence:</span>
                                <span className="font-semibold">{prediction.confidence}%</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>Factors:</p>
                                <ul className="ml-4 space-y-1">
                                  <li>• Seasonality: {prediction.factors.seasonality}%</li>
                                  <li>• Economic: {prediction.factors.economic}%</li>
                                  <li>• Regulatory: {prediction.factors.regulatory}%</li>
                                  <li>• Historical: {prediction.factors.historical}%</li>
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Credit Packages</CardTitle>
                  <p className="text-gray-600">Purchase credits for bulk lead purchases with volume discounts</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {creditPackages.map((pkg: CreditPackage) => (
                      <Card key={pkg.id} className="border-2 hover:border-blue-500 transition-colors">
                        <CardHeader>
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          <div className="space-y-1">
                            <p className="text-2xl font-bold">${pkg.price}</p>
                            <p className="text-sm text-gray-600">{pkg.credits} credits</p>
                            {parseFloat(pkg.discountPercentage) > 0 && (
                              <Badge className="bg-green-500 text-white">
                                {pkg.discountPercentage}% OFF
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => purchaseCreditsMutation.mutate({
                              packageId: pkg.id,
                              amount: pkg.price
                            })}
                            disabled={purchaseCreditsMutation.isPending}
                            className="w-full"
                          >
                            Purchase Credits
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </>
  );
}