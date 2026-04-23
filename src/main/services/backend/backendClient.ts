interface BackendRequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: string;
  token?: string | null;
}

export class BackendClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
  }
}

const DEFAULT_BACKEND_URL = "http://localhost:8000/api/v1";

const parsePayload = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

export class BackendClient {
  constructor(
    private readonly baseUrl: string = process.env.OYNA_BACKEND_URL?.replace(/\/+$/, "") || DEFAULT_BACKEND_URL,
  ) {}

  async request<T>(path: string, options: BackendRequestOptions = {}): Promise<T> {
    const headers = new Headers({ Accept: "application/json" });
    if (options.body) {
      headers.set("Content-Type", "application/json");
    }
    if (options.token) {
      headers.set("Authorization", `Bearer ${options.token}`);
    }

    const response = await fetch(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ?? null,
    });

    const payload = await parsePayload(response);
    if (!response.ok) {
      const message =
        typeof payload === "object" && payload && "detail" in payload
          ? String((payload as { detail: unknown }).detail)
          : response.statusText || "Backend request failed";
      throw new BackendClientError(message, response.status, payload);
    }

    return payload as T;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }
}
