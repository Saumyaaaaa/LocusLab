# Locus Lab 🏛️

A free, no-signup browser-based citizen-science experiment investigating whether a 3D memory palace (Method of Loci) produces superior long-term word recall compared to traditional digital flashcards.

---

## 🔒 Row Level Security (RLS) Verification Checklist

To verify that participant data is strictly isolated and immune to tampering, perform this 5-minute test using two separate browser profiles (or standard browser + Private/Incognito window):

### Test 1: Data Isolation Across Profiles
1. **Profile A**:
   - Open `http://localhost:5173`.
   - Complete Consent and copy your 8-character code (e.g. `ABC23456`).
   - Rate your mental imagery and begin the study.
2. **Profile B**:
   - Open `http://localhost:5173` in a second profile or Incognito.
   - Complete Consent and copy your code (e.g. `XYZ78923`).
3. **Database Check in Supabase Table Editor**:
   - Notice that both participants exist as separate rows in `participants`.
4. **Client-Side Isolation Check**:
   - In Profile A's browser DevTools Console (`F12`), run:
     ```js
     const { data } = await supabase.from('participants').select('*');
     console.log('Profile A sees:', data);
     ```
   - **Expected Result**: Profile A sees **ONLY** its own row. It can **NEVER** read Profile B's row.

### Test 2: Cross-User Tampering & Update Rejection
- In Profile A's browser DevTools Console, attempt to update Profile B's record using Profile B's UUID:
  ```js
  const { data, error } = await supabase
    .from('participants')
    .update({ imagery_score: 1.0 })
    .eq('id', 'PROFILE_B_UUID_HERE');
  console.log('Update result:', data, error);
  ```
- **Expected Result**: RLS strictly blocks the update (returns 0 updated rows or an error). Profile B's data remains unmodified.

### Test 3: Cross-User Insertion Rejection
- In Profile A's browser DevTools Console, attempt to insert a row masquerading as another user ID:
  ```js
  const { error } = await supabase
    .from('participants')
    .insert({ id: '00000000-0000-0000-0000-000000000000', code: 'FAKE1234' });
  console.log('Insert rejection:', error);
  ```
- **Expected Result**: Blocked with `new row violates row-level security policy for table "participants"`.

---

## 📊 Data Dictionary

### `participants` Table
- `id` (uuid, PK): Anonymous user UUID (`auth.uid()`).
- `code` (text, Unique): 8-character human-friendly participant code without ambiguous characters.
- `condition_order` (text): Counterbalanced order (`'palace_first'` | `'flashcard_first'`).
- `palace_list` (text): List assigned to palace (`'listA'` | `'listB'`).
- `immediate_test_order` (text): Counterbalanced recall order (`'A_first'` | `'B_first'`).
- `word_order` (jsonb): Per-participant shuffled word order for List A and List B.
- `imagery_score` (numeric): Mean score (1.00 to 5.00) from 5 original visual imagery questions.
- `palace_mode` (text): Mode utilized (`'guided'` | `'freewalk'`).
- `tutorial_ms` (int): Duration spent in pre-study controls tutorial.
- `webgl_fallback` (bool): `true` if participant used the accessible text route fallback.
- `flashcard_tab_hidden` (bool): `true` if browser tab lost visibility during flashcards study.
- `palace_tab_hidden` (bool): `true` if browser tab lost visibility during 3D palace study.
- `session_interrupted` (bool): `true` if user refreshed during a timed study or recall phase.
- `study_completed_at` (timestamptz): Timestamp when Session 1 study completed.
- `session_completed_at` (timestamptz): Timestamp when immediate test finished (Session 1 finish).

### `sessions` Table
- `id` (uuid, PK): Session UUID.
- `participant_id` (uuid, FK $\to$ participants.id, Cascade Delete).
- `phase` (text): Study phase (`'immediateTest'`, `'24h'`, `'7d'`).
- `started_at` (timestamptz): When session began.
- `completed_at` (timestamptz): When session ended.
- `late` (bool): `true` if return test was taken in the late window (24h: 48h–72h, 7d: 10d–14d).
- `start_hour` (int): Local hour of day (0–23) when test started for circadian analysis.
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
In development mode (`npm run dev`), you do not need to wait 24 hours or 7 days to test the return windows:
1. Append `&simElapsedHours=XX` to the return URL:
   - Early 24h countdown: `/return?code=XXXX&simElapsedHours=5`
   - On-time 24h test: `/return?code=XXXX&simElapsedHours=23`
   - Late 24h test: `/return?code=XXXX&simElapsedHours=50`
   - Closed 24h / Early 7d countdown: `/return?code=XXXX&simElapsedHours=75`
   - On-time 7d test: `/return?code=XXXX&simElapsedHours=160`
   - Late 7d test: `/return?code=XXXX&simElapsedHours=250`
   - Closed 7d test: `/return?code=XXXX&simElapsedHours=350`
2. Or use the built-in **Dev Time Simulator toolbar** that renders at the bottom of the `/return` screen in `npm run dev`.

> [!IMPORTANT]
> **Zero Production Backdoor**: The simulation code is guarded by Vite's `import.meta.env.DEV`. When building for production (`npm run build`), the compiler statically replaces `import.meta.env.DEV` with `false`, and the minifier strips the entire simulator and URL parameter handler from the production bundle as dead code.
