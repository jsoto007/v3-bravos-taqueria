export async function userLocatoin() {
  try {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Latitude:", latitude, "Longitude:", longitude);

        const address = await getAddressFromCoordinates(latitude, longitude);
        console.log("Address:", address);
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

async function getAddressFromCoordinates(lat, lon) {
  const apiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY;
  const response = await fetch(
    `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lon}&format=json`
  );
  const data = await response.json();
  console.log("USER'S ADDRESS:", data)
  return data.display_name;
}