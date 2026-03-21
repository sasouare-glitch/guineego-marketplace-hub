import { SellerLayout } from "@/components/seller/SellerLayout";
import WithdrawalHistoryPage from "@/pages/shared/WithdrawalHistoryPage";

export default function SellerWithdrawalHistory() {
  return <WithdrawalHistoryPage backUrl="/seller/finances" layout={SellerLayout} />;
}
