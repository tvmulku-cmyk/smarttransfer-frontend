'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Modal, Button, Input, Spin } from 'antd';
import { EnvironmentOutlined, CheckOutlined } from '@ant-design/icons';
import { useGoogleMaps } from '../providers/GoogleMapsProvider';
import LocationSearchInput from './LocationSearchInput';
import { getGeocode, getLatLng } from 'use-places-autocomplete';

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
};

const defaultCenter = {
    lat: 41.0082,
    lng: 28.9784
};

interface MapPickerModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (address: string, lat: number, lng: number) => void;
    initialLocation?: { lat: number; lng: number } | null;
    initialAddress?: string;
    title?: string;
    country?: string;
}

const MapPickerModal: React.FC<MapPickerModalProps> = ({
    visible,
    onCancel,
    onConfirm,
    initialLocation,
    initialAddress,
    title = "Konum Seçin",
    country
}) => {
    const { isLoaded } = useGoogleMaps();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);
    const [address, setAddress] = useState(initialAddress || '');
    const [loadingAddress, setLoadingAddress] = useState(false);

    // Sync address when prop changes
    useEffect(() => {
        if (visible) {
            if (initialAddress) {
                setAddress(initialAddress);
            }
            if (initialLocation && initialLocation.lat && initialLocation.lng) {
                setCenter(initialLocation);
                setMarkerPosition(initialLocation);
            } else if (!initialLocation) {
                // Try to get user location if no initial location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const pos = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                            };
                            setCenter(pos);
                            setMarkerPosition(pos);
                        },
                        () => {
                            // Handle location error or denial - stay at default
                        }
                    );
                }
            }
        }
    }, [visible, initialLocation, initialAddress]);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const handleSearchSelect = async (selectedAddress: string) => {
        setAddress(selectedAddress);
        try {
            const results = await getGeocode({ address: selectedAddress });
            const { lat, lng } = await getLatLng(results[0]);
            const newPos = { lat, lng };
            setCenter(newPos);
            setMarkerPosition(newPos);
        } catch (error) {
            console.error("Geocoding error: ", error);
        }
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPos = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            };
            setMarkerPosition(newPos);
            geocodePosition(newPos);
        }
    };

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPos = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            };
            setMarkerPosition(newPos);
            geocodePosition(newPos);
        }
    };

    const geocodePosition = (pos: { lat: number, lng: number }) => {
        setLoadingAddress(true);
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: pos }, (results, status) => {
            if (status === "OK" && results && results[0]) {
                setAddress(results[0].formatted_address);
            } else {
                setAddress("Konum adresi bulunamadı");
            }
            setLoadingAddress(false);
        });
    };

    const handleConfirm = () => {
        onConfirm(address, markerPosition.lat, markerPosition.lng);
        onCancel();
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <EnvironmentOutlined style={{ color: '#1890ff' }} />
                    <span>{title}</span>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="back" onClick={onCancel}>
                    İptal
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleConfirm}
                    disabled={loadingAddress}
                >
                    Konumu Onayla
                </Button>
            ]}
            width={700}
            destroyOnHidden={true}
            centered
        >
            <div style={{ marginBottom: 16 }}>
                <LocationSearchInput
                    placeholder="Harita üzerinde ara..."
                    value={address}
                    onChange={setAddress}
                    onSelect={handleSearchSelect}
                    size="large"
                    country={country}
                />
            </div>

            <div style={{ height: '400px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={13}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        onClick={handleMapClick}
                        options={{
                            disableDefaultUI: false,
                            streetViewControl: false,
                            mapTypeControl: false,
                            gestureHandling: 'greedy'
                        }}
                    >
                        <Marker
                            position={markerPosition}
                            draggable={true}
                            onDragEnd={handleMarkerDragEnd}
                            animation={google.maps.Animation.DROP}
                        />
                    </GoogleMap>
                ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                        <Spin size="large" />
                        <div>Harita Yükleniyor...</div>
                    </div>
                )}

                {loadingAddress && (
                    <div style={{
                        position: 'absolute',
                        bottom: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(255,255,255,0.9)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        zIndex: 10
                    }}>
                        <Spin size="small" />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>Adres alınıyor...</span>
                    </div>
                )}
            </div>

            <div style={{ marginTop: 16, padding: '12px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Seçilen Adres:</div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>
                    {address || <span style={{ color: '#ccc' }}>Haritadan bir konum seçin</span>}
                </div>
            </div>
        </Modal>
    );
};

export default MapPickerModal;
