'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { Spin } from 'antd';
import { useGoogleMaps } from '../providers/GoogleMapsProvider';

const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '8px'
};

const center = {
    lat: 41.0082,
    lng: 28.9784
};

interface BookingMapProps {
    pickup: string;
    dropoff: string;
    onDistanceCalculated?: (distance: string, duration: string) => void;
}

const BookingMap: React.FC<BookingMapProps> = ({ pickup, dropoff, onDistanceCalculated }) => {
    const { isLoaded, loadError } = useGoogleMaps();
    const [response, setResponse] = useState<google.maps.DistanceMatrixResponse | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounce to prevent rapid API calls
    const [debouncedPickup, setDebouncedPickup] = useState(pickup);
    const [debouncedDropoff, setDebouncedDropoff] = useState(dropoff);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedPickup(pickup);
            setDebouncedDropoff(dropoff);
        }, 1000);
        return () => clearTimeout(timer);
    }, [pickup, dropoff]);

    const directionsCallback = useCallback((
        result: google.maps.DirectionsResult | null,
        status: google.maps.DirectionsStatus
    ) => {
        if (result !== null) {
            if (status === 'OK') {
                setDirections(result);
                setError(null);

                // Extract stats
                const route = result.routes[0];
                if (route && route.legs && route.legs[0]) {
                    const leg = route.legs[0];
                    const dist = leg.distance?.text || 'Hesaplanamadı';
                    const dur = leg.duration?.text || 'Hesaplanamadı';

                    if (onDistanceCalculated) {
                        onDistanceCalculated(dist, dur);
                    }
                }
            } else {
                console.error('Directions request failed:', status);
                setError('Rota hesaplanamadı.');
                setDirections(null);
                if (onDistanceCalculated) {
                    onDistanceCalculated('Hesaplanamadı', 'Hesaplanamadı');
                }
            }
            setLoading(false);
        }
    }, [onDistanceCalculated]);

    // Effect to trigger loading state when inputs change (before debounce)
    useEffect(() => {
        if (pickup !== debouncedPickup || dropoff !== debouncedDropoff) {
            setLoading(true);
        }
    }, [pickup, dropoff, debouncedPickup, debouncedDropoff]);


    if (loadError) {
        return <div>Harita yüklenirken hata oluştu.</div>;
    }

    if (!isLoaded) {
        return (
            <div style={{ width: '100%', height: '250px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', borderRadius: '8px' }}>
                <Spin />
                <div style={{ fontSize: '12px' }}>Harita Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '250px' }}>
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 10,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(255,255,255,0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px'
                }}>
                    <Spin />
                    <div style={{ fontSize: '12px' }}>Rota Hesaplanıyor...</div>
                </div>
            )}

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={10}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                }}
            >
                {/* 
                    DirectionsService logic:
                    Only render it when we have valid pickup/dropoff and they match the debounced values (stable).
                    Also check if we already have a result for these EXACT values to avoid infinite loops,
                    BUT DirectionsService internals are tricky. 
                    
                    Better pattern using the dedicated hook or just rendering the component 
                    controlled by state is standard in this library.
                    
                    The library documentation suggests rendering DirectionsService with props. 
                    It fires the callback when props change.
                    We use 'loading' to block re-renders or feedback.
                 */}

                {debouncedPickup && debouncedDropoff && (
                    <DirectionsService
                        options={{
                            destination: debouncedDropoff,
                            origin: debouncedPickup,
                            travelMode: 'DRIVING' as google.maps.TravelMode,

                        }}
                        callback={directionsCallback}
                    />
                )}

                {directions && (
                    <DirectionsRenderer
                        options={{
                            directions: directions,

                        }}
                    />
                )}
            </GoogleMap>
        </div>
    );
};

export default BookingMap;
