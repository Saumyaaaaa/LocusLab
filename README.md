# Locus Lab 🏛️

A free, no-signup browser-based citizen-science experiment investigating whether a 3D memory palace (Method of Loci) produces superior long-term word recall compared to traditional digital flashcards across immediate, 24-hour, and 7-day delays.

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
- Node.js 18+ and npm
- A free [Supabase](https://supabase.com) project

### 2. Installation
```bash
git clone <your-repo-url>
cd LocusLab
npm install
```

### 3. Database Initialization
1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** (`>_`) and open a new query.
3. Paste the entire content of [`supabase/schema.sql`](file:///d:/LocusLab/supabase/schema.sql) and click **Run**.
4. In **Authentication &rarr; Providers &rarr; Anonymous Sign-Ins**, ensure **Anonymous Sign-Ins** are enabled.

### 4. Environment Variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_COHORT=pilot
```

> [!CAUTION]
> Never commit `.env` or `.env.local` to git. The repository `.gitignore` automatically excludes environment files. Never store or share the `service_role` secret key.

### 5. Run Development Server
```bash
npm run dev
```

### 6. Run Automated Tests & Build
```bash
npm test         # Runs Vitest unit tests
npm run build    # Compiles TypeScript and builds production bundle
```

---

## 🏷️ Cohort Flag Usage (`VITE_COHORT`)

Locus Lab tags each participant with a cohort identifier at consent creation:
- `VITE_COHORT=pilot`: Used during pre-launch testing and debugging with friends or colleagues. Allows easy filtering (`WHERE cohort = 'pilot'`) so pilot rows never contaminate primary analyses.
- `VITE_COHORT=main`: Used for official citizen-science data collection.

> [!NOTE]
> Vite bakes `import.meta.env` values into static client code at build time. When changing `VITE_COHORT` in Vercel, trigger a redeployment for the change to take effect.

---

## 🌐 Vercel Free-Tier Deployment Guide

Deploy Locus Lab to Vercel in 5 simple steps without exposing private keys:

1. **Push to Private GitHub Repository**:
   - Verify secrets are ignored before pushing:
     ```powershell
     git log -p | Select-String -Pattern "eyJ"
     ```
     (Must return 0 results).
   - Push code to your private repository:
     ```bash
     git push origin main
     ```
2. **Import into Vercel**:
   - Log in to [vercel.com](https://vercel.com).
   - Click **Add New... &rarr; Project** and select your GitHub repository.
   - Framework Preset will auto-detect as **Vite**.
3. **Configure Environment Variables**:
   - In the **Environment Variables** accordion, add the three keys:
     - `VITE_SUPABASE_URL`: Your Supabase Project URL (`https://xxx.supabase.co`)
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase public `anon` key
     - `VITE_COHORT`: Set to `pilot` initially (switch to `main` for public launch)
4. **Deploy**:
   - Click **Deploy**. Vercel will build the SPA and deploy it globally on the free tier.
5. **Verify SPA Routing & Security Headers**:
   - [`vercel.json`](file:///d:/LocusLab/vercel.json) automatically enforces client-side routing to `index.html`, configures security headers (`nosniff`, `same-origin`, `DENY`), and blocks search indexing on return URLs (`X-Robots-Tag: noindex`).

---

## 🔒 Row Level Security (RLS) Verification Checklist

All data tables (`participants`, `sessions`, `responses`) are guarded with strict Row Level Security. Authenticated anonymous users can access **only** their own records.

### Multi-Tenant Cross-User Isolation Checklist
1. **Profile A (User A)**:
   - Open the app, complete Consent, and copy the 8-character code.
2. **Profile B (User B)**:
   - Open the app in Incognito or a different browser profile.
3. **Client-Side DevTools Console Test (`F12`) in Profile B**:
   - Attempt to read User A's row:
     ```js
     const { data } = await supabase.from('participants').select('*');
     // Profile B sees ONLY Profile B's row. User A is completely invisible.
     ```
   - Attempt to alter User A's record using User A's UUID:
     ```js
     const { data, error } = await supabase
       .from('participants')
       .update({ imagery_score: 1.0 })
       .eq('id', 'USER_A_UUID_HERE');
     // 0 rows updated. Database silently rejects cross-user modification.
     ```
   - Attempt to delete User A's data:
     ```js
     const { error } = await supabase
       .from('participants')
       .delete()
       .eq('id', 'USER_A_UUID_HERE');
     // 0 rows deleted.
     ```
   - Attempt to insert a row masquerading as User A:
     ```js
     const { error } = await supabase
       .from('participants')
       .insert({ id: 'USER_A_UUID_HERE', code: 'SPOOF123' });
     // Blocked with "new row violates row-level security policy for table 'participants'".
     ```

---

## 📊 Data Dictionary

### `participants` Table
- `id` (uuid, PK): Anonymous user UUID (`auth.uid()`).
- `code` (text, Unique): 8-character human-friendly participant code without ambiguous characters.
- `cohort` (text): Data collection cohort (`'pilot'` or `'main'`, set from `VITE_COHORT`).
- `condition_order` (text): Counterbalanced presentation order (`'palace_first'` | `'flashcard_first'`).
- `palace_list` (text): Stimulus list assigned to palace (`'listA'` | `'listB'`).
- `immediate_test_order` (text): Counterbalanced recall order (`'A_first'` | `'B_first'`).
- `word_order` (jsonb): Per-participant randomized word order for List A and List B.
- `imagery_score` (numeric): Mean vividness rating (1.00 to 5.00) from 5 randomized questions.
- `palace_mode` (text): Palace mode utilized (`'guided'` | `'freewalk'`).
- `tutorial_ms` (int): Duration spent in pre-study controls tutorial.
- `webgl_fallback` (bool): `true` if participant used the accessible text route fallback.
- `flashcard_tab_hidden` (bool): `true` if browser tab lost visibility during flashcards study.
- `palace_tab_hidden` (bool): `true` if browser tab lost visibility during 3D palace study.
- `session_interrupted` (bool): `true` if user refreshed during a timed study or recall phase.
- `study_completed_at` (timestamptz): Timestamp when Session 1 study completed.
- `session_completed_at` (timestamptz): Authoritative server timestamp when immediate test finished.
- `withdrew_early` (bool): `true` if participant chose to stop participating early and view results.
- `palace_asset_fallback` (bool): `true` if any 3D furniture model failed to load and fell back to primitive geometry.
- `viewport_w` (int): Viewport width in CSS pixels at study onset (non-identifying device covariate).
- `viewport_h` (int): Viewport height in CSS pixels at study onset (non-identifying device covariate).
- `device_class` (text): Device form factor (`'phone'`, `'tablet'`, or `'desktop'`) based on CSS dimensions.
- `input_type` (text): Primary input modality (`'touch'` or `'mouse'`).

### `sessions` Table
- `id` (uuid, PK): Session UUID.
- `participant_id` (uuid, FK $\to$ participants.id, Cascade Delete).
- `phase` (text): Study phase (`'immediateTest'`, `'24h'`, `'7d'`).
- `started_at` (timestamptz): When session began (defaults to database `now()`).
- `completed_at` (timestamptz): When session ended.
- `late` (bool): `true` if return test was taken in the late window (24h: 48h–72h, 7d: 10d–14d).
- `start_hour` (int): Local hour of day (0–23) when test started for circadian analysis.
- `lists_completed` (int): Number of recall lists completed (`0`, `1`, or `2`). Missing rows for an uncompleted list indicate un-administered tests, never assumed zero-recall.
- `session_interrupted` (bool): `true` if participant refreshed or left mid-test.

### `responses` Table
- `id` (uuid, PK): Response entry UUID.
- `participant_id` (uuid, FK $\to$ participants.id, Cascade Delete).
- `phase` (text): `'immediateTest'`, `'24h'`, or `'7d'`.
- `list_id` (text): `'listA'` or `'listB'`.
- `condition` (text): `'palace'` or `'flashcard'`.
- `item_index` (int): 0 through 19 for target stimuli words; `-1` for intrusions/unmatched entries.
- `typed_answer` (text, nullable): Exact typed text (null if word was missed).
- `correct` (bool): `true` if recalled correctly within length-gated Levenshtein tolerance.
- `response_ms` (int, nullable): Latency from start of list test to response submission.
- `tab_hidden` (bool): `true` if user switched away from the browser tab during the test.
- `intrusion_seq` (int): `0` for target stimulus rows; `1, 2, ...` for intrusions to ensure idempotent upsert without duplicates.

---

## 🕒 Return Test Timing & Dev-Only Simulation Guide

### Test Timing Windows (Measured from `session_completed_at`)
- **24-Hour Test Window**:
  - `0h to <22h`: Window early (friendly countdown displayed).
  - `22h to 48h`: Open on-time (`late = false`).
  - `48h to 72h`: Open late window (`late = true`).
  - `>72h`: Window closed. (Skipping 24h does **not** block 7d!).
- **7-Day Test Window**:
  - `<156h` (6.5 days): Window early (friendly countdown displayed).
  - `156h to 240h` (6.5d to 10d): Open on-time (`late = false`).
  - `240h to 336h` (10d to 14d): Open late window (`late = true`).
  - `>336h`: Window closed.

### How to Simulate Elapsed Time During Development
In development mode (`npm run dev`), simulate any elapsed time without waiting:
- Append `&simElapsedHours=XX` to the return URL: e.g. `/return?code=XXXX&simElapsedHours=23`.
- Or click buttons on the built-in **Dev Time Simulator toolbar** at the bottom of `/return`.

> [!IMPORTANT]
> **Zero Production Backdoor**: The simulation code is guarded by Vite's `import.meta.env.DEV`. When building for production (`npm run build`), the compiler statically replaces `import.meta.env.DEV` with `false`, and the minifier strips the entire simulator and URL parameter handler from the production bundle as dead code.

---

## 🔬 Scientific & Methodological Limitations

When interpreting results from Locus Lab, researchers and participants should account for several inherent constraints:

1. **Self-Selected Sample**: As an open citizen-science project, participants are self-selected volunteers who may possess higher baseline motivation, cognitive interest, or technical literacy than the broader population.
2. **Novelty & Cognitive Load**: First-time exposure to a 3D browser environment introduces motor and visual novelty that simple 2D flashcards do not require, potentially impacting initial encoding efficiency.
3. **Attrition & Dropout Over Delays**: Longitudinal web experiments experience natural participant dropout across 24-hour and 7-day intervals. Non-random attrition may bias multi-day cohorts toward more conscientious participants.
4. **Same-Browser Device Dependency**: To preserve strict anonymity without email logins or passwords, session tokens live in browser local storage. Clearing cache, switching devices, or using private browsing windows prevents returning.
5. **Statistical Granularity (20-Word Lists)**: With 20 words per condition, individual scores have a discrete resolution of 5 percentage points (1 word). Score differences of $\le 3$ words fall within expected binomial variation.
6. **Unsupervised Web Context**: Participants complete the experiment without laboratory supervision. Distractions, external notifications, and browser tab switches (`tab_hidden`) may occur.
7. **Typo Tolerance Boundaries**: While length-gated Levenshtein matching accepts single-character typographical errors on words $\ge 5$ letters, unusual misspellings or phonetically plausible substitutions may be counted as misses.
