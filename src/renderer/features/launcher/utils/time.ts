const relativeFormatter = new Intl.RelativeTimeFormat("ru-RU", {
  numeric: "auto"
});

const activityTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

const dashboardDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "2-digit",
  month: "long"
});

const dashboardClockFormatter = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit"
});

export const formatRelativeTime = (iso: string): string => {
  const timestamp = Date.parse(iso);

  if (Number.isNaN(timestamp)) {
    return "только что";
  }

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  if (absSeconds < 45) {
    return "только что";
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
