'use client';

import React, { useEffect, useState } from 'react';
import {
    Table, Card, Tag, Button, Typography, message,
    Statistic, Row, Col, Select, Switch
} from 'antd';
import {
    FileTextOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    ReloadOutlined,
    ShopOutlined,
    UserOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import AdminLayout from '../../AdminLayout';
import AdminGuard from '../../AdminGuard';
import apiClient from '@/lib/api-client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function InvoicesPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [invoicedIds, setInvoicedIds] = useState<Set<string>>(new Set());
    const [showOnlyRequested, setShowOnlyRequested] = useState(true);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/transfer/bookings');
            const data: any[] = res.data?.data || res.data || [];
            setBookings(data);
            applyFilter(data, showOnlyRequested);
        } catch {
            message.error('Rezervasyonlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = (data: any[], onlyRequested: boolean) => {
        if (onlyRequested) {
            setFiltered(data.filter(b =>
                b.wantsInvoice === true ||
                b.metadata?.wantsInvoice === true ||
                !!b.billingDetails ||
                !!b.metadata?.billingDetails
            ));
        } else {
            setFiltered(data);
        }
    };

    useEffect(() => {
        fetchBookings();
        try {
            const saved = localStorage.getItem('invoicedBookingIds');
            if (saved) setInvoicedIds(new Set(JSON.parse(saved)));
        } catch { /* ignore */ }
    }, []);

    const handleFilterToggle = (val: boolean) => {
        setShowOnlyRequested(val);
        applyFilter(bookings, val);
    };

    const markInvoiced = (id: string) => {
        setInvoicedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            localStorage.setItem('invoicedBookingIds', JSON.stringify([...next]));
            return next;
        });
    };

    const pendingInvoice = filtered.filter(b => !invoicedIds.has(b.id));
    const invoiced = filtered.filter(b => invoicedIds.has(b.id));
    const invoiceRequested = bookings.filter(b =>
        b.wantsInvoice === true || b.metadata?.wantsInvoice === true ||
        !!b.billingDetails || !!b.metadata?.billingDetails
    );

    const getBillingInfo = (r: any) => r.billingDetails || r.metadata?.billingDetails || null;
    const getWantsInvoice = (r: any) => r.wantsInvoice || r.metadata?.wantsInvoice || !!getBillingInfo(r);

    const columns = [
        {
            title: '#',
            key: 'index',
            width: 46,
            render: (_: any, __: any, i: number) => i + 1,
        },
        {
            title: 'T.KOD',
            dataIndex: 'bookingNumber',
            key: 'bookingNumber',
            width: 130,
            render: (v: string) => <Tag color="blue">{v}</Tag>,
        },
        {
            title: 'Tarih',
            key: 'date',
            width: 130,
            render: (_: any, r: any) => {
                const d = r.pickupDateTime || r.startDate || r.createdAt;
                return d ? dayjs(d).format('DD.MM.YYYY HH:mm') : '-';
            },
        },
        {
            title: 'Müşteri',
            key: 'customer',
            render: (_: any, r: any) => (
                <div>
                    <Text strong>{r.contactName || r.passengerName || '-'}</Text>
                    <div style={{ fontSize: 11, color: '#888' }}>{r.contactEmail || r.passengerPhone || ''}</div>
                </div>
            ),
        },
        {
            title: 'Fatura Talebi',
            key: 'invoiceReq',
            width: 120,
            render: (_: any, r: any) => {
                const wants = getWantsInvoice(r);
                return wants
                    ? <Tag color="green" icon={<CheckCircleOutlined />}>İstedi</Tag>
                    : <Tag color="default" icon={<ExclamationCircleOutlined />}>İstemedi</Tag>;
            },
        },
        {
            title: 'Fatura Tipi',
            key: 'invoiceType',
            width: 120,
            render: (_: any, r: any) => {
                const billing = getBillingInfo(r);
                if (!billing) return <Text type="secondary">-</Text>;
                return billing.type === 'corporate'
                    ? <Tag icon={<ShopOutlined />} color="purple">Kurumsal</Tag>
                    : <Tag icon={<UserOutlined />} color="geekblue">Bireysel</Tag>;
            },
        },
        {
            title: 'Fatura Bilgisi',
            key: 'billingInfo',
            render: (_: any, r: any) => {
                const billing = getBillingInfo(r);
                if (!billing) return <Text type="secondary" style={{ fontSize: 12 }}>Fatura bilgisi girilmedi</Text>;
                if (billing.type === 'corporate') {
                    return (
                        <div style={{ fontSize: 12 }}>
                            <b>{billing.companyName}</b>
                            <div>{billing.taxOffice} / {billing.taxNo}</div>
                            <div style={{ color: '#888' }}>{billing.address}</div>
                        </div>
                    );
                }
                return (
                    <div style={{ fontSize: 12 }}>
                        <b>{billing.fullName}</b>
                        {billing.tcNo && <div>TC: {billing.tcNo}</div>}
                        {!billing.isCitizen && <Tag color="cyan" style={{ fontSize: 10 }}>Yabancı</Tag>}
                        <div style={{ color: '#888' }}>{billing.address}</div>
                    </div>
                );
            },
        },
        {
            title: 'Tutar',
            key: 'total',
            width: 110,
            render: (_: any, r: any) => {
                const amt = r.total || r.price;
                return amt ? `${Number(amt).toLocaleString('tr-TR')} ${r.currency || 'TRY'}` : '-';
            },
        },
        {
            title: 'Kesildi mi?',
            key: 'status',
            width: 130,
            render: (_: any, r: any) => (
                invoicedIds.has(r.id)
                    ? <Tag color="green" icon={<CheckCircleOutlined />}>Kesildi</Tag>
                    : <Tag color="orange" icon={<ClockCircleOutlined />}>Bekliyor</Tag>
            ),
        },
        {
            title: 'İşlem',
            key: 'action',
            width: 110,
            render: (_: any, r: any) => (
                <Button
                    size="small"
                    type={invoicedIds.has(r.id) ? 'default' : 'primary'}
                    icon={<FileTextOutlined />}
                    onClick={() => markInvoiced(r.id)}
                >
                    {invoicedIds.has(r.id) ? 'Geri Al' : 'Fatura Kes'}
                </Button>
            ),
        },
    ];

    return (
        <AdminGuard>
            <AdminLayout selectedKey="accounting-invoices">
                <div>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <Title level={4} style={{ margin: 0 }}>
                                <FileTextOutlined style={{ marginRight: 8 }} />
                                Kesilecek Faturalar
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Rezervasyon sırasında <b>"Fatura İstiyorum"</b> seçeneğini işaretleyen müşteriler.
                            </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Text>Sadece Fatura İsteyenler</Text>
                            <Switch checked={showOnlyRequested} onChange={handleFilterToggle} />
                            <Button icon={<ReloadOutlined />} onClick={fetchBookings}>Yenile</Button>
                        </div>
                    </div>

                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Fatura İsteyen"
                                    value={invoiceRequested.length}
                                    valueStyle={{ color: '#1677ff' }}
                                    prefix={<FileTextOutlined />}
                                    suffix="adet"
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Bekleyen"
                                    value={pendingInvoice.length}
                                    valueStyle={{ color: '#fa8c16' }}
                                    prefix={<ClockCircleOutlined />}
                                    suffix="adet"
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Kesilmiş"
                                    value={invoiced.length}
                                    valueStyle={{ color: '#52c41a' }}
                                    prefix={<CheckCircleOutlined />}
                                    suffix="adet"
                                />
                            </Card>
                        </Col>
                        <Col span={6}>
                            <Card>
                                <Statistic
                                    title="Toplam Rezervasyon"
                                    value={bookings.length}
                                    valueStyle={{ color: '#666' }}
                                    prefix={<DollarOutlined />}
                                    suffix="adet"
                                />
                            </Card>
                        </Col>
                    </Row>

                    <Card bodyStyle={{ padding: 0 }}>
                        <Table
                            columns={columns}
                            dataSource={filtered}
                            rowKey="id"
                            loading={loading}
                            size="small"
                            pagination={{ pageSize: 20, showSizeChanger: true }}
                            onRow={(r: any) => ({ style: getWantsInvoice(r) ? { background: '#fffbe6' } : {} })}
                        />
                    </Card>
                </div>
            </AdminLayout>
        </AdminGuard>
    );
}
