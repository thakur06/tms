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
// Update a comment
export const updateComment = async (ticketId, commentId, commentData) => {
    try {
        const response = await axios.put(`${API_URL}/${ticketId}/comments/${commentId}`, commentData, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error updating comment:", error);
        throw error;
    }
};

// Bulk Create Tickets
export const createBulkTickets = async (tickets) => {
    try {
        const response = await axios.post(`${API_URL}/bulk`, { tickets }, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error creating bulk tickets:", error);
        throw error;
    }
};
// Delete a comment
export const deleteComment = async (ticketId, commentId) => {
    try {
        const response = await axios.delete(`${API_URL}/${ticketId}/comments/${commentId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
    }
};
