// src/constants/locations.js

export const SUNSHINE_LOCATIONS = [
  { name: 'Bishop Oluwole', latitude: 6.4281, longitude: 3.4219, radiusMeters: 100 },
  { name: 'Beni Gold Apapa', latitude: 6.4474, longitude: 3.3562, radiusMeters: 100 },
  { name: 'Beni Gold Orile', latitude: 6.4631, longitude: 3.3284, radiusMeters: 100 },
  { name: 'Zion Court', latitude: 6.4385, longitude: 3.4731, radiusMeters: 100 },
  { name: 'Beni Apartment', latitude: 6.4422, longitude: 3.4110, radiusMeters: 100 },
  { name: 'Ibukun House', latitude: 6.4350, longitude: 3.4241, radiusMeters: 100 },
  { name: 'Beni Gold Marina', latitude: 6.4531, longitude: 3.3892, radiusMeters: 100 },
  { name: 'Ibeju Warehouse', latitude: 6.4820, longitude: 3.6450, radiusMeters: 150 },
  { name: 'Ilasun', latitude: 6.4480, longitude: 3.5120, radiusMeters: 100 },
  { name: 'Beni Gold VI', latitude: 6.4281, longitude: 3.4219, radiusMeters: 100 },
  { name: 'Beni Gold Ikoyi', latitude: 6.4541, longitude: 3.4207, radiusMeters: 100 },
  { name: 'Head Office', latitude: 6.5244, longitude: 3.3792, radiusMeters: 100 },
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
    name: siteName || 'Beni Gold Ikoyi',
    latitude: 6.4541,
    longitude: 3.4207,
    allowedRadiusMeters: 100
  };
}