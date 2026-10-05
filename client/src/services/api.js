import axios from 'axios';
import { LANGUAGE_VERSIONS } from '../constants';

const API = axios.create({
    baseURL: 'http://localhost:5000',
});

export const executeCode = async (language, code, stdin = "") => {
    try {
        const response = await API.post('/run', {
            language,
            version: LANGUAGE_VERSIONS[language],
            code,
            stdin
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            throw new Error(error.response.data.error || 'Server error occurred');
        } else if (error.request) {
            // The request was made but no response was received
            throw new Error('Network error. Unable to reach the server.');
        } else {
            // Something happened in setting up the request that triggered an Error
            throw new Error('Failed to execute code: ' + error.message);
        }
    }
};
