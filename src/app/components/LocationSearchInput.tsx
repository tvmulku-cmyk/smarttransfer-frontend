'use client';

import React, { useState } from 'react';
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from 'use-places-autocomplete';
import { AutoComplete, Input, Spin, Button } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { useGoogleMaps } from '../providers/GoogleMapsProvider';

// Fallback locations when Google API is not available
const FALLBACK_LOCATIONS = [
    { value: 'İstanbul Havalimanı (IST)', label: 'İstanbul Havalimanı (IST)', type: 'airport' },
    { value: 'Sabiha Gökçen Havalimanı (SAW)', label: 'Sabiha Gökçen Havalimanı (SAW)', type: 'airport' },
    { value: 'Antalya Havalimanı (AYT)', label: 'Antalya Havalimanı (AYT)', type: 'airport' },
    { value: 'İzmir Adnan Menderes (ADB)', label: 'İzmir Adnan Menderes (ADB)', type: 'airport' },
    { value: 'Ankara Esenboğa (ESB)', label: 'Ankara Esenboğa (ESB)', type: 'airport' },
    { value: 'Dalaman Havalimanı (DLM)', label: 'Dalaman Havalimanı (DLM)', type: 'airport' },
    { value: 'Bodrum Milas (BJV)', label: 'Bodrum Milas (BJV)', type: 'airport' },
    { value: 'Taksim Meydanı, İstanbul', label: 'Taksim Meydanı, İstanbul', type: 'location' },
    { value: 'Sultanahmet, İstanbul', label: 'Sultanahmet, İstanbul', type: 'location' },
    { value: 'Kadıköy, İstanbul', label: 'Kadıköy, İstanbul', type: 'location' },
    { value: 'Beşiktaş, İstanbul', label: 'Beşiktaş, İstanbul', type: 'location' },
    { value: 'Şişli, İstanbul', label: 'Şişli, İstanbul', type: 'location' },
    { value: 'Lara, Antalya', label: 'Lara, Antalya', type: 'location' },
    { value: 'Konyaaltı, Antalya', label: 'Konyaaltı, Antalya', type: 'location' },
    { value: 'Kemer, Antalya', label: 'Kemer, Antalya', type: 'location' },
    { value: 'Belek, Antalya', label: 'Belek, Antalya', type: 'location' },
    { value: 'Alanya, Antalya', label: 'Alanya, Antalya', type: 'location' },
    { value: 'Çeşme, İzmir', label: 'Çeşme, İzmir', type: 'location' },
    { value: 'Alaçatı, İzmir', label: 'Alaçatı, İzmir', type: 'location' },
    { value: 'Bodrum Merkez, Muğla', label: 'Bodrum Merkez, Muğla', type: 'location' },
];

interface LocationSearchInputProps {
    placeholder?: string;
    style?: React.CSSProperties;
    value?: string;
    onChange?: (value: string) => void;
    onSelect?: (value: string, lat?: number, lng?: number) => void;
    size?: 'large' | 'middle' | 'small';
    prefix?: React.ReactNode;
    onMapClick?: () => void;
    country?: string;
}

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
    placeholder,
    style,
    value,
    onChange,
    onSelect,
    size = 'middle',
    prefix,
    onMapClick, // New prop
    country = 'tr' // Default prop value
}) => {
    const { isLoaded } = useGoogleMaps();

    // Prepare component restrictions
    // Using string because array might be causing issues with some API versions
    const requestOptions = React.useMemo(() => {
        const options = {
            componentRestrictions: { country: country },
            types: ['geocode', 'establishment'] // Optional: limit types
        };
        console.log('LocationSearchInput requestOptions:', options);
        return options;
    }, [country]);

    const {
        ready,
        value: searchValue,
        suggestions: { status, data },
        setValue: setSearchValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions,
        debounce: 300,
        initOnMount: isLoaded,
        defaultValue: value || ''
    });

    React.useEffect(() => {
        console.log('LocationSearchInput ready state:', ready, 'isLoaded:', isLoaded);
    }, [ready, isLoaded]);

    // Update internal state when prop value changes
    React.useEffect(() => {
        if (value !== searchValue) {
            setSearchValue(value || '');
        }
    }, [value]);

    const handleSelect = async (address: string) => {
        setSearchValue(address, false);
        clearSuggestions();

        let lat, lng;
        // Only try geocoding if Google API is ready
        if (ready) {
            try {
                const results = await getGeocode({ address });
                const { lat: l, lng: n } = await getLatLng(results[0]);
                lat = l;
                lng = n;
                console.log('📍 Coordinates:', { lat, lng });
            } catch (error) {
                console.log('Error: ', error);
            }
        }

        if (onSelect) {
            onSelect(address, lat, lng);
        }
    };

    const handleChange = (val: string) => {
        setSearchValue(val);
        if (onChange) {
            onChange(val);
        }
    };

    // Google suggestions
    const googleOptions = status === 'OK'
        ? data.map(({ place_id, description }) => ({
            value: description,
            label: (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <EnvironmentOutlined style={{ marginRight: 8, color: '#999' }} />
                        {description}
                    </div>
                </div>
            ),
        }))
        : [];

    // Local fallback suggestions (filter based on input)
    const localOptions = (!ready || status !== 'OK') && searchValue.length > 1
        ? FALLBACK_LOCATIONS.filter(loc =>
            loc.label.toLowerCase().includes(searchValue.toLowerCase())
        ).map(loc => ({
            value: loc.value,
            label: (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <EnvironmentOutlined style={{ marginRight: 8, color: '#999' }} />
                    {loc.label}
                </div>
            ),
        }))
        : [];

    // Combine options (prioritize Google if available)
    const options = googleOptions.length > 0 ? googleOptions : localOptions;

    return (
        <div style={{ display: 'flex', gap: 8 }}>
            <AutoComplete
                value={searchValue}
                options={options}
                onSelect={handleSelect}
                onChange={handleChange}
                style={{ width: '100%', ...style }}
            >
                <Input
                    size={size}
                    placeholder={placeholder}
                    prefix={prefix || <EnvironmentOutlined style={{ color: '#bfbfbf' }} />}
                    suffix={!ready ? <Spin size="small" /> : null}
                    style={{ borderRadius: 'var(--radius-md)' }}
                />
            </AutoComplete>
            {onMapClick && (
                <Button
                    icon={<EnvironmentOutlined />}
                    onClick={onMapClick}
                    size={size}
                    title="Harita Üzerinde Seç"
                    style={{ borderRadius: 'var(--radius-md)' }}
                />
            )}
            {/* Display API Error Status if not OK or empty (and not just 'ZERO_RESULTS' which is common while typing) */}
            {status !== 'OK' && status !== '' && status !== 'ZERO_RESULTS' && (
                <div style={{ color: '#ff4d4f', fontSize: '11px', position: 'absolute', bottom: -18, left: 0 }}>
                    Google API Hatası: {status}
                </div>
            )}
        </div>
    );
};

export default LocationSearchInput;
