'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Table, Card, Tag, Button, Space, Typography, message,
    Row, Col, DatePicker, Select, Input, Checkbox, Popover, Badge,
    Avatar, Tooltip, Modal
} from 'antd';
import {
    ReloadOutlined,
    CarOutlined,
    EnvironmentOutlined,
    CalendarOutlined,
    UserOutlined,
    SearchOutlined,
    FilterOutlined,
    FileExcelOutlined,
    SwapRightOutlined,
    InfoCircleOutlined,
    ManOutlined,
    WomanOutlined,
    SaveOutlined,
    UndoOutlined,
    DragOutlined,
    EditOutlined,
    BgColorsOutlined,
    MessageOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import AdminLayout from '../../AdminLayout';
import AdminGuard from '../../AdminGuard';
import apiClient from '@/lib/api-client';
import type { ColumnsType } from 'antd/es/table';

import { useSocket } from '@/app/context/SocketContext';

// DnD Imports
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    useSortable,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

dayjs.locale('tr');

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Custom Resizable & Draggable Title Component
const ResizableTitle = (props: any) => {
    const { onResize, width, id, ...restProps } = props;

    // Sortable Hook
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: id,
    });

    const style: React.CSSProperties = {
        ...restProps.style,
        transform: CSS.Translate.toString(transform),
        transition,
        position: 'relative',
        cursor: 'move',
        zIndex: isDragging ? 9999 : undefined,
    };

    if (!width) {
        return <th {...restProps} />;
    }

    // State to track if resizing is active
    const [isResizing, setIsResizing] = useState(false);
    // Ref to track start position and width
    const resizingRef = useRef<{ startX: number; startWidth: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Stop propagation to prevent drag start
        setIsResizing(true);
        resizingRef.current = {
            startX: e.clientX,
            startWidth: width,
        };

        // Add listeners to window to handle movement outside the header
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!resizingRef.current) return;

        const deltaX = e.clientX - resizingRef.current.startX;
        const newWidth = Math.max(50, resizingRef.current.startWidth + deltaX); // Min width 50px

        onResize(e, { size: { width: newWidth } });
    };

    const handleMouseUp = () => {
        setIsResizing(false);
        resizingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    return (
        <th
            {...restProps}
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
        >
            {restProps.children}
            <div
                onMouseDown={handleMouseDown}
                onClick={(e) => e.stopPropagation()}
                title="Genişliği Ayarla"
                style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '10px',
                    cursor: 'col-resize',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isResizing ? '#1890ff' : 'transparent', // Highlight when resizing
                }}
            >
                <div style={{ width: '1px', height: '60%', backgroundColor: '#ccc' }} />
            </div>
        </th>
    );
};

export default function OperationsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const { socket } = useSocket();

    // Transfer durumu renk ayarları
    const STATUS_LABELS: Record<string, string> = {
        PENDING: 'Beklemede',
        CONFIRMED: 'Onaylandı',
        PASSENGER_PICKED_UP: 'Yolcu Alındı',
        ON_THE_WAY: 'Yolda',
        COMPLETED: 'Tamamlandı',
        CANCELLED: 'İptal',
        // Operasyonel alt durumlar
        OPERASYONDA: 'Operasyonda',
        HAVUZDA: 'Havuzda',
    };
    const DEFAULT_COLORS: Record<string, string> = {
        PENDING: '#e6f4ff',
        CONFIRMED: '#f6ffed',
        PASSENGER_PICKED_UP: '#fff7e6',
        ON_THE_WAY: '#e6fffb',
        COMPLETED: '#f9f9f9',
        CANCELLED: '#fff1f0',
        OPERASYONDA: '#f0f5ff',
        HAVUZDA: '#fff0f6',
    };
    const [statusColors, setStatusColors] = useState<Record<string, string>>(() => {
        try {
            const saved = localStorage.getItem('operationsStatusColors');
            return saved ? { ...DEFAULT_COLORS, ...JSON.parse(saved) } : DEFAULT_COLORS;
        } catch { return DEFAULT_COLORS; }
    });
    const [colorModalVisible, setColorModalVisible] = useState(false);
    const [tempColors, setTempColors] = useState<Record<string, string>>(DEFAULT_COLORS);


    // Filters
    const [filters, setFilters] = useState({
        dateRange: [dayjs().subtract(30, 'day'), dayjs().add(30, 'day')],
        direction: 'ALL', // ALL, DEPARTURE, ARRIVAL, INTER
        transferType: 'ALL', // ALL, SHUTTLE, PRIVATE
        agency: 'ALL',
        status: 'ALL',
        driver: 'ALL',
        vehicle: 'ALL'
    });

    // Default Columns Definition
    const defaultColumns = [
        {
            title: '#',
            key: 'index',
            width: 50,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: 'T.KOD',
            dataIndex: 'bookingNumber',
            key: 'bookingNumber',
            width: 120,
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: 'YÖN',
            dataIndex: 'direction',
            key: 'direction',
            width: 110,
            render: (text: string, record: any) => {
                let color = 'default';
                if (text === 'Geliş') color = 'green';
                if (text === 'Gidiş') color = 'orange';
                const isShuttle = record.transferType === 'SHUTTLE';
                return (
                    <Space direction="vertical" size={2}>
                        <Tag color={color} style={{ margin: 0 }}>{text}</Tag>
                        <Tag color={isShuttle ? 'geekblue' : 'purple'} style={{ margin: 0, fontSize: 10 }}>
                            {isShuttle ? 'Shuttle' : 'Özel'}
                        </Tag>
                    </Space>
                );
            }
        },
        {
            title: 'S/N',
            key: 'sn',
            width: 60,
            render: () => <Button size="small" type="text" icon={<InfoCircleOutlined />} />
        },
        {
            title: 'ALT ACENTE',
            key: 'subAgency',
            width: 120,
            render: () => <Text type="secondary">-</Text>
        },
        {
            title: 'ACENTE',
            dataIndex: 'partnerName',
            key: 'partnerName',
            width: 150,
            render: (text: string) => <Text strong>{text || 'Direkt'}</Text>
        },
        {
            title: 'ACENTE NOT',
            dataIndex: 'agencyNote',
            key: 'agencyNote',
            width: 100,
            render: (text: string) => (
                text ?
                    <Popover content={text} title="Acente Notu">
                        <InfoCircleOutlined style={{ color: '#faad14' }} />
                    </Popover> : '-'
            )
        },
        {
            title: 'AD SOYAD',
            dataIndex: ['customer', 'name'],
            key: 'customerName',
            width: 180,
            render: (text: string) => <Text style={{ textTransform: 'uppercase' }}>{text}</Text>
        },
        {
            title: 'TARİH',
            dataIndex: 'pickupDateTime',
            key: 'date',
            width: 120,
            render: (val: string) => dayjs(val).format('DD.MM.YYYY')
        },
        {
            title: 'DURUM',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status: string) => {
                const map: any = { 'CONFIRMED': 'blue', 'PENDING': 'orange', 'COMPLETED': 'green', 'CANCELLED': 'red', 'IN_PROGRESS': 'purple' };
                const label: any = { 'CONFIRMED': 'Onaylı', 'PENDING': 'Bekliyor', 'COMPLETED': 'Tamamlandı', 'CANCELLED': 'İptal', 'IN_PROGRESS': 'Müşteri Alındı' };
                return <Badge status={status === 'CONFIRMED' || status === 'IN_PROGRESS' ? 'processing' : 'default'} color={map[status]} text={label[status] || status} />;
            }
        },
        {
            title: 'T.DURUM',
            dataIndex: 'operationalStatus',
            key: 'opStatus',
            width: 120,
            render: (status: string, record: any) => {
                let color = 'default';
                let text = status || 'Beklemede';
                if (status === 'IN_POOL') { color = 'cyan'; text = 'Havuzda'; }
                // Override with master status if driver has started/completed
                if (record.status === 'IN_PROGRESS') { color = 'purple'; text = 'Müşteri Alındı'; }
                if (record.status === 'COMPLETED') { color = 'green'; text = 'Tamamlandı'; }
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'ŞOFÖR',
            dataIndex: 'driverId',
            key: 'driver',
            width: 170,
            render: (val: string, record: any) => (
                <Space size={2}>
                    <Select
                        size="small"
                        placeholder="Seçiniz"
                        style={{ width: 120 }}
                        bordered={false}
                        showSearch
                        optionFilterProp="children"
                        value={record.driverId || undefined}
                        onChange={(driverId) => handleDriverChange(record.id, driverId)}
                        options={drivers.map((d: any) => ({
                            value: d.user?.id || d.id,
                            label: `${d.firstName} ${d.lastName}`
                        }))}
                    />
                    {record.driverId && (
                        <Tooltip title="Sürücüye Mesaj At">
                            <Button
                                size="small"
                                type="text"
                                icon={<MessageOutlined style={{ color: '#1890ff' }} />}
                                onClick={() => handleOpenMessageModal(record.driverId)}
                            />
                        </Tooltip>
                    )}
                </Space>
            )
        },
        {
            title: 'ARAÇ',
            dataIndex: 'assignedVehicleId',
            key: 'vehicle',
            width: 210,
            render: (val: string, record: any) => {
                const isShuttle = record.transferType === 'SHUTTLE';

                // Filter by usageType (set in vehicle management)
                const shuttleVehicles = vehicles.filter((v: any) => v.usageType === 'SHUTTLE' || v.shuttleMode);
                const privateVehicles = vehicles.filter((v: any) => v.usageType !== 'SHUTTLE' && !v.shuttleMode);

                // Use filtered list; if empty fall back to all vehicles
                const targetPool = isShuttle ? shuttleVehicles : privateVehicles;
                const filteredVehicles = targetPool.length > 0 ? targetPool : vehicles;
                const fallback = targetPool.length === 0;

                return (
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        {record.vehicleType && record.vehicleType !== 'Unknown' && (
                            <Text type="secondary" style={{ fontSize: 11 }} ellipsis={{ tooltip: record.vehicleType }}>
                                <CarOutlined style={{ marginRight: 3 }} />{record.vehicleType}
                            </Text>
                        )}
                        {fallback && (
                            <Text type="warning" style={{ fontSize: 10 }}>
                                ⚠ Araç Yönetiminden tipi ayarlayın
                            </Text>
                        )}
                        <Select
                            style={{ width: 190 }}
                            placeholder={isShuttle ? 'Shuttle Araç Ata' : 'Özel Araç Ata'}
                            size="small"
                            value={record.assignedVehicleId || undefined}
                            onChange={(vehicleId) => handleVehicleChange(record.id, vehicleId)}
                            bordered={false}
                            showSearch
                            optionFilterProp="children"
                            options={filteredVehicles.map((v: any) => ({
                                value: v.id,
                                label: `${v.plateNumber} - ${v.model || ''}`
                            }))}
                        />
                    </Space>
                );
            }
        },
        {
            title: 'A.SAAT',
            dataIndex: 'pickupDateTime',
            key: 'time',
            width: 80,
            render: (val: string) => <Tag>{dayjs(val).format('HH:mm')}</Tag>
        },
        {
            title: 'UÇUŞ KODU',
            dataIndex: 'flightNumber',
            key: 'flightCode',
            width: 100,
            render: (text: string) => text || '-'
        },
        {
            title: 'TC/PASAPORT',
            dataIndex: 'passport',
            key: 'passport',
            width: 120,
        },
        {
            title: 'TELEFON',
            dataIndex: ['customer', 'phone'],
            key: 'phone',
            width: 130,
            render: (text: string) => <Text copyable>{text}</Text>
        },
        {
            title: 'PAX',
            dataIndex: ['vehicle', 'pax'],
            key: 'pax',
            width: 60,
        },
        {
            title: 'U-ETDS',
            dataIndex: 'uetds',
            key: 'uetds',
            width: 120,
            render: (text: string) => <Tag>{text}</Tag>
        },
        {
            title: 'ROTA',
            key: 'route',
            width: 250,
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0} style={{ fontSize: '12px' }}>
                    <Text ellipsis style={{ maxWidth: 230 }}><EnvironmentOutlined style={{ color: 'green' }} /> {record.pickup.rawLocation || record.pickup.location}</Text>
                    <Text ellipsis style={{ maxWidth: 230 }}><EnvironmentOutlined style={{ color: 'red' }} /> {record.dropoff.rawLocation || record.dropoff.location}</Text>
                </Space>
            )
        }
    ];

    // Column config stores only METADATA (key, width, title, order) - NOT render functions
    // This prevents stale closure issues with drivers/vehicles state
    type ColConfig = { key: string; width?: number; title?: string };
    const [columnConfig, setColumnConfig] = useState<ColConfig[]>(
        defaultColumns.map(c => ({ key: c.key, width: c.width, title: c.title }))
    );
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [tempColumns, setTempColumns] = useState<ColConfig[]>([]);

    // Merge column config with fresh render functions from defaultColumns
    const columns = React.useMemo(() => {
        return columnConfig.map(cfg => {
            const def = defaultColumns.find(d => d.key === cfg.key);
            if (!def) return null;
            return {
                ...def,
                width: cfg.width ?? def.width,
                title: cfg.title ?? def.title,
            };
        }).filter(Boolean);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columnConfig, drivers, vehicles]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 1,
            },
        })
    );

    // Initialize Columns from LocalStorage
    useEffect(() => {
        const savedColumns = localStorage.getItem('operationsTableColumns');
        if (savedColumns) {
            try {
                const parsed: ColConfig[] = JSON.parse(savedColumns);
                // Restore order & width from saved config
                const orderedKeys = parsed.map(p => p.key);
                const allKeys = defaultColumns.map(c => c.key);
                // Add new default columns not in saved storage
                const newKeys = allKeys.filter(k => !orderedKeys.includes(k));
                const finalConfig = [
                    ...parsed.filter(p => allKeys.includes(p.key)),
                    ...newKeys.map(k => {
                        const def = defaultColumns.find(c => c.key === k)!;
                        return { key: k, width: def.width, title: def.title };
                    })
                ];
                setColumnConfig(finalConfig);
            } catch (e) {
                console.error('Failed to parse saved columns', e);
            }
        }
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/transfer/bookings');
            if (response.data.success) {
                let data = response.data.data;

                // MOCKDATA: Enrich data with missing fields for UI demo
                data = data.map((item: any) => {
                    // Fix Backend Format Mismatch (Backend returns string, UI expects object or check)
                    const pickupVal = typeof item.pickup === 'string' ? item.pickup : (item.pickup?.location || '');
                    const dropoffVal = typeof item.dropoff === 'string' ? item.dropoff : (item.dropoff?.location || '');

                    // Infer Direction
                    let direction = 'Ara';
                    const p = pickupVal.toLowerCase();
                    const d = dropoffVal.toLowerCase();
                    if (p.includes('havaliman') || p.includes('airport')) direction = 'Geliş'; // Airport -> City
                    else if (d.includes('havaliman') || d.includes('airport')) direction = 'Gidiş'; // City -> Airport

                    // Detect shuttle/shared transfer type
                    const vtLower = (item.vehicleType || '').toLowerCase();
                    const isShuttle = vtLower.includes('shuttle')
                        || vtLower.includes('paylaşımlı')
                        || vtLower.includes('paylaşım')
                        || vtLower.includes('shared')
                        || vtLower.includes('mercedes sprinter')
                        || vtLower.includes('minibüs')
                        || vtLower.includes('minibus');

                    return {
                        ...item,
                        // Ensure UI components get the expected object structure
                        pickup: typeof item.pickup === 'string' ? { location: item.pickup, rawLocation: item.pickup } : item.pickup,
                        dropoff: typeof item.dropoff === 'string' ? { location: item.dropoff, rawLocation: item.dropoff } : item.dropoff,
                        direction,
                        transferType: isShuttle ? 'SHUTTLE' : 'PRIVATE',
                        driverName: 'Atanmadı', // Placeholder
                        plateNumber: '-', // Placeholder
                        passport: '-', // Placeholder
                        uetds: 'Gönderilmedi', // Placeholder
                        agencyNote: item.notes || '',
                        pax: item.adults || (item.vehicle?.pax) || 1, // Fix pax mapping
                        // Fix Phone Mapping
                        customer: {
                            ...item.customer,
                            phone: item.passengerPhone || item.contactPhone || '-'
                        }
                    };
                });

                // Apply Frontend Filters
                // Date Filter (Client-side)
                if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
                    const start = filters.dateRange[0].startOf('day');
                    const end = filters.dateRange[1].endOf('day');
                    data = data.filter((i: any) => {
                        const date = dayjs(i.pickupDateTime);
                        return (date.isAfter(start) || date.isSame(start)) && (date.isBefore(end) || date.isSame(end));
                    });
                }

                if (filters.transferType !== 'ALL') {
                    data = data.filter((i: any) => i.transferType === filters.transferType);
                }
                if (filters.direction !== 'ALL') {
                    data = data.filter((i: any) => i.direction === (filters.direction === 'DEPARTURE' ? 'Gidiş' : filters.direction === 'ARRIVAL' ? 'Geliş' : 'Ara'));
                }

                setBookings(data);
            } else {
                message.error('Veriler alınamadı');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            message.error('Bağlantı hatası');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [filters.transferType, filters.direction]); // Re-fetch/filter when filters change

    // Listeners for Real-Time Updates
    useEffect(() => {
        if (!socket) return;

        const handleStatusUpdate = (data: { bookingId: string, status: string, driverId?: string }) => {
            setBookings(prev => prev.map(b =>
                b.id === data.bookingId
                    ? { ...b, status: data.status, driverId: data.driverId || b.driverId }
                    : b
            ));
        };

        const handleNewBooking = () => {
            // Trigger a re-fetch to ensure all nested relations (customer, metadata) are complete
            fetchBookings();
        };

        socket.on('booking_status_update', handleStatusUpdate);
        socket.on('new_booking', handleNewBooking);

        return () => {
            socket.off('booking_status_update', handleStatusUpdate);
            socket.off('new_booking', handleNewBooking);
        };
    }, [socket, filters.transferType, filters.direction]);

    const handleResize = (index: number) => (_e: any, { size }: any) => {
        setColumnConfig((prev: ColConfig[]) => {
            const next = [...prev];
            next[index] = { ...next[index], width: size.width };
            return next;
        });
    };

    // Drag End Handler
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setColumnConfig((prev: ColConfig[]) => {
                const activeIndex = prev.findIndex((i: ColConfig) => i.key === active.id);
                const overIndex = prev.findIndex((i: ColConfig) => i.key === over?.id);
                return arrayMove(prev, activeIndex, overIndex);
            });
        }
    };

    // Save Columns to LocalStorage
    const saveLayout = () => {
        // Save columnConfig (already has key/width/title, no nulls)
        localStorage.setItem('operationsTableColumns', JSON.stringify(columnConfig));
        message.success('Görünüm, başlıklar ve sıralama kaydedildi');
    };

    // Reset Layout
    const resetLayout = () => {
        localStorage.removeItem('operationsTableColumns');
        setColumnConfig(defaultColumns.map(c => ({ key: c.key, width: c.width, title: c.title })));
        message.info('Görünüm sıfırlandı');
    };

    // Handle Edit Modal Open
    const openEditModal = () => {
        setTempColumns([...columnConfig]); // Copy current config
        setEditModalVisible(true);
    };

    // Handle Title Change in Modal
    const handleTitleChange = (key: string, newTitle: string) => {
        setTempColumns(prev => prev.map(col => col.key === key ? { ...col, title: newTitle } : col));
    };

    const fetchVehicles = async () => {
        try {
            const res = await apiClient.get('/api/vehicles');
            if (res.data.success) {
                setVehicles(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    const fetchDrivers = async () => {
        try {
            const res = await apiClient.get('/api/personnel');
            if (res.data.success) {
                // Filter driver personnel - case-insensitive, handles Turkish variants
                const DRIVER_KEYWORDS = ['driver', 'şöför', 'sofor', 'sürücü', 'surucü', 'surücu'];
                const driverList = res.data.data.filter((p: any) => {
                    const title = (p.jobTitle || '').toLowerCase().trim();
                    return DRIVER_KEYWORDS.some(kw => title.includes(kw));
                });
                setDrivers(driverList);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    };

    useEffect(() => {
        fetchVehicles();
        fetchDrivers();
    }, []);

    const handleVehicleChange = async (bookingId: string, vehicleId: string) => {
        // Optimistic Update
        setBookings(prev => prev.map((b: any) =>
            b.id === bookingId ? { ...b, assignedVehicleId: vehicleId } : b
        ));
        try {
            await apiClient.patch(`/api/transfer/bookings/${bookingId}`, { assignedVehicleId: vehicleId });
            message.success('Araç ataması güncellendi');
        } catch (error) {
            message.error('Araç atanamadı');
        }
    };

    const handleDriverChange = async (bookingId: string, driverId: string) => {
        // Optimistic Update
        setBookings(prev => prev.map((b: any) =>
            b.id === bookingId ? { ...b, driverId } : b
        ));
        try {
            await apiClient.patch(`/api/transfer/bookings/${bookingId}`, { driverId });
            message.success('Şoför ataması güncellendi');
        } catch (error) {
            message.error('Şoför atanamadı');
        }
    };

    // Save Edited Titles
    const saveColumnTitles = () => {
        setColumnConfig(tempColumns); // tempColumns is ColConfig[]
        setEditModalVisible(false);
        message.success('Başlıklar güncellendi. Kalıcı olması için "Görünümü Kaydet"e basınız.');
    };

    // Color modal handlers
    const openColorModal = () => {
        setTempColors({ ...statusColors });
        setColorModalVisible(true);
    };
    const saveColors = () => {
        setStatusColors(tempColors);
        localStorage.setItem('operationsStatusColors', JSON.stringify(tempColors));
        setColorModalVisible(false);
        message.success('Renkler kaydedildi');
    };
    const resetColors = () => {
        setTempColors({ ...DEFAULT_COLORS });
    };

    // Determine row background color based on booking status
    const getRowColor = (record: any): string | undefined => {
        const opStatus = record.operationalStatus as string | undefined;
        const status = record.status as string | undefined;
        // Prefer operational sub-status over main status
        if (opStatus && statusColors[opStatus]) return statusColors[opStatus];
        if (status && statusColors[status]) return statusColors[status];
        return undefined;
    };


    // Message Modal State
    const [messageModalVisible, setMessageModalVisible] = useState(false);
    const [messageLoading, setMessageLoading] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [selectedDriver, setSelectedDriver] = useState<{ id: string, name: string } | null>(null);

    const handleOpenMessageModal = (driverId: string) => {
        const driver = drivers.find((d: any) => d.user?.id === driverId || d.id === driverId);
        if (driver) {
            setSelectedDriver({ id: driverId, name: `${driver.firstName} ${driver.lastName}` });
            setMessageModalVisible(true);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedDriver || !messageContent.trim()) return;

        setMessageLoading(true);
        try {
            const res = await apiClient.post('/api/messages', {
                receiverId: selectedDriver.id,
                content: messageContent,
                format: 'TEXT'
            });
            if (res.data.success) {
                message.success('Mesaj gönderildi');
                setMessageModalVisible(false);
                setMessageContent('');
            }
        } catch (error) {
            console.error('Message send error:', error);
            message.error('Mesaj giderilemedi');
        } finally {
            setMessageLoading(false);
        }
    };

    return (
        <AdminGuard>
            <AdminLayout selectedKey="operations-list">
                <div style={{ paddingBottom: 24 }}>
                    {/* Header Filters */}
                    <Card bodyStyle={{ padding: '16px' }} style={{ marginBottom: 16 }}>
                        <Row gutter={[16, 16]} align="middle">
                            <Col>
                                <Space>
                                    <Button type={filters.direction === 'ALL' ? 'primary' : 'default'} onClick={() => setFilters({ ...filters, direction: 'ALL' })}>HEPSİ</Button>
                                    <Button type={filters.direction === 'DEPARTURE' ? 'primary' : 'default'} icon={<SwapRightOutlined rotate={-45} />} onClick={() => setFilters({ ...filters, direction: 'DEPARTURE' })}>GİDİŞ</Button>
                                    <Button type={filters.direction === 'ARRIVAL' ? 'primary' : 'default'} icon={<SwapRightOutlined rotate={45} />} onClick={() => setFilters({ ...filters, direction: 'ARRIVAL' })}>GELİŞ</Button>
                                    <Button type={filters.direction === 'INTER' ? 'primary' : 'default'} icon={<SwapRightOutlined />} onClick={() => setFilters({ ...filters, direction: 'INTER' })}>ARA</Button>
                                </Space>
                            </Col>
                            <Col flex="auto" style={{ textAlign: 'right' }}>
                                <Badge count={bookings.filter((b: any) => b.status === 'PENDING').length} style={{ marginRight: 8 }}>
                                    <Button type="primary" danger>ONAY BEKLEYEN</Button>
                                </Badge>

                                <Space>
                                    <Button icon={<EditOutlined />} onClick={openEditModal}>Başlıkları Düzenle</Button>
                                    <Button icon={<BgColorsOutlined />} onClick={openColorModal}>Renk Ayarları</Button>
                                    <Button icon={<SaveOutlined />} onClick={saveLayout}>Görünümü Kaydet</Button>
                                    <Tooltip title="Varsayılan Görünüme Dön">
                                        <Button icon={<UndoOutlined />} onClick={resetLayout} />
                                    </Tooltip>
                                    <Button style={{ marginLeft: 8 }} icon={<FileExcelOutlined />}>Excel</Button>
                                </Space>
                            </Col>
                        </Row>

                        <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                            <Row gutter={[12, 12]}>
                                <Col span={3}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Tarih Aralığı</Text>
                                    <RangePicker
                                        size="small"
                                        style={{ width: '100%' }}
                                        defaultValue={[dayjs(), dayjs().add(7, 'd')]}
                                        format="DD.MM.YYYY"
                                    />
                                </Col>
                                <Col span={2}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Transfer Tipi</Text>
                                    <Select
                                        size="small"
                                        style={{ width: '100%' }}
                                        defaultValue="ALL"
                                        onChange={(val) => setFilters({ ...filters, transferType: val })}
                                    >
                                        <Option value="ALL">Hepsi</Option>
                                        <Option value="SHUTTLE">Shuttle</Option>
                                        <Option value="PRIVATE">Özel</Option>
                                    </Select>
                                </Col>
                                <Col span={3}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Acente</Text>
                                    <Select size="small" style={{ width: '100%' }} placeholder="Hepsi" allowClear>
                                        <Option value="direct">Direkt</Option>
                                    </Select>
                                </Col>
                                <Col span={3}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Alt Acente</Text>
                                    <Select size="small" style={{ width: '100%' }} placeholder="Hepsi" disabled />
                                </Col>
                                <Col span={3}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Sürücü</Text>
                                    <Select
                                        size="small"
                                        style={{ width: '100%' }}
                                        placeholder="Hepsi"
                                        showSearch
                                        allowClear
                                        optionFilterProp="label"
                                        options={drivers.map((d: any) => ({
                                            value: d.user?.id || d.id,
                                            label: `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.name || d.id
                                        }))}
                                        onChange={(val) => setFilters(prev => ({ ...prev, driver: val || 'ALL' }))}
                                    />
                                </Col>
                                <Col span={3}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Araç</Text>
                                    <Select
                                        size="small"
                                        style={{ width: '100%' }}
                                        placeholder="Hepsi"
                                        showSearch
                                        allowClear
                                        optionFilterProp="label"
                                        options={vehicles.map((v: any) => ({
                                            value: v.id,
                                            label: `${v.plateNumber} - ${v.model || v.vehicleType || ''}`
                                        }))}
                                        onChange={(val) => setFilters(prev => ({ ...prev, vehicle: val || 'ALL' }))}
                                    />
                                </Col>
                                <Col span={2}>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Durum</Text>
                                    <Select size="small" style={{ width: '100%' }} placeholder="Aktif">
                                        <Option value="active">Aktif</Option>
                                        <Option value="cancelled">İptal</Option>
                                    </Select>
                                </Col>
                                <Col span={3} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <Button type="primary" size="small" icon={<FilterOutlined />} block onClick={fetchBookings}>Filtrele</Button>
                                </Col>
                            </Row>
                        </div>
                    </Card>

                    {/* Main Table */}
                    <Card bodyStyle={{ padding: 0 }}>
                        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                            <Text>Toplam {bookings.length} kayıt listelenmiştir.</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}><DragOutlined /> Sütun başlıklarını sürükleyebilir ve genişliklerini ayarlayabilirsiniz</Text>
                        </div>
                        <DndContext
                            sensors={sensors}
                            modifiers={[restrictToHorizontalAxis]}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={(columns as any[]).filter(Boolean).map((i: any) => i.key)}
                                strategy={horizontalListSortingStrategy}
                            >
                                <Table
                                    bordered
                                    columns={(columns as any[]).filter(Boolean).map((col, index) => ({
                                        ...col,
                                        onHeaderCell: (column: any) => ({
                                            width: column.width,
                                            onResize: handleResize(index),
                                            id: column.key, // Pass ID for Sortable
                                        }),
                                    }))}
                                    components={{
                                        header: {
                                            cell: ResizableTitle,
                                        },
                                    }}
                                    dataSource={bookings}
                                    rowClassName={(record: any) => {
                                        const color = getRowColor(record);
                                        return color ? `status-row-colored` : '';
                                    }}
                                    onRow={(record: any) => ({
                                        style: { backgroundColor: getRowColor(record) || undefined }
                                    })}
                                    loading={loading}
                                    pagination={{ pageSize: 20, showSizeChanger: true }}
                                    size="small"
                                    scroll={{ x: 1800 }} // Increased schema width
                                />
                            </SortableContext>
                        </DndContext>
                    </Card>

                    {/* Edit Columns Modal */}
                    <Modal
                        title="Sütun Başlıklarını Düzenle"
                        open={editModalVisible}
                        onOk={saveColumnTitles}
                        onCancel={() => setEditModalVisible(false)}
                        width={600}
                    >
                        <Row gutter={[16, 16]} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {tempColumns.map((col: any) => (
                                <Col span={12} key={col.key}>
                                    <div style={{ marginBottom: 4 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{defaultColumns.find(c => c.key === col.key)?.title || col.key}</Text>
                                    </div>
                                    <Input
                                        value={col.title}
                                        onChange={(e) => handleTitleChange(col.key, e.target.value)}
                                        placeholder={defaultColumns.find(c => c.key === col.key)?.title || col.key}
                                    />
                                </Col>
                            ))}
                        </Row>
                    </Modal>
                    {/* Color Settings Modal */}
                    <Modal
                        title="Renk Ayarları — Transfer Durumuna Göre Satır Rengi"
                        open={colorModalVisible}
                        onOk={saveColors}
                        onCancel={() => setColorModalVisible(false)}
                        okText="Renkleri Kaydet"
                        cancelText="İptal"
                        width={500}
                        footer={[
                            <Button key="reset" onClick={resetColors}>Varsayılana Sıfırla</Button>,
                            <Button key="cancel" onClick={() => setColorModalVisible(false)}>İptal</Button>,
                            <Button key="ok" type="primary" onClick={saveColors}>Renkleri Kaydet</Button>,
                        ]}
                    >
                        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <div key={key} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div
                                        style={{
                                            width: 120,
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            backgroundColor: tempColors[key] || '#fff',
                                            border: '1px solid #d9d9d9',
                                            fontSize: 13,
                                            fontWeight: 500,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {label}
                                    </div>
                                    <input
                                        type="color"
                                        value={tempColors[key] || '#ffffff'}
                                        onChange={(e) => setTempColors(prev => ({ ...prev, [key]: e.target.value }))}
                                        style={{ width: 48, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                                    />
                                    <div style={{ flex: 1, height: 28, borderRadius: 4, backgroundColor: tempColors[key] || '#fff', border: '1px solid #eee' }} />
                                    <Button size="small" onClick={() => setTempColors(prev => ({ ...prev, [key]: DEFAULT_COLORS[key] || '#ffffff' }))}>
                                        ↺
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Modal>

                    {/* Message Driver Modal */}
                    <Modal
                        title={`Sürücüye Mesaj Gönder: ${selectedDriver?.name || ''}`}
                        open={messageModalVisible}
                        onOk={handleSendMessage}
                        onCancel={() => setMessageModalVisible(false)}
                        okText="Gönder"
                        cancelText="İptal"
                        confirmLoading={messageLoading}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Mesajınızı yazın..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                        />
                    </Modal>
                </div>
            </AdminLayout>
        </AdminGuard >
    );
}
