# Bilingual SMS Booking Bot — Plan & Prerequisites

A Twilio SMS bot for a lawn-care business. Detects English/Spanish, collects
address + service type + yard size, quotes from a price table, confirms, and
books on Google Calendar. Conversation is driven by the Claude API using tool
use for the structured steps.

---

## 1. Accounts & API keys you need

### 1.1 Twilio (SMS ingress/egress)
- **Account** — https://www.twilio.com/try-twilio (trial works for dev)
- **Phone number** — buy an SMS-capable US long code or toll-free number
- **Credentials** — `Account SID`, `Auth Token`
- **Webhook URL** — point the number's "A MESSAGE COMES IN" webhook at
  `POST https://<your-host>/sms/incoming`
- **Production gotcha** — US carriers require **A2P 10DLC** registration
  (brand + campaign) for long codes, or **Toll-Free Verification** for TF
  numbers. Trial accounts skip this but are rate-limited and can only text
  verified numbers. Plan ~1–3 weeks lead time for 10DLC approval.
- **Optional** — Twilio **Messaging Service** (sender pool, opt-out handling,
  STOP/HELP compliance) is recommended over a raw number for production.

### 1.2 Anthropic / Claude API (conversation brain)
- **Account** — https://console.anthropic.com
- **Billing** — add a card; trial credits run out fast
- **API key** — one key per environment (dev/prod); store as
  `ANTHROPIC_API_KEY`
- **Model** — default to `claude-haiku-4-5-20251001` for low-latency SMS turns;
  escalate to `claude-sonnet-4-6` if reasoning quality matters more than cost
- **Features used** — messages API, tool use, prompt caching on the system
  prompt + price table

### 1.3 Google Calendar (booking sink)
Pick **one** auth strategy:

**Option A — Service Account (recommended for single-calendar business)**
- Create a **Google Cloud project**
- Enable the **Google Calendar API**
- Create a **Service Account**; download its JSON key
- Share the target calendar with the service account's email
  (`...@...iam.gserviceaccount.com`) granting "Make changes to events"
- Store the key as `GOOGLE_SERVICE_ACCOUNT_JSON` (base64 the file contents
  for env-var use, or mount as a file)
- Store the calendar's ID as `GOOGLE_CALENDAR_ID`

**Option B — OAuth 2.0 (if the business owner signs in with their Google
account and you don't control the workspace)**
- OAuth consent screen configured
- Client ID + Client Secret
- A one-time flow to capture a **refresh token** for the owner's account
- Store `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`

Default the plan to **Option A**.

### 1.4 Hosting / infra
- **Node.js 20+** runtime
- **Public HTTPS URL** for the Twilio webhook
  - Dev: `ngrok http 3000` (grab a free ngrok account + authtoken)
  - Prod: Render / Railway / Fly.io / Vercel Functions / AWS — any will do
- **Session store** for multi-turn conversation state
  - MVP: in-memory `Map` keyed by phone number
  - Prod: Redis (Upstash free tier works) or Postgres

### 1.5 Nice-to-have
- **Sentry** (or similar) for error tracking — `SENTRY_DSN`
- **Logtail / Axiom / Datadog** for structured logs
- **Address validation** — Google Maps Geocoding API or
  USPS/SmartyStreets — helps reject junk addresses and compute drive-time
  later. Not required for MVP.

---

## 2. Environment variables (goes into `.env`)

```
# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=        # E.164, e.g. +15551234567
TWILIO_MESSAGING_SERVICE_SID=   # optional, preferred in prod

# Anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# Google Calendar (Service Account path)
GOOGLE_SERVICE_ACCOUNT_JSON=    # base64-encoded JSON or path to file
GOOGLE_CALENDAR_ID=             # e.g. primary, or xxx@group.calendar.google.com

# Business config
BUSINESS_NAME=Green Thumb Lawn Care
BUSINESS_TIMEZONE=America/Los_Angeles
BUSINESS_HOURS_START=08:00
BUSINESS_HOURS_END=17:00
APPOINTMENT_SLOT_MINUTES=60

# Server
PORT=3000
PUBLIC_BASE_URL=                # https://... used for Twilio webhook config
SESSION_STORE=memory            # memory | redis
REDIS_URL=                      # if SESSION_STORE=redis
LOG_LEVEL=info
```

---

## 3. Project structure (scaffolded)

```
sms-bot/
├── PLAN.md                     # this file
├── package.json                # deps, scripts (no app code yet)
├── .env.example                # template for the vars above
├── .gitignore                  # node + secrets
├── src/
│   ├── index.js                # Express bootstrap (stub)
│   ├── routes/
│   │   └── sms.js              # POST /sms/incoming (stub)
│   ├── services/
│   │   ├── twilio.js           # signature verification + send SMS (stub)
│   │   ├── claude.js           # Anthropic client + tool loop (stub)
│   │   ├── calendar.js         # Google Calendar event create (stub)
│   │   ├── language.js         # EN/ES detection (stub)
│   │   └── pricing.js          # price-table lookup (stub)
│   ├── conversation/
│   │   ├── state.js            # session store abstraction (stub)
│   │   └── prompts.js          # EN + ES system prompts (stub)
│   └── config/
│       └── pricing.json        # price table data
└── tests/                      # unit tests go here
```

Stub files will be created as empty or with a single-line `TODO` header; no
business logic is committed in this first pass.

---

## 4. Conversation flow

1. SMS hits `POST /sms/incoming`.
2. Verify the `X-Twilio-Signature` header — reject if invalid.
3. Look up session by `From` phone number; create if new.
4. **First inbound message only:** detect language.
   - Heuristic first (common Spanish stopwords / accented chars).
   - Fall back to asking Claude with a one-shot classify call.
   - Persist `session.language` so every subsequent turn uses it.
5. Append the inbound message to `session.messages` and call Claude with:
   - System prompt localized to `session.language`.
   - Tool definitions: `set_address`, `set_service_type`, `set_yard_size`,
     `get_quote`, `propose_appointment_slot`, `confirm_booking`.
   - Prompt cache the system prompt + tool schema + price table.
6. Run the Claude tool-use loop until it returns a plain-text reply:
   - `get_quote` reads `config/pricing.json` and returns `{price, lineItems}`.
   - `propose_appointment_slot` calls Google Calendar `freebusy.query` to
     avoid conflicts and returns 2–3 candidate times.
   - `confirm_booking` calls `calendar.events.insert` and returns the event ID.
7. Send Claude's reply text back via Twilio (reply to the `MessagingResponse`
   or POST to Messages API).
8. If `confirm_booking` ran, also save `session.bookingId` and mark the
   session `completed`.

---

## 5. Price table (starting point — edit in `config/pricing.json`)

| Yard size         | Mow only | Mow + edge + blow | Full service* |
|-------------------|----------|-------------------|---------------|
| Small (<2,000 sqft)   | $35      | $50               | $75           |
| Medium (2k–5k sqft)   | $55      | $75               | $110          |
| Large (5k–10k sqft)   | $85      | $110              | $160          |
| XL (>10k sqft)        | Quote on-site | Quote on-site | Quote on-site |

\* Full service = mow + edge + blow + hedge trim + debris haul.

Quote rule: if `yard_size == "XL"`, the bot should offer to schedule a
no-charge site visit instead of quoting.

---

## 6. Required slots the bot must collect

| Slot          | Validation                                   |
|---------------|----------------------------------------------|
| address       | non-empty; optional geocode check            |
| service_type  | one of `mow`, `mow_edge_blow`, `full_service`|
| yard_size     | one of `small`, `medium`, `large`, `xl`      |
| preferred_day | optional — bot proposes if missing           |

Language is detected, not asked. The bot can confirm ("¿Español está bien?")
but should not block on it.

---

## 7. Build order (suggested)

1. Express server + Twilio webhook with signature verification; echo inbound.
2. Session store (in-memory) + language detection.
3. Claude client wired up with a single system prompt, no tools — just chat.
4. Add tool schemas + `get_quote` backed by `pricing.json`.
5. Add Google Calendar `freebusy` + `events.insert`.
6. Localize system prompts (EN + ES) and regression-test both flows.
7. Harden: STOP/HELP keywords, rate limiting, retry on Twilio/Anthropic 5xx.
8. Deploy; register A2P 10DLC if going to production.

---

## 8. Things explicitly out of scope for MVP

- Payments / deposits
- Rescheduling or cancellation flows over SMS
- Multi-technician routing
- MMS (photos of the yard) — easy add later via Twilio media URLs + Claude vision
- Web dashboard for the business owner
