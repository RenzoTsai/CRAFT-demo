// The same logical display size used by the CRAFT application.
export const DISPLAY = Object.freeze({ width: 1508, height: 825 });
export function fitDisplay(width, height) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return { scale: 0, left: 0, top: 0 };
  const scale = Math.min(width / DISPLAY.width, height / DISPLAY.height);
  return {
    scale,
    left: (width - DISPLAY.width * scale) / 2,
    top: (height - DISPLAY.height * scale) / 2,
  };
}
