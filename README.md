# Guess Not

Web multiplayer elimination game. The admin plays too, as **happyboy56**.

## Rules
1. Host creates a game room and shares the 5-letter code.
2. Everyone joins, including the admin (auto-joins as `happyboy56`).
3. Each round the admin secretly picks one option. Players then each pick one
   option too — anything is fair game, players can even pick the same option
   as each other.
4. Admin reveals. Anyone whose pick matches the admin's pick is **eliminated**.
   Everyone else survives to the next round. No pick = safe by default.
5. 10 rounds total, options shrinking each round:

   | Round | Theme                     | Options |
   |-------|---------------------------|---------|
   | 1     | Famous Indian Cricketers  | 11      |
   | 2     | Planets                   | 10      |
   | 3     | Famous Countries          | 9       |
   | 4     | Continents                | 8       |
   | 5     | Famous Telugu Heroes      | 7       |
   | 6     | Oceans                    | 6       |
   | 7     | Directions                | 5       |
   | 8     | States of Matter          | 4       |
   | 9     | Head or Tail              | 3       |
   | 10    | Final Round               | 2       |

   Every round's option list is editable on the admin screen right before you
   launch it, in case you'd rather swap in your own items for a theme.
6. Eliminated players stay in the room as spectators for the rest of the game
   (their screen shows the options greyed out with a "you're eliminated"
   message). Whoever is still standing after round 10 wins — ties are fine,
   there can be multiple winners.

## Files
- `index.html` / `app.js` — the page players (and the admin, conceptually)
  open on their phones
- `admin.html` / `admin.js` — separate host console; auto-joins the host into
  the player list as `happyboy56` and lets them tap their own hidden pick
  each round before launching it
- `game-core.js` — shared constants: the 10-round theme/option schedule, DB
  path helpers
- `style.css` — shared styling
- `firebase-config.js` — your Firebase project keys (fill in)

## Setup (5 minutes)
1. Create a free Firebase project at https://console.firebase.google.com
2. Enable **Realtime Database** (test mode is fine to start).
3. Project Settings → General → Your apps → add a Web app → copy the config
   object into `firebase-config.js`.
4. Open `admin.js` and change `ADMIN_PASSCODE` from `"changeme"` to something
   only you know. The `ADMIN_DISPLAY_NAME` (`happyboy56`) lives in
   `game-core.js` if you ever want to change it.
5. Host all files together (Firebase Hosting, GitHub Pages, Netlify, or a
   local `python3 -m http.server`) — they need to be served over http(s),
   not opened as `file://`.
6. You open `admin.html`, create the room, and share the code. Everyone else
   opens `index.html` and joins with that code.

## Host flow each round
1. Review/edit the option list for the round's theme.
2. Tap your own hidden pick from the grid (this is what players are trying
   to avoid — it stays hidden from them until you reveal).
3. **Launch Round** — players can now pick.
4. Watch the live "who's picked" table.
5. **Reveal & Eliminate Matches** — anyone who matched you is marked
   eliminated immediately, for everyone in real time.
6. **Next Round**, or **End Game** after round 10 for final standings.

## Known limitation
Your hidden pick is written to the same Firebase Realtime Database node as
everything else — it's only *UI-hidden* on the player screen until you hit
Reveal, not blocked at the database level. A player who opens dev tools and
inspects the live connection could technically peek early. Fine for a casual
game night; if you want it airtight, that means moving the pick into a
Cloud Function or adding Firebase Auth + security rules that block reads on
`adminPick` for non-admin users. Happy to build that hardened version if you
want it.
