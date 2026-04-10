# T-HUNT 2026

A modern, real-time Campus Treasure Hunt web application built with **React** and **InsForge** (PostgreSQL + PostgREST).

## 🚀 Features

- **Team-Based Authentication**: Secure login system locked to 15 pre-registered teams with unique 4-digit PINs.
- **Dynamic Check-Ins**: Players manually enter 4-digit node PINs (found on physical QR posters) to advance.
- **Strict Routing**: 15 completely randomized, non-overlapping routes to prevent teams from following each other.
- **Photographic Proof**: Teams must submit a group selfie verifying their arrival at each node before the puzzle decrypts.
- **The Split-Team Twist**: Intercepts players after the 4th stop, forcing a meetup at the Base/Auditorium where their final teammate solves a physical puzzle to unlock the rest of the map.
- **Live Admin Dashboard**: Real-time (`insforge` backed) monitoring of all 15 teams showing exact percentages, current nodes, and uploaded photo proofs. Includes manual overrides and state resets.

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite)
- **Styling**: Vanilla CSS with a Cyberpunk/Hacker Terminal aesthetic
- **Backend / Database**: InsForge (PostgreSQL Backend-as-a-Service)
- **Storage**: InsForge Storage Buckets (for photo proofs)

---

## 📋 Database Architecture (InsForge)

### Tables

| Table | Description |
|---|---|
| `th_teams` | Team login records: `id` (int PK), `pin` (text), `route` (jsonb array of location IDs) |
| `th_locations` | Static location data: `id` (text PK), `clue` (text) |
| `team_progress` | Live game state: `team_id`, `current_location`, `next_location`, `last_scanned_at`, `started_at`, `finished_at` |

### RLS Policies

All three tables use Row Level Security with two policies:
- `project_admin_policy` → Full access for `project_admin` role
- `anon_read_*` / `anon_all_progress` → Full access for `anon` role (public app)

---

## 🗃️ Database Seed Code

Run these SQL statements against your InsForge backend (via the `run-raw-sql` MCP tool or the PostgREST admin panel) to fully re-seed the database from scratch.

### Step 1 — Create Tables

```sql
-- Teams table
CREATE TABLE IF NOT EXISTS th_teams (
  id   INTEGER PRIMARY KEY,
  pin  TEXT NOT NULL,
  route JSONB NOT NULL
);

-- Locations table
CREATE TABLE IF NOT EXISTS th_locations (
  id   TEXT PRIMARY KEY,
  clue TEXT NOT NULL
);

-- Team progress table
CREATE TABLE IF NOT EXISTS team_progress (
  team_id          INTEGER PRIMARY KEY,
  current_location TEXT,
  next_location    TEXT,
  last_scanned_at  TIMESTAMPTZ DEFAULT now(),
  started_at       TIMESTAMPTZ,
  finished_at      TIMESTAMPTZ
);
```

### Step 2 — Enable RLS & Add Policies

```sql
-- th_teams
ALTER TABLE th_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_admin_policy ON th_teams FOR ALL TO project_admin USING (true) WITH CHECK (true);
CREATE POLICY anon_read_teams      ON th_teams FOR ALL TO anon           USING (true) WITH CHECK (true);

-- th_locations
ALTER TABLE th_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_admin_policy  ON th_locations FOR ALL TO project_admin USING (true) WITH CHECK (true);
CREATE POLICY anon_read_locations   ON th_locations FOR ALL TO anon           USING (true) WITH CHECK (true);

-- team_progress
ALTER TABLE team_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_admin_policy ON team_progress FOR ALL TO project_admin USING (true) WITH CHECK (true);
CREATE POLICY anon_all_progress    ON team_progress FOR ALL TO anon           USING (true) WITH CHECK (true);
```

### Step 3 — Seed Locations (9 nodes)

```sql
INSERT INTO th_locations (id, clue) VALUES
  ('amphitheatre', 'Open skies above, tiered seats below. I am the stage where ideas perform and voices carry far. Find me where the academic block breathes. Your code word is at the entrance.'),
  ('bigscreen',    'I greet every student who walks through the gate. A giant display you cannot miss — I''ve seen every face that ever joined this college. Your code word is at the entrance.'),
  ('bsn3rd',       'Climb up — three floors up in BSN. I am placed right outside a cabin. Come find what''s waiting. Your code word is on the notice board.'),
  ('datacentre',   'The brain of the campus hums here. Racks of servers, blinking lights, cool air. Where all the data lives. Your code word is at the entrance.'),
  ('foodcourt',    'Follow your nose to the lab block. Where hungry minds refuel between builds and bugs. I smell better than your deadline. Your code word is at the entrance.'),
  ('kuteera',      'Sunlight through leaves, the smell of food in open air. Not a cafeteria, not a classroom — somewhere the campus exhales. Find the green corner where students go to breathe between battles. Your code word is on the notice board.'),
  ('library',      'Thousands of voices, yet perfectly silent. Rows of knowledge line my walls. Scholars come to me when Google isn''t enough. Your code word is at the entrance.'),
  ('room506',      'I am a room with a number on my door — five hundred and six. In the lab block I wait, with chairs in rows and a board at the front. Come find me if you can count. Your code word is on the board inside.'),
  ('welding',      'You were looking for music, but creativity takes many forms. The room next door shapes metal, not melody. Look for sparks, not strings. Your code word is at the entrance.')
ON CONFLICT (id) DO UPDATE SET clue = EXCLUDED.clue;
```

### Step 4 — Seed Teams (15 teams with unique routes)

```sql
INSERT INTO th_teams (id, pin, route) VALUES
  (1,  '1423', '["room506","amphitheatre","library","foodcourt","datacentre","bsn3rd","welding","bigscreen","kuteera"]'),
  (2,  '2847', '["welding","room506","kuteera","bsn3rd","datacentre","amphitheatre","library","bigscreen","foodcourt"]'),
  (3,  '3291', '["amphitheatre","welding","kuteera","bsn3rd","datacentre","library","foodcourt","bigscreen","room506"]'),
  (4,  '4756', '["bigscreen","room506","amphitheatre","library","datacentre","welding","foodcourt","kuteera","bsn3rd"]'),
  (5,  '5138', '["kuteera","welding","library","foodcourt","datacentre","bsn3rd","room506","amphitheatre","bigscreen"]'),
  (6,  '6472', '["kuteera","room506","welding","amphitheatre","datacentre","bigscreen","foodcourt","library","bsn3rd"]'),
  (7,  '7315', '["bsn3rd","bigscreen","welding","foodcourt","datacentre","amphitheatre","kuteera","library","room506"]'),
  (8,  '8694', '["bigscreen","room506","bsn3rd","kuteera","datacentre","library","amphitheatre","welding","foodcourt"]'),
  (9,  '9027', '["room506","amphitheatre","library","welding","datacentre","foodcourt","bigscreen","bsn3rd","kuteera"]'),
  (10, '1056', '["bigscreen","welding","library","bsn3rd","datacentre","kuteera","amphitheatre","room506","foodcourt"]'),
  (11, '2183', '["amphitheatre","bsn3rd","kuteera","welding","datacentre","library","bigscreen","foodcourt","room506"]'),
  (12, '3749', '["bigscreen","welding","foodcourt","kuteera","datacentre","amphitheatre","library","room506","bsn3rd"]'),
  (13, '4862', '["welding","amphitheatre","library","kuteera","datacentre","foodcourt","room506","bsn3rd","bigscreen"]'),
  (14, '5391', '["bigscreen","kuteera","amphitheatre","library","datacentre","room506","foodcourt","welding","bsn3rd"]'),
  (15, '6274', '["amphitheatre","bigscreen","welding","bsn3rd","datacentre","kuteera","foodcourt","library","room506"]')
ON CONFLICT (id) DO UPDATE SET pin = EXCLUDED.pin, route = EXCLUDED.route;
```

### Step 5 — (Optional) Reset All Team Progress

```sql
-- Wipe all progress rows to start the game fresh
DELETE FROM team_progress;
```

---

## 📖 Game Rules & Setup

### QR Code Map (for Organizer)

Place **9 physical QR codes** around the campus. Each QR code should encode a **plain-text 4-digit number**.

| QR Code PIN | Location ID | Physical Location |
|---|---|---|
| `8143` | `room506` | Room 506 (Lab Block) |
| `3927` | `amphitheatre` | Amphitheatre |
| `6519` | `library` | Library |
| `2084` | `foodcourt` | Food Court |
| `9751` | `welding` | Welding Room |
| `4638` | `bigscreen` | Big Screen (Main Gate) |
| `1295` | `kuteera` | Kuteera |
| `7462` | `bsn3rd` | BSN 3rd Floor (Cabin) |
| `5820` | `datacentre` | **Data Centre** |

### Team Login Credentials

| Team # | PIN |
|---|---|
| 1 | `1423` |
| 2 | `2847` |
| 3 | `3291` |
| 4 | `4756` |
| 5 | `5138` |
| 6 | `6472` |
| 7 | `7315` |
| 8 | `8694` |
| 9 | `9027` |
| 10 | `1056` |
| 11 | `2183` |
| 12 | `3749` |
| 13 | `4862` |
| 14 | `5391` |
| 15 | `6274` |

> **Data Centre stop**: Every single team passes through `datacentre` as their **5th stop** — the midpoint "reunion" location after the Split-Team Twist.

### For Players

1. **Split up**: 3 runners hunt locations, 1 stays at Base.
2. **Scan**: Scan the physical QR code with your native phone camera to reveal a 4-digit PIN.
3. **Enter & Verify**: Type the PIN into the web app to verify your location.
4. **Selfie**: Upload a photo proving your team is there to decrypt the clue.
5. **Reunion**: After the 4th stop, the runners return to Base. The 4th teammate's physical puzzle reveals the 5th location.

---

## 💻 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   ```
3. **Admin Dashboard Access:**
   Navigate to `/admin` in your browser. The Master Key is `admin2026`.

---

## ⚙️ Session Recovery Mechanism

If a player accidentally closes their browser tab or refreshes the page mid-game, `App.jsx` intercepts the load, queries their `team_id` against the `team_progress` table, and securely restores their exact `current_location` state without losing progress!

---

## 🔑 Key Design Notes

- All 15 teams visit the **same 9 locations** but in **completely different orders** — eliminating copy-following.
- **`datacentre` is always stop #5** for every team — this is the "Split-Team Twist" reunion checkpoint.
- The first 4 stops are handled by the 3 runners; stop 5 onwards is unlocked by the stay-at-Base teammate solving a physical puzzle.
- The app uses **safe `.update()` upserts** on `team_progress` to avoid 409 conflicts from repeated scans.
