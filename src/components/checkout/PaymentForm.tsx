import { motion } from "framer-motion";
import { Smartphone, CreditCard, Wallet, Check, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: "mobile" | "card" | "wallet" | "cash";
  descriptionKey: string;
  fees?: string;
}

interface PaymentFormProps {
  selectedMethod: string | null;
  onSelectMethod: (methodId: string) => void;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  walletBalance?: number;
  walletLoading?: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "orange_money",
    name: "Orange Money",
    icon: "🟠",
    type: "mobile",
    descriptionKey: "orangeMoney",
    fees: "free"
  },
  {
    id: "mtn_money",
    name: "MTN Mobile Money",
    icon: "🟡",
    type: "mobile",
    descriptionKey: "mtnMoney",
    fees: "free"
  },
  {
    id: "wallet",
    name: "GuineeGo Wallet",
    icon: "💚",
    type: "wallet",
    descriptionKey: "wallet",
    fees: "balance"
  },
  {
    id: "cash",
    name: "Cash à la livraison",
    icon: "💵",
    type: "cash",
    descriptionKey: "cash",
    fees: "free"
  },
  {
    id: "card",
    name: "Visa / Mastercard",
    icon: "💳",
    type: "card",
    descriptionKey: "card",
    fees: "+2%"
  }
];

export const PaymentForm = ({ 
  selectedMethod, 
  onSelectMethod, 
  phoneNumber, 
  onPhoneChange,
  walletBalance = 0,
  walletLoading = false
}: PaymentFormProps) => {
  const { t } = useTranslation();
  const selectedPayment = paymentMethods.find(m => m.id === selectedMethod);

  const getDescription = (method: PaymentMethod) => {
    if (method.id === "orange_money") return "Orange Money";
    if (method.id === "mtn_money") return "MTN Mobile Money";
    if (method.id === "wallet") return t.checkout.yourBalance;
    if (method.id === "cash") return "Payez en espèces à la réception";
    return "Visa, Mastercard";
  };

  const getFeeLabel = (fee: string) => {
    if (fee === "free") return t.checkout.free;
    if (fee === "balance") {
      if (walletLoading) return "...";
      return `${walletBalance.toLocaleString()} GNF`;
    }
    return fee;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          {t.checkout.paymentMethod}
        </h2>
        <p className="text-muted-foreground">
          {t.checkout.choosePaymentMethod}
        </p>
      </div>

      {/* Payment Methods */}
      <RadioGroup value={selectedMethod || ""} onValueChange={onSelectMethod}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative border rounded-2xl p-4 cursor-pointer transition-all",
                selectedMethod === method.id 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => onSelectMethod(method.id)}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{method.icon}</span>
                    <span className="font-semibold text-foreground">{method.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{getDescription(method)}</p>
                  {method.fees && (
                    <span className={cn(
                      "inline-block mt-2 text-xs px-2 py-0.5 rounded-full",
                      method.fees === "free" 
                        ? "bg-guinea-green/10 text-guinea-green" 
                        : method.fees.startsWith("+") 
                          ? "bg-guinea-yellow/10 text-guinea-yellow"
                          : "bg-secondary text-muted-foreground"
                    )}>
                      {getFeeLabel(method.fees)}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </RadioGroup>

      {/* Mobile Money Form */}
      {selectedPayment && selectedPayment.type === "mobile" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-2xl">
              {selectedPayment.icon}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t.checkout.payWith} {selectedPayment.name}</h3>
              <p className="text-sm text-muted-foreground">{t.checkout.enterPhoneNumber}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="mobilePhone">{t.checkout.phoneNumber}</Label>
              <div className="relative mt-1.5">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  id="mobilePhone"
                  placeholder="6XX XX XX XX"
                  value={phoneNumber}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {t.checkout.receivePaymentRequest}
              </p>
            </div>

            <div className="bg-guinea-yellow/10 border border-guinea-yellow/20 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-guinea-yellow flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">{t.checkout.howItWorks}</p>
                  <ol className="mt-2 space-y-1 text-muted-foreground">
                    <li>1. {t.checkout.step1Payment}</li>
                    <li>2. {t.checkout.step2Payment}</li>
                    <li>3. {t.checkout.step3Payment}</li>
                    <li>4. {t.checkout.step4Payment}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Wallet Info */}
      {selectedPayment && selectedPayment.type === "wallet" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-guinea-green/10 border border-guinea-green/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-guinea-green/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-guinea-green" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t.checkout.yourBalance}</h3>
                {walletLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-guinea-green" />
                ) : (
                  <p className="text-2xl font-bold text-guinea-green">{walletBalance.toLocaleString()} GNF</p>
                )}
              </div>
            </div>
            <Check className="w-6 h-6 text-guinea-green" />
          </div>
        </motion.div>
      )}

      {/* Cash Info */}
      {selectedPayment && selectedPayment.type === "cash" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
              💵
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Paiement à la livraison</h3>
              <p className="text-sm text-muted-foreground">Payez en espèces au livreur</p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
            <p>• Préparez le montant exact si possible</p>
            <p>• Le livreur vous remettra un reçu</p>
            <p>• Vérifiez votre commande avant de payer</p>
          </div>
        </motion.div>
      )}

      {/* Card - Stripe Redirect */}
      {selectedPayment && selectedPayment.type === "card" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Paiement par carte Visa / Mastercard</h3>
              <p className="text-sm text-muted-foreground">Redirection sécurisée vers Stripe</p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Paiement 100% sécurisé
            </p>
            <p>• Vous serez redirigé vers la page de paiement Stripe</p>
            <p>• Accepte Visa, Mastercard et cartes internationales</p>
            <p>• Frais de traitement : +2%</p>
            <p>• Confirmation instantanée après paiement</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
