# API Integration

BASE URL: https://www.playtravel.com

## Get Hotels Destination
### POST /api/search/accommodations/destination

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `x-tkey` | Yes | API auth token |
| `Content-Type` | Yes | `application/json` |

## Request Example

```json
{
  "destinationFullName": "Bali, Indonesia",
  "page": {
    "size": 5,
    "current": 1
  },
  "availabilityRequest": {
    "checkInDate": "2026-04-10",
    "checkOutDate": "2026-04-13",
    "currency": "USD",
    "guestsCount": {
      "adult": 2,
      "child": 0,
      "infant": 0
    },
    "roomsCount": 1
  },
  "filters": {}
}
```

## Response Example 
please check hotelsV2.json
we should only take the data from result array

> **Note:** Before calling this endpoint, the backend first resolves `destinationFullName` via the **Destination Suggestions** endpoint below.



---

## Destination Suggestions

### POST /api/search/destinations/suggestions

Resolves a free-text destination query to a canonical full name before calling the destination search endpoint.

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `x-tkey` | Yes | API auth token |
| `Content-Type` | Yes | `application/json` |

**Request Body**

```json
{
  "query": "Bali, Indonesia",
  "count": 1,
  "filters": {
    "hasAccommodation": true
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | Destination text (may include area: `"Seminyak, Bali, Indonesia"`) |
| `count` | int | Max suggestions to return (always `1` internally) |
| `filters.hasAccommodation` | bool | Only return destinations with available hotels |

**Response**

```json
{
  "result": [
    {
      "displayFullName": "Bali, Indonesia"
    }
  ]
}
```

If the call fails or returns no results, the backend falls back to using the original query string.

