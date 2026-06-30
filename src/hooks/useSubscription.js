import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { SubscriptionStatus } from "../constants/enums";

export function useSubscription() {
  const { subscription, refreshSubscription } = useAuth();

  const isLocked = useMemo(() => {
    if (!subscription) return false;
    const status = subscription.status;
    return (
      status === SubscriptionStatus.EXPIRED ||
      status === SubscriptionStatus.CANCELLED ||
      status === SubscriptionStatus.PENDING
    );
  }, [subscription]);

  const isTrial = useMemo(() => {
    return subscription?.status === SubscriptionStatus.TRIAL;
  }, [subscription]);

  const isActive = useMemo(() => {
    return subscription?.status === SubscriptionStatus.ACTIVE;
  }, [subscription]);

  const daysRemaining = useMemo(() => {
    return subscription?.daysRemaining ?? 0;
  }, [subscription]);

  return {
    subscription,
    isLocked,
    isTrial,
    isActive,
    daysRemaining,
    refreshSubscription,
  };
}
