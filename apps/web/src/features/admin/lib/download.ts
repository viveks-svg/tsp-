/** Downloads a CSV from an admin export endpoint (the session cookie authenticates it). */
export async function downloadCsv(path: string, filename: string) {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
