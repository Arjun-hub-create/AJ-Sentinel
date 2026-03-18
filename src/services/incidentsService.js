import api from "./api"

export const incidentsService = {
  async list(params = {}) {
    const { data } = await api.get("/api/incidents", { params })
    return data
  },
  async create(payload) {
    const { data } = await api.post("/api/incidents", payload)
    return data
  },
  async addUpdate(id, text) {
    const { data } = await api.post(`/api/incidents/${id}/updates`, { text })
    return data
  },
  async resolve(id) {
    const { data } = await api.post(`/api/incidents/${id}/resolve`)
    return data
  },
}
