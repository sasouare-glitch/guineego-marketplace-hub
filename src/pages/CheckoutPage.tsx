import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { AddressForm } from "@/components/checkout/AddressForm";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { useCart } from "@/hooks/useCart";

const steps = [
  { id: 1, name: "Adresse", description: "Livraison" },
  { id: 2, name: "Paiement", description: "Méthode" },
  { id: 3, name: "Confirmation", description: "Commande" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<string | null>("1");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const canProceed = () => {
    if (currentStep === 1) return selectedAddress !== null;
    if (currentStep === 2) {
      if (!selectedPayment) return false;
      if (selectedPayment === "orange_money" || selectedPayment === "mtn_money") {
        return phoneNumber.length >= 9;
      }
      return true;
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      // Process payment
      setIsProcessing(true);
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessing(false);
      setOrderNumber(`GGO-${Date.now().toString().slice(-8)}`);
      clearCart();
      setCurrentStep(3);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Empty cart state
  if (items.length === 0 && currentStep !== 3) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-tight pt-24 pb-16">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">
              Votre panier est vide
            </h1>
            <p className="text-muted-foreground mb-6">
              Ajoutez des produits pour passer commande
            </p>
            <Button asChild>
              <Link to="/marketplace">Découvrir les produits</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-tight pt-24 pb-16">
        {/* Back Link */}
        {currentStep < 3 && (
          <Link 
            to="/cart" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au panier
          </Link>
        )}

        <h1 className="text-3xl font-display font-bold text-foreground mb-8">
          {currentStep === 3 ? "Commande confirmée" : "Finaliser la commande"}
        </h1>

        {/* Stepper */}
        <CheckoutStepper steps={steps} currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="address"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <AddressForm 
                    selectedAddress={selectedAddress}
                    onSelectAddress={setSelectedAddress}
                  />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <PaymentForm 
                    selectedMethod={selectedPayment}
                    onSelectMethod={setSelectedPayment}
                    phoneNumber={phoneNumber}
                    onPhoneChange={setPhoneNumber}
                  />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="confirmation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <OrderConfirmation 
                    orderNumber={orderNumber}
                    estimatedDelivery="Demain, 14h - 18h"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStep < 3 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Traitement...
                    </>
                  ) : currentStep === 2 ? (
                    <>
                      Confirmer et payer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {currentStep < 3 && (
            <div className="lg:col-span-1">
              <OrderSummary />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
