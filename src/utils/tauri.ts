/**
 * Tauri API utility — gracefully handles running outside Tauri (e.g. in vite dev).
 */
let tauriWindow: any = null;

export async function getTauriWindow() {
  if (tauriWindow) return tauriWindow;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    tauriWindow = getCurrentWindow();
    return tauriWindow;
  } catch {
    return null;
  }
}

/**
 * Start native OS window dragging from a mousedown event.
 * Must be called synchronously from a mousedown handler.
 */
export async function startWindowDrag() {
  try {
    const win = await getTauriWindow();
    if (win) {
      await win.startDragging();
    }
  } catch {}
}

/**
 * Resize the Tauri window to the given dimensions.
 */
export async function setWindowSize(width: number, height: number) {
  try {
    const win = await getTauriWindow();
    if (win) {
      const { PhysicalSize } = await import('@tauri-apps/api/window');
      await win.setSize(new PhysicalSize(width, height));
    }
  } catch {}
}

/**
 * Move the Tauri window to an absolute screen position.
 */
export async function setWindowPosition(x: number, y: number) {
  try {
    const win = await getTauriWindow();
    if (win) {
      const { PhysicalPosition } = await import('@tauri-apps/api/window');
      await win.setPosition(new PhysicalPosition(x, y));
    }
  } catch {}
}

/**
 * Get the current Tauri window's screen position.
 */
export async function getWindowPosition(): Promise<{ x: number; y: number } | null> {
  try {
    const win = await getTauriWindow();
    if (win) {
      const pos = await win.outerPosition();
      return { x: pos.x, y: pos.y };
    }
  } catch {}
  return null;
}
