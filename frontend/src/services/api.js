import axios from 'axios';

// Use environment variable for production, fallback to local for development
// For Render deployment, the env var is set at build time
const BASE_URL = import.meta.env.VITE_API_URL || 
                 (window.location.hostname === 'localhost' 
                   ? "http://127.0.0.1:8000/api"
                   : "https://segmentation-knight-backend.onrender.com/api");

export const getDashboardData = async (datasetId = null) => {
  try {
    const url = datasetId 
      ? `${BASE_URL}/dashboard-data/?dataset_id=${datasetId}`
      : `${BASE_URL}/dashboard-data/`;
    const res = await axios.get(url);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch dashboard data");
  }
};

export const getProfile = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/profile/`);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch profile");
  }
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await axios.post(`${BASE_URL}/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to upload file");
  }
};
