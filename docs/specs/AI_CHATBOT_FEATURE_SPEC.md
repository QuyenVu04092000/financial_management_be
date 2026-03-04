# AI Chatbot Feature — Technical Specification

**Version:** 1.0  
**Status:** Specification  
**Last updated:** 2025-02-28

---

## 1. Business Goal

- **Primary:** Provide an in-app AI assistant that helps users with personal finance questions (budgeting, spending, savings, categories, transactions) in natural language, without leaving the application.
- **Secondary:** Improve engagement and self-service by answering common “how do I…?” and “why did…?” questions instantly, and by offering contextual tips based on the product domain.
- **Non-goals (out of scope):** Executing financial actions on behalf of the user (e.g., creating transactions), providing regulated financial advice, or replacing human support for sensitive/legal matters.

---

## 2. API Contract

### 2.1 Request Format

| Field    | Type   | Required | Constraints                    | Description                                      |
|----------|--------|----------|--------------------------------|--------------------------------------------------|
| `message`| string | Yes      | Non-empty, max 10,000 chars     | User’s current message to the chatbot.          |
| `history`| array  | No       | See below                      | Previous turns for multi-turn conversation.      |

**`history` item shape:**

| Field    | Type   | Required | Constraints                    | Description                          |
|----------|--------|----------|--------------------------------|--------------------------------------|
| `role`   | string | Yes      | `"system"` \| `"user"` \| `"assistant"` | Who sent the message.                |
| `content`| string | Yes      | Non-empty                      | Message content.                     |

- **Validation rules:** `message` required and length-capped; if `history` is present, each element must have valid `role` and non-empty `content`. Invalid payloads result in `400 Bad Request` with a descriptive message.

### 2.2 Response Format

**Success (200 OK)**

- Body is wrapped in the application’s standard envelope (e.g. `{ "data": { ... } }`).
- Chat-specific payload inside `data`:

| Field    | Type   | Description                                      |
|----------|--------|--------------------------------------------------|
| `reply`  | string | Assistant’s text reply.                          |
| `usage`  | object | Optional; present when the provider returns it.  |

**`usage` object (optional):**

| Field             | Type   | Description                    |
|-------------------|--------|--------------------------------|
| `promptTokens`    | number | Tokens in the request.         |
| `completionTokens`| number | Tokens in the reply.           |
| `totalTokens`     | number | Total tokens used.             |

**Error responses**

- Use the application’s global error format (e.g. `statusCode`, `message`, `error`, `timestamp`, `path`).
- See Section 5 for status codes and when each is used.

---

## 3. Endpoint Structure

- **Method:** `POST`
- **Path:** `/api/{version}/chat`
  - `{version}` is the API version segment (e.g. `v1`), consistent with the rest of the API.
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>` (required; see Authentication).
- **Behavior:** Single endpoint for all chat requests; conversation state is not stored on the server—client sends `history` when multi-turn context is desired.

---

## 4. Error Handling

| Scenario                         | HTTP Status   | Client action / message intent                          |
|----------------------------------|---------------|---------------------------------------------------------|
| Missing or invalid JWT           | 401           | Re-authenticate (login again).                          |
| Request body validation failed  | 400           | Fix payload (e.g. required `message`, length, `history` shape). |
| Chat not configured (e.g. no key)| 400          | “Chat is not configured”; operator must set env.       |
| Provider error (OpenAI down, etc.)| 503          | Retry later; optional backoff.                         |
| Rate limit (provider or app)    | 429           | Retry after `Retry-After` or with backoff.             |
| Unexpected server error         | 500           | Generic message; log server-side, retry or contact support. |

- All error responses MUST use the same JSON structure (e.g. `statusCode`, `message`, `error`, `timestamp`, `path`) for consistent client handling.
- Sensitive details (stack traces, internal hostnames) must not be returned to the client in production.
- 5xx errors should be logged server-side with request id or correlation id where available.

---

## 5. Authentication

- **Mechanism:** Bearer JWT in `Authorization` header, aligned with the rest of the API.
- **Requirement:** The chat endpoint is **protected**; unauthenticated requests receive `401 Unauthorized`.
- **Usage of identity:** The authenticated user id may be used for:
  - Rate limiting per user.
  - Future personalization (e.g. “your budgets”) or audit logs.
- **No separate “chat API key”** for end-users; only the backend server holds the AI provider API key (e.g. `OPENAI_API_KEY`).

---

## 6. Example Request and Response

### 6.1 Simple (single turn)

**Request**

```http
POST /api/v1/chat HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "message": "How do I set a budget for groceries?"
}
```

**Response (200 OK)**

```json
{
  "data": {
    "reply": "To set a budget for groceries in the app, go to Budgets, choose the category (e.g. Food), then set a monthly amount. You can also set budgets per sub-category for more detail. Would you like steps for a specific category?",
    "usage": {
      "promptTokens": 120,
      "completionTokens": 58,
      "totalTokens": 178
    }
  }
}
```

### 6.2 Multi-turn (with history)

**Request**

```http
POST /api/v1/chat HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "message": "And how do I see if I'm over it?",
  "history": [
    { "role": "user", "content": "How do I set a budget for groceries?" },
    { "role": "assistant", "content": "To set a budget for groceries..." }
  ]
}
```

**Response (200 OK)**

```json
{
  "data": {
    "reply": "You can see if you're over your grocery budget in the Budget section: each category or sub-category shows spent vs. limit. When you're over, the indicator will typically turn red or show an alert. You can also check the Reports view for a broader picture.",
    "usage": {
      "promptTokens": 210,
      "completionTokens": 72,
      "totalTokens": 282
    }
  }
}
```

### 6.3 Error examples

**Validation error (400)**

```json
{
  "statusCode": 400,
  "message": ["message must be a string", "message should not be empty"],
  "error": "Bad Request",
  "timestamp": "2025-02-28T10:00:00.000Z",
  "path": "/api/v1/chat"
}
```

**Chat not configured (400)**

```json
{
  "statusCode": 400,
  "message": "Chat is not configured. Set OPENAI_API_KEY in the environment.",
  "error": "Bad Request",
  "timestamp": "2025-02-28T10:00:00.000Z",
  "path": "/api/v1/chat"
}
```

**Service unavailable (503)**

```json
{
  "statusCode": 503,
  "message": "The AI service is temporarily unavailable. Please try again later.",
  "error": "Service Unavailable",
  "timestamp": "2025-02-28T10:00:00.000Z",
  "path": "/api/v1/chat"
}
```

---

## 7. Edge Cases

| Edge case | Handling |
|-----------|----------|
| Empty `message` or whitespace-only | Reject with 400; require non-empty after trim. |
| `message` longer than 10,000 characters | Reject with 400 and max-length message. |
| Very long `history` (e.g. 100+ turns) | Option A: Cap total size/tokens and truncate oldest. Option B: Reject with 400 and “history too long”. Spec recommends a cap (e.g. last N turns or max tokens) and truncation. |
| Invalid `role` in `history` | Reject with 400; only `system`, `user`, `assistant` allowed. |
| AI returns empty content | Treat as provider failure; return 503 and do not return an empty reply. |
| AI provider timeout | Fail request with 503 (or 504); client can retry. |
| Concurrent requests per user | Optional: rate limit (e.g. 60/min per user) and return 429 when exceeded. |
| Sensitive data in `message` (PII, credentials) | Do not log full message in plain text; log only length or hash. Consider warning in product UX not to paste passwords. |
| Off-topic or abusive content | System prompt instructs model to stay on-topic and be concise; optional content moderation or abuse detection for future. |
| Model-specific errors (e.g. context length exceeded) | Map to 400 or 503 with a generic message; log full error server-side. |

---

## 8. Data Flow

1. **Client** sends `POST /api/{version}/chat` with JSON body (`message`, optional `history`) and Bearer JWT.
2. **API Gateway / Router** forwards the request to the Chat controller.
3. **Auth middleware** validates JWT; on failure returns 401 and stops.
4. **Validation layer** checks body (required fields, types, lengths, `history` shape); on failure returns 400 and stops.
5. **Controller** receives validated DTO, extracts user id from JWT, calls Chat service with payload and user id.
6. **Chat service:**
   - Ensures chat is configured (e.g. AI provider API key present); else 400.
   - Builds prompt: system message (financial assistant instructions) + optional `history` + current `message`.
   - Calls AI provider (e.g. OpenAI) with the constructed messages and model/config.
   - On success: maps provider response to `reply` and optional `usage`; returns to controller.
   - On provider error: maps to 503 (or 429 if rate limit); does not expose provider internals.
7. **Controller** wraps service result in standard envelope (`data`) and returns 200.
8. **Global exception/error handler** ensures all errors (validation, auth, service) are returned in the same JSON shape and appropriate status code.
9. **Client** receives either success body or error body and updates UI (show reply or show error message / retry).

No persistence of conversation is required in this spec; the client is responsible for maintaining `history` if multi-turn is desired.

---

## 9. Sequence Diagram Explanation

A typical successful flow can be represented as follows (described in text; no diagram image):

1. **User (client)** → **API**: `POST /api/v1/chat` with `{ message, history? }` and `Authorization: Bearer <token>`.
2. **API** → **Auth**: Validate token. **Auth** → **API**: token valid, user id = U.
3. **API** → **Validator**: Validate body. **Validator** → **API**: valid.
4. **API** → **Chat service**: `sendMessage(payload, userId)`.
5. **Chat service** → **Config**: Get `OPENAI_API_KEY`. **Config** → **Chat service**: key present.
6. **Chat service** builds messages (system + history + user message).
7. **Chat service** → **OpenAI (external)**: Chat completion request with messages and model.
8. **OpenAI** → **Chat service**: Completion (reply + usage).
9. **Chat service** → **API**: `{ reply, usage }`.
10. **API** → **User (client)**: `200 OK` with `{ data: { reply, usage } }`.

**Error flows (short):**

- Step 2 failure (invalid/missing token): **Auth** → **API** → **User**: `401`.
- Step 3 failure (validation): **Validator** → **API** → **User**: `400`.
- Step 5 (no API key): **Chat service** → **API** → **User**: `400` “Chat not configured”.
- Step 8 failure (OpenAI error/timeout): **OpenAI** → **Chat service**; **Chat service** → **API** → **User**: `503` (or `429` if rate limit).

---

## 10. Folder Structure

Recommended placement within the existing backend (e.g. NestJS) without duplicating generic layers:

```
src/
├── common/
│   ├── dto/
│   │   └── chat/
│   │       ├── chat.dto.ts      # Request/response DTOs and validation
│   │       └── index.ts
│   └── filters/                 # (if not already present)
│       └── http-exception.filter.ts   # Global error shape
├── modules/
│   └── chat/
│       ├── controllers/
│       │   ├── chat.controller.ts
│       │   └── index.ts
│       ├── services/
│       │   ├── chat.service.ts
│       │   └── index.ts
│       └── chat.module.ts
├── app.module.ts                # Register ChatModule
└── main.ts                      # Global prefix, versioning, filters
```

**Responsibilities:**

- **controllers:** HTTP only—parse request, call service, return response and status.
- **services:** Business logic—config check, prompt construction, call to AI provider, map response/errors.
- **dto (chat):** Request/response shapes and validation rules (e.g. class-validator).
- **filters:** Shared error formatting for the whole API (not chat-specific).
- **chat.module:** Wires controller and service; imports config (and any future dependencies).

No separate “routes” file is required if the framework uses controller-based routing (e.g. NestJS). Configuration (e.g. `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`) lives in environment and is read via the application’s config service, not in the chat folder.

---

## Document History

| Version | Date       | Author / change |
|---------|------------|------------------|
| 1.0     | 2025-02-28 | Initial specification |
