'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Space, message, Tag, Tooltip, Avatar } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiClient from '../../../lib/api-client';
import AdminGuard from '../AdminGuard';
import AdminLayout from '../AdminLayout';

interface Personnel {
    id: string;
    firstName: string;
    lastName: string;
    tcNumber: string;
    jobTitle: string;
    department: string;
    phone: string;
    email: string;
    photo: string;
    isActive: boolean;
    startDate: string;
}

const PersonnelListPage = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<Personnel[]>([]);
    const router = useRouter();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/personnel');
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching personnel:', error);
            message.error('Personel listesi yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await apiClient.delete(`/api/personnel/${id}`);
            message.success('Personel silindi');
            fetchData();
        } catch (error) {
            message.error('Silme işlemi başarısız');
        }
    };

    const columns = [
        {
            title: 'Personel',
            key: 'personnel',
            render: (text: any, record: Personnel) => (
                <Space>
                    <Avatar src={record.photo} icon={<UserOutlined />} size="large" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{record.firstName} {record.lastName}</span>
                        <span style={{ fontSize: '12px', color: '#888' }}>{record.tcNumber}</span>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Görevi / Departman',
            key: 'job',
            render: (text: any, record: Personnel) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>{record.jobTitle || '-'}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{record.department || '-'}</span>
                </div>
            ),
        },
        {
            title: 'İletişim',
            key: 'contact',
            render: (text: any, record: Personnel) => (
                <Space direction="vertical" size={0}>
                    {record.phone && (
                        <Space size={4}>
                            <PhoneOutlined style={{ color: '#888' }} />
                            <span style={{ fontSize: '13px' }}>{record.phone}</span>
                        </Space>
                    )}
                    {record.email && (
                        <Space size={4}>
                            <MailOutlined style={{ color: '#888' }} />
                            <span style={{ fontSize: '13px' }}>{record.email}</span>
                        </Space>
                    )}
                </Space>
            ),
        },
        {
            title: 'İşe Başlama',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date: string) => date ? new Date(date).toLocaleDateString('tr-TR') : '-',
        },
        {
            title: 'Durum',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (active: boolean) => (
                <Tag color={active ? 'green' : 'red'}>
                    {active ? 'Aktif' : 'Pasif'}
                </Tag>
            ),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (text: any, record: Personnel) => (
                <Space>
                    <Tooltip title="Düzenle">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => router.push(`/admin/personnel/${record.id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Sil">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                if (confirm('Bu personeli silmek istediğinize emin misiniz?')) {
                                    handleDelete(record.id);
                                }
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <AdminGuard>
            <AdminLayout selectedKey="personnel">
                <Card
                    title="Personel Listesi"
                    extra={
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => router.push('/admin/personnel/create')}
                        >
                            Yeni Personel Ekle
                        </Button>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={data}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>
            </AdminLayout>
        </AdminGuard>
    );
};

export default PersonnelListPage;
