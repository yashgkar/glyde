<p align="center">
  <h1 align="center">glyde</h1>
  <p align="center">A lightweight, TypeScript-first HTTP client built on native <code>fetch</code>. Zero dependencies.</p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/glyde"><img src="https://img.shields.io/npm/v/glyde" alt="npm version" /></a>
  <a href="https://github.com/yashgarudkar/glyde/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/glyde" alt="license" /></a>
  <a href="https://www.npmjs.com/package/glyde"><img src="https://img.shields.io/bundlephobia/minzip/glyde" alt="bundle size" /></a>
  <img src="https://img.shields.io/badge/dependencies-0-green" alt="zero dependencies" />
</p>

---

## Why glyde?

- **Zero dependencies** — no supply chain risk, no transitive vulnerabilities
- **Built on native `fetch`** — works in browsers, Node.js 18+, Bun, Deno
- **TypeScript-first** — full generic inference on every request
- **Tiny** — 5.25 KB minified, 1.73 KB gzipped
- **Interceptors** — async request/response pipelines with eject support
- **Typed errors** — catch by type, not string matching

## Install

```bash
npm install glyde
```

```bash
pnpm add glyde
```

```bash
yarn add glyde
```

## Quick Start

```ts
import plane from "glyde"

const api = plane({ baseURL: "https://api.example.com/v1" })

// GET
const { data } = await api.get<User[]>("/users")

// POST
await api.post<User>("/users", { name: "Yash" })

// With query params
await api.get("/search", { params: { q: "glyde", page: 1 } })
```

## API

### `plane(config?)`

Creates a new HTTP client instance. Every call returns an independent instance with its own config and interceptors.

```ts
import plane from "glyde"
// or
import { plane } from "glyde"

const api = plane({
  baseURL: "https://api.example.com",
  timeout: 5000,
  headers: { "X-App": "myapp" },
  withCredentials: true,
})
```

### Methods

| Method    | Signature                               |
| --------- | --------------------------------------- |
| `get`     | `api.get<T>(url, config?)`              |
| `post`    | `api.post<T>(url, data?, config?)`      |
| `put`     | `api.put<T>(url, data?, config?)`       |
| `patch`   | `api.patch<T>(url, data?, config?)`     |
| `delete`  | `api.delete<T>(url, config?)`           |
| `head`    | `api.head<T>(url, config?)`             |
| `request` | `api.request<T>(config)`                |
| `upload`  | `api.upload<T>(url, formData, config?)` |
| `stream`  | `api.stream(url, config?)`              |

Every method returns `Promise<GlydeResponse<T>>`:

```ts
interface GlydeResponse<T> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  config: RequestConfig
}
```

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

## Interceptors

Add request/response middleware with full async support.

### Request interceptor

```ts
api.interceptors.request.use((config) => ({
  ...config,
  headers: { ...config.headers, Authorization: `Bearer ${token}` },
}))
```

### Response interceptor

```ts
api.interceptors.response.use((response) => ({
  ...response,
  data: response.data.result, // unwrap nested response
}))
```

### Async interceptors

```ts
api.interceptors.request.use(async (config) => {
  const token = await getToken()
  return {
    ...config,
    headers: { ...config.headers, Authorization: `Bearer ${token}` },
  }
})
```

### Error handler

```ts
api.interceptors.request.use(
  (config) => config,
  (error) => console.error("interceptor failed:", error),
)
```

### Eject

```ts
const id = api.interceptors.request.use(myInterceptor)
api.interceptors.request.eject(id)
```

## Error Handling

glyde throws typed errors you can catch precisely:

```ts
import { isHttpError, isTimeoutError, isGlydeError } from "glyde"

try {
  await api.get("/data")
} catch (err) {
  if (isHttpError(err)) {
    console.log(err.status) // 404
    console.log(err.response?.data) // parsed body
    console.log(err.config.url) // "/data"
  }

  if (isTimeoutError(err)) {
    // request exceeded timeout
  }

  if (isGlydeError(err)) {
    // any glyde error (network, timeout, http)
  }
}
```

### Error hierarchy

```
GlydeError (base)
├── HttpError      — non-2xx response (status, response, config)
├── TimeoutError   — request exceeded timeout
└── NetworkError   — fetch failed (DNS, offline, CORS)
```

## File Upload

Content-Type is automatically removed for `FormData` so the browser sets the correct multipart boundary:

```ts
const form = new FormData()
form.append("file", file)
form.append("name", "avatar")

await api.upload("/upload", form)
```

## Streaming

Returns a `ReadableStream` without consuming the response body:

```ts
const { data: stream } = await api.stream("/events")
// data is ReadableStream
```

## Cancellation

```ts
const controller = new AbortController()
api.get("/slow", { signal: controller.signal })

// cancel it
controller.abort()
```

## Timeout

```ts
const api = plane({ timeout: 5000 }) // 5 seconds

// or per-request
api.get("/slow", { timeout: 10000 })
```

## Next.js Usage

glyde is framework-agnostic, but here's the recommended pattern for Next.js App Router.

### Server instance (tower)

```ts
// lib/api/server.ts
import plane from "glyde"
import { cookies } from "next/headers"

export async function tower() {
  const api = plane({ baseURL: process.env.API_BASE_URL })
  const cookieStore = await cookies()

  api.interceptors.request.use((config) => {
    const token = cookieStore.get("access_token")?.value
    if (token) {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
    }
    return config
  })

  return api
}
```

### Client instance (passenger)

```ts
// lib/api/client.ts
"use client"
import plane from "glyde"

export const passenger = plane({ baseURL: "/api/proxy" })

passenger.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.status === 401) window.location.href = "/login"
    throw error
  },
)
```

### Token refresh via middleware

Server Components cannot write cookies. Handle token refresh in Next.js middleware:

```ts
// middleware.ts
import { NextResponse } from "next/server"

export async function middleware(request) {
  const access = request.cookies.get("access_token")?.value
  const refresh = request.cookies.get("refresh_token")?.value

  if (!access && refresh) {
    const res = await fetch(`${process.env.API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })

    if (res.ok) {
      const { access: newToken } = await res.json()
      const response = NextResponse.next()
      response.cookies.set("access_token", newToken, {
        httpOnly: true,
        secure: true,
      })
      return response
    }
  }

  return NextResponse.next()
}
```

## Scripts

```bash
npm run build        # ESM + CJS + .d.ts
npm run typecheck    # tsc --noEmit
npm run test         # vitest
npm run test:watch   # vitest --watch
npm run dev          # rollup watch mode
```

## Requirements

- Node.js >= 18.0.0 (native fetch required)
- TypeScript >= 5.0 (recommended)

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your branch (`git checkout -b feature/my-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit and push
6. Open a pull request

## License

[MIT](./LICENSE) --- Made by [Yash Garudkar](https://github.com/yashgkar)
