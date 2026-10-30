# Private audio streaming — production

SYSTEMCHECKMATE serves its music catalogue through a same-origin streaming endpoint.

## Current production status

- [x] 19 MP3 tracks stored in private Vercel Blob storage.
- [x] Public music players use the site's own `/api/stream?track=<slug>` endpoint.
- [x] The endpoint uses a fixed allowlist of track slugs.
- [x] GET, HEAD and byte-range requests are supported for playback and seeking.
- [x] Storage credentials are kept in server-side environment variables.
- [x] The 19 public MP3 files have been removed from the current GitHub `main` tree.
- [x] The production site has been tested, including playback and seeking.

## Public music page

The canonical music page is:

https://systemcheckmate.studio/music.html

Track links use anchors on that page, for example:

`https://systemcheckmate.studio/music.html#feel-you-near`

The browser requests audio from the same site origin:

`/api/stream?track=feel-you-near`

No private Blob URL or storage credential is sent to the browser.

## Security boundary

The streaming endpoint is intentionally public so visitors can listen without signing in. The private storage origin and credentials remain server-side. This prevents direct access to permanent public storage URLs, but it cannot prevent recording or saving audio that has already been delivered to a browser.

## Maintenance checks

Before changing the audio system, verify:

- A valid track returns HTTP 200 and `Content-Type: audio/mpeg`.
- HEAD returns metadata without an audio body.
- A valid byte-range request returns HTTP 206 with a correct `Content-Range`.
- Unknown track slugs return HTTP 404.
- Missing storage configuration returns HTTP 503 without exposing internal details.
- Playback, seeking, mobile playback, Play All, Shuffle and share links continue to work.

Never place storage tokens in HTML, browser JavaScript, screenshots, chat messages or Git.
