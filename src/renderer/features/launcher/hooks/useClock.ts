import { useEffect, useMemo, useState } from "react";

import { formatDashboardClock, formatDashboardDate } from "@renderer/features/launcher/utils/time";

export const useClock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1_000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  return useMemo(
    () => ({
      dateLabel: formatDashboardDate(now),
      timeLabel: formatDashboardClock(now)
    }),
    [now]
  );
};
