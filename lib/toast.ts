type Level = "error" | "success" | "info";
type Listener = (msg: string, level: Level) => void;

let _listener: Listener | null = null;

export const toast = {
  error: (msg: string) => _listener?.(msg, "error"),
  success: (msg: string) => _listener?.(msg, "success"),
  info: (msg: string) => _listener?.(msg, "info"),
  _subscribe(fn: Listener): () => void {
    _listener = fn;
    return () => {
      _listener = null;
    };
  },
};
