import { useState } from "react";
import type { CSSProperties } from "react";

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

const ICON_PRESETS: Record<string, IconPreset> = {
  explorer: { glyph: "EX", bg: "#2d3f55", fg: "#d6e8fa", border: "#4f6a88" },
  notepad: { glyph: "NP", bg: "#294138", fg: "#d7f1e3", border: "#4f7a66" },
  calculator: { glyph: "CL", bg: "#4b3a27", fg: "#ffe8cd", border: "#835f3d" },
  chrome: { glyph: "CH", bg: "#4a2f2e", fg: "#ffe2dd", border: "#854c49" },
  powershell: { glyph: "PS", bg: "#244260", fg: "#d7ecff", border: "#47709d" },
  vscode: { glyph: "VS", bg: "#1f3a57", fg: "#d2e8ff", border: "#456b96" },
  discord: { glyph: "DC", bg: "#363d67", fg: "#e2e7ff", border: "#636fb8" },
  steam: { glyph: "ST", bg: "#203248", fg: "#d7e9ff", border: "#466a93" },
  epic: { glyph: "EG", bg: "#2b2b2d", fg: "#ededee", border: "#5e6065" },
  riot: { glyph: "RT", bg: "#5a282f", fg: "#ffdbe0", border: "#a14c57" },
  battlenet: { glyph: "BN", bg: "#1f4259", fg: "#d3f1ff", border: "#4a7795" },
  ubisoft: { glyph: "UB", bg: "#303549", fg: "#e1e7f7", border: "#596586" },
  ea: { glyph: "EA", bg: "#38363f", fg: "#efedf7", border: "#6b6678" },
  telegram: { glyph: "TG", bg: "#24506d", fg: "#d5f1ff", border: "#4b80a0" },
  teamspeak: { glyph: "TS", bg: "#23515e", fg: "#d7f4ff", border: "#4c8494" },
  spotify: { glyph: "SP", bg: "#224b30", fg: "#d4f8df", border: "#458157" },
  obs: { glyph: "OB", bg: "#37303c", fg: "#f3eef8", border: "#675c72" },
  vlc: { glyph: "VL", bg: "#583e27", fg: "#ffe9d6", border: "#926843" },
  opera: { glyph: "OG", bg: "#5d2734", fg: "#ffe0e7", border: "#9f4c62" },
  firefox: { glyph: "FF", bg: "#563622", fg: "#ffe7d2", border: "#946246" }
};

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
