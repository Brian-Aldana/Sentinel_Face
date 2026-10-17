export function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

    let decoded = "";
    if (typeof atob === "function") {
      decoded = atob(padded);
    } else {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      let bc = 0, bs = 0;
      for (let idx = 0; idx < padded.length; idx++) {
        const buffer = chars.indexOf(padded.charAt(idx));
        if (buffer === -1 || padded.charAt(idx) === "=") continue;
        bs = bc % 4 ? bs * 64 + buffer : buffer;
        if (bc++ % 4) {
          decoded += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
        }
      }
    }

    const data = JSON.parse(decoded);
    return typeof data.exp === "number" ? Date.now() / 1000 > data.exp : false;
  } catch {
    return true;
  }
}
