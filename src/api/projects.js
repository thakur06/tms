import axios from 'axios';

const API_URL = `${import.meta.env.VITE_SERVER_ADDRESS}/api/projects`;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAllProjects = async () => {
    try {
        const response = await axios.get(API_URL, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching projects:", error);
        throw error;
    }
};
