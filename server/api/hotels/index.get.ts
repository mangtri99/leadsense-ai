import { getHotelsByDestination, formatHotelForUI } from '../../utils/hotels'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const destination = (query.destination as string || '').trim()
  const limit = Math.min(20, Number(query.limit) || 6)
  const ids = query.ids ? (query.ids as string).split(',').map(s => s.trim()).filter(Boolean) : null

  const fetchLimit = ids ? Math.max(50, limit) : limit
  const hotels = await getHotelsByDestination(destination, fetchLimit)

  const filtered = ids ? hotels.filter(h => ids.includes(h.id)) : hotels
  return filtered.slice(0, limit).map(h => formatHotelForUI(h))
})
