import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface DraftConfirmationScreenProps {
  onOpenGmail: () => void;
  onBackToBrief: () => void;
}

const DraftConfirmationScreen: React.FC<DraftConfirmationScreenProps> = ({ 
  onOpenGmail, 
  onBackToBrief 
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 animate-fade-in">
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-brief-accent-soft flex items-center justify-center mb-8">
          <FileText className="w-7 h-7 text-brief-accent" />
        </div>
        
        {/* Message */}
        <p className="text-xl text-brief-text-primary leading-relaxed mb-12 font-light">
          Draft saved to Gmail.<br />
          I didn't send it.
        </p>
        
        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <Button 
            variant="brief" 
            onClick={onOpenGmail}
            className="w-full"
          >
            Open in Gmail
          </Button>
          
          <Button 
            variant="brief-ghost" 
            onClick={onBackToBrief}
            className="w-full"
          >
            Back to Brief
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DraftConfirmationScreen;
