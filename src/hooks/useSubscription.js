import { useAuth } from "./useAuth";
import { SubscriptionStatus } from "../constants/enums";

export function useSubscription() {
  const { subscription, refreshSubscription } = useAuth();

  const isLocked = (() => {
    if (!subscription) return false;
    const status = subscription.status;
    return (
      status === SubscriptionStatus.EXPIRED ||
      status === SubscriptionStatus.CANCELLED ||
      status === SubscriptionStatus.PENDING
    );
  })();

  const isTrial = subscription?.status === SubscriptionStatus.TRIAL;

  const isActive = subscription?.status === SubscriptionStatus.ACTIVE;

  const daysRemaining = subscription?.daysRemaining ?? 0;

  return {
    subscription,
    isLocked,
    isTrial,
    isActive,
    daysRemaining,
    refreshSubscription,
  };
}
