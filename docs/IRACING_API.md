# iRacing Data API

Base URL: `https://members-ng.iracing.com/data`
Auth docs: `https://oauth.iracing.com/oauth2/book/data_api_workflow.html`

## Authentication

OAuth2 Authorization Code Flow. Legacy auth removed December 9, 2025.

### Requirements

- Client ID + Client Secret (request from iRacing via support)
- Registered redirect URI
- Audience: `data-server`

### Flow (implemented in `lib/auth/`)

```
1. GET https://oauth.iracing.com/oauth2/auth
   ?response_type=code
   &client_id={CLIENT_ID}
   &redirect_uri={REDIRECT_URI}
   &scope=openid
   &audience=data-server

2. User approves → redirect to callback with ?code={AUTH_CODE}

3. POST https://oauth.iracing.com/oauth2/token
   grant_type=authorization_code
   code={AUTH_CODE}
   redirect_uri={REDIRECT_URI}
   client_id={CLIENT_ID}
   client_secret={CLIENT_SECRET}

   → { access_token, refresh_token, expires_in }

4. All /data requests use: Authorization: Bearer {access_token}

5. Refresh: POST /token with grant_type=refresh_token
```

### Token Storage

Store in encrypted HTTP-only cookies or server-side session. NEVER expose tokens to the client.

## Endpoints Used

### Static Data (cache aggressively, changes only per-build)

| Endpoint | Returns | Cache TTL |
|----------|---------|-----------|
| `GET /data/track/get` | All tracks with metadata, configs, free status | 24h+ |
| `GET /data/car/get` | All cars with metadata, classes, free status | 24h+ |
| `GET /data/carclass/get` | Car class definitions | 24h+ |
| `GET /data/series/get` | All active series with car requirements | 24h+ |

### Season Data (cache per-season, ~12 weeks)

| Endpoint | Returns | Cache TTL |
|----------|---------|-----------|
| `GET /data/series/seasons` | Schedule per week per series for current/upcoming season | 12h |
| `GET /data/series/past_seasons` | Historical schedules (predict future?) | 24h+ |

### Member Data (per-user, shorter cache)

| Endpoint | Returns | Cache TTL |
|----------|---------|-----------|
| `GET /data/member/info` | Profile, cust_id, licenses | 1h |
| `GET /data/member/profile` | Extended profile, may include content IDs | 1h |
| `GET /data/results/search_series` | Race history (proves track ownership) | 6h |

## Response Pattern

All iRacing /data endpoints return a redirect link, not direct data:

```json
// Step 1: GET /data/track/get
{ "link": "https://members-ng.iracing.com/data/track/get?...", "expires": "..." }

// Step 2: GET the link value → actual data
[{ "track_id": 1, "track_name": "Lime Rock Park", ... }]
```

Always follow the redirect. Cache the final data, not the link.

## Rate Limiting

- Limits returned in response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Track these in Redis and back off when remaining < 10%
- Static data should be fetched once and cached in Redis/DB, not per-request

## Owned Content Detection (Hybrid Strategy)

The API does not have a clean "list owned tracks" endpoint. Use this approach:

```
1. Fetch /data/member/profile → extract any content/package IDs present
2. Fetch /data/results/search_series for recent seasons → any track raced = owned
3. Mark all free_with_subscription tracks as owned
4. Cross-reference: content IDs ↔ track package IDs from /data/track/get
5. Present remaining unknowns to user for manual confirmation
6. Persist final ownership list in DB (lib/iracing/ownership.ts)
```

## Existing npm Packages

Evaluate before building custom:

| Package | What | Notes |
|---------|------|-------|
| `@iracing-data/api-client-fetch` | Fetch-based TS client | From racedirector/iracing-data-api monorepo |
| `@iracing-data/oauth-client` | OAuth token management | Handles token lifecycle |
| `@iracing-data/api-schema` | Zod schemas for endpoints | Useful for validation |

If these packages are mature enough, use them. Otherwise build a thin wrapper in `lib/iracing/client.ts` with own Zod schemas.

## Fallback: No OAuth Access

If iRacing denies the OAuth registration, the app can still work:

1. Remove OAuth flow entirely
2. User manually marks owned tracks/cars (like iRacing Planner does)
3. Pre-populate free content automatically
4. Season schedules can be imported from the public PDF at:
   `https://members-assets.iracing.com/public/schedulepdf/SeasonSchedule.pdf`
5. Community JSON sources may also provide schedule data
