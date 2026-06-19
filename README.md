# GhostTalkrAI

GhostTalkrAI is a student-led AI chatbot web application designed to bridge the gap between academic excellence and industry opportunity. The platform identifies students with outstanding projects and connects them with relevant industry professionals, creating pathways to meaningful internships and career advancement. Interaction is facilitated through an embedded AI assistant intended to be powered by a Flask backend and a Snowflake data layer.

> **Status:** Frontend is fully functional and runs standalone. The backend (`app.py`) implements the Flask API and dynamic Snowflake connection, but is **not yet wired into the live frontend**, and no LLM provider is connected by default — it currently returns a stub response. See [How It Works](#how-it-works) below for what's implemented vs. planned.

---

## Project Structure

```
GhostTalkrAI/
├── index.html              # Main HTML entry point
├── css/
│   ├── style.css           # Core styles and layout
│   └── glitch.css          # Glitch animation effects
├── js/
│   ├── chatbot.js          # Chat UI logic and backend communication
│   ├── script.js           # General UI interactions and effects
│   └── cursor.js           # Custom cursor animations
├── app.py                  # Flask backend server
├── requirements.txt        # Python dependencies
├── .env.example             # Environment variable template (safe to share)
└── .env                     # Local environment config (DO NOT commit)
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 | Page structure and semantic layout |
| CSS3 (custom) | Styling, animations, glitch effects, responsive design |
| Vanilla JavaScript (ES6+) | Chat UI, custom cursor, smooth scroll, rainbow hover effects |

### Backend
| Technology | Purpose |
|---|---|
| Python / Flask | REST API server handling chat requests |
| Flask-CORS | Cross-origin resource sharing, configurable via `CORS_ORIGINS` |
| Snowflake | Cloud data warehouse for storing chatbot responses and chat logs |
| python-dotenv | Environment variable management |

---

## How It Works

**What's actually implemented in `app.py`:**

1. **Dynamic Snowflake configuration** — connection parameters are built automatically from *any* environment variable prefixed with `SNOWFLAKE_` (not a fixed list). Add `SNOWFLAKE_ROLE`, `SNOWFLAKE_AUTHENTICATOR`, or any other Snowflake connector parameter to `.env` and it's picked up without touching the code.
2. **Dynamic query results** — `query_snowflake()` returns rows as column-name-keyed dictionaries rather than fixed-position tuples, so queries can return any number/shape of columns.
3. **Graceful degradation** — if Snowflake isn't configured (no credentials in `.env`), the `/api/chat` endpoint still responds with a stub message instead of failing with a server error.
4. **Message validation** — empty messages are rejected, and message length is capped via `MAX_MESSAGE_LENGTH`.

**What's intentionally a stub:**

- `get_llm_response()` does not call any LLM provider. `.env.example` includes placeholders for `GEMINI_API_KEY` and `OPENAI_API_KEY` for anyone who wants to wire one up — neither is connected in the current code.
- The frontend (`chatbot.js`) calls a placeholder URL (`https://your-backend-api.com/chat`) — update it to your local Flask server address to test the full flow.

**Intended end-to-end flow once fully connected:**

```
User message → chatbot.js → POST /api/chat → Snowflake lookup
→ LLM call (with retrieved context) → Snowflake log → JSON response → Chat UI
```

---

## Local Setup

### Frontend only (no backend required)

```bash
git clone https://github.com/your-username/GhostTalkrAI.git
cd GhostTalkrAI
```

Open `index.html` directly in any modern browser. No build tools or server required. The chat UI will display a fallback error message since no backend is connected.

### Full stack (with backend)

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Copy the environment template and fill in your own credentials:
   ```bash
   cp .env.example .env
   ```

3. At minimum, set `SNOWFLAKE_ACCOUNT` and `SNOWFLAKE_USER` in `.env` for the backend to start without errors. Add any other `SNOWFLAKE_*` variable your setup needs — it will be picked up automatically.

4. Start the Flask server:
   ```bash
   python app.py
   ```

5. Update the API endpoint in `js/chatbot.js` to point at your local server:
   ```javascript
   const response = await fetch('http://localhost:5000/api/chat', { ... });
   ```

6. Open `index.html` in your browser.

---

## Environment Variables

Copy `.env.example` to `.env` and populate the values you need. **Never commit your `.env` file.**

| Variable | Required? | Description |
|---|---|---|
| `SNOWFLAKE_ACCOUNT` | Yes | Snowflake account identifier |
| `SNOWFLAKE_USER` | Yes | Snowflake username |
| `SNOWFLAKE_PASSWORD` | Recommended | Snowflake password |
| `SNOWFLAKE_WAREHOUSE` | Optional | Compute warehouse name |
| `SNOWFLAKE_DATABASE` | Optional | Target database name |
| `SNOWFLAKE_SCHEMA` | Optional | Target schema name |
| `SNOWFLAKE_ROLE` | Optional | Snowflake role, or any other connector parameter — read dynamically |
| `CORS_ORIGINS` | Optional | Comma-separated allowed origins; defaults to allow-all if unset |
| `SECRET_KEY` | Optional | Flask secret key; defaults to a dev placeholder if unset |
| `MAX_MESSAGE_LENGTH` | Optional | Max characters accepted per chat message (default: 500) |
| `FLASK_HOST` / `FLASK_PORT` / `FLASK_DEBUG` | Optional | Flask server config |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | Not yet used | Placeholder for future LLM integration — not called by current code |

---

## Known Limitations & Roadmap

- No LLM provider is connected; `get_llm_response()` returns a static stub response. Wiring a real provider means adding the SDK to `requirements.txt` and implementing the actual API call.
- The frontend's backend URL in `chatbot.js` is a placeholder and needs to be updated to test the integration end-to-end.
- Snowflake keyword matching (`LIKE` on a substring) is a simplified proof-of-concept; a production system would use embeddings or a dedicated search index.
- No authentication exists on the Flask API endpoints — add auth middleware before any public deployment.

---

## ⚠️ Security Note

Ensure `.env` is listed in `.gitignore` before pushing to any remote repository. `.env.example` is the only configuration file that should ever be committed, and it must contain placeholder values only — never real credentials.

---

*© 2024 GhostTalkrAI. All rights reserved.*