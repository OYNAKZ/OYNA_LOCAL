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
  icon.startsWith("http://") ||
  icon.startsWith("https://") ||
  icon.startsWith("/") ||
  icon.startsWith("./") ||
  /\.(svg|png|jpg|jpeg|webp)$/i.test(icon);

const SIMPLE_ICON_SLUGS: Record<string, string> = {
  chrome: "googlechrome",
  discord: "discord",
  steam: "steam",
  epic: "epicgames",
  "epic-games": "epicgames",
  riot: "riotgames",
  "riot-client": "riotgames",
  valorant: "valorant",
  "counter-strike-2": "counterstrike",
  cs2: "counterstrike",
  "dota-2": "dota2",
  dota: "dota2",
  "league-of-legends": "leagueoflegends",
  league: "leagueoflegends",
  fortnite: "fortnite",
  minecraft: "minecraft",
  roblox: "roblox",
  pubg: "pubg",
  faceit: "faceit",
  "geforce-now": "nvidia",
  geforce: "nvidia",
  battlenet: "battle.net",
  ubisoft: "ubisoft",
  "ubisoft-connect": "ubisoft",
  ea: "ea",
  "ea-app": "ea",
  telegram: "telegram",
  teamspeak: "teamspeak",
  spotify: "spotify",
  youtube: "youtube",
  twitch: "twitch",
  obs: "obsstudio",
  "obs-studio": "obsstudio",
  vlc: "vlcmediaplayer",
  opera: "operagx",
  "opera-gx": "operagx",
  powershell: "powershell",
  vscode: "visualstudiocode",
  "visual-studio-code": "visualstudiocode",
  firefox: "firefoxbrowser",
  whatsapp: "whatsapp",
  zoom: "zoom",
  medal: "medal"
};

const resolveBrandIcon = (appId: string, icon?: string): string | null => {
  const key = (icon ?? appId).toLowerCase();
  const slug = SIMPLE_ICON_SLUGS[key] ?? SIMPLE_ICON_SLUGS[appId.toLowerCase()];
  return slug ? `https://cdn.simpleicons.org/${slug}` : null;
};

export const AppIcon = ({ appId, icon, title }: AppIconProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const brandIcon = resolveBrandIcon(appId, icon);
  const imageSource = icon && isImageIcon(icon) ? icon : brandIcon;

  if (imageSource && !imageFailed) {
    return (
      <span className="app-icon app-icon--image-wrap" aria-label={`${title} icon`}>
        <img
          className="app-icon__image"
          src={imageSource}
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
