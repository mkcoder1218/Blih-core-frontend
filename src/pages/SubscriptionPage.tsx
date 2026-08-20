import BusinessSubscriptionView from "../components/subscription/BusinessSubscriptionView";
import PlatformSubscriptionManager from "../components/subscription/PlatformSubscriptionManager";
import { useMe } from "../hooks/useMe";

export default function SubscriptionPage() {
  const me = useMe();
  return me.data?.data?.user?.isPlatformSuperAdmin ? <PlatformSubscriptionManager /> : <BusinessSubscriptionView />;
}
