'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Upload,
  Tabs,
} from 'antd';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import {
  PlusOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import apiClient from '../../../lib/api-client';
import dayjs from 'dayjs';
import AdminGuard from '../AdminGuard';
import AdminLayout from '../AdminLayout';

const { Title, Text } = Typography;
const { Option } = Select;

interface Vehicle {
  id: number;
  name: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  plateNumber: string;
  capacity: number;
  luggage?: number | null;
  vehicleType: string;
  vehicleTypeId?: number;
  vehicleClass?: string | null;
  basePricePerKm?: number | null;
  basePricePerHour?: number | null;
  isCompanyOwned: boolean;
  hasWifi: boolean;
  hasBabySeat: boolean;
  maxBabySeats?: number | null;
  imageUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  usageType: string;
  shuttleMode?: string | null;
}

interface VehicleFormValues {
  name: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  plateNumber: string;
  capacity: number;
  luggage?: number;
  vehicleType: string;
  vehicleTypeId?: number;
  vehicleClass?: string;
  basePricePerKm?: number;
  basePricePerHour?: number;
  isCompanyOwned?: boolean;
  hasWifi?: boolean;
  hasBabySeat?: boolean;
  maxBabySeats?: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
  usageType?: string;
  shuttleMode?: string | null;
  metadata?: {
    openingFee?: number;
    fixedPrice?: number;
  };
}

const VehiclesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]); // Added vehicleTypes state

  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [vehicleClassFilter, setVehicleClassFilter] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm<VehicleFormValues>();
  const [uploadLoading, setUploadLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();

  /* MOCK DATA REMOVED */

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/vehicles');
      const data: Vehicle[] = res.data?.data || [];
      setVehicles(data);
    } catch (err) {
      console.error('fetchVehicles error:', err);
      message.error('Araçlar alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const res = await apiClient.get('/api/vehicle-types');
      if (res.data.success) {
        setVehicleTypes(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchVehicleTypes(); // Fetch types on mount
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (filterActive === 'active' && !v.isActive) return false;
      if (filterActive === 'inactive' && v.isActive) return false;
      if (vehicleClassFilter && v.vehicleClass !== vehicleClassFilter) return false;

      if (searchText.trim()) {
        const s = searchText.trim().toLowerCase();
        const text =
          `${v.name} ${v.brand || ''} ${v.model || ''} ${v.plateNumber}`.toLowerCase();
        if (!text.includes(s)) return false;
      }

      return true;
    });
  }, [vehicles, filterActive, vehicleClassFilter, searchText]);

  const handleNewVehicle = () => {
    setEditingVehicle(null);
    setImageUrl(undefined);
    form.resetFields();
    form.setFieldsValue({
      isCompanyOwned: true,
      hasWifi: true,
      hasBabySeat: false,
      isActive: true,
      usageType: 'TRANSFER',
      shuttleMode: undefined,
    });
    setModalVisible(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setImageUrl(vehicle.imageUrl || undefined);
    form.setFieldsValue({
      name: vehicle.name,
      brand: vehicle.brand || undefined,
      model: vehicle.model || undefined,
      year: vehicle.year || undefined,
      color: vehicle.color || undefined,
      plateNumber: vehicle.plateNumber,
      capacity: vehicle.capacity,
      luggage: vehicle.luggage || undefined,
      // vehicleType: vehicle.vehicleType, // Legacy string
      vehicleTypeId: (vehicle as any).vehicleTypeId, // Use ID if available
      vehicleClass: vehicle.vehicleClass || undefined,
      basePricePerKm: vehicle.basePricePerKm || undefined,
      basePricePerHour: vehicle.basePricePerHour || undefined,
      isCompanyOwned: vehicle.isCompanyOwned,
      hasWifi: vehicle.hasWifi,
      hasBabySeat: vehicle.hasBabySeat,
      maxBabySeats: vehicle.maxBabySeats || undefined,
      imageUrl: vehicle.imageUrl || undefined,
      description: vehicle.description || undefined,
      isActive: vehicle.isActive,
      usageType: vehicle.usageType || 'TRANSFER',
      shuttleMode: vehicle.shuttleMode || undefined,
      metadata: {
        openingFee: (vehicle as any).openingFee,
        fixedPrice: (vehicle as any).fixedPrice
      }
    });

    // Fallback if ID is missing (legacy records), set ID by searching name match (optional but good)
    if (!(vehicle as any).vehicleTypeId && vehicleTypes.length > 0) {
      const match = vehicleTypes.find(t => t.category === vehicle.vehicleType);
      if (match) {
        form.setFieldsValue({ vehicleTypeId: match.id });
      }
    }

    setModalVisible(true);
  };

  const handleToggleActive = async (vehicle: Vehicle, active: boolean) => {
    try {
      await apiClient.patch(`/api/vehicles/${vehicle.id}/active`, {
        isActive: active,
      });
      message.success('Araç durumu güncellendi');
      fetchVehicles();
    } catch (err) {
      console.error('handleToggleActive error:', err);
      message.error('Araç durumu güncellenirken hata oluştu');
    }
  };

  const handleUploadChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setUploadLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      setUploadLoading(false);
      const url = info.file.response?.data?.url;
      setImageUrl(url);
      form.setFieldValue('imageUrl', url);
      message.success('Resim yüklendi');
    } else if (info.file.status === 'error') {
      setUploadLoading(false);
      message.error('Resim yüklenemedi');
    }
  };

  const uploadButton = (
    <div>
      {uploadLoading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Yükle</div>
    </div>
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Extract metadata fields from values (if any)
      const metadataForm = (values as any).metadata || {};

      // Get the selected type object to send legacy "vehicleType" string as backup/display
      const selectedType = vehicleTypes.find(t => t.id === values.vehicleTypeId);

      const payload: any = {
        ...values,
        imageUrl: imageUrl,
        isCompanyOwned: values.isCompanyOwned,
        shuttleMode: values.usageType === 'SHUTTLE' ? values.shuttleMode : null,
        // Map metadata fields to root for backend
        openingFee: metadataForm.openingFee,
        fixedPrice: metadataForm.fixedPrice,
        basePricePerKm: (values as any).basePricePerKm,
        basePricePerHour: (values as any).basePricePerHour,
        // Send vehicleType string for legacy compatibility/display
        vehicleType: selectedType ? selectedType.name : 'Unknown'
      };

      if (editingVehicle) {
        await apiClient.put(
          `/api/vehicles/${editingVehicle.id}`,
          payload
        );
        message.success('Araç güncellendi');
      } else {
        await apiClient.post('/api/vehicles', payload);
        message.success('Araç eklendi');
      }

      setModalVisible(false);
      fetchVehicles();
    } catch (err: any) {
      if (err?.errorFields) {
        return;
      }
      console.error('handleSubmit error:', err);
      if (err.response) {
        message.error(`Hata: ${err.response.data?.error || err.message}`);
      } else {
        message.error('Araç kaydedilirken hata oluştu');
      }
    }
  };

  const onVehicleTypeChange = (typeId: string) => {
    const type = vehicleTypes.find(t => t.id === typeId);
    if (type) {
      form.setFieldsValue({
        capacity: type.capacity,
        luggage: type.luggage,
        vehicleClass: type.category // Auto-select category/class if strictly mapped
      });
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
    },
    {
      title: 'Kullanım',
      dataIndex: 'usageType',
      render: (_: any, record: Vehicle) => {
        const handleUsageToggle = async (newType: string) => {
          try {
            await apiClient.put(`/api/vehicles/${record.id}`, {
              ...record,
              usageType: newType,
              shuttleMode: newType === 'SHUTTLE' ? (record.shuttleMode || 'FLEXIBLE') : null,
            });
            message.success(`Araç tipi "${newType}" olarak güncellendi`);
            fetchVehicles();
          } catch (err) {
            message.error('Güncelleme başarısız');
          }
        };

        return (
          <Space direction="vertical" size={2}>
            <Select
              size="small"
              value={record.usageType || 'TRANSFER'}
              style={{ width: 150 }}
              onChange={handleUsageToggle}
              options={[
                { value: 'TRANSFER', label: '🚗 Özel Transfer' },
                { value: 'SHUTTLE', label: '🚌 Shuttle' },
                { value: 'TOUR', label: '🗺 Tur' },
              ]}
            />
            {record.usageType === 'SHUTTLE' && record.shuttleMode && (
              <Tag color="cyan" style={{ fontSize: 11 }}>
                {record.shuttleMode === 'ROUTE_BASED' ? 'Sabit Hat' : 'Esnek'}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Araç Adı',
      dataIndex: 'name',
      render: (_: any, record: Vehicle) => (
        <div>
          <Text strong>{record.name}</Text>
          <br />
          <Text type="secondary">
            {record.brand || '-'} {record.model || ''}
          </Text>
        </div>
      ),
    },
    {
      title: 'Plaka',
      dataIndex: 'plateNumber',
    },
    {
      title: 'Tip / Sınıf',
      render: (_: any, record: Vehicle) => {
        const classMap: Record<string, string> = {
          'ECONOMY': 'Ekonomik',
          'BUSINESS': 'Business',
          'VIP': 'VIP',
          'MINIBUS': 'Minibüs',
          'BUS': 'Otobüs'
        };
        const className = record.vehicleClass ? (classMap[record.vehicleClass] || record.vehicleClass) : null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Prioritize showing the actual type name if available, else usage type */}
            <Tag color="blue">{(record as any).vehicleTypeDetails?.name || record.vehicleType}</Tag>
            {className && <Tag color="geekblue">{className}</Tag>}
          </div>
        );
      },
    },
    {
      title: 'Kapasite',
      render: (_: any, record: Vehicle) => (
        <span>
          {record.capacity} yolcu
          {record.luggage != null && ` / ${record.luggage} bagaj`}
        </span>
      ),
    },
    {
      title: 'Fiyatlama',
      render: (_: any, record: Vehicle) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text type="secondary">
            km: {record.basePricePerKm != null ? `${record.basePricePerKm} €` : '-'}
          </Text>
          <Text type="secondary">
            saat: {record.basePricePerHour != null ? `${record.basePricePerHour} €` : '-'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Bebek Koltuğu',
      dataIndex: 'hasBabySeat',
      render: (val: boolean, record: Vehicle) =>
        val ? (
          <Tag color="green">
            Var {record.maxBabySeats ? `(${record.maxBabySeats} adet)` : ''}
          </Tag>
        ) : (
          <Tag>Yok</Tag>
        ),
    },
    {
      title: 'Durum',
      dataIndex: 'isActive',
      render: (val: boolean) =>
        val ? <Tag color="green">Aktif</Tag> : <Tag color="red">Pasif</Tag>,
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'createdAt',
      render: (val: string) => dayjs(val).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (_: any, record: Vehicle) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditVehicle(record)}
          >
            Düzenle
          </Button>
          <Switch
            checked={record.isActive}
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<CloseCircleOutlined />}
            onChange={(checked) => handleToggleActive(record, checked)}
          />
        </Space>
      ),
    },
  ];

  return (
    <AdminGuard>
      <AdminLayout selectedKey="vehicles">
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              title={<Title level={3} style={{ margin: 0 }}>Araç Yönetimi</Title>}
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleNewVehicle}
                >
                  Yeni Araç
                </Button>
              }
            >
              <Space style={{ marginBottom: 16 }} wrap>
                <Select
                  value={filterActive}
                  style={{ width: 160 }}
                  onChange={(val) => setFilterActive(val)}
                >
                  <Option value="all">Tümü</Option>
                  <Option value="active">Aktif</Option>
                  <Option value="inactive">Pasif</Option>
                </Select>

                <Select
                  allowClear
                  placeholder="Araç Sınıfı"
                  style={{ width: 180 }}
                  value={vehicleClassFilter}
                  onChange={(val) => setVehicleClassFilter(val)}
                >
                  <Option value="ECONOMY">Economy</Option>
                  <Option value="BUSINESS">Business</Option>
                  <Option value="VIP">VIP</Option>
                  <Option value="MINIBUS">Minibus</Option>
                  <Option value="BUS">Bus</Option>
                </Select>

                <Input
                  placeholder="Ara / plaka, isim, marka"
                  style={{ width: 220 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Space>

              <Table
                rowKey="id"
                loading={loading}
                dataSource={filteredVehicles}
                columns={columns}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }}
              />
            </Card>
          </Col>
        </Row>

        <Modal
          open={modalVisible}
          title={editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle'}
          onCancel={() => setModalVisible(false)}
          onOk={handleSubmit}
          width={800}
          okText="Kaydet"
          cancelText="İptal"
        >
          <Form form={form} layout="vertical">
            <Tabs defaultActiveKey="1" items={[
              {
                key: '1',
                label: 'Araç Özellikleri',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          label="Araç Adı"
                          name="name"
                          rules={[{ required: true, message: 'Araç adı zorunludur' }]}
                        >
                          <Input placeholder="Örn: Mercedes E Serisi - Sedan" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label="Plaka"
                          name="plateNumber"
                          rules={[{ required: true, message: 'Plaka zorunludur' }]}
                        >
                          <Input placeholder="34 ABC 123" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="Marka" name="brand">
                          <Input placeholder="Mercedes, VW, Ford..." />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Model" name="model">
                          <Input placeholder="E220d, Caravelle..." />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Yıl" name="year">
                          <InputNumber placeholder="2023" style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="Renk" name="color">
                          <Input placeholder="Siyah, Beyaz..." />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          label="Kapasite (Yolcu)"
                          name="capacity"
                          rules={[{ required: true, message: 'Kapasite zorunludur' }]}
                        >
                          <InputNumber min={1} max={50} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Bagaj Kapasitesi" name="luggage">
                          <InputNumber min={0} max={20} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        {/* Dynamic Vehicle Type Selection */}
                        <Form.Item
                          label="Araç Tipi"
                          name="vehicleTypeId"
                          rules={[{ required: true, message: 'Araç tipi seçiniz' }]}
                        >
                          <Select
                            placeholder="Seçiniz"
                            onChange={onVehicleTypeChange}
                            showSearch
                            optionFilterProp="children"
                          >
                            {vehicleTypes.map(t => (
                              <Option key={t.id} value={t.id}>{t.name}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          label="Kullanım Tipi"
                          name="usageType"
                          rules={[{ required: true, message: 'Kullanım tipi zorunludur' }]}
                        >
                          <Select placeholder="Seçiniz">
                            <Option value="TRANSFER">Özel Transfer</Option>
                            <Option value="SHUTTLE">Shuttle / Paylaşımlı</Option>
                            <Option value="TOUR">Tur Aracı</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Araç Sınıfı" name="vehicleClass">
                          <Select placeholder="Seçiniz" allowClear>
                            <Option value="ECONOMY">Ekonomik (Economy)</Option>
                            <Option value="BUSINESS">Business</Option>
                            <Option value="VIP">VIP</Option>
                            <Option value="MINIBUS">Minibüs</Option>
                            <Option value="BUS">Otobüs</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Sadece SHUTTLE için göster */}
                    <Form.Item noStyle shouldUpdate>
                      {() => {
                        const usageType = form.getFieldValue('usageType');
                        if (usageType !== 'SHUTTLE') return null;

                        return (
                          <Row gutter={16}>
                            <Col span={12}>
                              <Form.Item
                                label="Shuttle Modu"
                                name="shuttleMode"
                                rules={[{ required: true, message: 'Shuttle modu zorunludur' }]}
                              >
                                <Select placeholder="Seçiniz">
                                  <Option value="ROUTE_BASED">Sabit Hat</Option>
                                  <Option value="FLEXIBLE">Esnek / Koltuk Bazlı</Option>
                                </Select>
                              </Form.Item>
                            </Col>
                          </Row>
                        );
                      }}
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="Bebek Koltuğu" name="hasBabySeat" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Maks. Bebek Koltuğu" name="maxBabySeats">
                          <InputNumber min={0} max={5} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Ücretsiz WiFi" name="hasWifi" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )
              },
              {
                key: '2',
                label: 'Fiyat Tarifesi',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Başlangıç Fiyatı (€)" name={['metadata', 'openingFee']}>
                          <InputNumber
                            min={0}
                            step={1}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="0.00"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Km Başı Fiyat (€)" name="basePricePerKm">
                          <InputNumber
                            min={0}
                            step={0.1}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="1.50"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Sabit Fiyat (€)" name={['metadata', 'fixedPrice']}>
                          <InputNumber
                            min={0}
                            step={1}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="0.00"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Saatlik Fiyat (€)" name="basePricePerHour">
                          <InputNumber
                            min={0}
                            step={1}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="50.00"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )
              },
              {
                key: '3',
                label: 'Diğer',
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="Şirket Aracı" name="isCompanyOwned" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Aktif" name="isActive" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item label="Fotoğraf">
                      <Upload
                        name="file"
                        listType="picture-card"
                        className="avatar-uploader"
                        showUploadList={false}
                        action={`${(process.env.NEXT_PUBLIC_API_URL || 'https://smarttransfer-backend-production.up.railway.app').replace(/[\r\n]+/g, '').trim()}/api/upload`}
                        headers={{
                          Authorization: typeof window !== 'undefined' ? `Bearer ${localStorage.getItem('token')}` : '',
                        }}
                        onChange={handleUploadChange}
                      >
                        {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: '100%', objectFit: 'contain' }} /> : uploadButton}
                      </Upload>
                    </Form.Item>
                    <Form.Item name="imageUrl" hidden>
                      <Input />
                    </Form.Item>

                    <Form.Item label="Açıklama / Notlar" name="description">
                      <Input.TextArea rows={3} placeholder="Ek bilgiler..." />
                    </Form.Item>
                  </>
                )
              }
            ]} />
          </Form>
        </Modal>
      </AdminLayout>
    </AdminGuard>
  );
};

export default VehiclesPage;