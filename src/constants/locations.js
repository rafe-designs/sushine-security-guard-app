// src/constants/locations.js

export const SUNSHINE_LOCATIONS = [
  { name: 'Bishop Oluwole', latitude: 6.4234, longitude: 3.4178, radiusMeters: 100 },
  { name: 'Beni Gold Apapa', latitude: 6.449, longitude: 3.359, radiusMeters: 100 },
  { name: 'Beni Gold Orile', latitude: 6.4540, longitude: 3.3946, radiusMeters: 100 },
  { name: 'Zion Court', latitude: 6.4385, longitude: 3.4731, radiusMeters: 100 },
  { name: 'Beni Apartment', latitude: 6.4422, longitude: 3.4110, radiusMeters: 100 },
  { name: 'Ibukun House', latitude: 6.4284, longitude:  3.4298, radiusMeters: 100 },
  { name: 'Beni Gold Marina', latitude: 6.4531, longitude: 3.3892, radiusMeters: 100 },
  { name: 'Ibeju Warehouse', latitude: 6.4820, longitude: 3.6450, radiusMeters: 150 },
  { name: 'Ilasun', latitude: 6.4480, longitude: 3.5120, radiusMeters: 100 },
  { name: 'Beni Gold VI', latitude: 6.4345, longitude: 3.4186, radiusMeters: 100 },
  { name: 'Beni Gold Ikoyi', latitude: 6.4568, longitude:  3.4389, radiusMeters: 100 },
  { name: 'Head Office', latitude: 6.4280, longitude: 3.4173, radiusMeters: 100 },
  { name: 'HQ', latitude: 6.6494, longitude: 3.3081, radiusMeters: 100 },
  { name: 'Fatai Durosimi', latitude: 6.4420, longitude: 3.5010, radiusMeters: 100 },
  { name: 'Bashorun', latitude: 6.4310, longitude: 3.4350, radiusMeters: 100 },
  { name: 'Wharf Road', latitude: 6.4435, longitude: 3.3650, radiusMeters: 100 },
  { name: 'Orile Filing Station', latitude: 6.4610, longitude: 3.3320, radiusMeters: 100 },
  { name: 'Stacco Filing Station', latitude: 6.5510, longitude: 3.3420, radiusMeters: 100 },
  { name: 'Okoko', latitude: 6.4650, longitude: 3.1950, radiusMeters: 150 },
  { name: 'Ibeju House', latitude: 6.4830, longitude: 3.6480, radiusMeters: 100 }
];

// Helper to pull coordinates by site name with a safe fallback
export function getBeatCoordinates(siteName) {
  const found = SUNSHINE_LOCATIONS.find(
    (loc) => loc.name.toLowerCase() === (siteName || '').toLowerCase()
  );
  
  if (found) {
    return {
      name: found.name,
      latitude: found.latitude,
      longitude: found.longitude,
      allowedRadiusMeters: found.radiusMeters
    };
  }

  // Default fallback if site name doesn't match exactly
  return {
    name: siteName || 'unknown',
    latitude: 0,
    longitude: 0,
    allowedRadiusMeters: 100
  };
}