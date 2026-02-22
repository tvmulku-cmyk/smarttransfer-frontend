'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Input,
  DatePicker,
  TimePicker,
  Radio,
  Button,
  Select,
  Modal,
  Checkbox,
  message,
  List,
  Tag,
  Space,
  InputNumber,
  Form,
  Tabs,
  Carousel,
  Spin
} from 'antd';
import {
  CarOutlined,
  TeamOutlined,
  SearchOutlined,
  ArrowRightOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  StarOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  BankOutlined,
  CompassOutlined,
  ShopOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import TopBar from './components/TopBar';
import LocationSearchInput from './components/LocationSearchInput';
import MapPickerModal from './components/MapPickerModal';
import PassengerSelector from './components/PassengerSelector';

const { Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

interface TransferOption {
  id: number;
  vehicleType: string;
  vendor: string;
  price: number;
  capacity: number;
  cancellationPolicy: string;
  features: string[];
}

interface TourOption {
  id: number;
  title: string;
  description: string;
  duration: string;
  price: number;
  highlights: string[];
  includes: string[];
}

const HomePage: React.FC = () => {
  const router = useRouter();

  // Site Configuration State
  const [configLoading, setConfigLoading] = useState(true);
  const [modules, setModules] = useState<any>({
    transfer: true,
    tour: false,
    hotel: false,
    flight: false,
    car: false,
    cruise: false
  });
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [googleMapsSettings, setGoogleMapsSettings] = useState<{ country?: string }>({});
  const [heroBackground, setHeroBackground] = useState<{ type: 'image' | 'video', videoUrl: string }>({ type: 'image', videoUrl: '' });

  // Active Service Tab
  const [activeTab, setActiveTab] = useState('transfer');

  // Transfer state
  const [pickup, setPickup] = useState('');
  const [pickupLocation, setPickupLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [dropoff, setDropoff] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [pickupDate, setPickupDate] = useState<Dayjs | null>(null);

  // Date/Time state split
  const [pickupHour, setPickupHour] = useState<string>('12');
  const [pickupMinute, setPickupMinute] = useState<string>('00');

  const [returnDate, setReturnDate] = useState<Dayjs | null>(null);
  const [tripType, setTripType] = useState<'oneway' | 'return'>('oneway');

  // Replaced simple passenger count with detailed counts
  const [passengerCounts, setPassengerCounts] = useState({ adults: 1, children: 0, babies: 0 });
  const [passengers, setPassengers] = useState<number>(1); // Keep for compatibility if needed, but sync with counts

  const [childAges, setChildAges] = useState<number[]>([]);
  const [babySeatRequired, setBabySeatRequired] = useState(false);
  const [babySeatModalVisible, setBabySeatModalVisible] = useState(false);

  // Map Modal State
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapModalType, setMapModalType] = useState<'pickup' | 'dropoff'>('pickup');
  const [mapInitialLocation, setMapInitialLocation] = useState<{ lat: number, lng: number } | null>(null);

  // Tour state
  const [tourDestination, setTourDestination] = useState('');
  const [tourDate, setTourDate] = useState<Dayjs | null>(null);
  const [tourParticipants, setTourParticipants] = useState<number>(1);

  // Search results
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<TransferOption[]>([]);
  const [tourResults, setTourResults] = useState<TourOption[]>([]);
  const [searchDone, setSearchDone] = useState(false);

  // Booking modal
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferOption | null>(null);
  const [selectedTour, setSelectedTour] = useState<TourOption | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [form] = Form.useForm();

  // Load configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [modulesRes, imagesRes, infoRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tenant/modules`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tenant/hero-images`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tenant/info`)
        ]);

        if (modulesRes.data.success) {
          setModules(modulesRes.data.data.modules);
          // Set initial active tab based on enabled modules
          if (modulesRes.data.data.modules.flight) setActiveTab('flight');
          else if (modulesRes.data.data.modules.transfer) setActiveTab('transfer');
          else if (modulesRes.data.data.modules.tour) setActiveTab('tour');
        }

        if (infoRes.data.success && infoRes.data.data.tenant.settings?.googleMaps) {
          setGoogleMapsSettings(infoRes.data.data.tenant.settings.googleMaps);
        }

        if (infoRes.data.success && infoRes.data.data.tenant.settings?.heroBackground) {
          setHeroBackground(infoRes.data.data.tenant.settings.heroBackground);
        }

        if (imagesRes.data.success && imagesRes.data.data.heroImages?.length > 0) {
          setHeroImages(imagesRes.data.data.heroImages);
        } else {
          // Default images if none configured
          setHeroImages([
            'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2021&q=80',
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
          ]);
        }
      } catch (error) {
        console.error('Config load error:', error);
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Child handling
  // Map Modal Handlers
  const openMapModal = (type: 'pickup' | 'dropoff') => {
    setMapModalType(type);
    setMapModalVisible(true);
  };

  const handleMapConfirm = (address: string, lat: number, lng: number) => {
    if (mapModalType === 'pickup') {
      setPickup(address);
      setPickupLocation({ lat, lng });
    } else {
      setDropoff(address);
      setDropoffLocation({ lat, lng });
    }
  };

  // Transfer search
  const handleTransferSearch = () => {
    if (!pickup || !dropoff || !pickupDate) {
      message.warning('Lütfen alış, bırakış ve tarihi doldurun.');
      return;
    }

    const params = new URLSearchParams();
    params.set('pickup', pickup);
    params.set('dropoff', dropoff);
    params.set('date', pickupDate.format('YYYY-MM-DD'));
    params.set('time', `${pickupHour}:${pickupMinute}`);

    // Calculate total passengers
    const totalPassengers = passengerCounts.adults + passengerCounts.children + passengerCounts.babies;
    params.set('passengers', totalPassengers.toString());

    params.set('type', tripType === 'return' ? 'ROUND_TRIP' : 'ONE_WAY');

    if (tripType === 'return' && returnDate) {
      params.set('returnDate', returnDate.format('YYYY-MM-DD'));
    }

    if (pickupLocation) {
      params.set('pickupLat', pickupLocation.lat.toString());
      params.set('pickupLng', pickupLocation.lng.toString());
    }

    router.push(`/transfer/search?${params.toString()}`);
  };

  // Tour search
  const handleTourSearch = async () => {
    if (!tourDestination || !tourDate) {
      message.warning('Lütfen destinasyon ve tarihi doldurun.');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchDone(false);

      // TODO: Implement tour search API
      message.info('Tur arama özelliği yakında eklenecek!');
      setTourResults([]);
      setSearchDone(true);
    } catch (error) {
      console.error('handleTourSearch error:', error);
      setTourResults([]);
      setSearchDone(true);
      message.error('Arama sırasında bir hata oluştu.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePlaceholderSearch = (serviceName: string) => {
    message.info(`${serviceName} arama özelliği yakında hizmetinizde!`);
  };

  // Select transfer
  const handleSelectTransfer = (item: TransferOption) => {
    setSelectedTransfer(item);
    setSelectedTour(null);
    form.setFieldsValue({
      fullName: '',
      email: '',
      phone: '',
      flightNumber: '',
      notes: '',
      meetAndGreet: true,
    });
    setBookingModalVisible(true);
  };

  // Select tour
  const handleSelectTour = (item: TourOption) => {
    setSelectedTour(item);
    setSelectedTransfer(null);
    form.setFieldsValue({
      fullName: '',
      email: '',
      phone: '',
      notes: '',
    });
    setBookingModalVisible(true);
  };

  // Booking submit
  const handleBookingSubmit = async () => {
    try {
      const values = await form.validateFields();
      setBookingLoading(true);

      if (selectedTransfer) {
        // Transfer booking
        if (!pickupDate) {
          message.error('Alış tarihi bulunamadı.');
          return;
        }

        const pickupDateTime = dayjs(pickupDate)
          .hour(parseInt(pickupHour))
          .minute(parseInt(pickupMinute))
          .second(0)
          .millisecond(0)
          .toISOString();

        let returnDateTime: string | null = null;
        if (tripType === 'return' && returnDate) {
          returnDateTime = dayjs(returnDate)
            .hour(parseInt(pickupHour)) // Assuming same time for return, or ask user? Defaulting to same.
            .minute(parseInt(pickupMinute))
            .second(0)
            .millisecond(0)
            .toISOString();
        }

        const payload = {
          vehicleType: selectedTransfer.vehicleType,
          vendor: selectedTransfer.vendor,
          price: selectedTransfer.price,
          passengers,
          capacity: selectedTransfer.capacity,
          pickup,
          dropoff,
          pickupDateTime,
          returnDateTime,
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          flightNumber: values.flightNumber || null,
          flightArrivalTime: null,
          meetAndGreet: values.meetAndGreet || false,
          notes: values.notes || '',
          childAges,
          babySeat: babySeatRequired,
        };

        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/bookings`, payload);

        if (res.data?.success) {
          message.success('Rezervasyon başarıyla oluşturuldu!');
          setBookingModalVisible(false);
        } else {
          message.error(res.data?.message || 'Rezervasyon sırasında bir hata oluştu.');
        }
      } else if (selectedTour) {
        // Tour booking - TODO: Implement tour booking API
        message.info('Tur rezervasyonu yakında eklenecek!');
      }
    } catch (err: any) {
      console.error('handleBookingSubmit error:', err);
      message.error('Rezervasyon sırasında bir hata oluştu.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (configLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    modules.flight && {
      key: 'flight',
      label: <span style={{ fontSize: 16 }}><RocketOutlined /> Uçak Bileti</span>,
      children: (
        <div className="search-tab-content">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}><EnvironmentOutlined style={{ color: '#00C9FF' }} /> Nereden</Text>
              <Input size="large" placeholder="Şehir veya Havalimanı" />
            </Col>
            <Col xs={24} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}><EnvironmentOutlined style={{ color: '#00C9FF' }} /> Nereye</Text>
              <Input size="large" placeholder="Şehir veya Havalimanı" />
            </Col>
            <Col xs={24} md={8}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}><CalendarOutlined style={{ color: '#FF6B6B' }} /> Tarih</Text>
              <DatePicker.RangePicker size="large" style={{ width: '100%' }} />
            </Col>
          </Row>
          <Button
            type="primary"
            size="large"
            block
            style={{
              marginTop: 28,
              height: 56,
              fontSize: 18,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)',
              border: 'none',
              boxShadow: '0 6px 20px rgba(0, 201, 255, 0.4)',
              borderRadius: 12
            }}
            onClick={() => handlePlaceholderSearch('Uçak bileti')}
          >
            Uçuş Ara
          </Button>
        </div>
      )
    },
    modules.hotel && {
      key: 'hotel',
      label: <span style={{ fontSize: 16 }}><BankOutlined /> Otel</span>,
      children: (
        <div className="search-tab-content">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}><EnvironmentOutlined style={{ color: '#00C9FF' }} /> Destinasyon</Text>
              <Input size="large" placeholder="Şehir veya Otel Adı" />
            </Col>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}><CalendarOutlined style={{ color: '#FF6B6B' }} /> Giriş - Çıkış</Text>
              <DatePicker.RangePicker size="large" style={{ width: '100%' }} />
            </Col>
          </Row>
          <Button
            type="primary"
            size="large"
            block
            style={{
              marginTop: 28,
              height: 56,
              fontSize: 18,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)',
              border: 'none',
              boxShadow: '0 6px 20px rgba(0, 201, 255, 0.4)',
              borderRadius: 12
            }}
            onClick={() => handlePlaceholderSearch('Otel')}
          >
            Otel Ara
          </Button>
        </div>
      )
    },
    modules.transfer && {
      key: 'transfer',
      label: <span style={{ fontSize: 16 }}><CarOutlined /> Transfer</span>,
      children: (
        <div className="search-tab-content">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}>
                <EnvironmentOutlined style={{ color: '#00C9FF' }} /> Nereden
              </Text>
              <LocationSearchInput
                size="large"
                placeholder="Havaalanı, Adres, Otel yada Yer İsmi"
                value={pickup}
                onChange={setPickup}
                onSelect={(val, lat, lng) => {
                  setPickup(val);
                  if (lat && lng) setPickupLocation({ lat, lng });
                }}
                onMapClick={() => openMapModal('pickup')}
                country={googleMapsSettings.country || 'tr'}
                key={`pickup-${googleMapsSettings.country || 'tr'}`}
                style={{ borderRadius: 'var(--radius-md)' }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}>
                <EnvironmentOutlined style={{ color: '#FF6B6B' }} /> Nereye
              </Text>
              <LocationSearchInput
                size="large"
                placeholder="Havaalanı, Adres, Otel yada Yer İsmi"
                value={dropoff}
                onChange={setDropoff}
                onSelect={(val, lat, lng) => {
                  setDropoff(val);
                  if (lat && lng) setDropoffLocation({ lat, lng });
                }}
                onMapClick={() => openMapModal('dropoff')}
                country={googleMapsSettings.country || 'tr'}
                key={`dropoff-${googleMapsSettings.country || 'tr'}`}
                style={{ borderRadius: 'var(--radius-md)' }}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
            <Col xs={24} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}>
                <CalendarOutlined style={{ color: '#FF6B6B' }} /> Alış Tarihi
              </Text>
              <DatePicker
                size="large"
                style={{ width: '100%', borderRadius: 'var(--radius-md)' }}
                format="DD.MM.YYYY"
                placeholder="Tarih seçin"
                value={pickupDate}
                onChange={(date) => setPickupDate(date)}
              />
            </Col>
            <Col xs={24} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}>
                <ClockCircleOutlined style={{ color: '#FF6B6B' }} /> Alış Saati
              </Text>
              <Space.Compact style={{ width: '100%' }}>
                <Select
                  size="large"
                  value={pickupHour}
                  onChange={setPickupHour}
                  style={{ width: '50%' }}
                  options={Array.from({ length: 24 }, (_, i) => ({
                    value: i.toString().padStart(2, '0'),
                    label: i.toString().padStart(2, '0')
                  }))}
                />
                <Select
                  size="large"
                  value={pickupMinute}
                  onChange={setPickupMinute}
                  style={{ width: '50%' }}
                  options={['00', '15', '30', '45'].map(m => ({ value: m, label: m }))}
                />
              </Space.Compact>
            </Col>
            <Col xs={24} md={5}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}>
                Yolcular
              </Text>
              <PassengerSelector
                size="large"
                value={passengerCounts}
                onChange={(counts) => {
                  setPassengerCounts(counts);
                  // Sync total for compatibility
                  setPassengers(counts.adults + counts.children + counts.babies);
                }}
              />
            </Col>
            <Col xs={24} md={7}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}>
                Transfer Tipi
              </Text>
              <Radio.Group
                value={tripType}
                onChange={(e) => setTripType(e.target.value)}
                style={{ width: '100%' }}
                size="large"
              >
                <Radio.Button value="oneway" style={{ width: '50%', textAlign: 'center' }}>
                  Tek Yön
                </Radio.Button>
                <Radio.Button value="return" style={{ width: '50%', textAlign: 'center' }}>
                  Gidiş-Dönüş
                </Radio.Button>
              </Radio.Group>
            </Col>
          </Row>


          <Button
            type="primary"
            block
            size="large"
            icon={<SearchOutlined />}
            onClick={handleTransferSearch}
            loading={searchLoading}
            style={{
              marginTop: 28,
              height: 56,
              fontSize: 18,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)', // Tropical Cyan-Green
              border: 'none',
              boxShadow: '0 6px 20px rgba(0, 201, 255, 0.4)',
              borderRadius: 12,
              color: '#fff'
            }}
          >
            Transfer Ara
          </Button>
        </div>
      ),
    },
    modules.car && {
      key: 'car',
      label: <span style={{ fontSize: 16 }}><CarOutlined /> Araç Kirala</span>,
      children: (
        <div className="search-tab-content">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}><EnvironmentOutlined style={{ color: '#00C9FF' }} /> Alış Yeri</Text>
              <Input size="large" placeholder="Şehir veya Havalimanı" />
            </Col>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}><CalendarOutlined style={{ color: '#FF6B6B' }} /> Tarihler</Text>
              <DatePicker.RangePicker size="large" style={{ width: '100%' }} />
            </Col>
          </Row>
          <Button
            type="primary"
            size="large"
            block
            style={{
              marginTop: 28,
              height: 56,
              fontSize: 18,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)',
              border: 'none',
              boxShadow: '0 6px 20px rgba(0, 201, 255, 0.4)',
              borderRadius: 12
            }}
            onClick={() => handlePlaceholderSearch('Araç kiralama')}
          >
            Araç Ara
          </Button>
        </div>
      )
    },
    modules.tour && {
      key: 'tour',
      label: <span style={{ fontSize: 16 }}><CompassOutlined /> Turlar</span>,
      children: (
        <div className="search-tab-content">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}>
                <EnvironmentOutlined style={{ color: '#00C9FF' }} /> Destinasyon
              </Text>
              <LocationSearchInput
                size="large"
                placeholder="Örn: Kapadokya"
                value={tourDestination}
                onChange={setTourDestination}
                onSelect={(val) => setTourDestination(val)}
              />
            </Col>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}>
                <CalendarOutlined style={{ color: '#FF6B6B' }} /> Tarih
              </Text>
              <DatePicker
                size="large"
                style={{ width: '100%' }}
                format="DD.MM.YYYY"
                placeholder="Tur tarihi seçin"
                value={tourDate}
                onChange={(date) => setTourDate(date)}
              />
            </Col>
          </Row>
          <Button
            type="primary"
            block
            size="large"
            icon={<SearchOutlined />}
            onClick={handleTourSearch}
            loading={searchLoading}
            style={{
              marginTop: 28,
              height: 56,
              fontSize: 18,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)',
              border: 'none',
              boxShadow: '0 6px 20px rgba(0, 201, 255, 0.4)',
              borderRadius: 12
            }}
          >
            Tur Ara
          </Button>
        </div>
      ),
    },
    modules.cruise && {
      key: 'cruise',
      label: <span style={{ fontSize: 16 }}><ShopOutlined /> Cruise</span>,
      children: (
        <div className="search-tab-content">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}><EnvironmentOutlined style={{ color: '#00C9FF' }} /> Bölge</Text>
              <Select size="large" style={{ width: '100%' }} placeholder="Seçiniz">
                <Select.Option value="med">Akdeniz</Select.Option>
                <Select.Option value="carr">Karayipler</Select.Option>
              </Select>
            </Col>
            <Col xs={24} md={12}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: '#1a1a2e', fontSize: 15 }}><CalendarOutlined style={{ color: '#FF6B6B' }} /> Tarih</Text>
              <DatePicker.MonthPicker size="large" style={{ width: '100%' }} />
            </Col>
          </Row>
          <Button
            type="primary"
            size="large"
            block
            style={{
              marginTop: 28,
              height: 56,
              fontSize: 18,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)',
              border: 'none',
              boxShadow: '0 6px 20px rgba(0, 201, 255, 0.4)',
              borderRadius: 12
            }}
            onClick={() => handlePlaceholderSearch('Cruise')}
          >
            Cruise Ara
          </Button>
        </div>
      )
    },
  ].filter(Boolean);

  const searchOverlay = (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100%',
      maxWidth: '1100px',
      zIndex: 10,
      padding: '0 20px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40, color: '#fff' }}>
        <Title level={1} style={{
          color: '#fff',
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          marginBottom: 16,
          fontWeight: 800,
          textShadow: '0 4px 15px rgba(0,0,0,0.5)',
          letterSpacing: '1px'
        }}>
          Hayalinizdeki Tatili Keşfedin
        </Title>
        <Text style={{
          color: '#fff',
          fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
          textShadow: '0 2px 4px rgba(0,0,0,0.6)',
          fontWeight: 500
        }}>
          En iyi oteller, uçuşlar ve transferler tek adreste
        </Text>
      </div>

      <Card
        variant="borderless"
        style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(16px)',
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        }}
        styles={{ body: { padding: '32px 40px' } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          centered
          size="large"
          tabBarStyle={{ marginBottom: 32 }}
        />
      </Card>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      <MapPickerModal
        visible={mapModalVisible}
        onCancel={() => setMapModalVisible(false)}
        onConfirm={handleMapConfirm}
        initialAddress={mapModalType === 'pickup' ? pickup : dropoff}
        title={mapModalType === 'pickup' ? "Nereden Alınacaksınız?" : "Nereye Gideceksiniz?"}
        country={googleMapsSettings.country || 'tr'}
        key={`map-modal-${googleMapsSettings.country || 'tr'}`}
      />
      <TopBar />

      <Content>
        {/* Render Hero Section based on configuration */}
        {heroBackground.type === 'video' && heroBackground.videoUrl ? (
          <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 0,
              pointerEvents: 'none'
            }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${heroBackground.videoUrl}?autoplay=1&mute=1&controls=0&loop=1&playlist=${heroBackground.videoUrl}&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&vq=hd1080`}
                title="Background Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{
                  width: '100vw',
                  height: '56.25vw',
                  minHeight: '100vh',
                  minWidth: '177.77vh',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}
              ></iframe>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.3)',
                zIndex: 1
              }} />
            </div>
            {searchOverlay}
          </div>
        ) : heroImages.length > 0 ? (
          <div style={{ position: 'relative', height: '600px', overflow: 'hidden' }}>
            <Carousel autoplay effect="fade" autoplaySpeed={5000}>
              {heroImages.map((img, index) => (
                <div key={index}>
                  <div style={{
                    height: '600px',
                    backgroundImage: `url(${img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'rgba(0,0,0,0.4)'
                    }} />
                  </div>
                </div>
              ))}
            </Carousel>
            {searchOverlay}
          </div>
        ) : (
          // Fallback Gradient Hero
          <div
            className="gradient-animate"
            style={{
              background: 'linear-gradient(135deg, var(--primary-gradient-start), var(--primary-gradient-end), var(--secondary-gradient-end))',
              padding: '120px 24px',
              textAlign: 'center',
              position: 'relative',
              height: '500px'
            }}
          >
            <div style={{ position: 'relative', zIndex: 10, maxWidth: '1000px', margin: '0 auto' }}>
              <Title level={1} style={{ color: '#fff', fontSize: '3rem', marginBottom: 20 }}>
                Premium Transfer & Tur Hizmetleri
              </Title>
              <Card
                variant="borderless"
                style={{
                  background: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(16px)',
                  borderRadius: 24,
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                  marginTop: 40
                }}
              >
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={tabItems}
                  centered
                  size="large"
                />
              </Card>
            </div>
          </div>
        )}

        {/* Features Section - Below the fold */}
        <div style={{ maxWidth: '1200px', margin: '60px auto', padding: '0 24px' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
            Neden SmartTransfer?
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card
                className="animate-fadeIn"
                style={{ textAlign: 'center', borderRadius: 'var(--radius-lg)', height: '100%' }}
                hoverable
              >
                <SafetyOutlined style={{ fontSize: 48, color: 'var(--primary-color)', marginBottom: 16 }} />
                <Title level={4}>Güvenilir Hizmet</Title>
                <Text type="secondary">Deneyimli şoförler ve bakımlı araçlarla güvenli yolculuk</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                className="animate-fadeIn"
                style={{ textAlign: 'center', borderRadius: 'var(--radius-lg)', height: '100%', animationDelay: '0.1s' }}
                hoverable
              >
                <ClockCircleOutlined style={{ fontSize: 48, color: 'var(--success-color)', marginBottom: 16 }} />
                <Title level={4}>7/24 Destek</Title>
                <Text type="secondary">Her an ulaşabileceğiniz müşteri hizmetleri ekibi</Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                className="animate-fadeIn"
                style={{ textAlign: 'center', borderRadius: 'var(--radius-lg)', height: '100%', animationDelay: '0.2s' }}
                hoverable
              >
                <StarOutlined style={{ fontSize: 48, color: 'var(--warning-color)', marginBottom: 16 }} />
                <Title level={4}>Premium Deneyim</Title>
                <Text type="secondary">Konforlu ve lüks araçlarla seyahat keyfi</Text>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Modals */}
        <Modal
          title="Bebek Koltuğu Gerekli mi?"
          open={babySeatModalVisible}
          onOk={() => {
            setBabySeatRequired(true);
            setBabySeatModalVisible(false);
            message.success('Bebek koltuğu eklendi.');
          }}
          onCancel={() => {
            setBabySeatRequired(false);
            setBabySeatModalVisible(false);
          }}
          okText="Evet, Gerekli"
          cancelText="Hayır"
        >
          <Text>0-2 yaş arası çocuğunuz için bebek koltuğu eklemek ister misiniz?</Text>
        </Modal>

        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircleOutlined style={{ fontSize: 24, color: 'var(--success-color)' }} />
              <span>Rezervasyon Bilgileri</span>
            </div>
          }
          open={bookingModalVisible}
          onOk={handleBookingSubmit}
          confirmLoading={bookingLoading}
          onCancel={() => setBookingModalVisible(false)}
          okText="Rezervasyonu Tamamla"
          cancelText="İptal"
          width={600}
        >
          {selectedTransfer && (
            <div
              style={{
                marginBottom: 24,
                padding: 16,
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Seçilen Araç:
              </Text>
              <Space>
                <CarOutlined style={{ color: 'var(--primary-color)' }} />
                <Text>
                  {selectedTransfer.vehicleType} - {selectedTransfer.vendor}
                </Text>
                <Text strong style={{ color: 'var(--primary-color)' }}>
                  €{selectedTransfer.price.toFixed(2)}
                </Text>
              </Space>
            </div>
          )}

          <Form layout="vertical" form={form}>
            <Form.Item
              label="Ad Soyad"
              name="fullName"
              rules={[{ required: true, message: 'Lütfen ad soyad girin' }]}
            >
              <Input size="large" placeholder="Ad Soyad" />
            </Form.Item>
            <Form.Item
              label="E-posta"
              name="email"
              rules={[
                { required: true, message: 'Lütfen e-posta girin' },
                { type: 'email', message: 'Geçerli bir e-posta girin' },
              ]}
            >
              <Input size="large" placeholder="ornek@mail.com" />
            </Form.Item>
            <Form.Item
              label="Telefon"
              name="phone"
              rules={[{ required: true, message: 'Lütfen telefon numarası girin' }]}
            >
              <Input size="large" placeholder="+90..." />
            </Form.Item>
            {selectedTransfer && (
              <>
                <Form.Item label="Uçuş Numarası" name="flightNumber">
                  <Input size="large" placeholder="Örn: TK1234" />
                </Form.Item>
                <Form.Item name="meetAndGreet" valuePropName="checked">
                  <Checkbox>Karşılama hizmeti (Meet & Greet) istiyorum</Checkbox>
                </Form.Item>
              </>
            )}
            <Form.Item label="Notlar" name="notes">
              <Input.TextArea
                rows={3}
                placeholder="İletmek istediğiniz ek notlar"
              />
            </Form.Item>
          </Form>
        </Modal>
      </Content>

      <Footer
        style={{
          textAlign: 'center',
          background: 'var(--gray-900)',
          color: '#fff',
          padding: '32px 24px',
        }}
      >
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
          SmartTransfer ©2025 - Tüm hakları saklıdır
        </Text>
      </Footer>
    </Layout>
  );
};

export default HomePage;