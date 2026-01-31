import { useState } from "react";
import { motion } from "framer-motion";
import { Smartphone, CreditCard, Wallet, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: "mobile" | "card" | "wallet";
  description: string;
  fees?: string;
}

interface PaymentFormProps {
  selectedMethod: string | null;
  onSelectMethod: (methodId: string) => void;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "orange_money",
    name: "Orange Money",
    icon: "🟠",
    type: "mobile",
    description: "Payez avec votre compte Orange Money",
    fees: "Gratuit"
  },
  {
    id: "mtn_money",
    name: "MTN Mobile Money",
    icon: "🟡",
    type: "mobile",
    description: "Payez avec votre compte MTN MoMo",
    fees: "Gratuit"
  },
  {
    id: "wallet",
    name: "Portefeuille GuineeGo",
    icon: "💚",
    type: "wallet",
    description: "Utilisez votre solde GuineeGo",
    fees: "Solde: 2 500 000 GNF"
  },
  {
    id: "card",
    name: "Carte bancaire",
    icon: "💳",
    type: "card",
    description: "Visa, Mastercard",
    fees: "+2% frais"
  }
];

export const PaymentForm = ({ 
  selectedMethod, 
  onSelectMethod, 
  phoneNumber, 
  onPhoneChange 
}: PaymentFormProps) => {
  const selectedPayment = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-display font-bold text-foreground mb-2">
          Mode de paiement
        </h2>
        <p className="text-muted-foreground">
          Choisissez comment vous souhaitez payer
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
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                  {method.fees && (
                    <span className={cn(
                      "inline-block mt-2 text-xs px-2 py-0.5 rounded-full",
                      method.fees === "Gratuit" 
                        ? "bg-guinea-green/10 text-guinea-green" 
                        : method.fees.startsWith("+") 
                          ? "bg-guinea-yellow/10 text-guinea-yellow"
                          : "bg-secondary text-muted-foreground"
                    )}>
                      {method.fees}
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
              <h3 className="font-semibold text-foreground">Paiement {selectedPayment.name}</h3>
              <p className="text-sm text-muted-foreground">Entrez votre numéro de téléphone</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="mobilePhone">Numéro de téléphone</Label>
              <div className="relative mt-1.5">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  id="mobilePhone"
                  placeholder={selectedMethod === "orange_money" ? "6XX XX XX XX" : "6XX XX XX XX"}
                  value={phoneNumber}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Vous recevrez une demande de paiement sur ce numéro
              </p>
            </div>

            <div className="bg-guinea-yellow/10 border border-guinea-yellow/20 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-guinea-yellow flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Comment ça marche ?</p>
                  <ol className="mt-2 space-y-1 text-muted-foreground">
                    <li>1. Confirmez votre commande</li>
                    <li>2. Vous recevrez un SMS avec un code USSD</li>
                    <li>3. Composez le code pour valider le paiement</li>
                    <li>4. Votre commande sera confirmée automatiquement</li>
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
                <h3 className="font-semibold text-foreground">Votre solde GuineeGo</h3>
                <p className="text-2xl font-bold text-guinea-green">2 500 000 GNF</p>
              </div>
            </div>
            <Check className="w-6 h-6 text-guinea-green" />
          </div>
        </motion.div>
      )}

      {/* Card Form Placeholder */}
      {selectedPayment && selectedPayment.type === "card" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Carte bancaire</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Numéro de carte</Label>
              <Input id="cardNumber" placeholder="1234 5678 9012 3456" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Date d'expiration</Label>
                <Input id="expiry" placeholder="MM/AA" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" placeholder="123" className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="cardName">Nom sur la carte</Label>
              <Input id="cardName" placeholder="MAMADOU DIALLO" className="mt-1.5" />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
