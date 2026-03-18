import api from "./api"

export const servicesService = {

  async list(filters = {}) {
    const { data } = await api.get("/api/services", { params: filters })
    return data
  },

  async create(payload) {
    const { data } = await api.post("/api/services", payload)
    return data
  },

  async get(id) {
    const { data } = await api.get(`/api/services/${id}`)
    return data
  },

  async update(id, payload) {
    const { data } = await api.put(`/api/services/${id}`, payload)
    return data
  },

  async delete(id) {
    await api.delete(`/api/services/${id}`)
  },

  async getMetrics(id, hours = 24) {
    const { data } = await api.get(`/api/services/${id}/metrics`, { params: { hours } })
    return data
  },

  async triggerCheck(id) {
    const { data } = await api.post(`/api/services/${id}/check`)
    return data
  },
}
