import { useState, useCallback } from "react";

export type SandboxPaymentStatus = 
  | "idle" 
  | "initiating" 
  | "ussd_sent" 
  | "user_confirming" 
  | "processing" 
  | "success" 
  | "failed";

interface SandboxPaymentResult {
  success: boolean;
  orderId: string;
  transactionId: string;
  paymentUrl?: string;
  instructions?: string;
}

interface UsePaymentSandboxReturn {
  isSandboxMode: boolean;
  toggleSandbox: () => void;
  sandboxStatus: SandboxPaymentStatus;
  sandboxProgress: number;
  simulatePayment: (params: {
    method: "orange_money" | "mtn_money";
    phone: string;
    amount: number;
    orderId: string;
  }) => Promise<SandboxPaymentResult>;
  resetSandbox: () => void;
}

const SANDBOX_STEPS: { status: SandboxPaymentStatus; delay: number; progress: number }[] = [
  { status: "initiating", delay: 800, progress: 10 },
  { status: "ussd_sent", delay: 1500, progress: 30 },
  { status: "user_confirming", delay: 2000, progress: 55 },
  { status: "processing", delay: 1500, progress: 80 },
  { status: "success", delay: 1000, progress: 100 },
];

export function usePaymentSandbox(): UsePaymentSandboxReturn {
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [sandboxStatus, setSandboxStatus] = useState<SandboxPaymentStatus>("idle");
  const [sandboxProgress, setSandboxProgress] = useState(0);

  const toggleSandbox = useCallback(() => {
    setIsSandboxMode((prev) => !prev);
    setSandboxStatus("idle");
    setSandboxProgress(0);
  }, []);

  const resetSandbox = useCallback(() => {
    setSandboxStatus("idle");
    setSandboxProgress(0);
  }, []);

  const simulatePayment = useCallback(
    async (params: {
      method: "orange_money" | "mtn_money";
      phone: string;
      amount: number;
      orderId: string;
    }): Promise<SandboxPaymentResult> => {
      const { method, phone, amount, orderId } = params;

      for (const step of SANDBOX_STEPS) {
        await new Promise((resolve) => setTimeout(resolve, step.delay));
        setSandboxStatus(step.status);
        setSandboxProgress(step.progress);
      }

      const txId = `SANDBOX_${method.toUpperCase()}_${Date.now()}`;
      const provider = method === "orange_money" ? "Orange Money" : "MTN MoMo";

      return {
        success: true,
        orderId,
        transactionId: txId,
        instructions: `✅ [SANDBOX] Paiement ${provider} simulé avec succès\n` +
          `📱 Numéro: ${phone}\n` +
          `💰 Montant: ${amount.toLocaleString()} GNF\n` +
          `🔖 Transaction: ${txId}`,
      };
    },
    []
  );

  return {
    isSandboxMode,
    toggleSandbox,
    sandboxStatus,
    sandboxProgress,
    simulatePayment,
    resetSandbox,
  };
}
