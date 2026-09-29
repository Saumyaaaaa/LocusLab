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

### `sessions` Table
- `id` (uuid, PK): Session UUID.
- `participant_id` (uuid, FK $\to$ participants.id, Cascade Delete).
- `phase` (text): Study phase (`'immediate'`, `'24h'`, `'7d'`).
- `started_at` (timestamptz): When session began.
- `completed_at` (timestamptz): When session ended.

### `responses` Table
- `id` (uuid, PK): Response entry UUID.
- `participant_id` (uuid, FK $\to$ participants.id, Cascade Delete).
- `phase` (text): `'immediate'`, `'24h'`, or `'7d'`.
- `list_id` (text): `'listA'` or `'listB'`.
- `condition` (text): `'palace'` or `'flashcard'`.
- `item_index` (int): 0 through 19 for target stimuli words; `-1` for intrusions/unmatched entries.
- `typed_answer` (text, nullable): Exact typed text (null if word was missed).
- `correct` (bool): `true` if recalled correctly within 1-char Levenshtein tolerance (5+ letter words).
- `response_ms` (int, nullable): Latency from start of list test to response submission.
