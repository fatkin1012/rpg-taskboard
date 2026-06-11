/**
 * Debounce utility — delays invoking `fn` until after `ms`ms of inactivity.
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: any[]) => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = setTimeout(() => {
      fn(...args);
      timeout = undefined;
    }, ms);
  };
  return debounced as unknown as T;
}
