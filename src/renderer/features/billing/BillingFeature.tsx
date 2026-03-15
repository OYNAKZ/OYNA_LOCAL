import { useMemo, useState } from "react";

import { Modal } from "@renderer/features/launcher/components/Modal";
import type { UiTone } from "@renderer/features/launcher/types";

interface ToastPayload {
  tone: UiTone;
  title: string;
  message: string;
}

interface BillingFeatureProps {
  open: boolean;
  walletMinutes: number;
  onClose(): void;
  onWalletChange(nextMinutes: number): void;
  onToast(payload: ToastPayload): void;
  onActivity(tone: UiTone, title: string, details: string): void;
}

interface TariffPlan {
  id: string;
  title: string;
  minutes: number;
  bonusMinutes: number;
  price: number;
  note: string;
}

type PaymentMethod = "card" | "cash" | "qr";

const TARIFF_PLANS: TariffPlan[] = [
  {
    id: "starter-60",
    title: "Starter 60",
    minutes: 60,
    bonusMinutes: 0,
    price: 1.99,
    note: "Short play session"
  },
  {
    id: "prime-180",
    title: "Prime 180",
    minutes: 180,
    bonusMinutes: 30,
    price: 4.99,
    note: "Most popular"
  },
  {
    id: "night-360",
    title: "Night 360",
    minutes: 360,
    bonusMinutes: 90,
    price: 8.99,
    note: "Long gaming block"
  }
];

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const formatMinutesAsLabel = (minutes: number): string => {
  if (minutes <= 0) {
    return "0h";
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${rest}m`;
};

export const BillingFeature = ({
  open,
  walletMinutes,
  onClose,
  onWalletChange,
  onToast,
  onActivity
}: BillingFeatureProps) => {
  const [activePlanId, setActivePlanId] = useState("prime-180");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);

  const activePlan = useMemo(
    () => TARIFF_PLANS.find((plan) => plan.id === activePlanId) ?? TARIFF_PLANS[0],
    [activePlanId]
  );

  const handleConfirmPayment = async () => {
    if (!activePlan || processing) {
      return;
    }

    try {
      setProcessing(true);
      await wait(650);

      const minutesAdded = activePlan.minutes + activePlan.bonusMinutes;
      const nextWallet = walletMinutes + minutesAdded;
      onWalletChange(nextWallet);

      onToast({
        tone: "success",
        title: "Payment Applied",
        message: `${activePlan.title} added ${minutesAdded} min.`
      });
      onActivity("success", "Tariff Purchased", `${activePlan.title} via ${paymentMethod.toUpperCase()}`);

      onClose();
    } catch {
      onToast({
        tone: "error",
        title: "Payment Error",
        message: "Could not process payment. Try again."
      });
      onActivity("error", "Payment Failed", activePlan.title);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Tariffs & Payment"
      onClose={processing ? () => undefined : onClose}
      footer={
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose} disabled={processing}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              void handleConfirmPayment();
            }}
            disabled={processing || !activePlan}
          >
            {processing ? "Processing..." : `Pay $${activePlan?.price.toFixed(2) ?? "0.00"}`}
          </button>
        </div>
      }
    >
      <div className="billing-summary billing-card-shape">
        <span>Wallet Time</span>
        <strong>{formatMinutesAsLabel(walletMinutes)}</strong>
      </div>

      <div className="billing-plan-grid">
        {TARIFF_PLANS.map((plan) => {
          const selected = plan.id === activePlanId;
          const totalMinutes = plan.minutes + plan.bonusMinutes;

          return (
            <button
              key={plan.id}
              type="button"
              className={`billing-plan billing-card-shape ${selected ? "billing-plan--active" : ""}`.trim()}
              onClick={() => setActivePlanId(plan.id)}
              disabled={processing}
            >
              <div className="billing-plan__body">
                <strong>{plan.title}</strong>
                <p>{plan.note}</p>
              </div>
              <div className="billing-plan__meta">
                <strong>{formatMinutesAsLabel(totalMinutes)}</strong>
                <span>${plan.price.toFixed(2)}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="payment-methods">
        <button
          type="button"
          className={`payment-method billing-card-shape ${paymentMethod === "card" ? "payment-method--active" : ""}`.trim()}
          onClick={() => setPaymentMethod("card")}
          disabled={processing}
        >
          Card
        </button>
        <button
          type="button"
          className={`payment-method billing-card-shape ${paymentMethod === "cash" ? "payment-method--active" : ""}`.trim()}
          onClick={() => setPaymentMethod("cash")}
          disabled={processing}
        >
          Cash
        </button>
        <button
          type="button"
          className={`payment-method billing-card-shape ${paymentMethod === "qr" ? "payment-method--active" : ""}`.trim()}
          onClick={() => setPaymentMethod("qr")}
          disabled={processing}
        >
          QR
        </button>
      </div>
    </Modal>
  );
};
