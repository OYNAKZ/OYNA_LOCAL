import { useState } from "react";
import type { CSSProperties } from "react";
import { ICON_PRESETS } from '../shared/styles/icon-presets'

interface AppIconProps {
  appId: string;
  icon?: string | undefined;
  title: string;
}

interface IconPreset {
  glyph: string;
  bg: string;
  fg: string;
  border: string;
}


const getFallbackPreset = (title: string): IconPreset => ({
  glyph: title.slice(0, 2).toUpperCase(),
  bg: "#263341",
  fg: "#e7eff9",
  border: "#50657d"
});

const isImageIcon = (icon: string): boolean =>
  icon.startsWith("data:") ||
  icon.startsWith("/") ||
  icon.startsWith("./") ||
  /\.(svg|png|jpg|jpeg|webp)$/i.test(icon);

export const AppIcon = ({ appId, icon, title }: AppIconProps) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (icon && !imageFailed && isImageIcon(icon)) {
    return (
      <span className="app-icon app-icon--image-wrap" aria-label={`${title} icon`}>
        <img
          className="app-icon__image"
          src={icon}
          alt=""
          onError={() => {
            setImageFailed(true);
          }}
        />
      </span>
    );
  }

  const key = (icon ?? appId).toLowerCase();
  const preset = ICON_PRESETS[key] ?? getFallbackPreset(title);

  const style = {
    "--app-icon-bg": preset.bg,
    "--app-icon-fg": preset.fg,
    "--app-icon-border": preset.border
  } as CSSProperties;

  return (
    <span className="app-icon" style={style} aria-label={`${title} icon`}>
      {preset.glyph}
    </span>
  );
};
