import { useEffect, useMemo, useState } from "react";

const MIN_VISIBLE_DURATION_MS = 2_100;

const getPhaseLabel = (progress: number, isReady: boolean): string => {
  if (progress < 22) {
    return "Пробуждаем ядро";
  }

  if (progress < 48) {
    return "Синхронизируем модули";
  }

  if (progress < 78) {
    return "Подгружаем каталог станции";
  }

  if (progress < 100) {
    return isReady ? "Финальные проверки" : "Ожидание сервисов";
  }

  return "Добро пожаловать в OYNA";
};

export const useBootSplash = (isReady: boolean) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(5);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timerId = window.setInterval(() => {
      setProgress((current) => {
        if (isReady) {
          if (current >= 100) {
            return 100;
          }

          return Math.min(100, current + (current < 88 ? 6 : 3));
        }

        if (current >= 88) {
          return 88;
        }

        return Math.min(88, current + (current < 40 ? 2.3 : 1.4));
      });
    }, 50);

    return () => {
      window.clearInterval(timerId);
    };
  }, [isReady, visible]);

  useEffect(() => {
    if (!visible || !isReady || progress < 100) {
      return;
    }

    const elapsed = Date.now() - startedAt;
    const delay = Math.max(260, MIN_VISIBLE_DURATION_MS - elapsed);

    const timeoutId = window.setTimeout(() => {
      setVisible(false);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isReady, progress, startedAt, visible]);

  const phase = useMemo(() => getPhaseLabel(progress, isReady), [progress, isReady]);

  return {
    visible,
    progress,
    phase
  };
};
