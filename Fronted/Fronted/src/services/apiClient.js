import axios from 'axios';

const API_URL = 'http://18.117.138.19:8000/';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});



export default apiClient;


