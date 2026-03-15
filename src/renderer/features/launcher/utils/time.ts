const relativeFormatter = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto"
});

const activityTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

const dashboardDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "2-digit"
});

const dashboardClockFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit"
});

export const formatRelativeTime = (iso: string): string => {
  const timestamp = Date.parse(iso);

  if (Number.isNaN(timestamp)) {
    return "just now";
  }

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 45) {
    return "just now";
  }

  if (absSeconds < 3600) {
    return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
  }

  if (absSeconds < 86_400) {
    return relativeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  }

  return relativeFormatter.format(Math.round(diffSeconds / 86_400), "day");
};

export const formatActivityTime = (timestamp: number): string =>
  activityTimeFormatter.format(new Date(timestamp));

export const formatDashboardDate = (date: Date): string => dashboardDateFormatter.format(date);

export const formatDashboardClock = (date: Date): string => dashboardClockFormatter.format(date);
