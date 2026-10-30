/**
 * Private audio streaming endpoint for the static SYSTEMCHECKMATE site.
 *
 * Required Vercel environment variables:
 *   BLOB_STORE_ID
 *   BLOB_READ_WRITE_TOKEN
 *
 * The MP3s must first be uploaded to a PRIVATE Vercel Blob store under
 * the same music/audio/<filename> path. Do not point this endpoint at
 * the public GitHub repository.
 *
 * Public endpoint by design: visitors can listen without signing in.
 * This hides permanent storage URLs; it cannot prevent a visitor from
 * recording or downloading audio delivered to their browser.
 */

const TRACKS = Object.freeze({
  "im-echo": "im-echo.mp3",
  "im-ghost": "im-ghost.mp3",
  "let-it-be-real": "let-it-be-real.mp3",
  "neural-boot-sequence": "neural-boot-sequence.mp3",
  "system-surge": "system-surge.mp3",
  "system-awakening": "system-awakening.mp3",
  "invisible-threads": "invisible-threads.mp3",
  "run-the-silence": "run-the-silence.mp3",
  "awake-to-flight": "awake-to-flight.mp3",
  "system-quietude": "system-quietude.mp3",
  "0-1": "0-1.mp3",
  "summer-rain": "summer-rain.mp3",
  "free-together": "free-together.mp3",
  "im-stepping-out": "im-stepping-out.mp3",
  "loose-my-way": "loose-my-way.mp3",
  "my-memories": "my-memories.mp3",
  "dont-take-it-away": "dont-take-it-away.mp3",
  "can-anybody-hear-me": "can-anybody-hear-me.mp3",
  "feel-you-near": "feel-you-near.mp3",
});

function send(res, status, message) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(message);
}

function blobHostStoreId(value) {
  // Vercel SDK/store metadata may use the "store_" prefix, while the
  // private Blob hostname uses the raw store identifier.
  return value.startsWith("store_") ? value.slice(6) : value;
}

async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return send(res, 405, "Method not allowed");
  }

  const url = new URL(req.url, "https://systemcheckmate.studio");
  const track = url.searchParams.get("track");
  const filename = TRACKS[track];

  if (!filename) return send(res, 404, "Track not found");

  const storeId = process.env.BLOB_STORE_ID;
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!storeId || !token) {
    return send(res, 503, "Private music storage is not configured");
  }

  const pathname = "music/audio/" + filename;
  const upstreamUrl =
    "https://" + blobHostStoreId(storeId) +
    ".private.blob.vercel-storage.com/" +
    pathname.split("/").map(encodeURIComponent).join("/");

  const headers = new Headers({
    Authorization: "Bearer " + token,
  });

  // Forward byte ranges so HTML audio controls can seek without
  // downloading the entire recording.
  for (const name of ["range", "if-range", "if-none-match", "if-modified-since"]) {
    const value = req.headers[name];
    if (value) headers.set(name, value);
  }

  let upstream;
  try {
    upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      redirect: "error",
    });
  } catch (error) {
    console.error("Private audio upstream request failed:", error);
    return send(res, 502, "Audio service temporarily unavailable");
  }

  res.statusCode = upstream.status;

  const allowedResponseHeaders = [
    "accept-ranges",
    "content-length",
    "content-range",
    "etag",
    "last-modified",
  ];
  for (const name of allowedResponseHeaders) {
    const value = upstream.headers.get(name);
    if (value) res.setHeader(name, value);
  }

  res.setHeader("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
  res.setHeader("Content-Disposition", "inline; filename=\"" + filename + "\"");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");

  if (req.method === "HEAD" || !upstream.body) {
    return res.end();
  }

  // Node's serverless response supports piping a Web ReadableStream
  // without buffering the complete audio file in memory.
  try {
    const reader = upstream.body.getReader();
    res.on("close", () => reader.cancel().catch(() => {}));
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!res.write(Buffer.from(value))) {
        await new Promise((resolve) => res.once("drain", resolve));
      }
    }
    res.end();
  } catch (error) {
    console.error("Private audio stream interrupted:", error);
    if (!res.headersSent) return send(res, 502, "Audio stream interrupted");
    res.destroy(error);
  }
}

module.exports = handler;
