# Vault-Tec Overseer Terminal // Fallout DM Toolkit

A Pip-Boy themed single-page web app that gives a Fallout-RPG Dungeon Master
everything they need to run a session at the table.

## How to use

Open `index.html` in any modern browser. No build step, no dependencies, no
network calls. Notes and character state are stored in `localStorage`.

## Modules

1. **Dice** — d4/d6/d8/d10/d12/d20/d100 with modifiers, custom XdY+Z formula
   parser, and a S.P.E.C.I.A.L. attribute check roller (with advantage and
   crit detection).
2. **V.A.T.S. Initiative Tracker** — Add combatants, sort by initiative,
   step through turns, track HP and DR, set status conditions, mark dead.
3. **NPC Generator** — Names, stats, traits, jobs, goals for Wastelanders,
   Raiders, Brotherhood, Enclave, NCR, Legion, Institute, Ghouls,
   Super Mutants, Vault Dwellers and Caravan Traders.
4. **Loot Generator** — 11 container types (Raider Corpse, Ammo Box, Safe,
   Vault Storage, etc.) across 4 rarity tiers.
5. **Encounter Generator** — Creatures, events, weather, time of day and
   surprise rolls per region and threat level.
6. **Settlement & POI Generator** — Procedural town names, leaders,
   features, problems; plus standalone Points-of-Interest with hooks.
7. **Quest Hook Generator** — Hooks across 7 tones with twists and rewards.
8. **Status Tracker** — HP/AP/Rad/Caps bars and condition list per
   character, persisted locally.
9. **Logbook** — Session notes with timestamps, export to `.txt`.
10. **Hero Prompts** — Random AI-image prompt generator plus 12 curated
    ready-to-use Fallout hero portrait and banner prompts.

## Keyboard shortcuts

Press `1`-`9` or `0` (outside of input fields) to switch between modules.

## Aesthetic

Pip-Boy CRT terminal: phosphor green text, scanlines, flicker, VT323 typeface.
