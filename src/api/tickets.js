import axios from 'axios';

const API_URL = `${import.meta.env.VITE_SERVER_ADDRESS}/api/tickets`;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all tickets (supports filtering)
export const getTickets = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await axios.get(`${API_URL}?${queryParams}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching tickets:", error);
        throw error;
    }
};

// Get single ticket details
export const getTicketById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching ticket details:", error);
        throw error;
    }
};

// Create a new ticket
export const createTicket = async (ticketData) => {
    try {
        const response = await axios.post(API_URL, ticketData, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error creating ticket:", error);
        throw error;
    }
};

// Update a ticket
export const updateTicket = async (id, ticketData) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, ticketData, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error updating ticket:", error);
        throw error;
    }
};

// Delete a ticket
export const deleteTicket = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting ticket:", error);
        throw error;
    }
};

// Add a comment
export const addComment = async (id, commentData) => {
    try {
        const response = await axios.post(`${API_URL}/${id}/comments`, commentData, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};
