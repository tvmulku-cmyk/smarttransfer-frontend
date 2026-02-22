'use client';

import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Modal, Form, Input, Typography, message, Space, Tag, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api-client';
import AgencyLayout from '../AgencyLayout';
import AgencyGuard from '../AgencyGuard';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface AgencyUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    agencyCommissionRate: number;
    createdAt: string;
}

const AgencyUsersPage = () => {
    const [users, setUsers] = useState<AgencyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/api/agency/users');
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (error: any) {
            if (error.response?.status === 403) {
                message.error('Bu sayfayı görüntüleme yetkiniz yok (Sadece Admin).');
            } else {
                message.error('Personeller yüklenirken hata oluştu');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        form.resetFields();
        form.setFieldsValue({ agencyCommissionRate: 0 });
        setModalVisible(true);
    };

    const handleSave = async (values: any) => {
        try {
            await apiClient.post('/api/agency/users', values);
            message.success('Alt personel başarıyla oluşturuldu');
            setModalVisible(false);
            fetchUsers();
        } catch (error) {
            console.error('Create agency user error:', error);
            message.error('Personel kaydedilirken hata oluştu');
        }
    };

    const columns = [
        {
            title: 'Personel',
            key: 'name',
            render: (text: string, record: AgencyUser) => (
                <div>
                    <Text strong>{record.firstName} {record.lastName}</Text>
                    <div style={{ fontSize: 12, color: 'gray' }}>{record.email}</div>
                </div>
            )
        },
        {
            title: 'Satış Komisyonu',
            dataIndex: 'agencyCommissionRate',
            key: 'agencyCommissionRate',
            render: (val: any) => {
                const numVal = parseFloat(val?.toString() || '0');
                return <Tag color="purple">%{numVal}</Tag>;
            }
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color={status === 'ACTIVE' ? 'success' : 'default'}>{status}</Tag>
        },
        {
            title: 'Kayıt Tarihi',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (val: string) => dayjs(val).format('DD.MM.YYYY HH:mm')
        }
    ];

    return (
        <AgencyGuard>
            <AgencyLayout selectedKey="users">
                <Card bordered={false}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                            <Title level={4} style={{ margin: 0 }}>Acente Personelleri</Title>
                            <Text type="secondary">Acentenize bağlı olarak satış yapacak personelleri yönetin.</Text>
                        </div>
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                            Yeni Personel Ekle
                        </Button>
                    </div>

                    <Table
                        dataSource={users}
                        columns={columns}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>

                <Modal
                    title="Yeni Alt Personel Oluştur"
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    onOk={() => form.submit()}
                    okText="Oluştur"
                    cancelText="İptal"
                >
                    <Form form={form} layout="vertical" onFinish={handleSave}>
                        <Form.Item name="firstName" label="Ad" rules={[{ required: true, message: 'Ad zorunludur' }]}>
                            <Input placeholder="Personel adını giriniz" />
                        </Form.Item>
                        <Form.Item name="lastName" label="Soyad" rules={[{ required: true, message: 'Soyad zorunludur' }]}>
                            <Input placeholder="Personel soyadını giriniz" />
                        </Form.Item>
                        <Form.Item name="email" label="E-Posta (Giriş Adresi)" rules={[{ required: true, type: 'email', message: 'Geçerli e-posta giriniz' }]}>
                            <Input placeholder="E-posta adresi" />
                        </Form.Item>
                        <Form.Item name="password" label="Şifre" rules={[{ required: true, message: 'Şifre zorunludur' }]}>
                            <Input.Password placeholder="Geçici şifre belirleyin" />
                        </Form.Item>
                        <Form.Item
                            name="agencyCommissionRate"
                            label="Fiyatlara Eklenecek Kâr Marjı / Komisyon (%)"
                            tooltip="Bu oran personelin göreceği fiyatların üzerine gizlice eklenir ve satışı yaptığında acentenin kârı olarak kaydedilir."
                        >
                            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="Örn: 10" />
                        </Form.Item>
                    </Form>
                </Modal>
            </AgencyLayout>
        </AgencyGuard>
    );
};

export default AgencyUsersPage;
