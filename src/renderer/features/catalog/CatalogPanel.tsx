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
  onInspectApp
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
          <h2>Applications</h2>
        </header>
        <p className="muted">Loading catalog...</p>
      </section>
    );
  }

  const apps = filterApps(catalog.apps, selectedCategory, search);

  return (
    <section className="panel-card catalog-panel">
      <header className="catalog-panel__header">
        <h2>Applications</h2>
        <input
          className="search-field"
          type="search"
          value={search}
          placeholder="Search by name or tag"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </header>

      <div className="chip-row" role="tablist" aria-label="categories">
        <button
          className={`chip ${selectedCategory === "all" ? "chip--active" : ""}`}
          type="button"
          onClick={() => onCategoryChange("all")}
        >
          All ({catalog.apps.length})
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

      <section className="catalog-grid-wrap">
        {apps.length === 0 ? <p className="muted">No apps match current filters.</p> : null}

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
