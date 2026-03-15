import { useMemo } from "react";

import type { CatalogSnapshot, LauncherApp } from "@shared/schemas/catalog";
import { AppCard } from "@renderer/features/catalog/components/AppCard";

interface CatalogPanelProps {
  catalog: CatalogSnapshot | null;
  search: string;
  selectedCategory: string;
  launchingAppId: string | null;
  recentMap: Map<string, string>;
  onSearchChange(value: string): void;
  onCategoryChange(value: string): void;
  onLaunch(appId: string): void;
  onInspectApp(appId: string): void;
  onOpenPalette(): void;
}

const filterApps = (apps: LauncherApp[], selectedCategory: string, search: string) => {
  const normalized = search.trim().toLowerCase();

  return apps.filter((app) => {
    const categoryMatch = selectedCategory === "all" || app.categoryId === selectedCategory;

    if (!categoryMatch) {
      return false;
    }

    if (normalized.length === 0) {
      return true;
    }

    return (
      app.title.toLowerCase().includes(normalized) ||
      app.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  });
};

export const CatalogPanel = ({
  catalog,
  search,
  selectedCategory,
  launchingAppId,
  recentMap,
  onSearchChange,
  onCategoryChange,
  onLaunch,
  onInspectApp,
  onOpenPalette
}: CatalogPanelProps) => {
  const categoryCounts = useMemo(() => {
    if (!catalog) {
      return new Map<string, number>();
    }

    const map = new Map<string, number>();

    for (const app of catalog.apps) {
      map.set(app.categoryId, (map.get(app.categoryId) ?? 0) + 1);
    }

    return map;
  }, [catalog]);

  if (!catalog) {
    return (
      <section className="panel-card catalog-panel">
        <header className="panel-title-row">
          <h2>Каталог приложений</h2>
        </header>
        <p className="muted">Загрузка каталога...</p>
      </section>
    );
  }

  const apps = filterApps(catalog.apps, selectedCategory, search);
  const appById = new Map(catalog.apps.map((app) => [app.id, app]));
  const recentApps = catalog.recent
    .map((entry) => appById.get(entry.appId))
    .filter((value): value is LauncherApp => Boolean(value))
    .slice(0, 8);

  return (
    <section className="panel-card catalog-panel">
      <header className="catalog-panel__header">
        <div>
          <h2>Игровая библиотека</h2>
          <p>Выбери приложение, фильтруй по категориям и запускай без лишних шагов.</p>
        </div>

        <div className="catalog-panel__tools">
          <input
            className="search-field"
            type="search"
            value={search}
            placeholder="Поиск по названию и тегам"
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <button type="button" className="ghost-button" onClick={onOpenPalette}>
            Быстрая команда
          </button>
        </div>
      </header>

      <div className="chip-row" role="tablist" aria-label="categories">
        <button
          className={`chip ${selectedCategory === "all" ? "chip--active" : ""}`}
          type="button"
          onClick={() => onCategoryChange("all")}
        >
          Все ({catalog.apps.length})
        </button>

        {catalog.categories.map((category) => (
          <button
            key={category.id}
            className={`chip ${selectedCategory === category.id ? "chip--active" : ""}`}
            type="button"
            onClick={() => onCategoryChange(category.id)}
          >
            {category.title} ({categoryCounts.get(category.id) ?? 0})
          </button>
        ))}
      </div>

      <section className="recent-block">
        <div className="panel-title-row">
          <h3>Последние запуски</h3>
        </div>

        {recentApps.length === 0 ? (
          <p className="muted">История запусков пока пустая.</p>
        ) : (
          <div className="recent-strip">
            {recentApps.map((app) => (
              <button
                key={`recent-${app.id}`}
                type="button"
                className="recent-tile"
                onClick={() => onInspectApp(app.id)}
              >
                <strong>{app.title}</strong>
                <span>{recentMap.get(app.id) ? "Недавно активен" : "Без данных"}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="catalog-grid-wrap">
        {apps.length === 0 ? <p className="muted">Ничего не найдено по текущему фильтру.</p> : null}

        <div className="app-grid">
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              launching={launchingAppId === app.id}
              lastLaunchedAt={recentMap.get(app.id)}
              onLaunch={onLaunch}
              onInspect={onInspectApp}
            />
          ))}
        </div>
      </section>
    </section>
  );
};
