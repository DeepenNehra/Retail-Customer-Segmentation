import axios from 'axios';
import { auth } from '../firebase';

// Use environment variable for production, fallback to local for development
// For Render deployment, the env var is set at build time
const BASE_URL = import.meta.env.VITE_API_URL || 
                 (window.location.hostname === 'localhost' 
                   ? "http://127.0.0.1:8000/api"
                   : "https://segmentation-knight-backend.onrender.com/api");

// Create an axios instance
const api = axios.create({
  baseURL: BASE_URL,
});

// Add a request interceptor to attach the Firebase UID
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    // Send the Firebase UID to identify the user on the backend
    config.headers['X-User-ID'] = user.uid;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const getDashboardData = async (datasetId = null) => {
  try {
    const url = datasetId 
      ? `/dashboard-data/?dataset_id=${datasetId}`
      : `/dashboard-data/`;
    const res = await api.get(url);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch dashboard data");
  }
};

export const getProfile = async () => {
  try {
    const res = await api.get(`/profile/`);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch profile");
  }
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await api.post(`/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to upload file");
  }
};

export const getUploadHistory = async () => {
  try {
    const res = await api.get(`/upload-history/`);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch upload history");
  }
};
