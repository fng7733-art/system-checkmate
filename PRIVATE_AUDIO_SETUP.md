# Private audio streaming — setup and rollout

This branch adds a server-side streaming endpoint for moving the music catalogue away from public MP3 URLs. The public Music page is intentionally unchanged until the private files are uploaded and tested.

## Current status

- [x] Isolated branch: `security/private-audio-streaming`
- [x] Add `api/stream.js` with a fixed 19-track allowlist.
- [x] Forward HTTP byte-range requests for seeking.
- [x] Create private Vercel Blob store: `systemcheckmate-private-audio` (region ARN1 / Stockholm).
- [x] Connect the store to the Vercel project.
- [x] Add `BLOB_READ_WRITE_TOKEN` as an encrypted Vercel environment variable (never expose it).
- [x] Add `BLOB_STORE_ID` for Preview deployments on this branch only.
- [ ] Upload the 19 MP3 files to the private store under `music/audio/<filename>`.
- [ ] Verify GET, HEAD, Range (206), seeking, mobile playback and visualiser.
- [ ] Update the Music page audio sources and structured-data audio URLs to same-origin `/api/stream?track=<slug>`.
- [ ] Confirm all 19 players, Play All, Shuffle, share links and analytics still work.
- [ ] Review preview deployment before any production release.

## Upload destination

In the Vercel dashboard, open Storage → Blob → `systemcheckmate-private-audio` → Objects and upload the MP3 files using the exact object paths below. Keep the `music/audio/` prefix and exact filenames. Do not upload the ZIP as a single object, and do not put the MP3s back in the public GitHub repository.

```text
music/audio/im-echo.mp3
music/audio/im-ghost.mp3
music/audio/let-it-be-real.mp3
music/audio/neural-boot-sequence.mp3
music/audio/system-surge.mp3
music/audio/system-awakening.mp3
music/audio/invisible-threads.mp3
music/audio/run-the-silence.mp3
music/audio/awake-to-flight.mp3
music/audio/system-quietude.mp3
music/audio/0-1.mp3
music/audio/summer-rain.mp3
music/audio/free-together.mp3
music/audio/im-stepping-out.mp3
music/audio/loose-my-way.mp3
music/audio/my-memories.mp3
music/audio/dont-take-it-away.mp3
music/audio/can-anybody-hear-me.mp3
music/audio/feel-you-near.mp3
```

If the dashboard uploader does not let you specify the full object path or preserve the folder structure, stop and tell me what options it shows. Do not guess at paths.

## Preview test address

The isolated preview deployment is:

`https://system-checkmate-qxqraahqj-nikexes-projects.vercel.app`

The invalid-track test has already returned 404 as expected. The first valid-track test returned 503 because that preview deployment was built before the storage environment variables were attached. A new branch deployment is being triggered by this documentation commit so it can pick up the configured preview variables. Once it is READY, test a valid track after upload.

## Required server environment

The function requires these server-side variables:

- `BLOB_STORE_ID` (Preview-only on this branch)
- `BLOB_READ_WRITE_TOKEN` (encrypted, Vercel-managed)

The token must never be placed in HTML, browser JavaScript, screenshots, chat messages, or Git.

## Important: production is untouched

The Music page still uses its existing public MP3 URLs. No production files, music page markup, metadata, or player design have been changed. Do not merge this branch or switch the page to the API until the private store contains all 19 files and the endpoint passes range/seek tests.

## Security boundary

The endpoint exposes only the 19 allowlisted tracks and never returns the private Blob URL or token. It is public by design so visitors can listen without signing in. This removes easy permanent public storage URLs; it cannot prevent recording or saving audio delivered to a browser.

## Required tests before switching the Music page

- `GET /api/stream?track=im-echo` returns 200 and `Content-Type: audio/mpeg`.
- `HEAD /api/stream?track=im-echo` returns metadata without a body.
- `GET /api/stream?track=im-echo` with `Range: bytes=0-1023` returns 206 and a correct `Content-Range`.
- Invalid track slugs return 404.
- Missing storage configuration returns 503 without exposing internal details.
- Test seeking, playback, mobile playback, visualiser, Play All, Shuffle and share links.

If the private Blob origin does not support byte ranges through authenticated requests, do not switch the Music page yet. Investigate a range-capable private origin/proxy first.

## Cost and deployment caution

The project is currently on Vercel Hobby. Check current plan terms, storage and transfer usage before commercial release or broad promotion. No production deployment or Music page migration is included in this stage.
