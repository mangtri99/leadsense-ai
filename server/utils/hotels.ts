export interface HotelRaw {
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

function getDefaultDates() {
  const checkIn = new Date()
  checkIn.setDate(checkIn.getDate() + 14)
  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + 3)
  return {
    checkInDate: checkIn.toISOString().slice(0, 10),
    checkOutDate: checkOut.toISOString().slice(0, 10)
  }
}

async function resolveDestinationName(query: string, baseUrl: string, tkey: string): Promise<string> {
  try {
    const res = await $fetch<{ result: { displayFullName: string }[] }>(`${baseUrl}/api/search/destinations/suggestions`, {
      method: 'POST',
      headers: { 'x-tkey': tkey, 'Content-Type': 'application/json' },
      body: { query, count: 1, filters: { hasAccommodation: true } }
    })
    return res?.result?.[0]?.displayFullName || query
  } catch {
    return query
  }
}

async function fetchHotelsFromApi(destinationFullName: string, limit: number, baseUrl: string, tkey: string): Promise<HotelRaw[]> {
  const { checkInDate, checkOutDate } = getDefaultDates()
  const res = await $fetch<{ result: HotelRaw[] }>(`${baseUrl}/api/search/accommodations/destination`, {
    method: 'POST',
    headers: { 'x-tkey': tkey, 'Content-Type': 'application/json' },
    body: {
      destinationFullName,
      page: { size: limit, current: 1 },
      availabilityRequest: {
        checkInDate,
        checkOutDate,
        currency: 'USD',
        guestsCount: { adult: 2, child: 0, infant: 0 },
        roomsCount: 1
      },
      filters: {}
    }
  })
  return Array.isArray(res?.result) ? res.result : []
}

// --- Public async API ---

export async function getHotelsByDestination(destination: string, limit = 10): Promise<HotelRaw[]> {
  const config = useRuntimeConfig()
  const destinationFullName = await resolveDestinationName(destination, config.apiBaseUrl, config.apiTkey)
  return fetchHotelsFromApi(destinationFullName, limit, config.apiBaseUrl, config.apiTkey)
}

export function formatHotelForPrompt(hotel: HotelRaw, index: number): string {
  const stars = hotel.starRating ? `⭐${hotel.starRating}` : 'Unrated'
  const rating = `${(hotel.guestRating / 10).toFixed(1)}/10 (${hotel.guestRatingCount} reviews)`
  const price = `${hotel.currency} ${hotel.currentCheapestPrice}/night`
  const amenities = (hotel.hotelAmenities || [])
    .filter(a => KEY_AMENITIES.some(k => a.includes(k)))
    .slice(0, 4)
    .join(', ')
  const refundable = hotel.isRefundable ? 'Free cancellation' : 'Non-refundable'

  return `[${index + 1}] ${hotel.name}
    ${stars} | Rating: ${rating} | ${price}
    Location: ${hotel.destinationDetails.displayName}
    Amenities: ${amenities || 'N/A'}
    ${refundable}
    ID: ${hotel.id}`
}

export function formatHotelForUI(hotel: HotelRaw) {
  return {
    id: hotel.id,
    name: hotel.name,
    starRating: hotel.starRating,
    guestRating: hotel.guestRating,
    guestRatingCount: hotel.guestRatingCount,
    price: hotel.currentCheapestPrice,
    strikethroughPrice: hotel.currentStrikeThroughPrice > 0 ? hotel.currentStrikeThroughPrice : null,
    strikethroughDesc: hotel.currentStrikeThroughDescription,
    currency: hotel.currency,
    image: hotel.images?.[0] ?? null,
    propertyType: hotel.propertyType,
    city: hotel.destinationDetails?.city,
    country: hotel.destinationDetails?.country,
    displayName: hotel.destinationDetails?.displayName,
    isRefundable: hotel.isRefundable,
    amenities: (hotel.hotelAmenities || [])
      .filter(a => KEY_AMENITIES.some(k => a.includes(k)))
      .slice(0, 3)
  }
}
