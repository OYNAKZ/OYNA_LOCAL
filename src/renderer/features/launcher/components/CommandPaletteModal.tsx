import { useEffect, useMemo, useRef } from "react";

import type { CatalogSnapshot } from "@shared/schemas/catalog";
import { Modal } from "@renderer/features/launcher/components/Modal";

interface CommandPaletteModalProps {
  open: boolean;
  catalog: CatalogSnapshot | null;
  query: string;
  launchingAppId: string | null;
  onClose(): void;
  onQueryChange(value: string): void;
  onLaunch(appId: string): void;
}

export const CommandPaletteModal = ({
  open,
  catalog,
  query,
  launchingAppId,
  onClose,
  onQueryChange,
  onLaunch
}: CommandPaletteModalProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 10);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  const matches = useMemo(() => {
    if (!catalog) {
      return [];
    }

    const normalized = query.trim().toLowerCase();

    return catalog.apps
      .filter((app) => {
        if (normalized.length === 0) {
          return true;
        }

        return (
          app.title.toLowerCase().includes(normalized) ||
          app.tags.some((tag) => tag.toLowerCase().includes(normalized))
        );
      })
      .sort((left, right) => {
        if (left.installed !== right.installed) {
          return Number(right.installed) - Number(left.installed);
        }

        return left.title.localeCompare(right.title);
      })
      .slice(0, 12);
  }, [catalog, query]);

  return (
    <Modal
      open={open}
      title="Командная палитра"
      onClose={onClose}
      footer={
        <div className="modal-footer-hint">
          <span>Найди приложение и запусти его в один клик.</span>
          <kbd>Ctrl+K</kbd>
        </div>
      }
    >
      <div className="palette-input-wrap">
        <input
          ref={inputRef}
          type="search"
          value={query}
          className="search-field"
          placeholder="Поиск по названию или тегам"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      <ul className="palette-list">
        {matches.map((app) => (
          <li key={app.id}>
            <button
              type="button"
              className="palette-item"
              onClick={() => onLaunch(app.id)}
              disabled={!app.installed || launchingAppId === app.id}
            >
              <div>
                <strong>{app.title}</strong>
                <p>{app.description ?? "Без описания"}</p>
              </div>
              <span>
                {launchingAppId === app.id ? "..." : app.installed ? "Запуск" : "Недоступно"}
              </span>
            </button>
          </li>
        ))}

        {matches.length === 0 ? <li className="muted">Совпадений не найдено.</li> : null}
      </ul>
    </Modal>
  );
};
