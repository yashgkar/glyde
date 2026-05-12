# flite

A lightweight, TypeScript-first HTTP client built on the native `fetch` API. Zero runtime dependencies. First-class Next.js App Router support.

## Install

```bash
npm install flite
```

## Core Usage

```ts
import flite, { create } from "flite"

// Quick GET
const { data } = await flite.get<User[]>("/api/users")

// Create a configured instance
const api = create({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: { "X-API-Key": "my-key" },
})

const { data } = await api.post<User>("/users", { name: "Alice" })
```

## Next.js App Router

flite ships a dedicated Next.js adapter for the httpOnly cookie + proxy pattern:

```
Browser → Next.js Route Handler (/api/...) → External API
```

### Server client — Route Handlers / Server Actions

```ts
// lib/api.server.ts
import { createServerClient } from "flite/next"

export const apiClient = createServerClient({
  baseURL: process.env.API_BASE_URL!,

  auth: {
    inject: async (config, cookieStore) => {
      const token = cookieStore.get("access_token")?.value
      if (token) {
        config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
      }
      return config
    },
  },

  refresh: {
    endpoint: "/auth/refresh",
    body: async (cookieStore) => ({
      refresh_token: cookieStore.get("refresh_token")?.value,
    }),
    extractTokens: (response) => ({
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token, // optional
    }),
    onSuccess: async (tokens, cookieStore) => {
      cookieStore.set("access_token", tokens.accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      })
      if (tokens.refreshToken) {
        cookieStore.set("refresh_token", tokens.refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
        })
      }
    },
    onFailure: async (_err, cookieStore) => {
      cookieStore.delete("access_token")
      cookieStore.delete("refresh_token")
    },
  },
})
```

### Browser client — Client Components

```ts
// lib/api.client.ts
"use client"
import { createClientClient } from "flite/next/client"

export const client = createClientClient({
  baseURL: "/api",
  onUnauthorized: () => {
    window.location.href = "/login"
  },
})
```

### Route Handler

```ts
// app/api/users/route.ts
import { apiClient } from "@/lib/api.server"
import { isRefreshFailedError } from "flite/next"

export async function GET(request: Request) {
  try {
    const { data } = await apiClient.get<User[]>("/users", {
      signal: request.signal,
    })
    return Response.json(data)
  } catch (err) {
    if (isRefreshFailedError(err)) {
      return new Response(null, { status: 401 })
    }
    throw err
  }
}
```

## API Reference

### Request Config

```ts
interface RequestConfig {
  url?: string
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS"
  baseURL?: string
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean>
  data?: unknown
  timeout?: number
  signal?: AbortSignal
  responseType?: "json" | "text" | "blob" | "arrayBuffer" | "stream"
  withCredentials?: boolean
}
```

### Response Shape

```ts
interface FlightResponse<T> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: RequestConfig
}
```

### Error Types

```ts
import {
  isFlightError,
  isHttpError,
  isTimeoutError,
  isRefreshFailedError,
} from "flite"
import { isRefreshFailedError } from "flite/next"

try {
  await apiClient.get("/endpoint")
} catch (err) {
  if (isRefreshFailedError(err)) {
    /* refresh token expired */
  }
  if (isHttpError(err)) {
    console.log(err.status, err.response)
  }
  if (isTimeoutError(err)) {
    /* request timed out */
  }
}
```

### Interceptors

```ts
const id = api.interceptors.request.use((config) => {
  config.headers!["X-Request-ID"] = crypto.randomUUID()
  return config
})

api.interceptors.response.use((response) => {
  console.log(`[${response.status}] ${response.config.url}`)
  return response
})

api.interceptors.request.eject(id)
```

### File Upload

```ts
// FormData — Content-Type set automatically with boundary
const form = new FormData()
form.append("file", file)
form.append("name", "avatar")

await apiClient.upload("/upload", form)
// or on core client:
await api.post("/upload", form)
```

### Streaming

```ts
const { data: stream } = await apiClient.stream("/ai/chat")
// data is a ReadableStream
```

### Cancellation

```ts
const controller = new AbortController()
api.get("/slow", { signal: controller.signal })
controller.abort()
```

## Scripts

```bash
npm run build       # build all entry points (ESM + CJS + .d.ts)
npm run typecheck   # type-check without emitting
npm run dev         # watch mode
```

## Requirements

- Node.js >= 18.0.0 (native fetch)
- Next.js >= 14.0.0 (for `flite/next` only)

## License

MIT
