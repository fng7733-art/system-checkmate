# Private audio streaming — setup and rollout

This branch adds the first server-side component for moving the music catalogue away from public MP3 URLs.

## Current status

- [x] Create isolated branch: `security/private-audio-streaming`
- [x] Add `api/stream.js` with a fixed 19-track allowlist.
- [x] Forward HTTP byte-range requests and return upstream range/status headers.
- [x] Keep the public Music page unchanged until private storage is populated and verified.
- [ ] Provision a private Vercel Blob store.
- [ ] Upload all 19 MP3 files to `music/audio/<filename>` in that private store.
- [ ] Connect the store to this Vercel project and confirm server-side environment variables.
- [ ] Test GET, HEAD, Range (206), seeking, mobile playback and visualiser.
- [ ] Update the Music page audio sources and structured-data audio URLs to same-origin `/api/stream?track=<slug>`.
- [ ] Confirm all 19 players, Play All, Shuffle, share links and analytics still work.
- [ ] Review preview deployment before any production release.

## Required server environment

Vercel must provide these server-side variables to the function:

- `BLOB_STORE_ID`
- `BLOB_READ_WRITE_TOKEN`

The token must never be placed in HTML, JavaScript sent to the browser, or Git.

## Important: no production change yet

The Music page intentionally still references the existing public files in this branch. Do not merge this branch or switch the page to the API until the private Blob store has all 19 files and the endpoint has passed range/seek tests. Otherwise playback would fail.

## Security boundary

The endpoint exposes only the 19 allowlisted tracks and never returns the private Blob URL or token. It is deliberately public so visitors can listen without signing in. This prevents easy direct access to the storage URL; it does not prevent recording or downloading audio that a browser is allowed to play.

## Range testing

For a track slug, verify:

- `GET /api/stream?track=im-echo` returns 200 and `Content-Type: audio/mpeg`.
- `HEAD /api/stream?track=im-echo` returns metadata without a body.
- `GET /api/stream?track=im-echo` with `Range: bytes=0-1023` returns 206, `Content-Range`, and exactly the requested bytes.
- Invalid track slugs return 404.
- Missing storage configuration returns 503 without exposing internal details.

If the private Blob origin does not support byte ranges through authenticated requests, do not switch the Music page yet. Investigate a range-capable private origin/proxy first.

## Cost and deployment caution

The project currently uses the Vercel Hobby plan. Provisioning storage, storing audio and serving traffic may have usage or plan implications. Check current account pricing and usage before provisioning or uploading. No storage has been created and no production deployment has been triggered by this branch.
