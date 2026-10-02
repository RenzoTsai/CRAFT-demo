import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

const buttons = [
  { key: "ArrowUp", position: "top", label: "Top button", Icon: ArrowUp },
  { key: "ArrowLeft", position: "left", label: "Left button", Icon: ArrowLeft },
  { key: "ArrowDown", position: "bottom", label: "Bottom button", Icon: ArrowDown },
  { key: "ArrowRight", position: "right", label: "Right button", Icon: ArrowRight },
];

export default function RingMouse({ suggestedKey, pressedKey, busy, onDirection }) {
  return (
    <div className="ring-mouse" role="group" aria-label="Ring mouse directional buttons">
      <span className="ring-label">RING MOUSE</span>
      <div className="ring-face">
        <span className="ring-trackpad" aria-hidden="true" />
        {buttons.map(({ key, position, label, Icon }) => (
          <button
            key={key}
            className={`ring-key ring-${position}${suggestedKey === key && !busy ? " is-suggested" : ""}${pressedKey === key ? " is-pressed" : ""}`}
            aria-label={`${label} (${key.replace("Arrow", "")} arrow)`}
            aria-keyshortcuts={key}
            title={`${label} · ${key.replace("Arrow", "")} arrow${suggestedKey === key && !busy ? " · Next action" : ""}`}
            disabled={busy}
            onClick={() => onDirection(key)}
          >
            <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
