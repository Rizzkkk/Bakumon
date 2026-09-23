const stamp = () => new Date().toISOString();

export const log = {
  info: (message) => console.log(`${stamp()} ${message}`),
  error: (message, error) => console.error(`${stamp()} ${message}`, error ?? ''),
};
