let cachedAddress = null;
let fetching = false;

export async function userLocation(vin, setLocation, location) {


  console.log("GEO being called with VIN:", vin);

  // add alert for user to check settings
  if (!vin) {
    console.log("No VIN provided — skipping location lookup.");
    return;
  }

  if (cachedAddress) {
    console.log("Using cached address:", cachedAddress);
    setLocation && setLocation({ address: cachedAddress.address, latitude: cachedAddress.latitude, longitude: cachedAddress.longitude });
    return;
  }

  if (fetching) {
    console.log("Fetch already in progress — skipping.");
    return;
  }

  fetching = true;

  try {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      fetching = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log("Latitude:", latitude, "Longitude:", longitude);

          // Dealer coordinates
          const dealerLat = 40.862503;
          const dealerLon = -74.0966241;
          // Haversine formula (returns distance in miles)
          function haversine(lat1, lon1, lat2, lon2) {
            const toRad = (x) => (x * Math.PI) / 180;
            const R = 3958.8; // Earth radius in miles
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          }

          const distanceToDealer = haversine(latitude, longitude, dealerLat, dealerLon);
          console.log("Distance to dealer (miles):", distanceToDealer);

          let address;
          if (distanceToDealer <= 0.1) {
            // Snap to dealer location
            address = "350 S Main St, Wood-Ridge, NJ 07075"; // Dealer's main address
            console.log("User is within 0.4 miles, snapping to dealer address:", address);
          } else {
            // Use actual user location
            address = await getAddressFromCoordinates(latitude, longitude);
            console.log("Address:", address);
          }
          cachedAddress = { address, latitude, longitude };
          setLocation && setLocation({ address, latitude, longitude });

          setTimeout(() => {
            cachedAddress = null;
            fetching = false;
          }, 5 * 60 * 1000);
        } catch (innerErr) {
          console.error("Error during position handling or reverse geocoding:", innerErr);
          fetching = false;
        }
      },
      (error) => {
        console.error("Error getting location:", error.message || error);
        fetching = false;
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    fetching = false;
  }
}

async function getAddressFromCoordinates(lat, lon) {
  const apiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing LocationIQ API key. Please set VITE_LOCATIONIQ_API_KEY in your .env file.");
  }

  const url = `https://locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lon}&format=json`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text(); // for better debugging
    throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log("USER'S ADDRESS:", data);
  return data.display_name;
}