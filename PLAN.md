# Fire Finder — Plan
_Updated 2026-03-29 | Personal project | Priorities: Code quality → Ship features_

## Key Architecture Notes
- `typeKey: '$type'` in Mongoose schemas — required, do not remove
- `adminAuth` middleware: dual-path (x-admin-key header for GH Actions, session cookie for browser)
- Map interaction lives exclusively in `useMap.js` — components must not call mapbox-gl directly
- Server-side cache (`cache.js`) sits in front of all external API calls
- Activity log uses a MongoDB capped collection (50 docs max) via `server/utils/logger.js`
- Hotspot squares computed client-side in `pointToSquare()` using scan/track km from NASA — not stored

---

## Task Queue

### 🔴 Tier 1 — Bug Fixes
- [x] **cache.js** — `delete()` regex support added
- [x] **fire.js / perimeter.js** — `createError` without `throw` fixed
- [x] **HelpPage.vue** — prototype scaffold removed, real help content added

### 🟠 Tier 2 — In Flight
- [x] **NASA Hotspot System** — fetching, storing, rendering. Heatmap at low zoom, axis-aligned pixel squares at high zoom using scan/track math.
- [x] **Activity log** — capped MongoDB collection, admin panel collapsible log with per-entry expand
- [x] **IR reset button** — deletes all hotspots, re-fetches 7 days from NASA
- [x] **Hotspot cron** — added to GitHub Actions, runs every 6 hours alongside fires/perimeters

### 🟡 Tier 3 — Next Features
- [ ] **Connect Fire Feed → Map click** — Emit event from FireFeed, `flyTo()` in FireMap. useFireData already shared between both components.
- [ ] **Fix perimeter validation & indexing** — Audit `Perimeter.js` for missing `typeKey: '$type'` (cf. FirePoint.js). Check 2dsphere index integrity.

### 🟢 Tier 4 — Lower Priority
- [ ] **MapBox token** — Restrict by URL in Mapbox dashboard if still exposed via `runtimeConfig.public`
- [ ] **KeepAlive RAM** — Profile map component memory after Hotspots are rendering (highest pressure point)
- [ ] **Location Services / Home Location** — `homeLocation` already stubbed in User model
- [ ] **Fire History System** — Needs design pass on retention, schema, and queries before coding
- [ ] **User Observation System** — Leave until core data experience is solid
- [ ] **Educational Documentation** — Write last, when features stabilize

---

## Done (summary)
Core infra, auth (Google OAuth), fire point/perimeter systems, map rendering, feed, cron scheduler (fires + perimeters + hotspots), admin middleware, hotspot system end-to-end, activity log, IR reset, N+1 fix in fire renewal, null-safe Mapbox paint expressions, HelpPage content (NIFC + NASA sources).
