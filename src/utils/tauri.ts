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
