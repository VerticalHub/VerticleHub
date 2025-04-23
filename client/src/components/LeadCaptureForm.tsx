import { useState } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Loader2 } from "lucide-react";

export default function LeadCaptureForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const stateOptions = useStates();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadValidationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      zipCode: "",
      state: "",
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

  const handleInterestChange = (interest: string, checked: boolean) => {
    setSelectedInterests(prev => 
      checked 
        ? [...prev, interest]
        : prev.filter(i => i !== interest)
    );
    
    // Update the form value
    const updatedInterests = checked 
      ? [...selectedInterests, interest]
      : selectedInterests.filter(i => i !== interest);
    
    form.setValue('interests', updatedInterests);
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
