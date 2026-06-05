# 10 — Moderation, Safety & Rules Gate

The product is content-permissive by design, but the **floor is hard**. These controls ship in v1 regardless of the "bare minimum" posture.

## 1. Rules gate (first-visit agreement)

A blocking modal shown until the user accepts. Acceptance persists in a cookie so it never reappears on that device.

### Source of truth — `lib/rules.ts`
```ts
export const RULES_VERSION = "1.1"; // bumped: added liability waiver -> forces re-acceptance

export const RULES = [
  "You must follow your school's acceptable-use policy. This site does not exempt you from it.",
  "No illegal content. This includes threats, content sexualizing minors, and doxxing. These are removed and may be reported to authorities.",
  "No targeted harassment of real, named individuals.",
  "No personal information about others (addresses, schedules, phone numbers).",
  "Posts are anonymous to other users but not untraceable. Don't be stupid.",
  "Admins can remove anything at any time. There is no appeal.",
];

// The liability waiver is shown separately (and more prominently) from the conduct
// rules, and must be explicitly agreed to. Acceptance is recorded with RULES_VERSION.
export const LIABILITY_WAIVER =
  "ALL CONTENT ON THIS SITE IS CREATED BY ITS USERS. The author(s) and operator(s) of " +
  "this software ARE NOT RESPONSIBLE AND SHALL NOT BE HELD LIABLE for any content posted, " +
  "any consequences arising from it, or any use of this website. You use this site entirely " +
  "AT YOUR OWN RISK. By continuing, you agree to indemnify and hold harmless the author(s) " +
  "and operator(s) from any and all claims arising out of your use of the site.";
```
`/rules` page and the gate modal both render the `RULES` array **and** the `LIABILITY_WAIVER` — one source.

> ⚠️ A click-through waiver helps but is **not** absolute legal protection (especially with minors, who may not be able to form a binding contract). Treat it as a clear statement of intent, not a guarantee — have whoever is legally accountable review it. This is not legal advice.

### Gate component — `components/RulesGate.tsx` (Client)
```tsx
"use client";
import { useEffect, useState } from "react";
import { RULES, RULES_VERSION, LIABILITY_WAIVER } from "@/lib/rules";

const COOKIE = "ssbs_rules_accepted";

export function RulesGate() {
  const [open, setOpen] = useState(false);
  const [waiverChecked, setWaiverChecked] = useState(false);
  useEffect(() => {
    const accepted = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
    if (accepted?.split("=")[1] !== RULES_VERSION) setOpen(true);   // re-prompt if version bumped
  }, []);
  if (!open) return null;
  function accept() {
    // non-httpOnly UI flag; 1 year. Versioned so updating RULES/waiver re-prompts.
    document.cookie = `${COOKIE}=${RULES_VERSION}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setOpen(false);
  }
  return (
    <div role="dialog" aria-modal className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-mono text-lg">before you enter</h2>

        {/* Liability waiver — prominent, must be explicitly checked */}
        <div className="mt-4 rounded-[var(--radius)] border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5 p-3">
          <p className="text-xs leading-relaxed text-[var(--color-text)]">{LIABILITY_WAIVER}</p>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-[var(--color-muted)] list-disc pl-5">
          {RULES.map((r, i) => <li key={i}>{r}</li>)}
        </ul>

        <label className="mt-4 flex items-start gap-2 text-sm">
          <input type="checkbox" checked={waiverChecked}
            onChange={(e) => setWaiverChecked(e.target.checked)} className="mt-1" />
          <span>I am at least 13, I agree to the rules, and I accept the liability waiver above
            — I will not hold the author(s) or operator(s) liable for anything on this site.</span>
        </label>

        <button onClick={accept} disabled={!waiverChecked}
          className="mt-6 w-full rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2
                     font-medium text-[var(--color-accent-ink)] disabled:opacity-40">
          I understand and agree
        </button>
      </div>
    </div>
  );
}
```

Notes:
- Cookie stores the **version**, not just `1`. Bump `RULES_VERSION` to force re-acceptance after a rules change.
- Gate is UX/consent; it is **not** a security control. Posting APIs don't depend on it (a client could skip it), but the composer is disabled in-UI until accepted.
- Optional hardening: also stamp acceptance server-side (timestamp + version + ipHash) the first time a device posts, for an audit trail of "agreed before posting."

## 2. Rate limiting
From `lib/ratelimit`. Applied per `ipHash:action`:
- replies: `RL_POST_PER_MIN` (default 4/min)
- new threads: `RL_THREAD_PER_10MIN` (default 3/10min)
- uploads: `RL_UPLOAD_PER_MIN` (default 4/min)
- reports: 10/10min
- admin login: 5/15min
Return `429 RATE_LIMITED` with a friendly "slow down" toast. Tune after observing real traffic.

## 3. Reports
- Report button on every post → `POST /api/posts/[id]/report` → row in `reports`.
- Admin console "Reports" tab lists unresolved reports with a link to the post in context; admin can delete the post or dismiss (sets `resolvedAt`).
- De-dupe: ignore repeat reports for the same post from the same ipHash within a window.

## 4. Bans
- `bans` table keyed by `ip_hash` (+ optional `expiresAt`).
- `assertNotBanned(ipHash)` runs at the top of every posting route → `403 BANNED`.
- Admin can ban from any post (the server knows the post's `ipHash`; admin UI never sees the raw value, only a "ban poster" action that resolves server-side).
- Bans are reversible; permanent if `expiresAt` is null.

## 5. Content controls (light)
- **Flood/dupe guard:** reject a post identical to the poster's previous post within N seconds.
- **Link cap:** optional max links per post for brand-new poster tokens (anti-spam).
- **Max image dimensions / size:** enforced in upload pipeline.
- No profanity filter (permissive by design) — but keep a config-driven hard denylist hook for slurs/illegal-promoting terms if the school requires it.

## 6. Privacy
- Raw IPs never stored or rendered — only salted `ipHash`.
- `ipHash` and `posterToken` are stripped by `toPostDTO`; verify in tests that no API response contains either field.
- Image EXIF stripped (see `09`).

## 7. Admin console summary
`/admin` (admin session required, re-checked per API call):
- **Reports** — queue, resolve, jump-to-post, delete.
- **Threads** — search; pin / lock / archive / delete / hard-purge.
- **Boards** — create, rename, reorder, toggle `adminOnlyPost`.
- **Bans** — list, add (via post action), lift.
- **Audit** — deletions record `deletedBy`; admin actions logged with actor + timestamp.

## 8. Operator responsibilities (out of code)
The software gives controls; policy is the operator's. Before launch (you):
- Confirm the school/district acceptable-use policy and whether this is sanctioned.
- Define the hard-disallowed list (CSAM, threats, doxxing, targeted harassment — illegal regardless of vibe) and a real takedown/escalation path.
- Decide retention (how long deleted posts/images persist) and your obligations if law enforcement requests data.
- Keep `IP_HASH_SALT` secret and backed up — losing it breaks ban/abuse correlation.

> ⚠️ Reminder: a public, anonymous, "unhinged" board used by minors is a genuine liability surface. The school-email gate option was declined in favor of optional accounts; consider revisiting if abuse appears. Document who is accountable.

## Exit criteria
- First visit shows the gate; after "agree", refresh does not re-show it; bumping `RULES_VERSION` re-shows it.
- Exceeding a rate limit returns 429 + toast.
- Reporting a post lands it in the admin queue; admin delete removes it for everyone.
- A banned ipHash cannot post; lifting the ban restores posting.
