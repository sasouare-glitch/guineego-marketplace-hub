import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Shield, Bell, LogOut } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PersonalInfoCard } from "@/components/profile/PersonalInfoCard";
import { SavedAddressesCard, Address } from "@/components/profile/SavedAddressesCard";
import { RoleRequestCard } from "@/components/profile/RoleRequestCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";

export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
}

const defaultAddresses: Address[] = [];

export default function ProfilePage() {
  const { user: firebaseUser, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const user: UserInfo = {
    firstName: profile?.profile?.firstName || firebaseUser?.displayName?.split(' ')[0] || '',
    lastName: profile?.profile?.lastName || firebaseUser?.displayName?.split(' ').slice(1).join(' ') || '',
    email: firebaseUser?.email || '',
    phone: firebaseUser?.phoneNumber || profile?.phone || '',
    avatar: firebaseUser?.photoURL || undefined,
  };

  const [addresses, setAddresses] = useState<Address[]>(defaultAddresses);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-tight pt-24 pb-16">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.profile.backToHome}
        </Link>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            {t.profile.title}
          </h1>
          <p className="text-muted-foreground">
            {t.profile.manageInfo}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <PersonalInfoCard user={user} />
            <SavedAddressesCard
              addresses={addresses}
              onAddressesChange={setAddresses}
            />
            <RoleRequestCard />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.settings.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to="/settings/notifications">
                      <Bell className="w-4 h-4 mr-3" />
                      {t.settings.notifications}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to="/settings/security">
                      <Shield className="w-4 h-4 mr-3" />
                      {t.settings.security}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to="/settings/preferences">
                      <Settings className="w-4 h-4 mr-3" />
                      {t.settings.preferences}
                    </Link>
                  </Button>
                  <Separator className="my-2" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      await signOut();
                      navigate('/');
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    {t.nav.logout}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.profile.activity}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.profile.totalOrders}</span>
                    <span className="font-semibold text-foreground">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.profile.inProgress}</span>
                    <span className="font-semibold text-primary">2</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.orders.statusDelivered}</span>
                    <span className="font-semibold text-foreground">10</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t.profile.memberSince}</span>
                    <span className="font-semibold text-foreground">
                      {firebaseUser?.metadata?.creationTime
                        ? new Date(firebaseUser.metadata.creationTime).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Help */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t.profile.needHelp}
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/help">{t.profile.contactSupport}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
