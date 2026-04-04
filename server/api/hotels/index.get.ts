import { getHotelsByDestination, getHotelsById, formatHotelForUI } from '../../utils/hotels'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const destination = (query.destination as string || '').trim()
  const ids = (query.ids as string || '').split(',').map(s => s.trim()).filter(Boolean)
  const limit = Math.min(20, Number(query.limit) || 6)

  // Fetch by explicit IDs (for AI-selected hotels)
  if (ids.length) {
    const hotels = getHotelsById(ids)
    return hotels.map(h => formatHotelForUI(h))
  }

  // Fetch by destination filter
  const hotels = getHotelsByDestination(destination, limit)
  return hotels.map(h => formatHotelForUI(h))
})
