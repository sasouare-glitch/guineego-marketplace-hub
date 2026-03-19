import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingBag, FlaskConical } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { AddressForm } from "@/components/checkout/AddressForm";
import { GuestAddressForm, GuestAddress, validateGuineaPhone } from "@/components/checkout/GuestAddressForm";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { SandboxPaymentSimulator } from "@/components/checkout/SandboxPaymentSimulator";
import { useCart } from "@/hooks/useCart";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAddresses } from "@/hooks/useUserAddresses";
import { useWallet } from "@/hooks/useWallet";
import { usePaymentSandbox } from "@/hooks/usePaymentSandbox";
import { createOrderDirect } from "@/lib/firebase/orders";
import { toast } from "sonner";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart, subtotal } = useCart();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addresses, loading: addressesLoading, addAddress, defaultAddress } = useUserAddresses();
  const { wallet, loading: walletLoading } = useWallet();
  const { isSandboxMode, toggleSandbox, sandboxStatus, sandboxProgress, simulatePayment, resetSandbox } = usePaymentSandbox();

  const isGuest = !user;

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Guest address state
  const [guestAddress, setGuestAddress] = useState<GuestAddress>({
    fullName: "",
    phone: "",
    address: "",
    commune: "",
    city: "Conakry",
    instructions: "",
  });

  // Auto-select default address when loaded (authenticated only)
  if (!isGuest && !selectedAddress && defaultAddress && !addressesLoading) {
    setSelectedAddress(defaultAddress.id);
  }

  const steps = [
    { id: 1, name: t.checkout.step1, description: t.checkout.deliveryAddress },
    { id: 2, name: t.checkout.step2, description: t.checkout.paymentMethod },
    { id: 3, name: t.checkout.step3, description: t.checkout.orderConfirmed },
  ];

  const isGuestAddressValid = () => {
    return (
      guestAddress.fullName.trim().length >= 2 &&
      validateGuineaPhone(guestAddress.phone).valid &&
      guestAddress.address.trim().length >= 3 &&
      guestAddress.commune.length > 0
    );
  };

  const canProceed = () => {
    if (currentStep === 1) {
      if (isGuest) return isGuestAddressValid();
      return selectedAddress !== null;
    }
    if (currentStep === 2) {
      if (!selectedPayment) return false;
      if (selectedPayment === "orange_money" || selectedPayment === "mtn_money") {
        return phoneNumber.length >= 9;
      }
      if (selectedPayment === "cash") return true;
      if (selectedPayment === "wallet") {
        if (isGuest) return false; // Wallet not available for guests
        return (wallet?.balance || 0) >= subtotal;
      }
      return true;
    }
    return true;
  };

  const getShippingAddress = () => {
    if (isGuest) {
      return {
        fullName: guestAddress.fullName.trim(),
        phone: guestAddress.phone.trim(),
        commune: guestAddress.commune,
        quartier: guestAddress.address,
        address: `${guestAddress.address}, ${guestAddress.commune}, ${guestAddress.city}`,
        instructions: guestAddress.instructions || '',
      };
    }
    const address = addresses.find(a => a.id === selectedAddress);
    if (!address) return null;
    return {
      fullName: address.fullName,
      phone: address.phone,
      commune: address.commune,
      quartier: address.address,
      address: `${address.address}, ${address.commune}, ${address.city}`,
      instructions: address.instructions || '',
    };
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      setIsProcessing(true);
      try {
        const shippingAddress = getShippingAddress();
        if (!shippingAddress) {
          toast.error("Veuillez renseigner une adresse de livraison");
          setIsProcessing(false);
          return;
        }

        // SANDBOX MODE
        const isMobileMoney = selectedPayment === "orange_money" || selectedPayment === "mtn_money";
        if (isSandboxMode && isMobileMoney) {
          const sandboxResult = await simulatePayment({
            method: selectedPayment as "orange_money" | "mtn_money",
            phone: phoneNumber,
            amount: subtotal,
            orderId: `SANDBOX_ORD_${Date.now()}`,
          });

          if (sandboxResult.success) {
            setOrderNumber(sandboxResult.orderId);
            clearCart();
            toast.success("🧪 [SANDBOX] Paiement simulé avec succès !");
            await new Promise(r => setTimeout(r, 1500));
            setCurrentStep(3);
            resetSandbox();
          }
          setIsProcessing(false);
          return;
        }

        const result = await createOrderDirect({
          uid: user?.uid,
          isGuest,
          items: items.map(item => ({
            productId: item.productId,
            variantSku: item.variant || 'default',
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            sellerId: item.sellerId || item.seller || 'unknown',
            thumbnail: item.image,
          })),
          shippingAddress,
          paymentMethod: selectedPayment as string,
        });

        // For card payments, redirect to Stripe Checkout
        if (selectedPayment === 'card') {
          try {
            const { callFunction } = await import('@/lib/firebase/config');
            const createStripeCheckout = callFunction<
              { orderId: string; paymentId: string; successUrl: string; cancelUrl: string },
              { success: boolean; checkoutUrl: string }
            >('createStripeCheckout');

            const stripeResult = await createStripeCheckout({
              orderId: result.orderId,
              paymentId: result.paymentId || result.orderId,
              successUrl: `${window.location.origin}/orders/${result.orderId}?payment=success`,
              cancelUrl: `${window.location.origin}/orders/${result.orderId}?payment=cancelled`,
            });

            if (stripeResult.data.checkoutUrl) {
              window.location.href = stripeResult.data.checkoutUrl;
              return;
            }
          } catch (stripeError: any) {
            console.error('Stripe checkout error:', stripeError);
            toast.error("Erreur Stripe: " + (stripeError.message || "Impossible de créer la session de paiement"));
            setIsProcessing(false);
            return;
          }
        }

        setOrderNumber(result.orderId);
        clearCart();
        setCurrentStep(3);
        toast.success("Commande créée avec succès !");
      } catch (error: any) {
        console.error('Order creation error:', error);
        toast.error(error.message || "Erreur lors de la création de la commande");
      } finally {
        setIsProcessing(false);
      }
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
              {t.checkout.cartEmpty}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t.checkout.addProductsToOrder}
            </p>
            <Button asChild>
              <Link to="/marketplace">{t.cart.discoverProducts}</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Filter payment methods for guests (wallet + card require authenticated flows)
  const guestExcludedPayments = isGuest ? ['wallet', 'card'] : [];

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
            {t.cart.backToCart}
          </Link>
        )}

        <h1 className="text-3xl font-display font-bold text-foreground mb-8">
          {currentStep === 3 ? t.checkout.orderConfirmed : t.checkout.title}
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
                  {isGuest ? (
                    <GuestAddressForm
                      address={guestAddress}
                      onChange={setGuestAddress}
                    />
                  ) : (
                    <AddressForm 
                      selectedAddress={selectedAddress}
                      onSelectAddress={setSelectedAddress}
                      addresses={addresses}
                      loading={addressesLoading}
                      onAddAddress={addAddress}
                    />
                  )}
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Sandbox Toggle */}
                  <div className="flex items-center gap-3 mb-4 p-3 rounded-xl border-2 border-dashed border-guinea-yellow/40 bg-guinea-yellow/5">
                    <FlaskConical className="w-5 h-5 text-guinea-yellow" />
                    <Label htmlFor="sandbox-toggle" className="text-sm font-medium text-foreground cursor-pointer flex-1">
                      Mode Sandbox (simulation)
                    </Label>
                    <Switch
                      id="sandbox-toggle"
                      checked={isSandboxMode}
                      onCheckedChange={toggleSandbox}
                    />
                  </div>
                  {isSandboxMode && (
                    <p className="text-xs text-guinea-yellow mb-4 -mt-2 ml-1">
                      🧪 Les paiements Mobile Money seront simulés sans appeler l'API réelle
                    </p>
                  )}

                  <PaymentForm 
                    selectedMethod={selectedPayment}
                    onSelectMethod={setSelectedPayment}
                    phoneNumber={phoneNumber}
                    onPhoneChange={setPhoneNumber}
                    walletBalance={wallet?.balance || 0}
                    walletLoading={walletLoading}
                    excludeMethods={guestExcludedPayments}
                  />

                  {/* Sandbox Simulator */}
                  {isSandboxMode && (selectedPayment === "orange_money" || selectedPayment === "mtn_money") && (
                    <SandboxPaymentSimulator
                      status={sandboxStatus}
                      progress={sandboxProgress}
                      method={selectedPayment}
                      phone={phoneNumber}
                      amount={subtotal}
                    />
                  )}
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
                    estimatedDelivery={t.time.today + ", 14h - 18h"}
                    isGuest={isGuest}
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
                  {t.common.back}
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {t.checkout.processing}
                    </>
                  ) : currentStep === 2 ? (
                    <>
                      {t.checkout.confirmAndPay}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      {t.checkout.continue}
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
