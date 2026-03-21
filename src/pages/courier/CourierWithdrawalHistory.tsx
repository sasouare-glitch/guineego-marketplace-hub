import { CourierLayout } from "@/components/courier/CourierLayout";
import WithdrawalHistoryPage from "@/pages/shared/WithdrawalHistoryPage";

export default function CourierWithdrawalHistory() {
  return <WithdrawalHistoryPage backUrl="/courier/earnings" layout={CourierLayout} />;
}
