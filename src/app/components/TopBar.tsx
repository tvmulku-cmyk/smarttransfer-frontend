'use client';

import React from 'react';
import { Button, Space, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const { Text } = Typography;

const TopBar: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleLogoutClick = () => {
    logout();
    router.push('/');
  };

  // Kullanıcı giriş yapmışsa panele gönder
  const getPanelRoute = () => {
    if (!user) return null;
    const type = (user.role?.type || '').toUpperCase();
    const code = (user.role?.code || '').toUpperCase();
    const combined = type + ' ' + code;

    if (combined.includes('AGENCY')) return '/agency';
    if (combined.includes('PARTNER')) return '/partner';
    if (combined.includes('DRIVER')) return '/driver';

    // Admin, SUPER_ADMIN, TENANT_ADMIN, PLATFORM_OPS, Staff vs. → hepsini /admin'e gönder
    return '/admin';
  };

  const panelRoute = getPanelRoute();

  return (
    <div
      style={{
        width: '100%',
        padding: '8px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0f172a',
        color: 'white',
      }}
    >
      <div
        style={{ fontWeight: 600, cursor: 'pointer' }}
        onClick={() => router.push('/')}
      >
        SmartTransfer
      </div>

      {!loading && (
        <Space align="center">
          {user ? (
            <>
              {/* İsme tıklayınca panel sayfasına git */}
              <span
                onClick={() => panelRoute && router.push(panelRoute)}
                style={{
                  color: 'white',
                  cursor: panelRoute ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                Hoş geldin,{' '}
                <b>{user.fullName || user.email}</b>
              </span>
              <Button
                size="small"
                danger
                style={{ marginLeft: 8 }}
                onClick={handleLogoutClick}
              >
                Çıkış Yap
              </Button>
            </>
          ) : (
            <Button
              size="small"
              type="primary"
              onClick={handleLoginClick}
            >
              Giriş Yap
            </Button>
          )}
        </Space>
      )}
    </div>
  );
};

export default TopBar;