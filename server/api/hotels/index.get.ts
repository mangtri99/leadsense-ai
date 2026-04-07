import { getHotelsByDestination, formatHotelForUI } from '../../utils/hotels'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const destination = (query.destination as string || '').trim()
  const limit = Math.min(20, Number(query.limit) || 6)

  const hotels = await getHotelsByDestination(destination, limit)
  return hotels.map(h => formatHotelForUI(h))
})
