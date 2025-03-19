import { format, formatDistance, formatRelative } from 'date-fns';

// Date formatting utilities
export const formatDate = {
    standard: (date) => format(new Date(date), 'MMM dd, yyyy'),
    withTime: (date) => format(new Date(date), 'MMM dd, yyyy HH:mm'),
    relative: (date) => formatRelative(new Date(date), new Date()),
    fromNow: (date) => formatDistance(new Date(date), new Date(), { addSuffix: true }),
};

// Form validation utilities
export const validators = {
    required: (value) => (value ? '' : 'This field is required'),
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? '' : 'Invalid email address';
    },
    password: (value) => {
        const errors = [];
        if (value.length < 8) errors.push('Password must be at least 8 characters');
        if (!/\d/.test(value)) errors.push('Password must contain a number');
        if (!/[A-Z]/.test(value)) errors.push('Password must contain an uppercase letter');
        if (!/[a-z]/.test(value)) errors.push('Password must contain a lowercase letter');
        if (!/[!@#$%^&*]/.test(value)) errors.push('Password must contain a special character');
        return errors.length ? errors.join(', ') : '';
    },
    phone: (value) => {
        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        return phoneRegex.test(value) ? '' : 'Invalid phone number';
    },
};

// Local storage utilities
export const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },
};

// Error handling utilities
export const errorHandler = {
    getErrorMessage: (error) => {
        if (typeof error === 'string') return error;
        if (error.response?.data?.message) return error.response.data.message;
        if (error.message) return error.message;
        return 'An unexpected error occurred';
    },
    isNetworkError: (error) => {
        return !error.response && !error.request && error.message === 'Network Error';
    },
    isAuthError: (error) => {
        return error.response?.status === 401 || error.response?.status === 403;
    },
};

// URL utilities
export const urlUtils = {
    getQueryParams: () => {
        const params = new URLSearchParams(window.location.search);
        return Object.fromEntries(params.entries());
    },
    buildUrl: (base, params = {}) => {
        const url = new URL(base, window.location.origin);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value);
            }
        });
        return url.toString();
    },
};

// Device detection utilities
export const deviceUtils = {
    isMobile: () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        );
    },
    isTablet: () => {
        return /(iPad|Android(?!.*Mobile)|Tablet)/i.test(navigator.userAgent);
    },
    isDesktop: () => {
        return !deviceUtils.isMobile() && !deviceUtils.isTablet();
    },
    getBrowserInfo: () => {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';

        if (ua.includes('Firefox/')) {
            browser = 'Firefox';
            version = ua.split('Firefox/')[1];
        } else if (ua.includes('Chrome/')) {
            browser = 'Chrome';
            version = ua.split('Chrome/')[1].split(' ')[0];
        } else if (ua.includes('Safari/')) {
            browser = 'Safari';
            version = ua.split('Version/')[1].split(' ')[0];
        }

        return { browser, version };
    },
};

// Number formatting utilities
export const formatNumber = {
    currency: (value, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(value);
    },
    percentage: (value, decimals = 1) => {
        return `${Number(value).toFixed(decimals)}%`;
    },
    compact: (value) => {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
        }).format(value);
    },
};

// String utilities
export const stringUtils = {
    capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
    truncate: (str, length = 50, suffix = '...') => {
        if (str.length <= length) return str;
        return str.substring(0, length).trim() + suffix;
    },
    slugify: (str) => {
        return str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    },
};

// Array utilities
export const arrayUtils = {
    groupBy: (array, key) => {
        return array.reduce((result, item) => {
            const group = item[key];
            result[group] = result[group] ?? [];
            result[group].push(item);
            return result;
        }, {});
    },
    sortBy: (array, key, order = 'asc') => {
        return [...array].sort((a, b) => {
            if (order === 'asc') return a[key] > b[key] ? 1 : -1;
            return a[key] < b[key] ? 1 : -1;
        });
    },
    unique: (array) => [...new Set(array)],
};

// Color utilities
export const colorUtils = {
    hexToRgb: (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16),
              }
            : null;
    },
    rgbToHex: (r, g, b) => {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },
};

// Debug utilities
export const debug = {
    log: (...args) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(...args);
        }
    },
    error: (...args) => {
        if (process.env.NODE_ENV === 'development') {
            console.error(...args);
        }
    },
};
