/** Turn FastAPI / axios errors into a user-visible string. */
export function formatApiError(err, fallback) {
  const detail = err?.response?.data?.detail

  if (detail) {
    if (typeof detail === "string") return detail
    if (Array.isArray(detail)) {
      return detail
        .map((item) => item?.msg || item?.message || String(item))
        .filter(Boolean)
        .join(" ")
    }
  }

  if (err?.code === "ECONNABORTED" || /timeout/i.test(err?.message || "")) {
    return "The server is waking up — wait a few seconds and try again."
  }

  if (!err?.response) {
    return "Cannot reach the server — check your connection and try again."
  }

  const status = err.response.status
  if (status === 502 || status === 503 || status === 504) {
    return "The server is temporarily unavailable — please try again in a moment."
  }

  return fallback
}

/** Retry transient failures (cold start, gateway errors). */
export async function withRetry(requestFn, { retries = 3, delayMs = 2500 } = {}) {
  let lastError
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await requestFn()
    } catch (err) {
      lastError = err
      const status = err?.response?.status
      const transient =
        !err?.response ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        err?.code === "ECONNABORTED"

      if (!transient || attempt === retries - 1) throw err
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)))
    }
  }
  throw lastError
}
