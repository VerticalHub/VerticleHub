import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, DollarSign, Package, Plus, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  state: string;
  interestedInACA: boolean;
  interestedInMedicare: boolean;
  interestedInFinalExpense: boolean;
  createdAt: string;
}

interface LeadListing {
  id: number;
  leadId: number;
  price: string;
  qualityScore: number;
  timesResold: number;
  industry: string;
  geography: string;
  isActive: boolean;
  createdAt: string;
}

export default function Admin() {
  const [newListing, setNewListing] = useState({
    leadId: "",
    price: "",
    industry: "",
    geography: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all leads
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => apiRequest('/api/leads'),
  });

  // Fetch lead listings
  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['lead-listings'],
    queryFn: () => apiRequest('/api/lead-listings'),
  });

  // Fetch market trends
  const { data: trends = [], isLoading: loadingTrends } = useQuery({
    queryKey: ['market-trends'],
    queryFn: () => apiRequest('/api/market-trends'),
  });

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: (listingData: any) => 
      apiRequest('/api/lead-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...listingData,
          sellerId: 1, // Demo seller ID
          qualityScore: 100,
          timesResold: 0,
          isActive: true
        })
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Lead listing created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['lead-listings'] });
      setNewListing({ leadId: "", price: "", industry: "", geography: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create listing",
        variant: "destructive"
      });
    }
  });

  // Record market trend mutation
  const recordTrendMutation = useMutation({
    mutationFn: (trendData: any) => 
      apiRequest('/api/market-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trendData)
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Market trend recorded!" });
      queryClient.invalidateQueries({ queryKey: ['market-trends'] });
    }
  });

  const handleCreateListing = () => {
    if (!newListing.leadId || !newListing.price || !newListing.industry || !newListing.geography) {
      toast({ 
        title: "Error", 
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    createListingMutation.mutate({
      leadId: parseInt(newListing.leadId),
      price: newListing.price,
      industry: newListing.industry,
      geography: newListing.geography
    });
  };

  const handleRecordTrend = () => {
    const sampleTrend = {
      industry: 'healthcare',
      geography: 'CA',
      avgPrice: '25.50',
      volume: Math.floor(Math.random() * 100) + 50,
      growthRate: (Math.random() * 20 - 10).toFixed(2) // -10% to +10%
    };
    recordTrendMutation.mutate(sampleTrend);
  };

  const getInterests = (lead: Lead) => {
    const interests = [];
    if (lead.interestedInACA) interests.push('ACA');
    if (lead.interestedInMedicare) interests.push('Medicare');
    if (lead.interestedInFinalExpense) interests.push('Final Expense');
    return interests;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Lead Management & Analytics</title>
        <meta name="description" content="Manage leads, create listings, and analyze market trends with comprehensive admin dashboard." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />
      
      <main className="py-8 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage leads, create listings, and analyze market performance</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold">{leads.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Listings</p>
                    <p className="text-2xl font-bold">{listings.filter((l: LeadListing) => l.isActive).length}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Price</p>
                    <p className="text-2xl font-bold">
                      ${listings.length > 0 ? 
                        (listings.reduce((sum: number, l: LeadListing) => sum + parseFloat(l.price), 0) / listings.length).toFixed(2) : 
                        '0.00'
                      }
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Market Trends</p>
                    <p className="text-2xl font-bold">{trends.length}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="leads" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="listings">Listings</TabsTrigger>
              <TabsTrigger value="create">Create Listing</TabsTrigger>
              <TabsTrigger value="trends">Market Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="leads" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Lead Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>Interests</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingLeads ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">Loading leads...</TableCell>
                          </TableRow>
                        ) : leads.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">No leads found</TableCell>
                          </TableRow>
                        ) : (
                          leads.map((lead: Lead) => (
                            <TableRow key={lead.id}>
                              <TableCell>{lead.id}</TableCell>
                              <TableCell>{lead.firstName} {lead.lastName}</TableCell>
                              <TableCell>{lead.email}</TableCell>
                              <TableCell>{lead.phoneNumber}</TableCell>
                              <TableCell>{lead.state}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {getInterests(lead).map((interest) => (
                                    <Badge key={interest} variant="secondary" className="text-xs">
                                      {interest}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(lead.createdAt)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Lead Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Lead ID</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Quality</TableHead>
                          <TableHead>Times Resold</TableHead>
                          <TableHead>Industry</TableHead>
                          <TableHead>Geography</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingListings ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">Loading listings...</TableCell>
                          </TableRow>
                        ) : listings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8">No listings found</TableCell>
                          </TableRow>
                        ) : (
                          listings.map((listing: LeadListing) => (
                            <TableRow key={listing.id}>
                              <TableCell>{listing.id}</TableCell>
                              <TableCell>{listing.leadId}</TableCell>
                              <TableCell>${listing.price}</TableCell>
                              <TableCell>
                                <Badge className={listing.qualityScore >= 90 ? "bg-green-500" : listing.qualityScore >= 70 ? "bg-yellow-500" : "bg-red-500"}>
                                  {listing.qualityScore}%
                                </Badge>
                              </TableCell>
                              <TableCell>{listing.timesResold}</TableCell>
                              <TableCell>{listing.industry}</TableCell>
                              <TableCell>{listing.geography}</TableCell>
                              <TableCell>
                                <Badge variant={listing.isActive ? "default" : "secondary"}>
                                  {listing.isActive ? "Active" : "Sold"}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(listing.createdAt)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Lead Listing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadId">Lead ID</Label>
                      <Input
                        id="leadId"
                        type="number"
                        placeholder="Enter lead ID"
                        value={newListing.leadId}
                        onChange={(e) => setNewListing(prev => ({ ...prev, leadId: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="Enter price"
                        value={newListing.price}
                        onChange={(e) => setNewListing(prev => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select onValueChange={(value) => setNewListing(prev => ({ ...prev, industry: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="medicare">Medicare</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="geography">Geography</Label>
                      <Select onValueChange={(value) => setNewListing(prev => ({ ...prev, geography: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CA">California</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                          <SelectItem value="TX">Texas</SelectItem>
                          <SelectItem value="FL">Florida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      onClick={handleCreateListing}
                      disabled={createListingMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Listing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Market Trends
                  </CardTitle>
                  <Button 
                    onClick={handleRecordTrend}
                    disabled={recordTrendMutation.isPending}
                    className="ml-auto"
                  >
                    Record Sample Trend
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Industry</TableHead>
                          <TableHead>Geography</TableHead>
                          <TableHead>Avg Price</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Growth Rate</TableHead>
                          <TableHead>Recorded</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingTrends ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">Loading trends...</TableCell>
                          </TableRow>
                        ) : trends.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">No trends recorded</TableCell>
                          </TableRow>
                        ) : (
                          trends.map((trend: any) => (
                            <TableRow key={trend.id}>
                              <TableCell>{trend.industry}</TableCell>
                              <TableCell>{trend.geography}</TableCell>
                              <TableCell>${trend.avgPrice}</TableCell>
                              <TableCell>{trend.volume}</TableCell>
                              <TableCell>
                                <Badge variant={parseFloat(trend.growthRate) >= 0 ? "default" : "destructive"}>
                                  {trend.growthRate}%
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(trend.recordedAt)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
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