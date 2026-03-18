import api from "./api"

export const logsService = {
  async list(params = {}) {
    const { data } = await api.get("/api/logs", { params })
    return data
  },
  async ingest(payload) {
    const { data } = await api.post("/api/logs", payload)
    return data
  },
  async stats(hours = 24) {
    const { data } = await api.get("/api/logs/stats", { params: { hours } })
    return data
  },
}
