import axios from 'axios';

// Interfaces
export interface RouteDetails {
    distanceKm: number;
    durationMin: number;
    coords: [number, number][]; // [lat, lng] array for polylines
}

export interface GeocodeResult {
    lat: number;
    lng: number;
    displayName: string;
}

/**
 * Geocode an address string using OpenStreetMap Nominatim
 */
export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
    try {
        const cleanAddress = address.trim();
        const queryParts = cleanAddress.split(',').map(s => s.trim());
        const mainSearchTerm = queryParts[0].toLowerCase();

        let lat = null;
        let lng = null;
        let displayName = '';

        // Strategy 1: Structured Query (if multiple parts)
        if (queryParts.length >= 2) {
            try {
                const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: {
                        city: queryParts[0],
                        state: queryParts[1], // Heuristic mapping
                        country: 'Turkey',
                        format: 'json',
                        limit: 5
                    }
                });

                if (res.data && res.data.length > 0) {
                    const bestMatch = res.data.find((item: any) =>
                        item.name?.toLowerCase().includes(mainSearchTerm) ||
                        item.display_name?.toLowerCase().startsWith(mainSearchTerm)
                    );
                    const selected = bestMatch || res.data[0];
                    lat = parseFloat(selected.lat);
                    lng = parseFloat(selected.lon);
                    displayName = selected.display_name;
                }
            } catch (err) {
                // Warning only, fall through to strategy 2
            }
        }

        // Strategy 2: Free Text
        if (lat === null || lng === null) {
            const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: cleanAddress,
                    format: 'json',
                    limit: 5,
                    countrycodes: 'tr',
                    addressdetails: 1
                }
            });

            if (res.data && res.data.length > 0) {
                const bestMatch = res.data.find((item: any) =>
                    item.name?.toLowerCase().includes(mainSearchTerm)
                );
                const selected = bestMatch || res.data[0];
                lat = parseFloat(selected.lat);
                lng = parseFloat(selected.lon);
                displayName = selected.display_name;
            }
        }

        if (lat !== null && lng !== null) {
            return { lat, lng, displayName };
        }
        return null;

    } catch (err) {
        console.error('Geocoding error:', err);
        return null;
    }
};

/**
 * Calculate route between two address strings using OSRM
 */
export const getRouteDetails = async (pickup: string, dropoff: string): Promise<RouteDetails | null> => {
    try {
        // 1. Geocode
        const pickupRes = await geocodeAddress(pickup);
        const dropoffRes = await geocodeAddress(dropoff);

        if (!pickupRes || !dropoffRes) {
            console.warn('Geocoding failed for route addresses');
            return null;
        }

        // 2. OSRM Route
        const routerUrl = `https://router.project-osrm.org/route/v1/driving/${pickupRes.lng},${pickupRes.lat};${dropoffRes.lng},${dropoffRes.lat}?overview=full&geometries=geojson`;
        const res = await axios.get(routerUrl);

        if (res.data.code === 'Ok' && res.data.routes && res.data.routes.length > 0) {
            const route = res.data.routes[0];

            return {
                distanceKm: Number((route.distance / 1000).toFixed(1)), // OSRM gives meters
                durationMin: Math.round(route.duration / 60), // OSRM gives seconds
                coords: route.geometry.coordinates.map((c: any) => [c[1], c[0]]) // GeoJSON is [lng, lat] -> convert to [lat, lng]
            };
        }

        return null;

    } catch (err) {
        console.error('Routing error:', err);
        return null;
    }
};
