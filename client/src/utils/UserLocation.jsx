import { useState } from 'react'

export async function userLocation(vin, setLocation, location) {

    const [error, setError] = useState("")
  
    if (!vin) {
      return;
    }
  
    try {
      if (!navigator.geolocation) {
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
  
            const address = await getAddressFromCoordinates(latitude, longitude);
            if (setLocation) {
                setLocation(address);
              }

          } catch (innerErr) {
            setError(innerErr)
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
  
    const url = `https://locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lon}&format=json`;
    const response = await fetch(url);
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  
    const data = await response.json();
    console.log("USER'S ADDRESS:", data);
    return data.display_name;
  }
