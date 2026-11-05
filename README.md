# Leighton's Princess Adventure

A gentle, pixel-art side-scrolling platformer made for a 4-year-old. No losing, no reading required,
no internet needed. Every picture and sound is made in code.

## What you need

- [Node.js](https://nodejs.org/) 20 or newer (this was set up with Node 24).

## Run it

Open a terminal (PowerShell, Command Prompt, or Git Bash) in this folder:

```sh
npm install        # first time only: downloads Phaser, Vite, TypeScript into node_modules
npm run dev        # starts the game at http://localhost:5173
```

Open http://localhost:5173 in your browser. Press `Ctrl+C` in the terminal to stop.

### Play on a tablet on your home Wi-Fi

```sh
npm run dev:host   # same as `vite --host`: lets other devices on your network connect
```

Vite prints a `Network:` address such as `http://192.168.1.23:5173/`. Type that into the tablet's
browser (the tablet must be on the same Wi-Fi). If it won't load, allow Node.js through the
Windows Firewall for **Private** networks.

## Build it

```sh
npm run build      # type-checks, then writes the finished game to dist/
npm run preview    # serves dist/ so you can check the built version (also reachable from the tablet)
```

The `dist/` folder is the whole game: plain HTML + JavaScript, no server code needed.

## Controls

| Action | Keyboard | Game controller | Touch |
| --- | --- | --- | --- |
| Move | Left/Right arrows, A/D | D-pad or left stick | Pink arrow buttons (bottom-left) |
| Jump | Space, Up, W | A (or d-pad up) | Big blue up-arrow button (bottom-right) |
| Sparkle wand | X, Enter | B or X | Purple star button (bottom-right) |
| Pause | Esc, P | Start | Pause button (top-right) |

Touch buttons appear the first time the screen is touched. Add `?touch` to the address
(`http://localhost:5173/?touch`) to show them on a computer and click them with the mouse.

The small square icon in the top-right corner switches fullscreen on and off.

## Parent settings (hidden)

On the title screen, **press and hold the small crown in the top-left corner for 5 seconds**.
A grown-ups-only panel opens (it has words, because it's for you). Every switch saves right away.

| Setting | What it does |
| --- | --- |
| Helper mode | Double jump on, every obstacle moves at half speed, puzzle hints show after 5 s instead of 10 s. |
| Auto-run | Leighton walks forward on her own; your child only has to jump and use the wand. She stops by herself at puzzles. |
| Spoken hints | The game says short hints out loud, using only the voices already on the device. |
| Reduce flashing | Softer, fewer sparkles; gentler glows and blinks; fewer fireworks at the end. |
| Unlock all lands | Opens every land on the map (jewels already found are kept). |
| Clear progress | Asks for confirmation (full crown then empty crown, yes or no), then starts over. Settings are kept. |

## Play offline / add it to the iPad home screen

The built game is a **PWA** (an installable web app). On the first visit, a small "service worker"
(`sw.js`, written by `vite.config.ts` during `npm run build`) saves every file of the game in the browser.
After that it works with **no internet at all**, which is perfect for car trips.

On the iPad (Safari): open the game's web address, tap **Share**, then **Add to Home Screen**.
The crown icon opens it fullscreen, in landscape, like a normal app. Open it once while online
after each update so it can save the new version.

Offline mode only runs in the built game (`npm run build` + `npm run preview`, or the deployed site),
never in `npm run dev`, so it can't get in the way while you edit.

To redraw the crown icons after changing `scripts/make-icons.mjs`: `npm run icons`.

## Deploy to Vercel from GitHub (free)

1. **Put the project on GitHub.** In this folder:
   ```sh
   git init
   git add .
   git commit -m "Leighton's Princess Adventure"
   ```
   Create an empty repository on github.com (New repository; no README; Private is fine), then copy the two
   commands it shows under "push an existing repository", which look like:
   ```sh
   git remote add origin https://github.com/YOUR-NAME/leightons-princess-adventure.git
   git push -u origin main
   ```
   (`node_modules` and `dist` are left out on purpose by `.gitignore`; Vercel builds them itself.)
2. **Import it in Vercel.** Sign in at vercel.com with your GitHub account, click **Add New... > Project**,
   pick the repository, and click **Deploy**. You don't need to change any settings: `vercel.json`
   already tells Vercel to run `npm run build` and publish the `dist` folder.
3. **Done.** Vercel gives you an address like `https://leightons-princess-adventure.vercel.app`.
   Open it on the iPad and Add to Home Screen (see above).
4. **Updating:** commit and `git push`. Vercel rebuilds automatically; the game picks up the new version
   the next time it's opened with internet (close and reopen it once if it still shows the old one).

`vercel.json` also makes sure `sw.js` is never stale (so updates arrive), and that the game's files can be
cached for a long time (they get new names whenever they change).

## Privacy

**No data leaves the device.** The game makes no network requests of its own: no analytics, no ads,
no accounts, no external fonts, images, or links. Progress (which jewels are found, which lands are open)
and parent settings are saved **only in this browser** on this device (`localStorage`). Spoken hints use
only voices built into the device. Clearing the browser's website data, or "Clear progress" in the parent
settings, erases it. The only thing ever downloaded is the game itself, from wherever you host it.

## For the developer

- Rules and file layout: see `CLAUDE.md`.
- Open any level directly: `http://localhost:5173/?level=5` (0 = playground, 90 = toolkit test level).
- **Debug overlay** (only in `npm run dev`, never in the built game): press the **`** key (left of 1) in a
  level to show the last safe spot (green flag), checkpoints (blue lines), physics boxes, and red bonk
  counts per spot for this session. In the browser console, `__bonks()` lists every bonk spot.
