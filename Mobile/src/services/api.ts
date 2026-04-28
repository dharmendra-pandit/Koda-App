import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URLS = [
  'https://koda-app-k7u3.onrender.com/api',
  'https://koda-app-985v.onrender.com/api',
]

let currentBaseURL = API_URLS[0]

export const api = axios.create({
  baseURL: currentBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token interceptor
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Failover interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // agar already retry ho chuka hai → loop avoid
    if (!originalRequest._retry) {
      originalRequest._retry = true

      // switch to next server
      const currentIndex = API_URLS.indexOf(currentBaseURL)
      const nextIndex = (currentIndex + 1) % API_URLS.length
      currentBaseURL = API_URLS[nextIndex]

      console.log('Switching to:', currentBaseURL)

      api.defaults.baseURL = currentBaseURL
      originalRequest.baseURL = currentBaseURL

      return api(originalRequest)
    }

    return Promise.reject(error)
  },
)
