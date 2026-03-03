'use client';

import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Switch,
    List,
    Button,
    Input,
    Space,
    message,
    Tabs,
    Form,
    Row,
    Col,
    Image,
    Tag,
    Radio
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
    AppstoreOutlined,
    PictureOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import AdminGuard from '../AdminGuard';
import AdminLayout from '../AdminLayout';
import apiClient from '@/lib/api-client';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const SiteSettingsPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [modules, setModules] = useState<any>({});
    const [heroImages, setHeroImages] = useState<string[]>([]);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [googleMapsSettings, setGoogleMapsSettings] = useState<{ country: string; apiKey?: string }>({ country: 'tr', apiKey: '' });
    const [heroBackground, setHeroBackground] = useState({ type: 'image', videoUrl: '' });

    // Fetch settings on load
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const [modulesRes, imagesRes, infoRes] = await Promise.all([
                apiClient.get('/api/tenant/modules'),
                apiClient.get('/api/tenant/hero-images'),
                apiClient.get('/api/tenant/info')
            ]);

            if (modulesRes.data.success) {
                setModules(modulesRes.data.data.modules);
            }
            if (imagesRes.data.success) {
                setHeroImages(imagesRes.data.data.heroImages || []);
            }
            if (infoRes.data.success && infoRes.data.data.tenant.settings) {
                const settings = infoRes.data.data.tenant.settings;
                if (settings.googleMaps) {
                    setGoogleMapsSettings(settings.googleMaps);
                } else {
                    // Initialize with empty if not present
                    setGoogleMapsSettings({ country: 'tr', apiKey: '' });
                }
                if (settings.heroBackground) {
                    setHeroBackground(settings.heroBackground);
                }
            }
        } catch (error) {
            console.error('Fetch settings error:', error);
            message.error('Ayarlar yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGoogleMaps = async () => {
        try {
            const res = await apiClient.put('/api/tenant/settings', {
                googleMaps: googleMapsSettings
            });

            if (res.data.success) {
                message.success('Google Maps ayarları güncellendi');
            }
        } catch (error) {
            console.error('Update settings error:', error);
            message.error('Ayarlar güncellenemedi');
        }
    };

    const handleSaveBackgroundSettings = async () => {
        try {
            // Extract video ID if it's a full URL
            let finalVideoUrl = heroBackground.videoUrl;
            if (heroBackground.type === 'video' && finalVideoUrl) {
                // Determine if it is a URL or just ID
                if (finalVideoUrl.includes('youtube.com') || finalVideoUrl.includes('youtu.be')) {
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                    const match = finalVideoUrl.match(regExp);
                    if (match && match[2].length === 11) {
                        finalVideoUrl = match[2]; // Store only ID
                    }
                }
            }

            const res = await apiClient.put('/api/tenant/settings', {
                heroBackground: { ...heroBackground, videoUrl: finalVideoUrl }
            });

            if (res.data.success) {
                message.success('Arka plan ayarları güncellendi');
                setHeroBackground({ ...heroBackground, videoUrl: finalVideoUrl });
            }
        } catch (error) {
            console.error('Update settings error:', error);
            message.error('Ayarlar güncellenemedi');
        }
    };

    const handleModuleToggle = async (moduleName: string, checked: boolean) => {
        try {
            const updatedModules = { ...modules, [moduleName]: checked };
            setModules(updatedModules); // Optimistic update

            const res = await apiClient.put('/api/tenant/modules', updatedModules);

            if (res.data.success) {
                message.success(`${moduleName.toUpperCase()} durumu güncellendi`);
            } else {
                throw new Error(res.data.error);
            }
        } catch (error) {
            console.error('Update module error:', error);
            message.error('Güncelleme başarısız');
            fetchSettings(); // Revert on error
        }
    };

    const handleAddImage = async () => {
        if (!newImageUrl) return;

        try {
            const updatedImages = [...heroImages, newImageUrl];
            setHeroImages(updatedImages); // Optimistic update
            setNewImageUrl('');

            const res = await apiClient.put('/api/tenant/hero-images', {
                images: updatedImages
            });

            if (res.data.success) {
                message.success('Görsel eklendi');
            } else {
                throw new Error(res.data.error);
            }
        } catch (error) {
            console.error('Add image error:', error);
            message.error('Görsel eklenemedi');
            fetchSettings();
        }
    };

    const handleRemoveImage = async (index: number) => {
        try {
            const updatedImages = heroImages.filter((_, i) => i !== index);
            setHeroImages(updatedImages);

            const res = await apiClient.put('/api/tenant/hero-images', {
                images: updatedImages
            });

            if (res.data.success) {
                message.success('Görsel silindi');
            }
        } catch (error) {
            console.error('Remove image error:', error);
            message.error('Görsel silinemedi');
            fetchSettings();
        }
    };

    const tabItems = [
        {
            key: 'modules',
            label: (
                <span>
                    <AppstoreOutlined />
                    Hizmet Modülleri
                </span>
            ),
            children: (
                <Card title="Aktif Hizmetler" bordered={false}>
                    <List
                        itemLayout="horizontal"
                        dataSource={[
                            { key: 'transfer', title: 'Transfer Hizmeti', desc: 'Havalimanı ve şehir içi transferler' },
                            { key: 'tour', title: 'Tur Hizmeti', desc: 'Rehberli turlar ve geziler' },
                            { key: 'hotel', title: 'Otel Rezervasyonu', desc: 'Konaklama seçenekleri' },
                            { key: 'flight', title: 'Uçak Bileti', desc: 'Uçuş arama ve rezervasyon' },
                            { key: 'car', title: 'Araç Kiralama', desc: 'Rent a car hizmetleri' },
                            { key: 'cruise', title: 'Cruise Turları', desc: 'Gemi turları' },
                        ]}
                        renderItem={(item) => (
                            <List.Item
                                actions={[
                                    <Switch
                                        key="toggle"
                                        checked={modules[item.key]}
                                        onChange={(checked) => handleModuleToggle(item.key, checked)}
                                        checkedChildren={<CheckCircleOutlined />}
                                        unCheckedChildren={<CloseCircleOutlined />}
                                    />
                                ]}
                            >
                                <List.Item.Meta
                                    title={item.title}
                                    description={item.desc}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            ),
        },
        {
            key: 'images',
            label: (
                <span>
                    <PictureOutlined />
                    Arka Plan Görselleri
                </span>
            ),
            children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                    <Card title="Arka Plan Tipi" bordered={false}>
                        <Radio.Group
                            value={heroBackground.type}
                            onChange={(e) => setHeroBackground({ ...heroBackground, type: e.target.value })}
                            buttonStyle="solid"
                        >
                            <Radio.Button value="image">Resim Slayt</Radio.Button>
                            <Radio.Button value="video">Video (YouTube)</Radio.Button>
                        </Radio.Group>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={handleSaveBackgroundSettings}
                            style={{ float: 'right' }}
                        >
                            Kaydet
                        </Button>
                    </Card>

                    {heroBackground.type === 'video' ? (
                        <Card title="YouTube Video Ayarları" bordered={false}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                Arka planda oynatılacak YouTube videosunun linkini veya ID'sini giriniz.
                                Video otomatik olarak sessiz bir şekilde oynatılacaktır.
                            </Text>
                            <Space.Compact style={{ width: '100%' }}>
                                <Input
                                    placeholder="YouTube Video URL veya ID (örn: dqw4w9wgxcq)"
                                    value={heroBackground.videoUrl}
                                    onChange={(e) => setHeroBackground({ ...heroBackground, videoUrl: e.target.value })}
                                />
                            </Space.Compact>
                            {heroBackground.videoUrl && (
                                <div style={{ marginTop: 24, borderRadius: 8, overflow: 'hidden' }}>
                                    <iframe
                                        width="100%"
                                        height="400"
                                        src={`https://www.youtube.com/embed/${heroBackground.videoUrl}?autoplay=0&controls=1&showinfo=0&rel=0`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}
                        </Card>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
                            <Card title="Yeni Görsel Ekle" bordered={false}>
                                <Space.Compact style={{ width: '100%' }}>
                                    <Input
                                        placeholder="Görsel URL (https://...)"
                                        value={newImageUrl}
                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                        onPressEnter={handleAddImage}
                                    />
                                    <Button type="primary" onClick={handleAddImage} icon={<PlusOutlined />}>Ekle</Button>
                                </Space.Compact>
                            </Card>

                            <Card title="Mevcut Görseller" bordered={false}>
                                <List
                                    grid={{ gutter: 16, column: 3, xs: 1, sm: 2, md: 3 }}
                                    dataSource={heroImages}
                                    renderItem={(url, index) => (
                                        <List.Item>
                                            <Card
                                                cover={
                                                    <div style={{ height: 200, overflow: 'hidden' }}>
                                                        <Image
                                                            src={url}
                                                            alt={`Hero ${index}`}
                                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                        />
                                                    </div>
                                                }
                                                actions={[
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleRemoveImage(index)}
                                                    >
                                                        Sil
                                                    </Button>
                                                ]}
                                            >
                                                <Card.Meta title={`Görsel ${index + 1}`} description={<Text ellipsis>{url}</Text>} />
                                            </Card>
                                        </List.Item>
                                    )}
                                />
                            </Card>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'googleMaps',
            label: (
                <span>
                    <EnvironmentOutlined />
                    Google Maps
                </span>
            ),
            children: (
                <Card title="Google Maps Ayarları" bordered={false}>
                    <Form layout="vertical">
                        <Form.Item
                            label="Google Maps API Anahtarı"
                            extra="Google Cloud Console'dan alacağınız sınırsız veya domain kısıtlamalı API anahtarı."
                        >
                            <Input.Password
                                placeholder="AIza..."
                                value={(googleMapsSettings as any).apiKey || ''}
                                onChange={(e) => setGoogleMapsSettings({ ...googleMapsSettings, apiKey: e.target.value } as any)}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Ülke Sınırlaması (ISO Kodu)"
                            extra="Boş bırakırsanız tüm dünya, 'tr' yazarsanız sadece Türkiye sonuçları çıkar."
                        >
                            <Space.Compact style={{ width: '100%' }}>
                                <Input
                                    placeholder="örn: tr, us, gb"
                                    value={googleMapsSettings.country}
                                    onChange={(e) => setGoogleMapsSettings({ ...googleMapsSettings, country: e.target.value })}
                                />
                                <Button type="primary" onClick={handleSaveGoogleMaps} icon={<SaveOutlined />}>Kaydet</Button>
                            </Space.Compact>
                        </Form.Item>
                    </Form>
                </Card>
            ),
        },
    ];

    return (
        <AdminGuard>
            <AdminLayout selectedKey="site-settings">
                <div style={{ marginBottom: 24 }}>
                    <Title level={2}>Site Ayarları</Title>
                    <Text type="secondary">
                        Web sitesi görünürlük ayarlarını ve arka plan görsellerini yönetin.
                    </Text>
                </div>

                <Tabs defaultActiveKey="modules" items={tabItems} />
            </AdminLayout>
        </AdminGuard>
    );
};

export default SiteSettingsPage;
