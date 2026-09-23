# Least Privilege — how it was built

A write-up of the design decisions behind the simulator: what it is trying to
teach, why it is built the way it is, and the parts that turned out to be harder
than they looked.

[← Back to the README](README.md) · [Play it](https://maurishahouston11-lab.github.io/least-privilege/)

---

## The problem

Every IAM learning resource I could find is one of two things. Either it is a
multiple-choice quiz — *which of these is the principle of least privilege?* —
or it is a lab that walks you through clicking the right buttons in the right
order with a screenshot at every step.

Neither is the job. The job is that somebody's manager emails asking for access
"the same as Jordan's", and the interesting question is not which button to
press. It is whether copying Jordan's access is the right thing to do at all,
who has to approve it, what Jordan has that he shouldn't, and what this decision
looks like in an audit eighteen months from now.

So the design constraint was: **no multiple choice, and no correct-button path.**
You work a queue in a console. You can do anything the console allows, in any
order, including all the things that are technically possible and wrong.

## The shape of a shift

A shift is one working day. Six to eight tickets, some waiting when you arrive
and some that come in while you work. A clock in the header runs on the actions
you take, not on wall time — so reading a runbook costs you, and so does calling
someone.

Every shift is the **same company, in order**. Meridian Freight starts in
September 2026 with one directory and twenty-four people, and by the thirteenth
shift it has been audited, breached, merged, cut back, and federated to six
applications. Shift 10 fixes an application to match on payroll number instead
of sign-in name; shift 11 then has somebody change their name, and it is
survivable *because* of what you did in shift 10. That continuity is the whole
reason to build thirteen days rather than thirteen unrelated exercises.

## Grading: the thing that had to be right

Each ticket carries a list of **checks**, and each check is a declarative
condition against the state of the world at the end of the shift:

```json
{
  "label": "The old address kept so mail still arrives",
  "crit": true,
  "c": [{ "renamedTo": "d.brooks-adeyemi", "keptAlias": true }],
  "later": "Everything sent to her old address bounced from the day of the change.
            Two customers assumed she had left, and one of them called her
            replacement at a competitor."
}
```

Three things fall out of this design:

**Order doesn't matter, outcomes do.** The grader asks what is true at the end,
not what sequence you clicked. Where order genuinely matters — containment
before password reset, certificate handover before activation — that is encoded
explicitly as a condition, because in those cases the order *is* the skill.

**Every miss has a specific consequence.** Not "incorrect" but *what happened
because of it, three months later, to a named person.* That text is the actual
teaching surface. Writing it is most of the work of building a shift, and it is
the part that makes people remember.

**Scenarios are data.** Adding a shift means writing a JSON file: the directory,
the people, the policy, the tickets, the checks and the consequences. The engine
never changes for new content — only for new *mechanics*.

## Where the engine grew

The console started as users, groups and tickets. Each shift that needed a new
mechanic added one:

| Shift | What the engine had to learn |
|---|---|
| 2 | Access reviews, audit findings, evidence |
| 3 | Service accounts, secrets with expiry, a credential scanner |
| 5 | Break-glass with authorisation, seal state, a scheduled event queue |
| 6 | Litigation hold, mailbox custody, device wipe |
| 7 | Forest trusts with direction, transitivity and SID filtering |
| 8 | SPNs, gMSA, the two-reset `krbtgt` procedure |
| 10 | SAML configuration, certificate rollover, SCIM provisioning |
| 11 | An inbound HR feed as source of authority, rename that preserves the object |
| 12 | Guest lifecycle, collaboration settings, access packages |
| 13 | Authentication methods policy, self-service reset, registration campaigns |
| 14 | A credential vault: safes, policy, check-out, rotation on return |
| 15 | Entitlement mining, role definition, segregation-of-duties evaluation |

Two late pieces were rewrites rather than additions.

**Conditional access became an evaluator.** It began as a table of policies with
a state field, and a sign-in log that printed a hand-written list of outcomes.
That is fine until you want a What-If panel — and then you have two things that
can disagree with each other and with the policies as configured. It now parses
assignment, exclusions, conditions and grant controls and actually decides, and
the same function drives What-If *and* every row in the sign-in log. Rewriting it
surfaced two real bugs that had been invisible: the control string
`"Require device to be marked compliant"` never matched the parser, and
exclusions written as a category (`"Emergency access accounts"`) were not
matching the break-glass accounts they named.

**The shell got pipelines.** It ran exactly one cmdlet and printed. But nobody
types one cmdlet — they type *find the ones where X and count them*. Six cmdlets
now emit objects and pipe through `Where-Object`, `Sort-Object`,
`Select-Object`, `Measure-Object`, `ForEach-Object` and the formatters.
Everything that changes state still routes through the original code path, so
mutations keep their audit entries either way.

## Testing

Each shift has two automated playthroughs, driven headlessly: one working the
day by the book, one working it carelessly. Each asserts the **exact** score and
the **exact** set of consequences.

```
shift 1  perfect 16/16   careless 2/16, 40 consequences
shift 10 perfect 14/14   careless 0/14, 25 consequences
shift 13 perfect 12/12   careless 0/12, 20 consequences
```

Thirty runs in all. They exist because the engine is shared: a change made
for shift 12 can silently break shift 3, and visual review does not catch it.

They earned their keep. Things the suite found that reading the code did not:

- A CSS class name collision (`.tk` meant both a ticket card and the ticket
  detail layout) that gave the detail page `overflow:hidden` and a transform,
  silently breaking hit-testing so the resolve panel could not be clicked.
- A PIM ticket-number check hardcoded to one scenario's ID format, which would
  have rejected every valid ticket in every later shift.
- A type error where one scenario stored an SPN as a string and another as an
  array.
- A helper that clicked *Cancel* on the sync confirmation dialog and still
  reported success.

## Things I decided not to model

- **Kerberos cryptography.** The `krbtgt` shift models the sequencing, the
  replication gap and the reason for two resets. Actual ticket encryption would
  add code and teach nothing.
- **A real directory.** No LDAP, no Graph. The point is the decisions, not the
  protocol.
- **PKI internals, SIEM tuning, workload identity federation.** Real IAM work,
  but they would add surface without adding the kind of judgement the rest of
  this is about.

## Two things I went back and fixed

**Clickable table rows were mouse-only.** A `<tr>` takes a click handler happily
and is invisible to a keyboard — not in the tab order, no implicit role. Every
table in the console was built that way, so somebody navigating without a mouse
could reach the nav and then hit a wall at every record. Fixed once in the bind
step rather than table by table: each clickable row now gets `tabindex`, a
button role, an `aria-label` from its first cell and Enter/Space handling.

**The first load was 1.45MB, and every shift loaded before you picked
one.** A megabyte of that was scenario data nobody needs to play a single shift.
The build now emits a manifest — date, headline, blurb and check counts per
shift, 7KB — and the roster renders entirely from that. The shift you click
fetches its own data file; the rest are prefetched quietly once the browser is
idle, so offline still works. First paint went from 1.45MB to 512KB.

## Mining a role model

The last shift is the only one where nothing is broken and nobody is attacking
anything. It is a project day, and the interesting failure is a design mistake
rather than an incident.

Role mining is bottom-up by definition: you cluster on the entitlements people
actually hold and see what falls out. The tempting shortcut is to write the org
chart into a spreadsheet and call the departments roles, which produces a model
that describes what management believes access looks like rather than what it
is. So the console computes the mining for real — every enabled person's access
flattened across on-premises groups, cloud groups, application roles and
directory roles, counted per department — and the page leads with the number of
entitlements held by exactly one person, because that number is the whole
argument.

Three decisions follow from it, and the engine had to make all three available
rather than merely gradeable:

**Intersection, not union.** A role defined as everything a department holds
grants everyone the most privileged member's access, quietly, under the heading
of governance. The define dialog ticks what everyone already has and leaves the
rest to the analyst — including the things one person holds, because a mistake
you cannot make is a mistake nobody learns. Tick the group that lets the CFO
approve payments and the dialog says, before the role exists, that it is held by
one of five people and that including it gives it to all five.

**Segregation of duties, evaluated as the role is built.** Checking for a
conflict after a role is live means everyone already has it. The scenario
declares the pairs that must not co-occur, and the check runs on the selection
as it changes.

**Migration order.** Assigning a role adds access and breaks nothing; removing
the direct grants takes it away. The console enforces the order — it refuses to
strip somebody who has not been assigned a role, and tells you what the role does
*not* cover so that access is not silently lost with it.

Building it surfaced a bug in my own assumption. `entsOf` read cloud group
membership as an array of strings; the engine normalises it into objects at boot
(`{g, type, exp, why, src}`), and directory roles into another shape again.
The mining worked on the on-premises half and threw on the cloud half — which is
a fair summary of what hybrid identity does to anyone who assumes one shape.

## The reporting page

Every other page in the console is an operational list. Nothing answered *how
are we doing* — and the data was all there, never added up, which is a fair
description of a lot of real identity programmes.

The forms were chosen before the colours, which is the part people skip. A
single current value is a **stat tile**, not a one-bar chart. A ratio against a
target is a **meter**, where the fill carries severity and the unfilled track is
a lighter step of the same ramp. Counts are **one-hue bars** — there is no
categorical palette on the page at all, because the reader's job is magnitude,
not identity. Status colour never appears alone: every coloured dot sits beside
the word it means.

The one bug worth recording: the methods chart originally read its counts from a
`registered` number written into the scenario file, while the coverage meter
above it counted actual users. On a sixteen-person directory the chart cheerfully
claimed eighty-four people were on SMS. Two sources, one page, guaranteed to
disagree. It now counts the directory, like everything else here.

---

Built by Maurisha Houston. The company, its people, its domain and its console
are invented.
