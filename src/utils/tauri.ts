/**
 * Tauri API utility — gracefully handles running outside Tauri (e.g. in vite dev).
 *
 * IMPORTANT: startWindowDrag() MUST be synchronous (no async/await).
 * Tauri v2 requires startDragging() to be called synchronously from the
 * mousedown event handler, before the JS event loop yields.
 */

import { getCurrentWindow, type Window } from '@tauri-apps/api/window';
import { PhysicalSize, PhysicalPosition } from '@tauri-apps/api/window';

// Cache the window instance so we don't import/getCurrentWindow on every call.
let cachedWindow: Window | null = null;

/**
 * Check if we're running inside a Tauri window (not plain browser).
 * In browser/Vite dev mode, @tauri-apps/api methods will just throw gracefully.
 */
function getWin(): Window | null {
  if (cachedWindow) return cachedWindow;
  try {
    cachedWindow = getCurrentWindow();
    return cachedWindow;
  } catch {
    return null;
  }
}

/**
 * Start native OS window dragging from a mousedown event.
 * MUST be called synchronously from a mousedown handler — no async/await.
 * Tauri v2 captures the drag state from the synchronous call; the returned
 * promise must be fired but NOT awaited within the handler.
 */
export function startWindowDrag() {
  const win = getWin();
  if (win) {
    try {
      // startDragging() returns a Promise<void> — we must fire it but NOT await
      // it inside the mousedown handler. Tauri needs the call to happen before
      // the handler returns to capture mouse state.
      (win as any).startDragging();
    } catch {
      // Non-Tauri environment
    }
  }
}

/**
 * Resize the Tauri window to the given dimensions.
 */
export async function setWindowSize(width: number, height: number) {
  try {
    const win = getCurrentWindow();
    await win.setSize(new PhysicalSize(width, height));
  } catch {}
}

/**
 * Move the Tauri window to an absolute screen position.
 */
export async function setWindowPosition(x: number, y: number) {
  try {
    const win = getCurrentWindow();
    await win.setPosition(new PhysicalPosition(x, y));
  } catch {}
}

/**
 * Get the current Tauri window's screen position.
 */
export async function getWindowPosition(): Promise<{ x: number; y: number } | null> {
  try {
    const win = getCurrentWindow();
    const pos = await win.outerPosition();
    return { x: pos.x, y: pos.y };
  } catch {}
  return null;
}

/**
 * Get the cached Tauri window instance (sync, for use in non-async contexts).
 * Returns null outside Tauri context.
 */
export function getTauriWindow(): Window | null {
  return getWin();
}
