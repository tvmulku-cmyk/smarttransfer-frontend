// API client with authentication
import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://smarttransfer-backend-production.up.railway.app';
const rawTenantSlug = process.env.NEXT_PUBLIC_TENANT_SLUG || 'smarttravel-demo';

const API_URL = rawApiUrl.replace(/[\r\n]+/g, '').trim();
const TENANT_SLUG = rawTenantSlug.replace(/[\r\n]+/g, '').trim();

// Create axios instance
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Slug': TENANT_SLUG,
    },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
    // Log for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Handle response errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - redirect to login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
