'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  CarOutlined,
  UserOutlined,
  SettingOutlined,
  MenuOutlined,
  LogoutOutlined,
  GlobalOutlined,
  ShopOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  BankOutlined,
  TeamOutlined,
  CreditCardOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import FloatingDriverChat from '../components/FloatingDriverChat';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface AdminLayoutProps {
  children: React.ReactNode;
  selectedKey?: string;
  fullWidth?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, selectedKey = 'dashboard', fullWidth = false }) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'ST' : 'SmartTransfer'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultOpenKeys={['vehicles', 'vehicle-tracking-group']}
          selectedKeys={[selectedKey]}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: 'Dashboard',
              onClick: () => router.push('/admin')
            },


            {
              key: 'reservations',
              icon: <CalendarOutlined />,
              label: 'Rezervasyon İşlemleri',
              children: [
                {
                  key: 'transfers',
                  label: 'Rezervasyonlar',
                  onClick: () => router.push('/admin/transfers')
                }
              ]
            },
            {
              key: 'operations',
              icon: <AppstoreOutlined />,
              label: 'Operasyon Yönetimi',
              children: [
                {
                  key: 'op-dashboard',
                  label: 'Dashboard',
                  onClick: () => router.push('/admin/operation')
                },
                {
                  key: 'driver-tracking',
                  label: 'Şoför Takip',
                  onClick: () => router.push('/admin/live-map')
                },
                {
                  key: 'operations-list',
                  label: 'Operasyon',
                  onClick: () => router.push('/admin/operation/operations')
                },
                {
                  key: 'pool-transfers',
                  label: 'Havuzdaki Transferler',
                  onClick: () => router.push('/admin/operation/pool')
                },
                {
                  key: 'partner-transfers',
                  label: 'Partner Transfer Listesi',
                  onClick: () => router.push('/admin/operation/partner-transfers')
                }
              ]
            },
            {
              key: 'accounting',
              icon: <BankOutlined />,
              label: 'Muhasebe',
              children: [
                {
                  key: 'accounting-dashboard',
                  label: 'Genel Durum',
                  onClick: () => router.push('/admin/accounting')
                },
                {
                  key: 'accounting-accounts',
                  label: 'Cariler',
                  onClick: () => router.push('/admin/accounting/accounts')
                },
                {
                  key: 'accounting-invoices',
                  label: 'Kesilecek Faturalar',
                  onClick: () => router.push('/admin/accounting/invoices')
                },
                {
                  key: 'agency-deposits',
                  label: 'Acente Depozitoları',
                  onClick: () => router.push('/admin/agencies/deposits')
                },
                {
                  key: 'payroll',
                  label: 'Personel Hakediş & Maaş',
                  onClick: () => router.push('/admin/accounting/payroll')
                }
              ]
            },
            {
              key: 'partner-operations',
              icon: <TeamOutlined />,
              label: 'Partner / Acente',
              children: [
                {
                  key: 'partner-applications',
                  label: 'Partner Başvuruları',
                  onClick: () => router.push('/admin/partner-applications')
                },
                {
                  key: 'agencies',
                  label: 'Alt Acenteler (B2B)',
                  onClick: () => router.push('/admin/agencies')
                }
              ]
            },
            {
              key: 'bank-management',
              icon: <CreditCardOutlined />,
              label: 'Banka Yönetimi',
              children: [
                {
                  key: 'bank-list',
                  label: 'Banka Listesi',
                  onClick: () => router.push('/admin/banks')
                },
                {
                  key: 'virtual-pos',
                  label: 'Sanal Pos Ayarları',
                  onClick: () => router.push('/admin/banks/virtual-pos')
                }
              ]
            },
            {
              key: 'vehicles-definitions',
              icon: <CarOutlined />,
              label: 'Araç Tanımları',
              children: [
                {
                  key: 'vehicles',
                  label: 'Araçlar',
                  onClick: () => router.push('/admin/vehicles')
                },
                {
                  key: 'vehicle-types',
                  label: 'Araç Tipleri',
                  onClick: () => router.push('/admin/vehicle-types')
                },
                {
                  key: 'shuttle-routes',
                  label: 'Shuttle Hatları',
                  onClick: () => router.push('/admin/shuttle-routes')
                },
                {
                  key: 'extra-services',
                  label: 'Ekstra Hizmetler',
                  onClick: () => router.push('/admin/extra-services')
                }
              ]
            },
            {
              key: 'vehicle-tracking-group',
              icon: <BarChartOutlined />,
              label: 'Araç Takip',
              children: [
                {
                  key: 'vehicle-tracking-dashboard',
                  label: 'Genel Durum',
                  onClick: () => router.push('/admin/vehicle-tracking')
                },
                {
                  key: 'vehicle-tracking-insurance',
                  label: 'Sigorta Takibi',
                  onClick: () => router.push('/admin/vehicle-tracking/insurance')
                },
                {
                  key: 'vehicle-tracking-fuel',
                  label: 'Yakıt Giderleri',
                  onClick: () => router.push('/admin/vehicle-tracking/fuel')
                },
                {
                  key: 'vehicle-tracking-inspection',
                  label: 'Araç Muayene',
                  onClick: () => router.push('/admin/vehicle-tracking/inspection')
                },
                {
                  key: 'vehicle-tracking-maintenance',
                  label: 'Bakım & Onarım',
                  onClick: () => router.push('/admin/vehicle-tracking/maintenance')
                },
              ]
            },
            {
              key: 'personnel-definitions',
              icon: <UserOutlined />,
              label: 'Personel Tanımları',
              children: [
                {
                  key: 'personnel-list',
                  label: 'Personel Listesi',
                  onClick: () => router.push('/admin/personnel')
                }
              ]
            },
            {
              key: 'reports',
              icon: <BarChartOutlined />,
              label: 'Raporlar',
              children: [
                {
                  key: 'general-reports',
                  label: 'Genel Raporlar',
                  onClick: () => router.push('/admin/reports')
                }
              ]
            },
            {
              key: 'settings',
              icon: <SettingOutlined />,
              label: 'Ayarlar',
              children: [
                {
                  key: 'site-settings',
                  label: 'Site Ayarları',
                  onClick: () => router.push('/admin/site-settings')
                },
                {
                  key: 'users',
                  label: 'Kullanıcılar',
                  onClick: () => router.push('/admin/users')
                }
              ]
            }
          ]}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 48, height: 48 }}
            />
            <Title level={4} style={{ margin: '0 0 0 16px' }}>
              Admin Panel
            </Title>
          </div>

          {/* Sağ taraf: Kullanıcı + Çıkış */}
          <Space>
            <Text strong>{user?.fullName || user?.email}</Text>
            <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>
              Çıkış Yap
            </Button>
          </Space>
        </Header>

        {/* Content */}
        <Content style={fullWidth
          ? { minHeight: 'calc(100vh - 64px)', background: '#f5f5f5', overflow: 'hidden' }
          : { margin: '24px 16px', padding: 24, background: '#fff' }
        }>
          {children}
        </Content>
      </Layout>
      <FloatingDriverChat />
    </Layout>
  );
};

export default AdminLayout;