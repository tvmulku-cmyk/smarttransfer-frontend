'use client';

import React, { useState } from 'react';
import { Card, Button, Form, Input, Typography, message, DatePicker, InputNumber, Select, Row, Col } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api-client';
import AgencyLayout from '../../AgencyLayout';
import AgencyGuard from '../../AgencyGuard';

const { Title, Text } = Typography;

const AgencyNewTransferPage = () => {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSave = async (values: any) => {
        try {
            setLoading(true);
            await apiClient.post('/api/agency/bookings', {
                ...values,
                type: 'TRANSFER'
            });
            message.success('Transfer talebi başarıyla oluşturuldu.');
            form.resetFields();
        } catch (error) {
            console.error('Create transfer error:', error);
            message.error('Transfer oluşturulurken hata meydana geldi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AgencyGuard>
            <AgencyLayout selectedKey="new-transfer">
                <Card bordered={false} style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ marginBottom: 24 }}>
                        <Title level={4} style={{ margin: 0 }}>Yeni Transfer Talebi (B2B)</Title>
                        <Text type="secondary">Müşteriniz için sisteme yeni bir transfer talebi girin.</Text>
                    </div>

                    <Form form={form} layout="vertical" onFinish={handleSave}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="contactName" label="Müşteri Ad Soyad" rules={[{ required: true }]}>
                                    <Input placeholder="Müşteri adı" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="contactPhone" label="Müşteri Telefon" rules={[{ required: true }]}>
                                    <Input placeholder="Telefon numarası" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="startDate" label="Transfer Tarihi ve Saati" rules={[{ required: true }]}>
                                    <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="passengers" label="Yolcu Sayısı" rules={[{ required: true }]}>
                                    <InputNumber min={1} max={50} style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item name="amount" label="Acente Satış Tutarı (TRY)" rules={[{ required: true }]}>
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>

                        <div style={{ marginTop: 32, textAlign: 'right' }}>
                            <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading} size="large">
                                Talebi Gönder
                            </Button>
                        </div>
                    </Form>
                </Card>
            </AgencyLayout>
        </AgencyGuard>
    );
};

export default AgencyNewTransferPage;
