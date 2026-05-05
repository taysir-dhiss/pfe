# CancerCare TN — Feature Summary

> Full-stack MERN application for breast cancer patient support.
> **Stack:** MongoDB Atlas · Express 5 · React 19 · Node.js · OpenAI GPT-4o-mini · Socket.IO

---

## Authentication

| Feature | Details |
|---|---|
| Patient registration | Name, email, password, date of birth, cancer stage, medical history |
| Login | Works for both patients and admins; returns a signed JWT (7-day expiry) |
| Role-based access | `patiente` vs `admin` enforced on every protected route |
| Auto-logout | 401/403 responses clear the token and redirect to `/login` |

---

## Patient Side

### Dashboard
- Welcome banner with the patient's first name
- Upcoming appointment counter with next-appointment date badge
- Quick-access cards: Mes Symptômes · Rendez-vous · Contenu médical · Recommandations
- Inline profile editor (name, cancer stage, medical history)

### Symptom Tracking
- Declare symptoms with **type** (Douleur, Fatigue, Nausée, etc.) and **intensity** (1–10 slider)
- Visual intensity bar per symptom (green / amber / red)
- Delete individual symptoms
- Symptoms feed directly into the AI chatbot analysis

### CalmCare — AI Medical Chatbot
The main feature of the app. Each chat session runs a 5-step AI pipeline:

1. **Symptom classification** — GPT-4o-mini extracts symptoms, severity (`low` → `critical`), and confidence from the free-text message
2. **Semantic lookup** — cosine similarity against the patient's stored recommendation embeddings (tiers: high ≥ 0.82 · medium ≥ 0.62 · low · none)
3. **Medical reasoning** — GPT-4o-mini generates an empathetic analysis + prioritised recommendations, enriched with semantic context and a detected symptom category
4. **Safety filter** — pattern-matching against critical keywords (chest pain, sudden dyspnea, heavy bleeding, syncope, fever ≥ 38.5 °C, etc.); triggers escalation if matched
5. **Response assembly** — combines analysis, colour-coded recommendations (🔴🟠🟡🟢), escalation banners, and a mandatory medical disclaimer

**Additional chatbot capabilities:**

| Capability | Details |
|---|---|
| Session initialisation | Sends declared symptoms → receives preliminary analysis + 3 suggested questions |
| Structured responses | Detected symptom category injects a directive forcing a 4-part structured answer |
| Local keyword fallback | If OpenAI is unavailable, scored keyword matching returns a static medical response |
| Critical escalation | `requiresEscalation: true` → toast + auto-redirect to Appointments after 3.5 s |
| Session sharing | Generates a public read-only link (no auth required) for a session |
| Past conversations | Sidebar lists all open sessions; click to reopen and continue |
| Graceful session recovery | If a session is expired, the app silently creates a new one and retries the message |

### AI Symptom Analysis
- One-click analysis of all declared symptoms → GPT-4o-mini generates prioritised recommendations
- Recommendations saved to the database and their **vector embeddings** stored (text-embedding-3-small) for future semantic lookups

### Appointments
- Create, view, edit, delete appointments (type, date, doctor)
- Built-in 4-hour reminder logic (via scheduler)
- **Custom reminder** — set a specific reminder date/time per appointment

### Recommendations
- View all AI-generated medical recommendations linked to the patient
- Priority levels: faible · modéré · élevé · urgent

### Medical Content
- Browse admin-published articles and videos
- Filter by type

### Custom Reminders
- Create personal reminders: medication, follow-up tasks, etc.
- Repeat modes: **once** (specific date) · **daily** (at a time) · **weekly** (selected days + time)
- Enable / disable toggle per reminder

### Community Chat
- Real-time forum powered by **Socket.IO**
- Post messages, reply in threads (nested replies)
- Emoji reactions on messages
- Delete own messages

### Notifications
- In-app notifications pushed by admins
- Unread count badge
- Dismiss one or all notifications

---

## Admin Side

| Page | Capabilities |
|---|---|
| Dashboard | Overview stats |
| Manage Patients | View all registered patient accounts |
| Manage Appointments | View all appointments across all patients |
| Manage Notifications | Send notifications to any patient |
| Manage Medical Content | Create · edit · delete articles and videos |
| Create Admin | Add new admin accounts |

---

## Technical Architecture

| Layer | Technology |
|---|---|
| Database | MongoDB Atlas (cloud) |
| ORM | Mongoose 9 |
| API | Express 5 (REST) |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Real-time | Socket.IO 4 |
| AI — chat & analysis | OpenAI GPT-4o-mini |
| AI — embeddings | OpenAI text-embedding-3-small (1536-dim) |
| Semantic search | Cosine similarity (pure JS, no external lib) |
| Scheduler | node-cron (appointment reminders) |
| Frontend | React 19 + React Router 7 |
| Styling | Tailwind CSS 3 |
| HTTP client | Axios (with JWT interceptor + 401 auto-logout) |
| Language | French (UI + AI responses) |

---

## AI Pipeline — Flow Diagram

```
User message
     │
     ▼
[0] Semantic lookup        ← cosine similarity vs stored recommendation embeddings
     │
     ▼
[1] Symptom classifier     ← GPT-4o-mini → { symptoms[], severity, confidence }
     │
     ▼
[2] Keyword detector       ← scored matching → detectedCategory (no API call)
     │
     ▼
[3] Medical reasoning      ← GPT-4o-mini → { analysis, recommendations[] }
     │       (uses: severity + semantic context + category directive)
     ▼
[4] Safety filter          ← critical pattern regex → requiresEscalation?
     │
     ▼
[5] Response builder       ← assembles final French text + disclaimer
     │
     ▼
Saved to DB + returned to client
```
