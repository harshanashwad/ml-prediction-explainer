/*
api.js is like a centralized hub that talks with out FastAPI backend

methods here will be imported in relevant components to call the necessary endpoints
This is better than making axios calls directly in the component
*/

import axios from "axios";

// Adjust this if your backend runs on a different port in prod
// const BASE_URL = "http://localhost:8000";
const BASE_URL = import.meta.env.VITE_API_URL;


// Upload CSV
export const uploadCSV = async (file) => {
  const formData = new FormData();  // helps simulate form submission suitable for file upload

  // key must match what upload_csv() is expecting 
  formData.append("file", file); // formData allows to construct key-value pairs sent as request body for a POST request


  // send a POST request using axios to /upload-csv endpoint: formData is sent as body of the request. This line waitsfor the backend to respond before moving forward
  const response = await axios.post(`${BASE_URL}/upload-csv`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data; // .data of the response contains what is actually returned by upload_csv()
};

// Train model
export const trainModel = async (target) => {
  const response = await axios.post(`${BASE_URL}/train-model`, {
    target: target,
  });

  return response.data;
};

// Explain model
export const getExplanations = async (start = 0, end = 1) => {
  const response = await axios.get(`${BASE_URL}/explain-model`, {
    params: { start, end },
  });

  return response.data;
};
