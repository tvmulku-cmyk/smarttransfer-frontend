'use client';

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Typography, Button, Space, message } from 'antd';
import {
    DashboardOutlined,
    CarOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    SyncOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import dayjs from 'dayjs';
import AdminLayout from '../AdminLayout';
import AdminGuard from '../AdminGuard';

const { Title } = Typography;

export default function OperationDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        inPool: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all bookings to calculate stats (in a real app, use a dedicated stats endpoint)
            const response = await apiClient.get('/api/transfer/bookings');
            if (response.data.success) {
                const bookings = response.data.data;

                // Calculate Stats
                const stats = {
                    total: bookings.length,
                    pending: bookings.filter((b: any) => b.status === 'PENDING').length,
                    confirmed: bookings.filter((b: any) => b.status === 'CONFIRMED').length,
                    completed: bookings.filter((b: any) => b.status === 'COMPLETED').length,
                    inPool: bookings.filter((b: any) => b.operationalStatus === 'IN_POOL').length
                };
                setStats(stats);

                // Get pending/active bookings for the list
                const active = bookings
                    .filter((b: any) => ['PENDING', 'CONFIRMED'].includes(b.status))
                    .sort((a: any, b: any) => new Date(a.pickupDateTime).getTime() - new Date(b.pickupDateTime).getTime())
                    .slice(0, 5);

                setRecentBookings(active);
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error);
            message.error('Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns = [
        {
            title: 'Rezervasyon',
            dataIndex: 'bookingNumber',
            key: 'bookingNumber',
            render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>
        },
        {
            title: 'Tarih',
            dataIndex: 'pickupDateTime',
            key: 'date',
            render: (val: string) => dayjs(val).format('DD.MM HH:mm')
        },
        {
            title: 'Güzergah',
            key: 'route',
            render: (_: any, record: any) => (
                <div style={{ fontSize: '12px' }}>
                    <div>{record.pickup.location}</div>
                    <div style={{ color: '#999' }}>To: {record.dropoff.location}</div>
                </div>
            )
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: any) => {
                if (record.operationalStatus === 'IN_POOL') return <Tag color="orange">HAVUZDA</Tag>;
                if (status === 'CONFIRMED') return <Tag color="green">ONAYLI</Tag>;
                if (status === 'PENDING') return <Tag color="gold">BEKLİYOR</Tag>;
                return <Tag>{status}</Tag>;
            }
        },
        {
            title: 'Tutar',
            key: 'price',
            render: (_: any, record: any) => (
                <span style={{ fontWeight: 600 }}>{record.price} {record.currency || 'TRY'}</span>
            )
        }
    ];

    return (
        <AdminGuard>
            <AdminLayout selectedKey="op-dashboard">
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <Title level={2} style={{ margin: 0 }}>Operasyon Özeti</Title>
                        <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading}>Yenile</Button>
                    </div>

                    {/* Stats Cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <Statistic
                                    title="Bekleyen Rezervasyon"
                                    value={stats.pending}
                                    valueStyle={{ color: '#d48806' }}
                                    prefix={<ClockCircleOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <Statistic
                                    title="Havuzdaki Transferler"
                                    value={stats.inPool}
                                    valueStyle={{ color: '#fa8c16' }}
                                    prefix={<CarOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <Statistic
                                    title="Aktif Operasyon"
                                    value={stats.confirmed}
                                    valueStyle={{ color: '#3f8600' }}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <Statistic
                                    title="Tamamlanan Bugün"
                                    value={stats.completed}
                                    valueStyle={{ color: '#1890ff' }}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Row gutter={[24, 24]}>
                        {/* Pending / Active List */}
                        <Col xs={24} lg={16}>
                            <Card
                                title="Yaklaşan Transferler"
                                extra={<Button type="link" onClick={() => router.push('/admin/transfers')}>Tümünü Gör</Button>}
                                style={{ height: '100%' }}
                            >
                                <Table
                                    columns={columns}
                                    dataSource={recentBookings}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                />
                            </Card>
                        </Col>

                        {/* Quick Actions / Alerts */}
                        <Col xs={24} lg={8}>
                            <Card title="Hızlı İşlemler" style={{ marginBottom: '24px' }}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Button block onClick={() => router.push('/admin/operation/pool')}>
                                        <Space>
                                            <CarOutlined />
                                            Havuz Yönetimi
                                            <Tag color="orange" style={{ marginLeft: 'auto' }}>{stats.inPool}</Tag>
                                        </Space>
                                    </Button>
                                    <Button block onClick={() => router.push('/admin/vehicles')}>
                                        <Space>
                                            <CarOutlined />
                                            Araç Durumları
                                        </Space>
                                    </Button>
                                    <Button block onClick={() => router.push('/admin/partner-applications')}>
                                        <Space>
                                            <TeamOutlined />
                                            Partner Başvuruları
                                        </Space>
                                    </Button>
                                </Space>
                            </Card>

                            <Card title="Sistem Durumu">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span>API Durumu:</span>
                                    <Tag color="green">Online</Tag>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Son Güncelleme:</span>
                                    <span>{dayjs().format('HH:mm')}</span>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}
