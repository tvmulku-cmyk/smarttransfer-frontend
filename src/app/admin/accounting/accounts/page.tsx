'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Card, Tag, Space, Modal, Form, Input, Select, message, Popconfirm, Row, Col, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, WalletOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import AdminLayout from '../../AdminLayout';
import apiClient from '@/lib/api-client';

const { Option } = Select;

interface Account {
    id: string;
    code: string;
    name: string;
    type: 'CUSTOMER' | 'SUPPLIER' | 'PARTNER' | 'PERSONNEL' | 'OTHER';
    taxNumber?: string;
    taxOffice?: string;
    phone?: string;
    email?: string;
    currency: string;
    balance: number;
    debit: number;
    credit: number;
}

const AccountsPage: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // Statistics
    const [stats, setStats] = useState({
        totalReceivable: 0,
        totalPayable: 0,
        netBalance: 0
    });

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/accounting/accounts');
            if (res.data.success) {
                const data = res.data.data;
                setAccounts(data);
                calculateStats(data);
            }
        } catch (error) {
            message.error('Cariler yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: Account[]) => {
        // Simplified calculation assuming base currency is TRY for all or handled properly
        // In a real app, currency conversion would be needed
        let receivable = 0; // Alacak (We are owed)
        let payable = 0;    // Borç (We owe)

        data.forEach(acc => {
            // Logic: 
            // If balance is positive, it might mean we owe them or they owe us depending on perspective
            // Usually in accounting systems:
            // Debit (Borç) = Money flowing into the account (We gave them service/money) -> They owe us
            // Credit (Alacak) = Money flowing out of the account (They gave us service/money) -> We owe them
            // Balance = Debit - Credit
            // If Balance > 0 -> They owe us (Receivable)
            // If Balance < 0 -> We owe them (Payable)

            // However, the model likely stores aggregate Debit/Credit.
            // Let's assume:
            // Debit = Total billed to them
            // Credit = Total paid by them
            // Balance = Debit - Credit

            // Using the fields from DB which are likely pre-calculated or just placeholders for now
            // For this UI, let's just sum up Positive Balances as Receivable and Negative as Payable for simplicity
            // Or use the debit/credit columns if populated.

            // Let's use the DB fields directly if available, else 0
            const balance = Number(acc.balance) || 0;
            if (balance > 0) receivable += balance;
            else payable += Math.abs(balance);
        });

        setStats({
            totalReceivable: receivable,
            totalPayable: payable,
            netBalance: receivable - payable
        });
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleAdd = () => {
        setEditingAccount(null);
        form.resetFields();
        // Generate a random code or suggesting one could be nice, but checking DB is better.
        // For now, let user input or auto-generate simple one
        form.setFieldsValue({
            currency: 'TRY',
            type: 'CUSTOMER'
        });
        setIsModalVisible(true);
    };

    const handleEdit = (record: Account) => {
        setEditingAccount(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await apiClient.delete(`/api/accounting/accounts/${id}`);
            message.success('Cari silindi');
            fetchAccounts();
        } catch (error) {
            message.error('Silme işlemi başarısız');
        }
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            if (editingAccount) {
                await apiClient.put(`/api/accounting/accounts/${editingAccount.id}`, values);
                message.success('Cari güncellendi');
            } else {
                await apiClient.post('/api/accounting/accounts', values);
                message.success('Cari oluşturuldu');
            }

            setIsModalVisible(false);
            fetchAccounts();
        } catch (error) {
            // Form validation error or API error
            console.error(error);
            if (!(error as any).errorFields) {
                message.error('İşlem başarısız. Cari kodu tekrar ediyor olabilir.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeTag = (type: string) => {
        const map: Record<string, string> = {
            'CUSTOMER': 'blue',
            'SUPPLIER': 'green',
            'PARTNER': 'purple',
            'PERSONNEL': 'orange',
            'OTHER': 'default'
        };
        const labelMap: Record<string, string> = {
            'CUSTOMER': 'Müşteri',
            'SUPPLIER': 'Tedarikçi',
            'PARTNER': 'Partner',
            'PERSONNEL': 'Personel',
            'OTHER': 'Diğer'
        };
        return <Tag color={map[type] || 'default'}>{labelMap[type] || type}</Tag>;
    };

    const columns = [
        {
            title: 'Cari Kodu',
            dataIndex: 'code',
            key: 'code',
            render: (text: string) => <Tag>{text}</Tag>
        },
        {
            title: 'Cari Adı',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <b>{text}</b>
        },
        {
            title: 'Tipi',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => getTypeTag(type)
        },
        {
            title: 'Borç',
            dataIndex: 'debit',
            key: 'debit',
            render: (val: number, record: Account) => (
                <span style={{ color: 'red' }}>
                    {Number(val).toLocaleString('tr-TR', { style: 'currency', currency: record.currency })}
                </span>
            )
        },
        {
            title: 'Alacak',
            dataIndex: 'credit',
            key: 'credit',
            render: (val: number, record: Account) => (
                <span style={{ color: 'green' }}>
                    {Number(val).toLocaleString('tr-TR', { style: 'currency', currency: record.currency })}
                </span>
            )
        },
        {
            title: 'Bakiye',
            dataIndex: 'balance',
            key: 'balance',
            render: (val: number, record: Account) => {
                const num = Number(val);
                const color = num > 0 ? 'red' : (num < 0 ? 'green' : 'black');
                return (
                    <span style={{ color, fontWeight: 'bold' }}>
                        {num.toLocaleString('tr-TR', { style: 'currency', currency: record.currency })}
                    </span>
                );
            }
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_: any, record: Account) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" />
                    <Popconfirm
                        title="Bu cariyi silmek istediğinize emin misiniz?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Evet"
                        cancelText="Hayır"
                    >
                        <Button icon={<DeleteOutlined />} danger size="small" />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <AdminLayout selectedKey="accounting-accounts">
            <Space direction="vertical" style={{ width: '100%' }} size="large">

                {/* Statistics Cards */}
                <Row gutter={16}>
                    <Col span={8}>
                        <Card bordered={false}>
                            <Statistic
                                title="Toplam Alacak"
                                value={stats.totalReceivable}
                                precision={2}
                                valueStyle={{ color: '#3f8600' }}
                                prefix={<ArrowUpOutlined />}
                                suffix="₺" // Assuming base currency
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card bordered={false}>
                            <Statistic
                                title="Toplam Borç"
                                value={stats.totalPayable}
                                precision={2}
                                valueStyle={{ color: '#cf1322' }}
                                prefix={<ArrowDownOutlined />}
                                suffix="₺"
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card bordered={false}>
                            <Statistic
                                title="Net Bakiye"
                                value={Math.abs(stats.netBalance)}
                                precision={2}
                                valueStyle={{ color: stats.netBalance >= 0 ? '#3f8600' : '#cf1322' }}
                                prefix={<WalletOutlined />}
                                suffix={stats.netBalance >= 0 ? " (Alacaklı)" : " (Borçlu)"}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card
                    title="Cari Hesaplar"
                    extra={
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                            Yeni Cari Ekle
                        </Button>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={accounts}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 10 }}
                    />
                </Card>
            </Space>

            <Modal
                title={editingAccount ? "Cari Düzenle" : "Yeni Cari Ekle"}
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={submitting}
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ type: 'CUSTOMER', currency: 'TRY' }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="code"
                                label="Cari Kodu"
                                rules={[{ required: true, message: 'Cari kodu zorunludur' }]}
                            >
                                <Input placeholder="Örn: M-001" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label="Cari Tipi"
                                rules={[{ required: true, message: 'Cari tipi seçiniz' }]}
                            >
                                <Select>
                                    <Option value="CUSTOMER">Müşteri</Option>
                                    <Option value="SUPPLIER">Tedarikçi</Option>
                                    <Option value="PARTNER">Partner</Option>
                                    <Option value="PERSONNEL">Personel</Option>
                                    <Option value="OTHER">Diğer</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Cari Adı / Ünvanı"
                                rules={[{ required: true, message: 'Cari adı zorunludur' }]}
                            >
                                <Input placeholder="Ad Soyad veya Firma Adı" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="currency"
                                label="Para Birimi"
                                rules={[{ required: true }]}
                            >
                                <Select>
                                    <Option value="TRY">TRY (Türk Lirası)</Option>
                                    <Option value="USD">USD (Amerikan Doları)</Option>
                                    <Option value="EUR">EUR (Euro)</Option>
                                    <Option value="GBP">GBP (İngiliz Sterlini)</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="email" label="E-Posta">
                                <Input type="email" placeholder="example@mail.com" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="phone" label="Telefon">
                                <Input placeholder="+90 5XX XXX XX XX" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="taxNumber" label="Vergi Kimlik No / TC">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="taxOffice" label="Vergi Dairesi">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="address" label="Adres">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
};

export default AccountsPage;
