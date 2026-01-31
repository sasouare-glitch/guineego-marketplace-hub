import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutStep {
  id: number;
  name: string;
  description: string;
}

interface CheckoutStepperProps {
  steps: CheckoutStep[];
  currentStep: number;
}

export const CheckoutStepper = ({ steps, currentStep }: CheckoutStepperProps) => {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => (
          <li key={step.id} className="relative flex-1">
            <div className="flex items-center">
              {/* Line before */}
              {index > 0 && (
                <div 
                  className={cn(
                    "absolute left-0 right-1/2 top-5 h-0.5 -translate-y-1/2",
                    step.id <= currentStep ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              
              {/* Step indicator */}
              <div className="relative flex flex-col items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: step.id === currentStep ? 1.1 : 1,
                    backgroundColor: step.id < currentStep 
                      ? "hsl(152, 81%, 39%)" 
                      : step.id === currentStep 
                        ? "hsl(152, 81%, 39%)" 
                        : "hsl(var(--secondary))"
                  }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center z-10 border-2",
                    step.id < currentStep 
                      ? "border-primary" 
                      : step.id === currentStep 
                        ? "border-primary" 
                        : "border-border"
                  )}
                >
                  {step.id < currentStep ? (
                    <Check className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <span className={cn(
                      "text-sm font-semibold",
                      step.id <= currentStep ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {step.id}
                    </span>
                  )}
                </motion.div>
                
                {/* Labels */}
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    step.id <= currentStep ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Line after */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-1/2 right-0 top-5 h-0.5 -translate-y-1/2",
                    step.id < currentStep ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};
