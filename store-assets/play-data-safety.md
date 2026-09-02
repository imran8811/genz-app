# Play Console — Data safety answers

Transcribe these into **Play Console → App content → Data safety**. Every answer
below was read off the code, not assumed. Re-check it if the app starts
collecting anything new.

Privacy policy URL: `https://genzfoods.pk/privacy`

## Section 1 — Overview

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS only; no cleartext traffic permitted) |
| Do you provide a way for users to request that their data is deleted? | **Yes** — in-app (Account tab) and `https://genzfoods.pk/account-deletion` |

## Section 2 — Data types

For every type below: **collected = yes, shared = no, processed ephemerally =
no, optional = no** (they are required to place an order), and the user **can
request deletion**.

| Category | Type | Purposes |
| --- | --- | --- |
| Personal info | Name | App functionality, Account management |
| Personal info | Email address | App functionality, Account management |
| Personal info | Phone number | App functionality, Account management |
| Personal info | Address | App functionality (delivery) |
| Financial info | Purchase history | App functionality |
| App activity | Other actions (cart contents) | App functionality |

"Shared" means transferred to a third party. Riders are staff carrying out the
delivery, not a third party, so this stays **No**.

## Section 3 — Explicitly NOT collected

Answer **No** to all of these — the app has no SDK that would gather them:

- Location (approximate or precise) — the delivery address is typed by the
  user, which counts as Address, not Location
- Photos, videos, audio, files, contacts, calendar, SMS
- Health, fitness, payment info (cash on delivery only — no card data is ever
  entered or stored)
- Crash logs, diagnostics, performance data — **no crash reporting SDK**
- Advertising ID, ads data — **no ads, no analytics**
- Device or other IDs

## Section 4 — Security practices

| Question | Answer |
| --- | --- |
| Data encrypted in transit | **Yes** |
| Users can request data deletion | **Yes** |
| Committed to Play Families policy | **No** (not a children's app) |
| Independent security review | **No** |

## Related declarations

- **Ads:** app contains no ads
- **Target audience:** 13+ — not designed for children
- **Content rating questionnaire:** no violence, sexuality, profanity,
  controlled substances, gambling, or user-generated content. It is a food
  ordering app; expect "Everyone".
- **Financial features:** none. Cash on delivery only. The "Pay online" option
  is visibly disabled ("Coming soon") because the backend gateway is still a
  stub — declare no payment processing.

## Where these facts come from

- Collected fields: `RegisterScreen.tsx` (name, email, phone, password) and
  `CheckoutScreen.tsx` (recipient name, phone, address, area, city, landmark,
  notes).
- No third-party SDKs: `package.json` contains no analytics, ads or crash
  reporting dependency.
- Encryption in transit: `src/config.ts` points at `https://` only, and the
  release manifest permits no cleartext traffic.
- Deletion: `DELETE /api/v1/auth/account` in genz-web-apis, surfaced in the
  Account tab.
