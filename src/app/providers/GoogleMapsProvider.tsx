'use client';

import React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import apiClient from '@/lib/api-client';

const libraries: ("places" | "drawing" | "geometry")[] = ["places", "drawing", "geometry"];

const GoogleMapsContext = React.createContext({ isLoaded: false, loadError: undefined as Error | undefined });

export const useGoogleMaps = () => React.useContext(GoogleMapsContext);

const GoogleMapsLoader = ({ apiKey, children }: { apiKey: string, children: React.ReactNode }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: apiKey,
        libraries,
    });

    if (loadError) {
        console.error('Google Maps Load Error:', loadError);
        return <div>Google Maps yüklenemedi. Lütfen API anahtarınızı kontrol edin.</div>;
    }

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
            {children}
        </GoogleMapsContext.Provider>
    );
};

export default function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
    const [apiKey, setApiKey] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchApiKey = async () => {
            try {
                // First try to get from env (dev/build time)
                const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                if (envKey) {
                    setApiKey(envKey);
                    setIsLoading(false);
                    return;
                }

                // If not in env, fetch from backend settings using apiClient
                // apiClient handles the base URL
                const res = await apiClient.get('/api/tenant/info');
                const data = res.data;

                if (data.success && data.data.tenant.settings?.googleMaps?.apiKey) {
                    setApiKey(data.data.tenant.settings.googleMaps.apiKey);
                }
            } catch (error) {
                console.error('Failed to fetch Google Maps API key:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApiKey();
    }, []);

    if (isLoading) {
        return null; // or a spinner
    }

    if (!apiKey) {
        // Fallback or error if no key is found anywhere
        console.warn('Google Maps API Key not found in env or settings.');
        return <>{children}</>; // Render children without maps support or show error? 
        // Better to render children so app doesn't break, but maps won't work.
    }

    return <GoogleMapsLoader apiKey={apiKey}>{children}</GoogleMapsLoader>;
}
