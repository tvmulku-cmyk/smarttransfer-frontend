'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Space, Dropdown, Tag } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    MenuOutlined,
    LogoutOutlined,
    CarOutlined,
    FormOutlined,
    ProfileOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface AgencyLayoutProps {
    children: React.ReactNode;
    selectedKey?: string;
}

const AgencyLayout: React.FC<AgencyLayoutProps> = ({ children, selectedKey = 'dashboard' }) => {
    const [collapsed, setCollapsed] = useState(false);
    const router = useRouter();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const isAdmin = user?.role?.type === 'AGENCY_ADMIN';

    const menuItems: any[] = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'B2B Dashboard',
            onClick: () => router.push('/agency')
        },
        {
            key: 'transfers',
            icon: <CarOutlined />,
            label: 'Transferler',
            children: [
                {
                    key: 'new-transfer',
                    label: 'Talep Oluştur',
                    icon: <FormOutlined />,
                    onClick: () => router.push('/agency/transfers/new')
                },
                {
                    key: 'bulk-transfer',
                    label: 'Toplu Yükleme',
                    icon: <ProfileOutlined />,
                    onClick: () => router.push('/agency/transfers/bulk')
                }
            ]
        }
    ];

    // Only Admin can see the Users menu
    if (isAdmin) {
        menuItems.push({
            key: 'users',
            icon: <UserOutlined />,
            label: 'Personellerim',
            onClick: () => router.push('/agency/users')
        });
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
                <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                        {collapsed ? 'B2B' : 'B2B Portal'}
                    </Title>
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                />
            </Sider>

            <Layout>
                <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button type="text" icon={<MenuOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: '16px', width: 48, height: 48 }} />
                        <Title level={4} style={{ margin: '0 0 0 16px' }}>
                            Acente Paneli
                        </Title>
                    </div>
                    <Space>
                        <Text strong>{user?.fullName || user?.email}</Text>
                        <Tag color="blue">{user?.role?.name}</Tag>
                        <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout}>Çıkış Yap</Button>
                    </Space>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 24, background: '#f0f2f5', minHeight: 280 }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};

export default AgencyLayout;
