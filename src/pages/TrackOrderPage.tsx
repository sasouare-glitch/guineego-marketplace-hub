import { useState } from "react";
import { validateGuineaPhone } from "@/components/checkout/GuestAddressForm";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Package, Phone, Hash, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function TrackOrderPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tr = t.pages.track;
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedId = orderId.trim().toUpperCase();
    const trimmedPhone = phone.trim().replace(/\s+/g, "");

    if (!trimmedId) {
      setError(tr.errOrderIdRequired);
      return;
    }
    const phoneCheck = validateGuineaPhone(trimmedPhone);
    if (!phoneCheck.valid) {
      setError(phoneCheck.error || tr.errPhoneInvalid);
      return;
    }

    const encodedPhone = encodeURIComponent(trimmedPhone);
    navigate(`/track/${trimmedId}?phone=${encodedPhone}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">G</span>
            </div>
            <span className="font-display font-bold text-foreground">{tr.brand}</span>
          </Link>
          <Link to="/marketplace">
            <Button variant="ghost" size="sm">
              <ShoppingBag className="w-4 h-4 mr-1" />
              {tr.marketplace}
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">{tr.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{tr.subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                {tr.cardTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId" className="flex items-center gap-1.5 text-sm">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    {tr.orderIdLabel}
                  </Label>
                  <Input
                    id="orderId"
                    placeholder="GG-250318-ABC123"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="font-mono uppercase"
                  />
                  <p className="text-xs text-muted-foreground">{tr.orderIdHint}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {tr.phoneLabel}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={tr.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full">
                  {tr.submit}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center text-xs text-muted-foreground space-y-1"
        >
          <p>
            {tr.hasAccount}{" "}
            <Link to="/login" className="text-primary hover:underline">
              {tr.signIn}
            </Link>
            {tr.hasAccountSuffix}
          </p>
        </motion.div>
      </main>

      <footer className="border-t mt-auto py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {tr.brand} — {tr.copyright}
      </footer>
    </div>
  );
}
