import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface WelcomeStep {
  label: string;
  href: string;
}

interface WelcomeBannerProps {
  role: string;
  displayName?: string | null;
  title: string;
  description: string;
  steps?: WelcomeStep[];
}

const STORAGE_KEY = "guinee_go_welcome_dismissed";

export function WelcomeBanner({ role, displayName, title, description, steps }: WelcomeBannerProps) {
  const storageId = `${STORAGE_KEY}_${role}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageId)) {
      setVisible(true);
    }
  }, [storageId]);

  const dismiss = () => {
    localStorage.setItem(storageId, "true");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 p-5 mb-6"
        >
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                {title}{displayName ? `, ${displayName.split(" ")[0]}` : ""} 🎉
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>

              {steps && steps.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {steps.map((step, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-1.5 text-xs"
                    >
                      <Link to={step.href}>
                        {step.label}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
