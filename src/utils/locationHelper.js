// src/utils/locationHelper.js

export const getReadableLocationName = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    const data = await response.json();
    
    if (data && data.display_name) {
      const houseNumber = data.address?.house_number || '';
      const road = data.address?.road || '';
      const suburb = data.address?.suburb || '';
      
      return `${houseNumber} ${road}, ${suburb}`.trim() || data.display_name;
    }
    return 'Beni Gold Apapa, Total Compound'; 
  } catch (error) {
    console.warn('Geocoding lookup failed, using default beat name.', error);
    return 'Beni Gold Apapa, Total Compound'; 
  }
};

// Calculate exact distance in meters between guard's GPS and assigned beat coordinates
export const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Radius of the earth in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};