

let cachedAddress = null;
let fetching = false;

export async function userLocation(vin, setLocation, location) {
  console.log("GEO being called with VIN:", vin);

  if (!vin) {
    console.log("No VIN provided — skipping location lookup.");
    return;
  }

  if (cachedAddress) {
    console.log("Using cached address:", cachedAddress);
    setLocation && setLocation(cachedAddress);
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

          const address = await getAddressFromCoordinates(latitude, longitude);
          cachedAddress = address;
          setLocation && setLocation(address);
          console.log("Address:", address);

          setTimeout(() => {
            cachedAddress = null;
            fetching = false;
          }, 2 * 60 * 1000);
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
  console.log("Loaded API Key:", apiKey);

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