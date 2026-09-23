# Least Privilege

An identity and access management simulator. Nine shifts on the IAM queue at a
fictional freight company, each one a full working day, in order, across
fourteen months — the same directory, the same people, and whatever the last
shift left behind.

**[Play it →](https://maurishahouston11-lab.github.io/least-privilege/)**

There are no multiple-choice answers. You do the work in a hybrid console —
on-premises Active Directory on one side, a cloud tenant on the other — and when
the shift ends you find out what every decision cost three months later.

---

## The shifts

| | Shift | What it covers |
|---|---|---|
| 1 | **First Week** | Joiner, mover, leaver, a contractor asking for admin, and someone pretending to be locked out |
| 2 | **The Audit** | Five findings, one shift to clear what can be cleared and evidence what can't |
| 3 | **The Service Account** | Machine identities, expiring secrets, and a password left in a script on a file share |
| 4 | **Strange Sign-ins** | Impossible travel, MFA fatigue, an illicit consent grant, and one alert that is nothing at all |
| 5 | **Break Glass** | A policy change locks every administrator out. The emergency account is the way back in |
| 6 | **The List** | Reduction in force, three custodians under legal hold, and a name nobody approved |
| 7 | **Day One** | Merger onboarding: a forest trust, duplicate identities, and a sign-in name already taken |
| 8 | **Tier Zero** | Kerberoasting, a forged ticket, DCSync, and the decision of whether to reset `krbtgt` |
| 9 | **Housekeeping** | Nine domain admins down to three, and four people who don't want to give it up |

57 tickets, 297 scored steps.

## What it actually models

Every ticket is graded step by step against what a real analyst would have to
do, not against a single right answer. Miss a step and the scorecard tells you
what it cost — three months later, in the specific.

- **Hybrid identity** — AD objects, OUs and distinguished names, nested groups,
  directory sync with a real delta cycle, source of authority, GPO and RSoP,
  NTFS versus share permissions with deny-wins and inheritance, open SMB handles
- **Lifecycle** — joiner/mover/leaver by role template, privilege creep,
  ownership handover, account expiry, mailbox and OneDrive custody
- **Privileged access** — tiering, PIM activation with justification and ticket,
  standing versus eligible, break-glass with authorization, rotation and reseal
- **Detection and response** — containment order, session and token revocation,
  risk detections, consent grants, conditional access, number matching
- **Kerberos** — SPNs and offline cracking, gMSA, replication rights, the
  two-reset `krbtgt` procedure and the gap it requires
- **Governance** — access reviews and certification, segregation of duties,
  litigation hold, audit evidence

Real cmdlet and control names are used throughout, because job postings ask for
them.

## Running it

It's a static site with no build step and no dependencies.

```
git clone https://github.com/maurishahouston11-lab/least-privilege.git
cd least-privilege
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

It also installs as an app — open it in a browser and use the install option in
the address bar or menu. It works offline and keeps your progress per shift.

## How it's built

Plain HTML, CSS and JavaScript. No framework.

- `engine.js` — the console: pages, actions, the scheduled-event queue, and the
  grader
- `data*.js` — one file per shift. Every scenario is data: the directory, the
  people, the policy, the tickets, the per-step checks and the consequence text
- `app.css` — the design system
- `sw.js`, `manifest.webmanifest` — offline and install

Adding a shift means writing a data file, not touching the engine.

Each shift is verified by two automated playthroughs — one working it by the
book, one working it carelessly — asserting the exact score and the exact set of
consequences. Eighteen runs in all, and they're what catches a regression when
the engine changes.

## A note on the fiction

Meridian Freight, its people, its domain and its console are invented. Nothing
here imitates a real company or a real product.

---

Built by Maurisha Houston.
