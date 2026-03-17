import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Smartphone, Shield, Radio } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { SandboxPaymentStatus } from "@/hooks/usePaymentSandbox";

interface SandboxPaymentSimulatorProps {
  status: SandboxPaymentStatus;
  progress: number;
  method: string;
  phone: string;
  amount: number;
}

const STATUS_LABELS: Record<SandboxPaymentStatus, { label: string; icon: typeof Loader2 }> = {
  idle: { label: "En attente", icon: Radio },
  initiating: { label: "Connexion à l'API...", icon: Loader2 },
  ussd_sent: { label: "USSD push envoyé au téléphone", icon: Smartphone },
  user_confirming: { label: "En attente de confirmation utilisateur...", icon: Shield },
  processing: { label: "Validation du paiement...", icon: Loader2 },
  success: { label: "Paiement confirmé !", icon: CheckCircle2 },
  failed: { label: "Paiement échoué", icon: Radio },
};

export function SandboxPaymentSimulator({
  status,
  progress,
  method,
  phone,
  amount,
}: SandboxPaymentSimulatorProps) {
  if (status === "idle") return null;

  const current = STATUS_LABELS[status];
  const Icon = current.icon;
  const isComplete = status === "success";
  const provider = method === "orange_money" ? "Orange Money" : "MTN MoMo";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 border-2 border-dashed border-guinea-yellow/50 bg-guinea-yellow/5 rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="bg-guinea-yellow/10 text-guinea-yellow border-guinea-yellow/30 text-xs font-mono">
          🧪 SANDBOX MODE
        </Badge>
        <span className="text-xs text-muted-foreground">Simulation {provider}</span>
      </div>

      {/* Simulated phone screen */}
      <div className="bg-card border border-border rounded-xl p-4 max-w-xs mx-auto">
        <div className="text-center space-y-2">
          <div className="text-xs text-muted-foreground font-mono">📱 {phone || "6XX XX XX XX"}</div>
          <div className="h-px bg-border" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-3"
            >
              <Icon className={`w-8 h-8 mx-auto mb-2 ${
                isComplete ? "text-guinea-green" : "text-guinea-yellow animate-pulse"
              }`} />
              <p className={`text-sm font-medium ${isComplete ? "text-guinea-green" : "text-foreground"}`}>
                {current.label}
              </p>
            </motion.div>
          </AnimatePresence>

          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-guinea-green/10 rounded-lg p-3 text-left text-xs space-y-1"
            >
              <p className="font-medium text-guinea-green">✅ Transaction réussie</p>
              <p className="text-muted-foreground">Montant: {amount.toLocaleString()} GNF</p>
              <p className="text-muted-foreground font-mono text-[10px]">
                TX: SANDBOX_{method.toUpperCase()}_{Date.now()}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>API Call</span>
          <span>USSD</span>
          <span>Confirm</span>
          <span>Done</span>
        </div>
      </div>
    </motion.div>
  );
}
