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

  return (
    <div
      style={{
        width: '100%',
        padding: '8px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#0f172a', // koyu lacivert
        color: 'white',
      }}
    >
      <div
        style={{ fontWeight: 600, cursor: 'pointer' }}
        onClick={() => router.push('/')}
      >
        SmartTransfer
      </div>

      {/* loading durumunda hiçbir şey göstermeyelim */}
      {!loading && (
        <Space align="center">
          {user ? (
            <>
              <Text style={{ color: 'white' }}>
                Hoş geldin, <b>{user.fullName || user.email}</b>
              </Text>
              {(user.role?.code === 'ADMIN' || user.role?.type === 'ADMIN') && (
                <Button
                  size="small"
                  style={{ marginLeft: 8 }}
                  onClick={() => router.push('/admin')}
                >
                  Admin Panel
                </Button>
              )}
              {/* Partner Panel Button */}
              {(user.role?.code === 'PARTNER' || user.role?.type === 'PARTNER') && (
                <Button
                  size="small"
                  style={{ marginLeft: 8 }}
                  onClick={() => router.push('/partner')}
                >
                  Panel
                </Button>
              )}
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