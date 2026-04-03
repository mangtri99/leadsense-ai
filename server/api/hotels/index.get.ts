import hotelsData from '../../../hotels.json'

interface HotelRaw {
  id: string
  name: string
  popularity: number
  starRating: number | null
  guestRating: number
  guestRatingCount: number
  currentCheapestPrice: number
  currentStrikeThroughPrice: number
  currentStrikeThroughDescription: string | null
  currency: string
  images: string[]
  propertyType: string
  hotelAmenities: string[]
  hasRoomAvailability: boolean
  isRefundable: boolean
  destinationDetails: {
    city: string
    country: string
    displayName: string
    destinations: string[]
    keywords: string[]
  }
}

const KEY_AMENITIES = ['Free WiFi', 'Pool', 'pool', 'Fitness', 'Breakfast', 'Free parking', 'Airport', 'Spa', 'Restaurant']

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const destination = (query.destination as string || '').toLowerCase().trim()
  const limit = Math.min(20, Number(query.limit) || 6)

  let hotels = hotelsData as HotelRaw[]

  if (destination) {
    hotels = hotels.filter((hotel) => {
      const d = hotel.destinationDetails
      const fields = [
        d.city,
        d.country,
        d.displayName,
        ...(d.destinations || []),
        ...(d.keywords || [])
      ].map(s => s?.toLowerCase() || '')

      return fields.some(f => f.includes(destination) || destination.includes(f.split(',')[0]?.trim() || ''))
    })
  }

  const results = hotels
    .filter(h => h.hasRoomAvailability)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
    .map(h => ({
      id: h.id,
      name: h.name,
      starRating: h.starRating,
      guestRating: h.guestRating,
      guestRatingCount: h.guestRatingCount,
      price: h.currentCheapestPrice,
      strikethroughPrice: h.currentStrikeThroughPrice > 0 ? h.currentStrikeThroughPrice : null,
      strikethroughDesc: h.currentStrikeThroughDescription,
      currency: h.currency,
      image: h.images?.[0] ?? null,
      propertyType: h.propertyType,
      city: h.destinationDetails?.city,
      country: h.destinationDetails?.country,
      displayName: h.destinationDetails?.displayName,
      isRefundable: h.isRefundable,
      amenities: (h.hotelAmenities || [])
        .filter(a => KEY_AMENITIES.some(k => a.includes(k)))
        .slice(0, 3)
    }))

  return results
})
