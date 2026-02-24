import { useState } from "react";
import { SellerLayout } from "@/components/seller/SellerLayout";
import { PersonalInfoCard } from "@/components/profile/PersonalInfoCard";
import { SavedAddressesCard, type Address } from "@/components/profile/SavedAddressesCard";
import { useAuth } from "@/contexts/AuthContext";

const SellerProfilePage = () => {
  const { user: firebaseUser, profile } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);

  const userInfo = {
    firstName: profile?.profile?.firstName || firebaseUser?.displayName?.split(' ')[0] || '',
    lastName: profile?.profile?.lastName || firebaseUser?.displayName?.split(' ').slice(1).join(' ') || '',
    email: firebaseUser?.email || '',
    phone: firebaseUser?.phoneNumber || profile?.phone || '',
    avatar: firebaseUser?.photoURL || undefined,
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Mon Profil</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <PersonalInfoCard user={userInfo} />
          <SavedAddressesCard addresses={addresses} onAddressesChange={setAddresses} />
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerProfilePage;
