'use client';

import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useSocket } from '@/app/context/SocketContext';
import { useGoogleMaps } from '@/app/providers/GoogleMapsProvider';
import apiClient from '@/lib/api-client';
import AdminLayout from '../AdminLayout';
import { Card, Tag, Badge, Spin } from 'antd';
import { CarOutlined, DashboardOutlined } from '@ant-design/icons';

const containerStyle = { width: '100%', height: '100%' };
const center = { lat: 36.8969, lng: 30.7133 }; // Antalya

interface DriverLocation {
    driverId: string;
    driverName: string;
    lat: number;
    lng: number;
    speed: number;
    timestamp: string;
    heading: number;
}

const LiveMapPage = () => {
    const { socket, isConnected } = useSocket();
    const { isLoaded } = useGoogleMaps();
    const [drivers, setDrivers] = useState<Record<string, DriverLocation>>({});
    const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);

    // PRIMARY: Poll DB every 15 seconds — works even when driver is on a different server (Railway vs localhost)
    useEffect(() => {
        const fetchOnlineDrivers = async () => {
            try {
                const res = await apiClient.get('/api/driver/online');
                if (res.data?.success && Array.isArray(res.data.data)) {
                    setDrivers(() => {
                        const updated: Record<string, DriverLocation> = {};
                        res.data.data.forEach((d: any) => {
                            // Prefer in-memory realtime location, fallback to DB lastLocation fields
                            const lat = d.location?.lat ?? d.lastLocationLat;
                            const lng = d.location?.lng ?? d.lastLocationLng;
                            updated[d.id] = {
                                driverId: d.id,
                                driverName: d.fullName,
                                lat: lat || 0,
                                lng: lng || 0,
                                speed: d.location?.speed ?? d.lastLocationSpeed ?? 0,
                                timestamp: d.location?.ts || d.lastSeenAt || new Date().toISOString(),
                                heading: d.location?.heading || 0
                            };
                        });
                        return updated;
                    });
                }
            } catch (err) {
                console.error('Failed to fetch online drivers:', err);
            }
        };

        fetchOnlineDrivers(); // Load immediately on mount
        const interval = setInterval(fetchOnlineDrivers, 15000); // Then every 15 seconds
        return () => clearInterval(interval);
    }, []);

    // SECONDARY: Socket events for instant updates when admin & driver happen to be on the same server
    useEffect(() => {
        if (!socket) return;

        socket.on('driver_location', (data: any) => {
            setDrivers(prev => {
                if (!prev[data.driverId]) return prev;
                return { ...prev, [data.driverId]: { ...prev[data.driverId], ...data } };
            });
        });

        socket.on('driver_online', (data: any) => {
            setDrivers(prev => {
                if (prev[data.driverId]) return prev;
                return {
                    ...prev,
                    [data.driverId]: {
                        driverId: data.driverId, driverName: data.driverName,
                        lat: 0, lng: 0, speed: 0,
                        timestamp: new Date().toISOString(), heading: 0
                    }
                };
            });
        });

        // Don't trust socket driver_offline - let DB poll be the source of truth
        // A delayed OS background wake-up could cause a false offline event

        return () => {
            socket.off('driver_location');
            socket.off('driver_online');
        };
    }, [socket]);

    const allOnlineDrivers = Object.values(drivers) as DriverLocation[];
    const driversWithLocation = allOnlineDrivers.filter(d => d.lat !== 0 && d.lng !== 0);

    if (!isLoaded) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
            <Spin size="large" />
            <div style={{ marginTop: 10 }}>Harita yükleniyor...</div>
        </div>
    );

    return (
        <AdminLayout selectedKey="driver-tracking">
            <div style={{ padding: '24px', height: '100%', display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
                        {driversWithLocation.map(driver => (
                            <Marker
                                key={driver.driverId}
                                position={{ lat: driver.lat, lng: driver.lng }}
                                onClick={() => setSelectedDriver(driver)}
                                icon={{
                                    url: 'https://cdn-icons-png.flaticon.com/512/3097/3097180.png',
                                    scaledSize: new window.google.maps.Size(40, 40)
                                }}
                            />
                        ))}

                        {selectedDriver && selectedDriver.lat !== 0 && (
                            <InfoWindow
                                position={{ lat: selectedDriver.lat, lng: selectedDriver.lng }}
                                onCloseClick={() => setSelectedDriver(null)}
                            >
                                <div>
                                    <h3 style={{ margin: '0 0 5px', fontSize: '14px', fontWeight: 'bold' }}>{selectedDriver.driverName}</h3>
                                    <div style={{ fontSize: '12px' }}>
                                        Hız: {Math.round(selectedDriver.speed)} km/s<br />
                                        Son Güncelleme: {new Date(selectedDriver.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>

                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'white', padding: '10px', borderRadius: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                        <Badge status={isConnected ? 'success' : 'error'} text={isConnected ? 'Bağlı' : 'Bağlantı Yok'} />
                    </div>
                </div>

                <Card title="Aktif Sürücüler" style={{ width: 300, height: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                    {allOnlineDrivers.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Aktif sürücü yok</div>
                    ) : (
                        allOnlineDrivers.map(driver => (
                            <div
                                key={driver.driverId}
                                style={{
                                    padding: '12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
                                    background: selectedDriver?.driverId === driver.driverId ? '#e6f7ff' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}
                                onClick={() => setSelectedDriver(driver)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{driver.driverName}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            <DashboardOutlined /> {Math.round(driver.speed)} km/s
                                        </div>
                                    </div>
                                </div>
                                <Tag color="green">Aktif</Tag>
                            </div>
                        ))
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
};

export default LiveMapPage;
