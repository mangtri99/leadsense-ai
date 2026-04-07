## Hotel Detail URL Pattern

We need add button detail to card recommended hotels, when user click this button, it will redirect to hotel detail page with URL pattern:

```
{siteBase}/accommodation/detail/{slug}
  ?HotelCode={hotelCode}
  &CheckIn={checkin}
  &CheckOut={checkout}
  &CurrencyCode={currencyCode}
  &Provider={provider}
  &contentItemId={contentItemId}
  &Adults={adults}
  &Children={children}
  &Infants={infants}
  &Rooms={rooms}
```
### Description

slug = hotel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
hotelCode = hotel.providerPropertyId || hotel.ContentProviderPropertyId
checkin = *based on customer request*
checkout = *based on customer request*
contentItemId = hotel.productId
provider = hotel.provider
currencyCode = hotel.currency
adults = *based on customer request, default 2*
children = *based on customer request, default 0*
infants = *based on customer request, default 0*
rooms = *based on customer request, default 1*


