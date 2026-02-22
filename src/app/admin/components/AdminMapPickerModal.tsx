'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, Circle, DrawingManager, Polygon } from '@react-google-maps/api';
import { Modal, Button, Slider, InputNumber, Row, Col, Spin, Typography } from 'antd';
import { EnvironmentOutlined, CheckOutlined } from '@ant-design/icons';
import { useGoogleMaps } from '../../providers/GoogleMapsProvider';
import LocationSearchInput from '../../components/LocationSearchInput'; // Adjust path if needed
import { getGeocode, getLatLng } from 'use-places-autocomplete';

const { Text } = Typography;

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px'
};

const defaultCenter = {
    lat: 41.0082,
    lng: 28.9784
};

interface AdminMapPickerModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (address: string, lat: number, lng: number, radius: number, polygonPath?: { lat: number; lng: number }[]) => void;
    initialLocation?: { lat: number; lng: number } | null;
    initialAddress?: string;
    initialRadius?: number;
    title?: string;
    country?: string;
}

const AdminMapPickerModal: React.FC<AdminMapPickerModalProps> = ({
    visible,
    onCancel,
    onConfirm,
    initialLocation,
    initialAddress,
    initialRadius = 1000,
    title = "Konum ve Alan Seçin",
    country
}) => {
    const { isLoaded } = useGoogleMaps();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [center, setCenter] = useState(defaultCenter);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);
    const [address, setAddress] = useState(initialAddress || '');
    const [radius, setRadius] = useState(initialRadius);
    const [loadingAddress, setLoadingAddress] = useState(false);

    // Polygon State
    const [drawingMode, setDrawingMode] = useState<"circle" | "polygon">("circle");
    const [polygonPath, setPolygonPath] = useState<{ lat: number; lng: number }[]>([]);
    const [polygonInstance, setPolygonInstance] = useState<google.maps.Polygon | null>(null);

    const onPolygonComplete = (poly: google.maps.Polygon) => {
        const path = poly.getPath();
        const coords: { lat: number; lng: number }[] = [];
        for (let i = 0; i < path.getLength(); i++) {
            const xy = path.getAt(i);
            coords.push({ lat: xy.lat(), lng: xy.lng() });
        }
        setPolygonPath(coords);
        setPolygonInstance(poly);

        // Keep only one polygon
        if (polygonInstance) {
            polygonInstance.setMap(null);
        }
    };

    const clearPolygon = () => {
        if (polygonInstance) {
            polygonInstance.setMap(null);
            setPolygonInstance(null);
        }
        setPolygonPath([]);
    }

    // Sync props when visible changes
    useEffect(() => {
        if (visible) {
            if (initialAddress) setAddress(initialAddress);
            if (initialRadius) setRadius(initialRadius);

            // Reset polygon
            setPolygonPath([]);
            if (polygonInstance) {
                polygonInstance.setMap(null);
                setPolygonInstance(null);
            }

            if (initialLocation && initialLocation.lat && initialLocation.lng) {
                setCenter(initialLocation);
                setMarkerPosition(initialLocation);
            } else if (!initialLocation) {
                // Default logic or user location
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
                        () => { }
                    );
                }
            }
        }
    }, [visible, initialLocation, initialAddress, initialRadius]);

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
        onConfirm(address, markerPosition.lat, markerPosition.lng, radius, drawingMode === 'polygon' ? polygonPath : undefined);
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
                <Button key="back" onClick={onCancel}>İptal</Button>,
                <Button
                    key="submit"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleConfirm}
                    disabled={loadingAddress}
                >
                    Konumu ve Alanı Kaydet
                </Button>
            ]}
            width={800}
            destroyOnHidden={true}
            centered
        >
            <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 12, display: 'flex', gap: 10 }}>
                    <Button
                        type={drawingMode === 'circle' ? 'primary' : 'default'}
                        onClick={() => setDrawingMode('circle')}
                    >
                        Daire (Yarıçap)
                    </Button>
                    <Button
                        type={drawingMode === 'polygon' ? 'primary' : 'default'}
                        onClick={() => setDrawingMode('polygon')}
                    >
                        Çizim Yap (Polygon)
                    </Button>
                    {drawingMode === 'polygon' && (
                        <Button onClick={clearPolygon} danger disabled={polygonPath.length === 0}>
                            Çizimi Temizle
                        </Button>
                    )}
                </div>
            </div>

            {drawingMode === 'circle' && (
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                        <LocationSearchInput
                            placeholder="Harita üzerinde ara..."
                            value={address}
                            onChange={setAddress}
                            onSelect={handleSearchSelect}
                            size="large"
                            country={country}
                        />
                    </Col>
                    <Col span={12}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong>Yarıçap (m):</Text>
                            <Slider
                                min={100}
                                max={5000}
                                step={100}
                                style={{ flex: 1 }}
                                value={radius}
                                onChange={setRadius}
                            />
                            <InputNumber
                                min={100}
                                max={10000}
                                style={{ width: 80 }}
                                value={radius}
                                onChange={(val) => setRadius(val || 1000)}
                            />
                        </div>
                    </Col>
                </Row>
            )}

            {drawingMode === 'polygon' && (
                <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                    * Harita üzerine tıklayarak alanın sınırlarını belirleyin.
                </div>
            )}

            <div style={{ height: '400px', position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={14}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        onClick={handleMapClick}
                        options={{
                            disableDefaultUI: false,
                            streetViewControl: false,
                            mapTypeControl: true,
                            gestureHandling: 'greedy'
                        }}
                    >
                        {drawingMode === 'polygon' && (
                            <>
                                <DrawingManager
                                    onPolygonComplete={onPolygonComplete}
                                    options={{
                                        drawingControl: true,
                                        drawingControlOptions: {
                                            position: google.maps.ControlPosition.TOP_CENTER,
                                            drawingModes: [google.maps.drawing.OverlayType.POLYGON]
                                        },
                                        polygonOptions: {
                                            fillColor: '#1890ff',
                                            fillOpacity: 0.35,
                                            strokeWeight: 2,
                                            strokeColor: '#1890ff',
                                            clickable: false,
                                            editable: true,
                                            zIndex: 1
                                        }
                                    }}
                                />
                                {polygonPath.length > 0 && (
                                    <Polygon
                                        paths={polygonPath}
                                        options={{
                                            fillColor: '#1890ff',
                                            fillOpacity: 0.35,
                                            strokeWeight: 2,
                                            strokeColor: '#1890ff'
                                        }}
                                    />
                                )}
                            </>
                        )}

                        { /* DrawingManager needs to be imported. I'll add the import at the top */}
                    </GoogleMap>
                ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                        <Spin size="large" />
                        <div>Harita Yükleniyor...</div>
                    </div>
                )}
                {loadingAddress && (
                    <div style={{
                        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 10
                    }}>
                        <Spin size="small" />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>Adres alınıyor...</span>
                    </div>
                )}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                * Kırmızı marker konumu, mavi daire ise kabul edilecek alanı gösterir.
            </div>
        </Modal >
    );
};

export default AdminMapPickerModal;
