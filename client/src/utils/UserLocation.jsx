

export async function userLocation(vin, setLocation, location) {
    console.log("GEO being called with VIN:", vin);
  
    if (!vin) {
      console.log("No VIN provided — skipping location lookup.");
      return;
    }
  
    try {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            console.log("Latitude:", latitude, "Longitude:", longitude);
  
            const address = await getAddressFromCoordinates(latitude, longitude);
            if (setLocation) {
                setLocation(address);
                console.log(location)
              }
            console.log("Address:", address);
          } catch (innerErr) {
            console.error("Error during position handling or reverse geocoding:", innerErr);
          }
        },
        (error) => {
          console.error("Error getting location:", error.message || error);
        }
      );
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  }
  
  async function getAddressFromCoordinates(lat, lon) {
    const apiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY;
    console.log("Loaded API Key:", apiKey);
  
    if (!apiKey) {
      throw new Error("Missing LocationIQ API key. Please set VITE_LOCATIONIQ_API_KEY in your .env file.");
    }
  
    const url = `https://us1.locationiq.com/v1/reverse?key=${apiKey}&lat=${lat}&lon=${lon}&format=json`;


    const response = await fetch(url);
  
    if (!response.ok) {
      const errorText = await response.text(); // for better debugging
      throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  
    const data = await response.json();
    console.log("USER'S ADDRESS:", data);
    return data.display_name;
  }

