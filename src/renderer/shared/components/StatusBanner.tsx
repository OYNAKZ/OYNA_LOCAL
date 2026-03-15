interface StatusBannerProps {
  tone: "info" | "error";
  message: string;
}

export const StatusBanner = ({ tone, message }: StatusBannerProps) => (
  <div className={`status-banner status-banner--${tone}`} role="status" aria-live="polite">
    {message}
  </div>
);
