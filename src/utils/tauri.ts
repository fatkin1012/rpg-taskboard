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

export async function isTauri(): Promise<boolean> {
  try {
    const win = await getTauriWindow();
    return win !== null;
  } catch {
    return false;
  }
}

/** Set window size (Tauri only) */
export async function setWindowSize(width: number, height: number): Promise<void> {
  try {
    const win = await getTauriWindow();
    if (win) {
      await win.setSize({ width, height });
    }
  } catch {
    // Not in Tauri — ignore
  }
}

/** Set window position (Tauri only) */
export async function setWindowPosition(x: number, y: number): Promise<void> {
  try {
    const win = await getTauriWindow();
    if (win) {
      await win.setPosition({ x, y });
    }
  } catch {
    // Not in Tauri — ignore
  }
}

/** Get window position (Tauri only) */
export async function getWindowPosition(): Promise<{ x: number; y: number } | null> {
  try {
    const win = await getTauriWindow();
    if (win) {
      const pos = await win.outerPosition();
      return pos;
    }
  } catch {
    // Not in Tauri — ignore
  }
  return null;
}
