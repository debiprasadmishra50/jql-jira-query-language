/**
 * Waits for the specified number of seconds.
 *
 * @param secs - The number of seconds to wait.
 * @returns A promise that resolves with `true` after the specified number of seconds.
 */
export function wait(secs: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(true);
    }, secs * 1000);
  });
}
