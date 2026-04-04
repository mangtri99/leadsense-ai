import hotelsData from '../../hotels.json'

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

const mockHotels = hotelsData as HotelRaw[]

// --- Mock implementations ---

function mockGetByDestination(destination: string, limit: number): HotelRaw[] {
  const query = destination.toLowerCase().trim()
  if (!query) return []

  return mockHotels
    .filter((hotel) => {
      if (!hotel.hasRoomAvailability) return false
      const d = hotel.destinationDetails
      const fields = [
        d.city,
        d.country,
        d.displayName,
        ...(d.destinations || []),
        ...(d.keywords || [])
      ].map(s => s?.toLowerCase() || '')
      return fields.some(f => f.includes(query) || query.includes(f.split(',')[0]?.trim() || ''))
    })
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}

function mockGetById(ids: string[]): HotelRaw[] {
  return mockHotels.filter(h => ids.includes(h.id))
}

// --- Public async API ---

export async function getHotelsByDestination(destination: string, limit = 10): Promise<HotelRaw[]> {
  const config = useRuntimeConfig()

  if (config.useMockData) {
    return mockGetByDestination(destination, limit)
  }

  // Real API mode
  if (!config.apiBaseUrl) {
    console.warn('[hotels] API_BASE_URL tidak dikonfigurasi, fallback ke mock data')
    return mockGetByDestination(destination, limit)
  }

  try {
    const response = await $fetch<HotelRaw[]>(`${config.apiBaseUrl}/hotels`, {
      query: { destination, limit }
    })
    return Array.isArray(response) ? response : []
  } catch (err) {
    console.error('[hotels] Real API gagal, fallback ke mock data:', err)
    return mockGetByDestination(destination, limit)
  }
}

export async function getHotelsById(ids: string[]): Promise<HotelRaw[]> {
  if (!ids.length) return []

  const config = useRuntimeConfig()

  if (config.useMockData) {
    return mockGetById(ids)
  }

  if (!config.apiBaseUrl) {
    console.warn('[hotels] API_BASE_URL tidak dikonfigurasi, fallback ke mock data')
    return mockGetById(ids)
  }

  try {
    const response = await $fetch<HotelRaw[]>(`${config.apiBaseUrl}/hotels`, {
      query: { ids: ids.join(',') }
    })
    return Array.isArray(response) ? response : []
  } catch (err) {
    console.error('[hotels] Real API gagal, fallback ke mock data:', err)
    return mockGetById(ids)
  }
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
