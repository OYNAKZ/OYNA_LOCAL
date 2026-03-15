import type { CSSProperties } from "react";

import type { LauncherApp } from "@shared/schemas/catalog";
import { formatRelativeTime } from "@renderer/features/launcher/utils/time";

interface AppCardProps {
  app: LauncherApp;
  launching: boolean;
  lastLaunchedAt?: string;
  onLaunch(appId: string): void;
  onInspect(appId: string): void;
}

const hashTitle = (value: string): number => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

export const AppCard = ({ app, launching, lastLaunchedAt, onLaunch, onInspect }: AppCardProps) => {
  const hue = hashTitle(app.id) % 360;
  const style = {
    "--app-accent": `hsl(${hue} 88% 60%)`
  } as CSSProperties;

  return (
    <article className="app-card" style={style}>
      <div className="app-card__head">
        <span className="app-card__glyph" aria-hidden="true">
          {app.title.slice(0, 1).toUpperCase()}
        </span>

        <div>
          <h4>{app.title}</h4>
          <p>{app.description ?? "Описание отсутствует"}</p>
        </div>

        <span className={`state-pill ${app.installed ? "state-pill--ok" : "state-pill--warn"}`}>
          {app.installed ? "Готово" : "Missing"}
        </span>
      </div>

      <div className="tag-row">
        {app.tags.slice(0, 4).map((tag) => (
          <span key={`${app.id}-${tag}`} className="tag-pill">
            #{tag}
          </span>
        ))}
        {app.requiresAdmin ? <span className="tag-pill tag-pill--warn">admin</span> : null}
      </div>

      <div className="app-card__meta">
        <small>{lastLaunchedAt ? `Последний запуск ${formatRelativeTime(lastLaunchedAt)}` : "Ещё не запускалось"}</small>
      </div>

      <div className="app-card__actions">
        <button type="button" className="ghost-button" onClick={() => onInspect(app.id)}>
          Детали
        </button>
        <button
          type="button"
          className="primary-button"
          onClick={() => onLaunch(app.id)}
          disabled={!app.installed || launching}
        >
          {launching ? "Запуск..." : "Играть"}
        </button>
      </div>
    </article>
  );
};
