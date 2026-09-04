# MOIL Reserve Map

Map-first MVP for MOIL Limited: predicted manganese reserves, production shortfall risk, and corrective actions on a satellite map of the Central Indian belt.

## Run

```bash
npm install
npm run dev
```

Open the printed local URL. No API keys.

## Sixty-second demo

1. The map opens on the Nagpur–Bhandara–Balaghat mines. MOIL is in the search bar.
2. Search **Balaghat Mine**. The camera flies in. Predicted tonnes, confidence, and a 12-month production sparkline appear in the place panel.
3. Turn on **Rainfall** in the layer tray. Scrub the time slider to **Jul 2026**.
4. Search **Dongri Buzurg**. Opencast haul-road rain plus blast delay should read as a shortfall, with ordered steps (slip the blast, shift feed to an underground sister mine, redeploy dumpers).
5. Search **Sitapatore** or **Pani Block** to see a booked-vs-predicted gap and an exploration ranking.

## What is modelled

Client-side formulas, not a live satellite feed. Demo geology, production, equipment, and climate series live in `src/data/`. Scoring is in `src/models/` and is listed under **How this is scored** on each site.
