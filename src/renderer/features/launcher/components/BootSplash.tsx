interface BootSplashProps {
  visible: boolean;
  progress: number;
  phase: string;
}

export const BootSplash = ({ visible, progress, phase }: BootSplashProps) => {
  if (!visible) {
    return null;
  }

  return (
    <section className="boot-splash" role="status" aria-live="polite">
      <div className="boot-splash__halo" />
      <div className="boot-splash__noise" />

      <div className="boot-splash__content">
        <p className="boot-splash__kicker">GAME STATION</p>
        <h1>OYNA</h1>
        <p className="boot-splash__subtitle">Запуск локального лаунчера</p>

        <div className="boot-progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="boot-progress__meta">
          <span>{phase}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </section>
  );
};
