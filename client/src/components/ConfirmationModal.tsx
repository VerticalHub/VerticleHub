import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfirmationModal({ isOpen, onClose }: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4 text-primary-600">
            <CheckCircle2 className="h-16 w-16" />
          </div>
          <DialogTitle className="text-2xl font-heading font-bold text-gray-800">
            Thank You for Your Submission!
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            We've received your information and will be contacting you shortly with personalized insurance options.
          </p>
        </div>
        
        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={onClose}
            className="bg-primary-600 hover:bg-primary-700"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
