import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useStates } from "@/hooks/use-states";
import { leadValidationSchema, LeadFormData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function LeadCaptureForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const stateOptions = useStates();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showAcaWarning, setShowAcaWarning] = useState(false);
  const [showMedicareWarning, setShowMedicareWarning] = useState(false);
  
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadValidationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      zipCode: "",
      state: "",
      dateOfBirth: "",
      hasMedicaidMedicareVA: false,
      interests: [],
    },
  });

  const leadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const response = await apiRequest("POST", "/api/leads", data);
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      navigate("/thank-you");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit your information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeadFormData) => {
    // Ensure interests are submitted correctly
    data.interests = selectedInterests;
    
    if (data.interests.length === 0) {
      toast({
        title: "Form Error",
        description: "Please select at least one insurance interest.",
        variant: "destructive",
      });
      return;
    }

    leadMutation.mutate(data);
  };

  // Watch for Medicare interest and date of birth to show warnings
  useEffect(() => {
    // Check if user wants Medicare but is not old enough
    const dateOfBirth = form.getValues("dateOfBirth") as string;
    if (selectedInterests.includes("Medicare") && dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      // Check if they're at least 64.5 years old
      if (age < 64 || (age === 64 && monthDiff < 6)) {
        setShowMedicareWarning(true);
      } else {
        setShowMedicareWarning(false);
      }
    } else {
      setShowMedicareWarning(false);
    }
    
    // Check if user wants ACA but has Medicare/Medicaid/VA
    const hasCoverage = form.getValues("hasMedicaidMedicareVA");
    if (selectedInterests.includes("ACA/Obamacare") && hasCoverage) {
      setShowAcaWarning(true);
    } else {
      setShowAcaWarning(false);
    }
  }, [selectedInterests, form.watch("dateOfBirth"), form.watch("hasMedicaidMedicareVA"), form]);

  const handleInterestChange = (interest: string, checked: boolean) => {
    const newInterests = checked 
      ? [...selectedInterests, interest]
      : selectedInterests.filter(i => i !== interest);
    
    setSelectedInterests(newInterests);
    form.setValue('interests', newInterests);
    
    // Force re-validation
    form.trigger('interests');
  };

  return (
    <Card className="bg-white text-gray-800 rounded-lg shadow-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Doe" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(123) 456-7890" 
                      type="tel"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your@email.com" 
                      type="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="12345" 
                      maxLength={5}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stateOptions.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Select your date of birth</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Required for Medicare eligibility verification
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasMedicaidMedicareVA"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I currently have Medicare, Medicaid, or VA coverage
                    </FormLabel>
                    <FormDescription>
                      This helps us determine your eligibility for certain plans
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="interests"
            render={() => (
              <FormItem>
                <div className="mb-6">
                  <FormLabel className="block text-gray-700 font-medium mb-3">
                    I'm interested in: (select at least one)
                  </FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <Checkbox 
                        id="interest_aca" 
                        checked={selectedInterests.includes("ACA/Obamacare")}
                        onCheckedChange={(checked) => 
                          handleInterestChange("ACA/Obamacare", checked as boolean)
                        }
                      />
                      <label 
                        htmlFor="interest_aca" 
                        className="ml-2 text-gray-700 cursor-pointer"
                      >
                        ACA/Obamacare
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox 
                        id="interest_medicare" 
                        checked={selectedInterests.includes("Medicare")}
                        onCheckedChange={(checked) => 
                          handleInterestChange("Medicare", checked as boolean)
                        }
                      />
                      <label 
                        htmlFor="interest_medicare" 
                        className="ml-2 text-gray-700 cursor-pointer"
                      >
                        Medicare
                      </label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox 
                        id="interest_final_expense" 
                        checked={selectedInterests.includes("Final Expense/Life Insurance")}
                        onCheckedChange={(checked) => 
                          handleInterestChange("Final Expense/Life Insurance", checked as boolean)
                        }
                      />
                      <label 
                        htmlFor="interest_final_expense" 
                        className="ml-2 text-gray-700 cursor-pointer"
                      >
                        Final Expense/Life
                      </label>
                    </div>
                  </div>
                  {selectedInterests.length === 0 && form.formState.isSubmitted && (
                    <p className="text-sm font-medium text-destructive mt-2">
                      Select at least one interest
                    </p>
                  )}
                  
                  {showAcaWarning && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Eligibility Warning</AlertTitle>
                      <AlertDescription>
                        ACA/Obamacare plans are not available for people with existing Medicare, Medicaid, or VA coverage.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {showMedicareWarning && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Eligibility Warning</AlertTitle>
                      <AlertDescription>
                        Medicare is only available to people who are at least 64½ years old. Based on your date of birth, you may not be eligible yet.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </FormItem>
            )}
          />
          
          <div className="mb-6">
            <div className="flex items-start">
              <Checkbox 
                id="privacy_consent" 
                required
              />
              <label htmlFor="privacy_consent" className="ml-2 text-sm text-gray-600">
                I consent to receive phone calls, text messages, and emails about insurance products. 
                I understand my information will be used in accordance with your <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>. 
                I can opt-out at any time.
              </label>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-6 px-6 rounded-md shadow-md transition transform hover:-translate-y-1"
            disabled={leadMutation.isPending}
          >
            {leadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Get My Free Quotes Now"
            )}
          </Button>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            HIPAA Compliant • 256-bit Encryption • We never sell your personal data
          </p>
        </form>
      </Form>
    </Card>
  );
}
