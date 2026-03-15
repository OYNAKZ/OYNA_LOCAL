import type { CSSProperties } from "react";

import type { LauncherApp } from "@shared/schemas/catalog";
import { AppIcon } from "@renderer/features/catalog/components/AppIcon";
import { formatRelativeTime } from "@renderer/features/launcher/utils/time";

interface AppCardProps {
  app: LauncherApp;
  launching: boolean;
  lastLaunchedAt?: string | undefined;
  onLaunch(appId: string): void;
  onInspect(appId: string): void;
}

interface Theme {
  a: string;
  b: string;
  c: string;
}

const THEME_BY_CATEGORY: Record<string, Theme> = {
  core: { a: "#57adc9", b: "#87c9de", c: "#4e7d96" },
  gaming: { a: "#ca4951", b: "#d97962", c: "#a63b42" },
  communication: { a: "#45aa98", b: "#75d0c0", c: "#3c877a" },
  media: { a: "#d58d4f", b: "#e7ba6e", c: "#a56b39" },
  tools: { a: "#7a8ca4", b: "#9caec5", c: "#5f7088" },
  development: { a: "#6f8fa8", b: "#8ca9bf", c: "#546b83" }
};

const fallbackTheme: Theme = { a: "#7291aa", b: "#95b1c8", c: "#586f85" };

export const AppCard = ({ app, launching, lastLaunchedAt, onLaunch, onInspect }: AppCardProps) => {
  const theme = THEME_BY_CATEGORY[app.categoryId] ?? fallbackTheme;

  const style = {
    "--card-accent-a": theme.a,
    "--card-accent-b": theme.b,
    "--card-accent-c": theme.c
  } as CSSProperties;

  return (
    <article
      className="app-card"
      style={style}
      role="button"
      tabIndex={0}
      onClick={() => onInspect(app.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onInspect(app.id);
        }
      }}
    >
      <div className="app-card__head">
        <AppIcon appId={app.id} icon={app.icon} title={app.title} />

        <div>
          <h4>{app.title}</h4>
          <p>{app.description ?? "No description"}</p>
        </div>

        <span className={`state-pill ${app.installed ? "state-pill--ok" : "state-pill--warn"}`}>
          {app.installed ? "Ready" : "Missing"}
        </span>
      </div>

      <div className="tag-row">
        {app.tags.slice(0, 3).map((tag) => (
          <span key={`${app.id}-${tag}`} className="tag-pill">
            #{tag}
          </span>
        ))}
        {app.requiresAdmin ? <span className="tag-pill tag-pill--warn">admin</span> : null}
      </div>

      <div className="app-card__meta">
        <small>{lastLaunchedAt ? `Last launch ${formatRelativeTime(lastLaunchedAt)}` : "Never launched"}</small>
      </div>

      <div className="app-card__actions">
        <button
          type="button"
          className="primary-button"
          onClick={(event) => {
            event.stopPropagation();
            onLaunch(app.id);
          }}
          disabled={!app.installed || launching}
        >
          {launching ? "Launching..." : "Launch"}
        </button>
      </div>
    </article>
  );
};
