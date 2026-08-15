# Nightfall

Pass-and-play Mafia for one phone. Deals the cards, runs the night, keeps the
roll call, and works offline. No backend, no accounts — everything lives in
`localStorage` on the device.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build with service worker
npm run icons    # regenerate PNG app icons from public/icon.svg
```

## Running it on a phone

```bash
npm run mobile       # HTTPS dev server on your LAN, with hot reload
npm run mobile:pwa   # production build — installable, works offline
```

Both print every address the machine can be reached on. Prefer the `.local`
one — it is Bonjour, so it survives your router handing out a new IP:

```
https://your-macbook.local:5173/
```

Accept the certificate warning once (the cert is self-signed). On iOS Safari:
**Show Details → visit this website**. On Android Chrome: **Advanced →
Proceed**.

The cert is minted by `scripts/make-cert.mjs` and covers localhost, the `.local`
hostname, and every non-internal IP the machine currently has. It is reissued
automatically when your LAN address changes. `npm run cert` prints what the
current one covers.

If a phone still refuses the self-signed cert, tunnel instead — this gives a
real, publicly trusted certificate and no warnings at all:

```bash
npm run dev       # terminal 1, plain http on 5173
npm run tunnel    # terminal 2, ngrok
```

Note that a tunnel publishes your dev server to a public URL for as long as it
runs.

**HTTPS is not optional here.** Service workers, the Wake Lock API and
`crypto.randomUUID` are all restricted to secure contexts. `localhost` counts
as one; a LAN address does not — so over plain `http://192.168.…` the app
cannot keep the screen awake, cannot cache itself for offline use, and cannot
be installed to the home screen.

To install it: open the `mobile:pwa` URL, then **Share → Add to Home Screen**
on iOS, or the **Install** prompt on Android. Once installed it opens
fullscreen, locks to portrait, and runs with the network off.

## How a game runs

One person hosts. They sit out, hold the phone, and narrate — they are not
dealt a card, so the playing count is always **selected people − 1**.

1. **Setup** — pick who is here from the saved roster, then pick the host. The
   deal is shown before you commit to it.
2. **Deal** — the phone goes round in order. Each player taps their own name,
   then presses and holds for three seconds to bring their card up out of the
   dark. Releasing early sinks it back, so a glance never resolves into a role.
   Mafia cards name their partners.
3. **Night** — Mafia, then Detective, then Doctor. The host reads each prompt
   aloud and taps what the room pointed at. The Detective's answer fills the
   screen as `MAFIA` / `NOT MAFIA` for the host to signal with a thumb.
4. **Day** — the app shows the living and records the verdict. Voting itself
   stays off-screen; the argument is the game.
5. The app checks for a win after every elimination and ends the game itself.

The screen repaints with the clock: cold ink at night, warmer and lighter at
dawn, and one lit bone surface — the dealt card and the final reveal.

## Rules

Davidoff's original canon: **Mafia, Detective, Doctor, Civilian**. Exactly one
Detective and one Doctor at every size; Mafia scale with the table.

| Playing | Mafia |
| --- | --- |
| 5–6 | 1 |
| 7–9 | 2 |
| 10–13 | 3 |
| 14–17 | 4 |
| 18–20 | 5 |

Everyone else is a Civilian. The Doctor may save themselves **once per game**.
Night 1 has a live kill. Town wins at zero Mafia; Mafia win when they equal or
outnumber everyone else.

Two things are configurable at setup: whether a dead player's role is announced
(default on), and who hosts.

## Recovering from mistakes

The deal cannot be recreated, so the whole store is written to `localStorage`
after every single action — closing the app or locking the phone resumes
exactly where the host left off. The **Adjust** panel (top right, during play)
undoes the last action, kills or revives a player manually, re-shows a card to
someone who missed it, and abandons the game.

## Layout

```
src/
  domain/        pure game logic, no React
    roles.ts         role registry — the seam new roles slot into
    distribution.ts  how many of each role at each table size
    engine.ts        reducer, selectors, win check
    types.ts
  storage/       localStorage read/write
  hooks/         store context, wake lock, hold-to-reveal
  components/    Screen frame, SeatRow, RoleCard, HoldSeal, AdjustSheet
  screens/       one file per phase
```

Adding a role in a later phase means an entry in `ROLES` (alignment, wake
order, whether it can target itself, card text) and a count rule in
`distribution.ts`. The night sequence iterates the registry by `wakeOrder`, so
no new screens are needed for a role that simply picks a target at night.

## Not in this version

- **Device-as-host.** The night is physical: eyes closed, the host watches the
  room. Removing the human host means the app has to collect night actions by
  passing the phone to each role, which is a different night engine.
- Roles beyond the four above, on-device vote tallies, and audio narration.
