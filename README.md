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

## 📋 Database Architecture (InsForge)

This application relies on a backend InsForge database. The primary tables include:

1. **`th_teams`**: Stores team configuration (`id`, `pin`, `route` JSON array).
2. **`th_locations`**: Stores the static clues and data for each location (`id`, `clue`).
3. **`team_progress`**: A dynamic table storing the current state of every team (`team_id`, `current_location`, `next_location`, `last_scanned_at`).
4. **`Storage Bucket`**: An InsForge storage bucket (`photo-proofs`) configured to accept public uploads for team selfies.

*Note: The application uses safe `.update()` queries against `team_progress` to bypass strict Row Level Security (RLS) delete-limitations while preventing 409 Conflicts.*

## 📖 Game Rules & Setup

### For the Organizer (QR Codes)
You must place 9 physical QR codes around the campus at the designated locations.
- **Type of QR Code**: Plain Text (TXT)
- **Content**: A 4-digit number.
- **Node List**:
  - `1506` -> Room 506
  - `2202` -> Amphitheatre
  - `3303` -> Library
  - `4404` -> Food Court
  - `5505` -> Welding
  - `6606` -> Big Screen
  - `7707` -> Kuteera
  - `8808` -> BSN 3rd Floor (Cabin)
  - `9909` -> Datacentre

### For the Players
1. **Split up**: 3 runners hunt locations, 1 stays at Base.
2. **Scan**: Scan the physical QR code with your native phone camera to reveal a 4-digit PIN.
3. **Enter & Verify**: Type the PIN into the web app to verify your location.
4. **Selfie**: Upload a photo proving your team is there to decrypt the clue.
5. **Reunion**: After the 4th stop, the runners return to Base. The 4th teammate's physical puzzle reveals the 5th location.

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

## ⚙️ Session Recovery Mechanism
If a player accidentally closes their browser tab or refreshes the page mid-game, `App.jsx` intercepts the load, queries their `team_id` against the `team_progress` table, and securely restores their exact `current_location` state without losing progress!
