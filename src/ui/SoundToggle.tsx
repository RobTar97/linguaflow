import { Volume2, VolumeX } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { Locale } from "../domain/types";
import { workspaceCopy } from "../i18n/workspaceCopy";
import { soundEffects } from "../platform/soundEffects";

export function SoundToggle({ locale }: { locale: Locale }) {
  const enabled = useSyncExternalStore(
    soundEffects.subscribe,
    soundEffects.isEnabled,
    () => true,
  );
  const copy = workspaceCopy[locale];
  const label = enabled ? copy.muteSounds : copy.enableSounds;

  return (
    <button
      className="header-icon-button sound-toggle"
      type="button"
      onClick={() => soundEffects.toggle()}
      aria-label={label}
      aria-pressed={enabled}
      title={label}
    >
      {enabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
    </button>
  );
}
