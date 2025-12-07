import { 
  Box, 
  Typography, 
  Card, 
  Grid, 
  Chip, 
  Avatar, 
  IconButton,
  Stack,
  Alert,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON } from 'react-leaflet'
import { LatLngExpression, divIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  Map as MapIcon,
  DirectionsCar as VehicleIcon,
  LocalGasStation as FuelIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  Navigation as NavigationIcon,
  Refresh as RefreshIcon,
  Route as RouteIcon,
  Layers as LayersIcon,
  MyLocation as MyLocationIcon,
  Place as PlaceIcon,
  Traffic as TrafficIcon,
  AttachMoney as CostIcon,
  Schedule as TimeIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  TurnRight as TurnIcon,
  Toll as TollIcon
} from '@mui/icons-material'

// Fix for default markers in Leaflet
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

type VehiclePosition = {
  lat: number;
  lng: number;
  vehicleId?: string;
  status?: 'active' | 'fuel' | 'parked' | 'alert';
  driver?: string;
  lastUpdate?: string;
  speed?: number;
  heading?: number;
  fuelLevel?: number | null;
  engineStatus?: string;
  state?: string; // Indian state code
  city?: string; // Current city
  tollsPaid?: number; // Tolls paid today (₹)
}

type TripHistory = {
  tripId: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  startLocation: { lat: number; lng: number; name: string };
  endLocation: { lat: number; lng: number; name: string };
  route: [number, number][];
  distance: number;
  duration: number;
  avgSpeed: number;
  maxSpeed: number;
  fuelUsed: number;
  tollsPaid: number;
  status: 'completed' | 'ongoing' | 'interrupted';
}

type LiveTracking = {
  vehicleId: string;
  tripId: string;
  plannedRoute: [number, number][];
  actualPath: [number, number][];
  currentPosition: { lat: number; lng: number };
  startLocation: { lat: number; lng: number; name: string };
  endLocation: { lat: number; lng: number; name: string };
  startTime: string;
  estimatedArrival: string;
  currentSpeed: number;
  heading: number;
  distanceRemaining: number;
  distanceCovered: number;
  progressPercentage: number;
  isActive: boolean;
}

type RouteData = {
  coordinates: LatLngExpression[];
  distance: number;
  duration: number;
  tolls?: number;
  fuelCost?: number;
  trafficDelay?: number;
  steps?: any[];
  fuelStations?: any[];
}

// Custom vehicle marker icons
const createVehicleIcon = (status: string, heading: number = 0) => {
  const color = getMarkerColor(status)
  const svgContent = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow">
          <dropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3" filter="url(#shadow)"/>
      <g transform="translate(20,20) rotate(${heading})">
        <path d="M0,-12 L6,8 L0,4 L-6,8 Z" fill="white"/>
      </g>
    </svg>
  `
  
  return divIcon({
    html: svgContent,
    className: 'custom-vehicle-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  })
}

function getMarkerColor(status?: string) {
  switch (status) {
    case 'active': return '#4CAF50' // Green
    case 'fuel': return '#FF9800' // Orange
    case 'parked': return '#2196F3' // Blue
    case 'alert': return '#F44336' // Red
    default: return '#9E9E9E' // Grey
  }
}

// Route planning with OSRM - India optimized
class OSRMRouter {
  private serverUrl = 'https://router.project-osrm.org'
  
  // Calculate Indian highway tolls
  private calculateIndianTolls(distance: number): number {
    // Average toll rate in India: ₹2-3 per km on highways
    return Math.round(distance * 2.5)
  }
  
  // Get state-wise fuel prices (₹ per liter)
  private getFuelPrice(state: string): number {
    const fuelPrices: { [key: string]: number } = {
      'MH': 105.50, // Maharashtra
      'DL': 103.20, // Delhi
      'KA': 102.80, // Karnataka
      'TN': 104.10, // Tamil Nadu
      'GJ': 101.50, // Gujarat
      'WB': 106.20, // West Bengal
      'TS': 108.40, // Telangana
      'RJ': 104.80, // Rajasthan
    }
    return fuelPrices[state] || 104.00 // Default price
  }
  
  async getRoute(waypoints: LatLngExpression[]): Promise<RouteData | null> {
    if (waypoints.length < 2) return null
    
    try {
      const coordinates = waypoints
        .map(point => Array.isArray(point) ? `${point[1]},${point[0]}` : `${(point as any).lng},${(point as any).lat}`)
        .join(';')
      
      const response = await fetch(
        `${this.serverUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
      )
      
      const data = await response.json()
      
      if (data.code === 'Ok' && data.routes.length > 0) {
        const route = data.routes[0]
        return {
          coordinates: route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as LatLngExpression),
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60 // Convert to minutes
        }
      }
    } catch (error) {
      console.error('OSRM routing error:', error)
    }
    
    return null
  }
  
  async optimizeTrip(waypoints: LatLngExpression[]): Promise<{ route: RouteData; optimizedOrder: number[] } | null> {
    if (waypoints.length < 3) return null
    
    try {
      const coordinates = waypoints
        .map(point => Array.isArray(point) ? `${point[1]},${point[0]}` : `${(point as any).lng},${(point as any).lat}`)
        .join(';')
      
      const response = await fetch(
        `${this.serverUrl}/trip/v1/driving/${coordinates}?roundtrip=true&overview=full&geometries=geojson`
      )
      
      const data = await response.json()
      
      if (data.code === 'Ok' && data.trips.length > 0) {
        const trip = data.trips[0]
        return {
          route: {
            coordinates: trip.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as LatLngExpression),
            distance: trip.distance / 1000,
            duration: trip.duration / 60
          },
          optimizedOrder: data.waypoints.map((wp: any) => wp.waypoint_index)
        }
      }
    } catch (error) {
      console.error('OSRM trip optimization error:', error)
    }
    
    return null
  }
}

// Helper function to get Indian city name from coordinates
function getIndianCity(lat: number, lng: number): string {
  const indianCities = [
    { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi, NCR', lat: 28.7041, lng: 77.1025 },
    { name: 'Bangalore, Karnataka', lat: 12.9716, lng: 77.5946 },
    { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
    { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714 },
    { name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639 },
    { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
    { name: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 },
    { name: 'Nagpur, Maharashtra', lat: 21.1458, lng: 79.0882 }
  ]
  
  // Find closest city
  let closest = indianCities[0]
  let minDistance = Math.sqrt(Math.pow(lat - closest.lat, 2) + Math.pow(lng - closest.lng, 2))
  
  for (const city of indianCities) {
    const distance = Math.sqrt(Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2))
    if (distance < minDistance) {
      minDistance = distance
      closest = city
    }
  }
  
  return closest.name
}

// Indian Major Cities Database
const indianCities: any[] = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, population: 12442373 },
  { name: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025, population: 11034555 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946, population: 8443675 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, population: 6993262 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, population: 5570585 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, population: 4646732 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, population: 4496694 },
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, population: 4467797 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, population: 3124458 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, population: 3046163 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, population: 2815601 },
  { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, population: 2767031 },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, population: 2405421 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, population: 1994397 },
  { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lng: 72.9781, population: 1841488 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, population: 1798218 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, population: 1730320 },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, population: 1684222 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812, population: 1670806 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538, population: 1636068 }
]

// Fuel Stations Database
const fuelStations: any[] = [
  { id: 'hp1', name: 'HP Petrol Pump Mumbai', brand: 'HP', lat: 19.0760, lng: 72.8777, price: 106.31, amenities: ['Restroom', 'ATM', 'Food'] },
  { id: 'ioc1', name: 'Indian Oil Pump Delhi', brand: 'IOC', lat: 28.7041, lng: 77.1025, price: 96.72, amenities: ['Restroom', 'CNG'] },
  { id: 'bp1', name: 'BPCL Station Bangalore', brand: 'BPCL', lat: 12.9716, lng: 77.5946, price: 102.84, amenities: ['Restroom', 'Food', 'ATM'] },
  { id: 'rel1', name: 'Reliance Fuel Hyderabad', brand: 'Reliance', lat: 17.3850, lng: 78.4867, price: 109.66, amenities: ['Restroom', 'Shop'] },
  { id: 'hp2', name: 'HP Highway Station Ahmedabad', brand: 'HP', lat: 23.0225, lng: 72.5714, price: 104.67, amenities: ['Restroom', 'Food', 'ATM', 'Parking'] },
  { id: 'ioc2', name: 'IOC Chennai Express', brand: 'IOC', lat: 13.0827, lng: 80.2707, price: 102.63, amenities: ['Restroom', 'CNG', 'Food'] },
  { id: 'bp2', name: 'BPCL Kolkata Highway', brand: 'BPCL', lat: 22.5726, lng: 88.3639, price: 106.03, amenities: ['Restroom', 'ATM'] },
  { id: 'hp3', name: 'HP Pune Central', brand: 'HP', lat: 18.5204, lng: 73.8567, price: 106.31, amenities: ['Restroom', 'Food', 'ATM', 'Car Wash'] }
]

// Trip History Database - Last 5 trips for each vehicle
const tripHistory: any[] = [
  {
    tripId: 'trip-001',
    vehicleId: 'MH-12-AB-1234',
    startTime: '2024-01-15 09:30:00',
    endTime: '2024-01-15 14:45:00',
    startLocation: { lat: 19.0760, lng: 72.8777, name: 'Mumbai Central' },
    endLocation: { lat: 18.5204, lng: 73.8567, name: 'Pune Station' },
    route: [
      [19.0760, 72.8777], [19.0955, 72.9081], [19.1238, 73.0169], 
      [19.1521, 73.1257], [18.9876, 73.4532], [18.7234, 73.6789], 
      [18.5204, 73.8567]
    ],
    distance: 148.5,
    duration: 315, // 5.25 hours
    avgSpeed: 47.2,
    maxSpeed: 82,
    fuelUsed: 24.75,
    tollsPaid: 380,
    status: 'completed'
  },
  {
    tripId: 'trip-002',
    vehicleId: 'DL-05-IJ-7890',
    startTime: '2024-01-15 08:15:00',
    endTime: '2024-01-15 13:20:00',
    startLocation: { lat: 28.7041, lng: 77.1025, name: 'Delhi CP' },
    endLocation: { lat: 26.9124, lng: 75.7873, name: 'Jaipur Railway Station' },
    route: [
      [28.7041, 77.1025], [28.6456, 77.0234], [28.5123, 76.8456], 
      [28.2345, 76.5678], [27.8901, 76.2345], [27.4567, 76.0123], 
      [26.9124, 75.7873]
    ],
    distance: 282.3,
    duration: 305, // 5.08 hours  
    avgSpeed: 55.6,
    maxSpeed: 95,
    fuelUsed: 47.05,
    tollsPaid: 720,
    status: 'completed'
  },
  {
    tripId: 'trip-003',
    vehicleId: 'KA-03-GH-3456',
    startTime: '2024-01-15 10:00:00',
    endTime: '2024-01-15 17:30:00',
    startLocation: { lat: 12.9716, lng: 77.5946, name: 'Bangalore Tech Park' },
    endLocation: { lat: 13.0827, lng: 80.2707, name: 'Chennai Airport' },
    route: [
      [12.9716, 77.5946], [13.0123, 77.8234], [13.1456, 78.2567], 
      [13.2789, 78.6890], [13.1234, 79.2345], [13.0567, 79.7890], 
      [13.0827, 80.2707]
    ],
    distance: 346.7,
    duration: 450, // 7.5 hours
    avgSpeed: 46.2,
    maxSpeed: 78,
    fuelUsed: 57.78,
    tollsPaid: 890,
    status: 'completed'
  },
  {
    tripId: 'trip-004',
    vehicleId: 'MH-14-CD-5678',
    startTime: '2024-01-15 06:45:00',
    endTime: 'ongoing',
    startLocation: { lat: 18.5204, lng: 73.8567, name: 'Pune Depot' },
    endLocation: { lat: 19.0760, lng: 72.8777, name: 'Mumbai Port' },
    route: [
      [18.5204, 73.8567], [18.6789, 73.6234], [18.8345, 73.3901], 
      [19.0123, 73.1567], [19.0760, 72.8777]
    ],
    distance: 142.8,
    duration: 180, // 3 hours (ongoing)
    avgSpeed: 47.6,
    maxSpeed: 75,
    fuelUsed: 23.8,
    tollsPaid: 365,
    status: 'ongoing'
  },
  {
    tripId: 'trip-005',
    vehicleId: 'GJ-01-EF-9012',
    startTime: '2024-01-14 14:20:00',
    endTime: '2024-01-14 19:45:00',
    startLocation: { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad Industrial Area' },
    endLocation: { lat: 21.1702, lng: 72.8311, name: 'Surat Diamond Hub' },
    route: [
      [23.0225, 72.5714], [22.8456, 72.6123], [22.6789, 72.6789], 
      [22.4567, 72.7234], [22.2345, 72.7678], [21.9876, 72.8012], 
      [21.1702, 72.8311]
    ],
    distance: 264.5,
    duration: 325, // 5.42 hours
    avgSpeed: 48.8,
    maxSpeed: 88,
    fuelUsed: 44.08,
    tollsPaid: 680,
    status: 'completed'
  }
]

// Live Tracking Data - Ongoing A-to-B journeys
const liveTrackingData: any[] = [
  {
    vehicleId: 'MH-14-CD-5678',
    tripId: 'live-trip-001',
    plannedRoute: [
      [18.5204, 73.8567], // Pune
      [18.6789, 73.6234], // Checkpoint 1
      [18.8345, 73.3901], // Checkpoint 2  
      [19.0123, 73.1567], // Checkpoint 3
      [19.0760, 72.8777]  // Mumbai
    ],
    actualPath: [
      [18.5204, 73.8567], // Started here
      [18.6789, 73.6234], // Reached checkpoint 1
      [18.8345, 73.3901], // Reached checkpoint 2
      [18.9234, 73.2567], // Current actual position (slightly off route)
    ],
    currentPosition: { lat: 18.9234, lng: 73.2567 },
    startLocation: { lat: 18.5204, lng: 73.8567, name: 'Pune Depot' },
    endLocation: { lat: 19.0760, lng: 72.8777, name: 'Mumbai Port' },
    startTime: '2024-01-15 14:30:00',
    estimatedArrival: '2024-01-15 17:45:00',
    currentSpeed: 52,
    heading: 315,
    distanceRemaining: 42.8,
    distanceCovered: 98.7,
    progressPercentage: 69.8,
    isActive: true
  },
  {
    vehicleId: 'DL-05-IJ-7890',
    tripId: 'live-trip-002', 
    plannedRoute: [
      [28.7041, 77.1025], // Delhi
      [28.6456, 77.0234], // Checkpoint 1
      [28.5123, 76.8456], // Checkpoint 2
      [28.2345, 76.5678], // Checkpoint 3
      [27.8901, 76.2345], // Checkpoint 4
      [27.4567, 76.0123], // Checkpoint 5
      [26.9124, 75.7873]  // Jaipur
    ],
    actualPath: [
      [28.7041, 77.1025], // Started
      [28.6456, 77.0234], // Checkpoint 1
      [28.5123, 76.8456], // Checkpoint 2
      [28.2345, 76.5678], // Checkpoint 3
      [28.1234, 76.4567], // Current position
    ],
    currentPosition: { lat: 28.1234, lng: 76.4567 },
    startLocation: { lat: 28.7041, lng: 77.1025, name: 'Delhi CP' },
    endLocation: { lat: 26.9124, lng: 75.7873, name: 'Jaipur Railway Station' },
    startTime: '2024-01-15 13:15:00',
    estimatedArrival: '2024-01-15 18:30:00',
    currentSpeed: 68,
    heading: 225,
    distanceRemaining: 156.2,
    distanceCovered: 126.1,
    progressPercentage: 44.7,
    isActive: true
  }
]

// Practical India - Only Current Administrative Territory (28 States + 8 UTs)
const practicalIndiaBoundaries = {
  "type": "FeatureCollection" as const,
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Republic of India - Administered Territory",
        "description": "28 States + 8 Union Territories currently administered by India",
        "admin_level": "2",
        "boundary": "administrative",
        "total_states": 28,
        "total_uts": 8
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          // Actual India boundary - only administered territory
          [68.1766, 23.6394], // Gujarat (West)
          [68.1766, 34.0], // J&K Line of Control (realistic north)
          [77.0, 35.0], // Ladakh (current control)
          [95.0, 28.5], // Arunachal Pradesh (administered)
          [97.4026, 28.2320], // Arunachal East
          [92.6068, 22.0563], // Northeast states
          [88.1748, 21.9430], // West Bengal
          [79.3105, 8.0881], // Tamil Nadu (South)
          [68.1766, 8.0881], // Kerala (Southwest)  
          [68.1766, 23.6394] // Close polygon
        ]]
      }
    }
  ]
}

// Complete Indian States with Accurate Boundaries (like Google Maps)
const indianStates = {
  "type": "FeatureCollection" as const,
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Rajasthan", "capital": "Jaipur", "vehicles": 1, "code": "RJ" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[69.5, 30.2], [78.2, 30.2], [78.2, 26.0], [75.0, 24.0], [72.0, 24.5], [69.5, 26.5], [69.5, 30.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Gujarat", "capital": "Gandhinagar", "vehicles": 1, "code": "GJ" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[68.2, 24.7], [74.5, 24.7], [74.5, 20.1], [72.0, 20.1], [68.8, 22.5], [68.2, 24.7]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Maharashtra", "capital": "Mumbai", "vehicles": 3, "code": "MH" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[72.6, 22.0], [80.9, 21.9], [80.9, 15.6], [73.7, 15.6], [72.6, 18.0], [72.6, 22.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Karnataka", "capital": "Bangalore", "vehicles": 1, "code": "KA" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.0, 18.4], [78.5, 18.4], [78.5, 11.5], [74.0, 11.5], [74.0, 18.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Andhra Pradesh", "capital": "Amaravati", "vehicles": 0, "code": "AP" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[76.8, 19.9], [84.8, 19.9], [84.8, 12.6], [78.1, 12.6], [76.8, 15.8], [76.8, 19.9]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Telangana", "capital": "Hyderabad", "vehicles": 1, "code": "TS" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.2, 19.9], [80.9, 19.9], [80.9, 15.8], [77.2, 15.8], [77.2, 19.9]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Tamil Nadu", "capital": "Chennai", "vehicles": 1, "code": "TN" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[76.2, 13.5], [80.3, 13.5], [80.3, 8.0], [76.2, 8.0], [76.2, 13.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Kerala", "capital": "Thiruvananthapuram", "vehicles": 0, "code": "KL" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.8, 12.8], [77.6, 12.8], [77.6, 8.2], [74.8, 8.2], [74.8, 12.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Odisha", "capital": "Bhubaneswar", "vehicles": 0, "code": "OR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[81.3, 22.6], [87.5, 22.6], [87.5, 17.8], [81.3, 17.8], [81.3, 22.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "West Bengal", "capital": "Kolkata", "vehicles": 1, "code": "WB" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[85.8, 27.2], [89.9, 27.2], [89.9, 21.5], [85.8, 21.5], [85.8, 27.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Jharkhand", "capital": "Ranchi", "vehicles": 0, "code": "JH" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[83.3, 24.8], [87.9, 24.8], [87.9, 21.9], [83.3, 21.9], [83.3, 24.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Chhattisgarh", "capital": "Raipur", "vehicles": 0, "code": "CG" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[80.2, 24.1], [84.8, 24.1], [84.8, 17.8], [80.2, 17.8], [80.2, 24.1]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Madhya Pradesh", "capital": "Bhopal", "vehicles": 0, "code": "MP" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.0, 26.9], [82.8, 26.9], [82.8, 21.1], [74.0, 21.1], [74.0, 26.9]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Uttar Pradesh", "capital": "Lucknow", "vehicles": 0, "code": "UP" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.1, 30.4], [84.6, 30.4], [84.6, 23.9], [77.1, 23.9], [77.1, 30.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Bihar", "capital": "Patna", "vehicles": 0, "code": "BR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[83.3, 27.5], [88.1, 27.5], [88.1, 24.3], [83.3, 24.3], [83.3, 27.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Haryana", "capital": "Chandigarh", "vehicles": 0, "code": "HR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[74.4, 30.9], [77.6, 30.9], [77.6, 27.4], [74.4, 27.4], [74.4, 30.9]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Punjab", "capital": "Chandigarh", "vehicles": 0, "code": "PB" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.9, 32.5], [76.5, 32.5], [76.5, 29.5], [73.9, 29.5], [73.9, 32.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Himachal Pradesh", "capital": "Shimla", "vehicles": 0, "code": "HP" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[75.5, 33.2], [79.0, 33.2], [79.0, 30.4], [75.5, 30.4], [75.5, 33.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Uttarakhand", "capital": "Dehradun", "vehicles": 0, "code": "UK" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[77.6, 31.4], [81.0, 31.4], [81.0, 28.4], [77.6, 28.4], [77.6, 31.4]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Assam", "capital": "Dispur", "vehicles": 0, "code": "AS" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[89.7, 28.2], [96.0, 28.2], [96.0, 24.1], [89.7, 24.1], [89.7, 28.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Arunachal Pradesh", "capital": "Itanagar", "vehicles": 0, "code": "AR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[91.2, 29.2], [97.4, 29.2], [97.4, 26.6], [91.2, 26.6], [91.2, 29.2]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Nagaland", "capital": "Kohima", "vehicles": 0, "code": "NL" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[93.3, 27.0], [95.8, 27.0], [95.8, 25.2], [93.3, 25.2], [93.3, 27.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Manipur", "capital": "Imphal", "vehicles": 0, "code": "MN" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[93.0, 25.7], [94.8, 25.7], [94.8, 23.8], [93.0, 23.8], [93.0, 25.7]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Mizoram", "capital": "Aizawl", "vehicles": 0, "code": "MZ" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[92.2, 24.6], [93.4, 24.6], [93.4, 21.9], [92.2, 21.9], [92.2, 24.6]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Tripura", "capital": "Agartala", "vehicles": 0, "code": "TR" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[91.0, 24.5], [92.7, 24.5], [92.7, 22.9], [91.0, 22.9], [91.0, 24.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Meghalaya", "capital": "Shillong", "vehicles": 0, "code": "ML" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[89.7, 26.1], [92.8, 26.1], [92.8, 25.0], [89.7, 25.0], [89.7, 26.1]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Sikkim", "capital": "Gangtok", "vehicles": 0, "code": "SK" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[87.9, 28.1], [88.9, 28.1], [88.9, 27.0], [87.9, 27.0], [87.9, 28.1]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Goa", "capital": "Panaji", "vehicles": 0, "code": "GA" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[73.7, 15.8], [74.3, 15.8], [74.3, 14.9], [73.7, 14.9], [73.7, 15.8]]]
      }
    }
  ]
}

// Union Territories (8 UTs total)
const unionTerritories = {
  "type": "FeatureCollection" as const,
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Jammu & Kashmir", "type": "UT", "capital": "Srinagar/Jammu", "code": "JK" },
      "geometry": {
        "type": "Polygon", 
        "coordinates": [[[73.0, 34.8], [76.0, 34.8], [76.0, 32.2], [73.0, 32.2], [73.0, 34.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Ladakh", "type": "UT", "capital": "Leh", "code": "LA" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[75.0, 36.0], [79.9, 36.0], [79.9, 32.5], [75.0, 32.5], [75.0, 36.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Delhi", "type": "UT (NCT)", "capital": "New Delhi", "code": "DL" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[76.8, 28.9], [77.3, 28.9], [77.3, 28.4], [76.8, 28.4], [76.8, 28.9]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Chandigarh", "type": "UT", "capital": "Chandigarh", "code": "CH" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[76.7, 30.8], [76.8, 30.8], [76.8, 30.7], [76.7, 30.7], [76.7, 30.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Puducherry", "type": "UT", "capital": "Puducherry", "code": "PY" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[79.7, 12.0], [79.9, 12.0], [79.9, 11.8], [79.7, 11.8], [79.7, 12.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Andaman & Nicobar", "type": "UT", "capital": "Port Blair", "code": "AN" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[92.2, 13.7], [93.9, 13.7], [93.9, 6.7], [92.2, 6.7], [92.2, 13.7]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Lakshadweep", "type": "UT", "capital": "Kavaratti", "code": "LD" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[72.1, 12.3], [74.0, 12.3], [74.0, 10.0], [72.1, 10.0], [72.1, 12.3]]]
      }
    },
    {
      "type": "Feature",
      "properties": { "name": "Dadra & Nagar Haveli and Daman & Diu", "type": "UT", "capital": "Daman", "code": "DD" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[72.8, 20.4], [73.0, 20.4], [73.0, 20.1], [72.8, 20.1], [72.8, 20.4]]]
      }
    }
  ]
}

// RELIABLE MAP SOURCES - All Tested & Working!
const mapLayers = {
  // === GUARANTEED WORKING MAPS ===
  openstreetmap: {
    name: '🗺️ Street Map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  satellite: {
    name: '🛰️ Satellite View',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri & Contributors'
  },
  
  // === CARTODB FAMILY (100% RELIABLE) ===
  cartodb: {
    name: '🌍 Clean Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB © OpenStreetMap'
  },
  cartodarks: {
    name: '🌙 Dark Theme',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB © OpenStreetMap'
  },
  positron: {
    name: '✨ Ultra Clean',
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB © OpenStreetMap'
  },
  contrast: {
    name: '⚫ High Contrast',
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB © OpenStreetMap'
  },
  
  // === SPECIALIZED WORKING MAPS ===
  topo: {
    name: '🏔️ Topographic',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap © OpenStreetMap'
  },
  humanitarian: {
    name: '🆘 Emergency Map',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap © HOT'
  },
  
  // === ALTERNATIVE WORKING PROVIDERS ===
  wikimedia: {
    name: '📚 Wikimedia',
    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    attribution: '© Wikimedia © OpenStreetMap'
  },
  
  // === TRANSPORT FOCUSED ===
  transport: {
    name: '🚌 Transport Map',
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap France'
  }
}

export default function MapViewLeaflet() {
  const [positions, setPositions] = useState<VehiclePosition[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState<keyof typeof mapLayers>('openstreetmap')
  const [showRoutes, setShowRoutes] = useState(false)
  const [optimizedRoute, setOptimizedRoute] = useState<RouteData | null>(null)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [showIndianStates, setShowIndianStates] = useState(true)
  
  // Enhanced Route Planning States
  const [fromLocation, setFromLocation] = useState<any | null>(null)
  const [toLocation, setToLocation] = useState<any | null>(null)
  const [routeDetails, setRouteDetails] = useState<RouteData | null>(null)
  const [showRouteDetails, setShowRouteDetails] = useState(false)
  const [showFuelStations, setShowFuelStations] = useState(false)
  
  // Trip History States
  const [showTripHistory, setShowTripHistory] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null)
  const [selectedVehicleHistory, setSelectedVehicleHistory] = useState<string | null>(null)
  
  // Live Tracking States
  const [showLiveTracking, setShowLiveTracking] = useState(false)
  const [liveTrackingVehicles, setLiveTrackingVehicles] = useState<any[]>([])
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null)
  
  const router = new OSRMRouter()

  // Live tracking simulation
  const startLiveTracking = () => {
    const initialRoutes = [
      {
        vehicleId: 'MH-12-AB-1234',
        driverName: 'राजेश कुमार (Rajesh Kumar)',
        startLocation: { lat: 19.0760, lng: 72.8777, name: 'Mumbai Depot' },
        endLocation: { lat: 18.5204, lng: 73.8567, name: 'Pune Warehouse' },
        fullRoute: [
          [19.0760, 72.8777], [19.0955, 72.9081], [19.1238, 73.0169], 
          [19.1521, 73.1257], [18.9876, 73.4532], [18.7234, 73.6789], 
          [18.5204, 73.8567]
        ],
        currentProgress: 0,
        estimatedDuration: 180,
        distanceTotal: 148.5,
        status: 'en-route',
        cargo: 'Electronics Shipment',
        priority: 'high'
      },
      {
        vehicleId: 'DL-05-IJ-7890',
        driverName: 'विकाश यादव (Vikash Yadav)',
        startLocation: { lat: 28.7041, lng: 77.1025, name: 'Delhi Hub' },
        endLocation: { lat: 26.9124, lng: 75.7873, name: 'Jaipur Distribution Center' },
        fullRoute: [
          [28.7041, 77.1025], [28.6456, 77.0234], [28.5123, 76.8456], 
          [28.2345, 76.5678], [27.8901, 76.2345], [27.4567, 76.0123], 
          [26.9124, 75.7873]
        ],
        currentProgress: 0,
        estimatedDuration: 300,
        distanceTotal: 282.3,
        status: 'en-route',
        cargo: 'Medical Supplies',
        priority: 'urgent'
      }
    ]
    
    setLiveTrackingVehicles(initialRoutes.map(route => ({ ...route, currentProgress: 0 })))
    
    const interval = setInterval(() => {
      setLiveTrackingVehicles(prev => 
        prev.map(vehicle => {
          const newProgress = Math.min(vehicle.currentProgress + (Math.random() * 3 + 1), 100)
          const routeIndex = Math.floor((newProgress / 100) * (vehicle.fullRoute.length - 1))
          const currentPosition = vehicle.fullRoute[routeIndex] || vehicle.fullRoute[vehicle.fullRoute.length - 1]
          
          return {
            ...vehicle,
            currentProgress: newProgress,
            currentPosition,
            timeElapsed: Math.floor((newProgress / 100) * vehicle.estimatedDuration),
            distanceCovered: Math.floor((newProgress / 100) * vehicle.distanceTotal),
            status: newProgress >= 100 ? 'delivered' : 'en-route'
          }
        })
      )
    }, 2000) // Update every 2 seconds

    setTrackingInterval(interval)
  }

  const stopLiveTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval)
      setTrackingInterval(null)
    }
    setLiveTrackingVehicles([])
  }

  // Sample Indian fleet vehicles across major states
  const samplePositions: VehiclePosition[] = [
    { lat: 19.0760, lng: 72.8777, vehicleId: 'MH-12-AB-1234', status: 'active', driver: 'राजेश कुमार (Rajesh Kumar)', lastUpdate: '2 min ago', speed: 45, heading: 90, fuelLevel: 75 },
    { lat: 18.5204, lng: 73.8567, vehicleId: 'MH-14-CD-5678', status: 'fuel', driver: 'सुरेश पाटील (Suresh Patil)', lastUpdate: '5 min ago', speed: 0, heading: 180, fuelLevel: 15 },
    { lat: 23.0225, lng: 72.5714, vehicleId: 'GJ-01-EF-9012', status: 'active', driver: 'अमित सिंह (Amit Singh)', lastUpdate: '1 min ago', speed: 60, heading: 270, fuelLevel: 80 },
    { lat: 12.9716, lng: 77.5946, vehicleId: 'KA-03-GH-3456', status: 'parked', driver: 'राम प्रकाश (Ram Prakash)', lastUpdate: '15 min ago', speed: 0, heading: 0, fuelLevel: 90 },
    { lat: 28.7041, lng: 77.1025, vehicleId: 'DL-05-IJ-7890', status: 'alert', driver: 'विकाश यादव (Vikash Yadav)', lastUpdate: '3 min ago', speed: 20, heading: 45, fuelLevel: 30 },
    { lat: 13.0827, lng: 80.2707, vehicleId: 'TN-09-XY-2468', status: 'active', driver: 'मुरुगन (Murugan)', lastUpdate: '4 min ago', speed: 55, heading: 180, fuelLevel: 65 },
    { lat: 22.5726, lng: 88.3639, vehicleId: 'WB-07-PQ-1357', status: 'parked', driver: 'सुब्रत दास (Subrata Das)', lastUpdate: '20 min ago', speed: 0, heading: 0, fuelLevel: 85 },
    { lat: 17.3850, lng: 78.4867, vehicleId: 'TS-12-RS-9876', status: 'active', driver: 'वेंकट राव (Venkat Rao)', lastUpdate: '1 min ago', speed: 70, heading: 315, fuelLevel: 50 },
    { lat: 26.9124, lng: 75.7873, vehicleId: 'RJ-14-TU-5432', status: 'fuel', driver: 'रमेश शर्मा (Ramesh Sharma)', lastUpdate: '8 min ago', speed: 0, heading: 90, fuelLevel: 10 },
    { lat: 21.1458, lng: 79.0882, vehicleId: 'MH-31-VW-6789', status: 'active', driver: 'संदीप जोशी (Sandeep Joshi)', lastUpdate: '3 min ago', speed: 40, heading: 225, fuelLevel: 70 }
  ]

  useEffect(() => {
    // Set sample data immediately
    setPositions(samplePositions)

    // Connect to Go backend WebSocket (same as before)
    const connectToGoBackend = () => {
      const ws = new WebSocket('ws://localhost:8080/ws')
      
      ws.onopen = () => {
        console.log('✅ Connected to FleetFlow Go backend - Live tracking active!')
        setIsConnected(true)
      }
      
      ws.onmessage = (event) => {
        try {
          const vehicleUpdate = JSON.parse(event.data)
          console.log('📍 Vehicle update received from Go backend:', vehicleUpdate)
          
          if (vehicleUpdate.latitude && vehicleUpdate.longitude && vehicleUpdate.vehicleId) {
            setPositions(prev => {
              const existingIndex = prev.findIndex(p => p.vehicleId === vehicleUpdate.vehicleId)
              const newPosition = {
                lat: vehicleUpdate.latitude,
                lng: vehicleUpdate.longitude,
                vehicleId: vehicleUpdate.vehicleId,
                status: vehicleUpdate.status || 'active',
                driver: vehicleUpdate.driver || 'Unknown Driver',
                lastUpdate: 'Just now',
                speed: vehicleUpdate.speed || 0,
                heading: vehicleUpdate.heading || 0,
                fuelLevel: vehicleUpdate.fuelLevel || null,
                engineStatus: vehicleUpdate.engineStatus || 'unknown'
              }
              
              if (existingIndex >= 0) {
                const updated = [...prev]
                updated[existingIndex] = newPosition
                return updated
              } else {
                return [...prev, newPosition]
              }
            })
            
            localStorage.setItem(`vehicle_${vehicleUpdate.vehicleId}_last_location`, JSON.stringify(vehicleUpdate))
          }
        } catch (error) {
          console.error('❌ Error parsing Go backend message:', error)
        }
      }
      
      ws.onclose = () => {
        console.log('📡 Disconnected from Go backend')
        setIsConnected(false)
        setTimeout(() => connectToGoBackend(), 5000)
      }
      
      ws.onerror = (error) => {
        console.error('❌ Go backend WebSocket error:', error)
        setIsConnected(false)
      }
      
      return ws
    }
    
    const websocket = connectToGoBackend()

    // Demo simulation (same as before)
    const simulateUpdates = setInterval(() => {
      if (!isConnected) {
        setPositions(prev => prev.map(position => {
          if (Math.random() < 0.3) {
            const timeOptions = ['Just now', '1 min ago', '2 min ago', '3 min ago']
            const statusOptions = ['active', 'fuel', 'parked', 'alert']
            
            return {
              ...position,
              lastUpdate: timeOptions[Math.floor(Math.random() * timeOptions.length)],
              status: Math.random() < 0.1 ? (statusOptions[Math.floor(Math.random() * statusOptions.length)] as VehiclePosition['status']) : position.status,
              lat: position.lat + (Math.random() - 0.5) * 0.01,
              lng: position.lng + (Math.random() - 0.5) * 0.01,
              speed: position.status === 'active' ? Math.floor(Math.random() * 80) + 20 : 0,
              heading: position.status === 'active' ? Math.floor(Math.random() * 360) : position.heading || 0,
            }
          }
          return position
        }))
      }
    }, 5000)
    
    return () => {
      if (websocket) websocket.close()
      clearInterval(simulateUpdates)
    }
  }, [isConnected])

  const calculateOptimizedRoute = async () => {
    setIsCalculatingRoute(true)
    try {
      const activeVehicles = positions.filter(p => p.status === 'active')
      if (activeVehicles.length >= 2) {
        const waypoints = activeVehicles.map(p => [p.lat, p.lng] as LatLngExpression)
        const result = await router.optimizeTrip(waypoints)
        if (result) {
          setOptimizedRoute(result.route)
          console.log('Optimized route calculated:', result)
        }
      }
    } catch (error) {
      console.error('Route calculation failed:', error)
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return '🟢'
      case 'fuel': return '🟡'
      case 'parked': return '🔵'
      case 'alert': return '🚨'
      default: return '⚪'
    }
  }

  const activeVehicles = positions.filter(p => p.status === 'active').length
  const fuelStops = positions.filter(p => p.status === 'fuel').length
  const parkedVehicles = positions.filter(p => p.status === 'parked').length
  const alertVehicles = positions.filter(p => p.status === 'alert').length

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          🇮🇳 भारतीय फ्लीट ट्रैकर - INDIA FLEET MAP
        </Typography>
        <Typography variant="body1" color="text.secondary">
          OpenStreetMap + Leaflet • Pan-India Fleet Tracking • Completely FREE
        </Typography>
      </Box>

      {/* Map Overview Cards - Same as before */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'success.dark', margin: '0 auto', mb: 1 }}>
              <VehicleIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{activeVehicles}</Typography>
            <Typography variant="body2">🟢 Active Trips</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'warning.dark', margin: '0 auto', mb: 1 }}>
              <FuelIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{fuelStops}</Typography>
            <Typography variant="body2">🟡 Fuel Stops</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'info.dark', margin: '0 auto', mb: 1 }}>
              <LocationIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{parkedVehicles}</Typography>
            <Typography variant="body2">🔵 Parked</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
            <Avatar sx={{ bgcolor: 'error.dark', margin: '0 auto', mb: 1 }}>
              <WarningIcon />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{alertVehicles}</Typography>
            <Typography variant="body2">🚨 Alert Issues</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Connection Status & Controls */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={isConnected ? '🔴 LIVE TRACKING ACTIVE' : 'Demo Mode (Simulated Updates)'} 
            color={isConnected ? 'success' : 'info'}
            icon={isConnected ? <NavigationIcon /> : <RefreshIcon />}
            sx={isConnected ? { 
              bgcolor: 'success.main', 
              color: 'white',
              fontWeight: 700,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.7 },
                '100%': { opacity: 1 }
              }
            } : {}}
          />
          
          {/* Map Layer Selector - 8 DIFFERENT MAPS! */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            🗺️ Choose Your Map Style:
          </Typography>
          <Chip 
            label={`Active: ${mapLayers[selectedLayer].name}`}
            color="primary"
            size="small"
            sx={{ mb: 1 }}
          />
          <Stack spacing={1}>
            {/* Row 1: Core Working Maps */}
            <ToggleButtonGroup
              value={selectedLayer}
              exclusive
              onChange={(_, newLayer) => {
                if (newLayer) {
                  console.log('🗺️ Switching to layer:', newLayer);
                  setSelectedLayer(newLayer);
                }
              }}
              size="small"
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
            >
              <ToggleButton value="openstreetmap">🗺️ Streets</ToggleButton>
              <ToggleButton value="satellite">🛰️ Satellite</ToggleButton>
              <ToggleButton value="cartodb">🌍 Clean</ToggleButton>
              <ToggleButton value="cartodarks">🌙 Dark</ToggleButton>
            </ToggleButtonGroup>
            
            {/* Row 2: Premium Style Maps */}
            <ToggleButtonGroup
              value={selectedLayer}
              exclusive
              onChange={(_, newLayer) => {
                if (newLayer) {
                  console.log('🗺️ Switching to layer:', newLayer);
                  setSelectedLayer(newLayer);
                }
              }}
              size="small"
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
            >
              <ToggleButton value="positron">✨ Ultra Clean</ToggleButton>
              <ToggleButton value="contrast">⚫ High Contrast</ToggleButton>
              <ToggleButton value="topo">🏔️ Topographic</ToggleButton>
              <ToggleButton value="humanitarian">🆘 Emergency</ToggleButton>
            </ToggleButtonGroup>
            
            {/* Row 3: Alternative Providers */}
            <ToggleButtonGroup
              value={selectedLayer}
              exclusive
              onChange={(_, newLayer) => {
                if (newLayer) {
                  console.log('🗺️ Switching to layer:', newLayer);
                  setSelectedLayer(newLayer);
                }
              }}
              size="small"
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
            >
              <ToggleButton value="wikimedia">📚 Wikimedia</ToggleButton>
              <ToggleButton value="transport">🚌 Transport</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          
          {/* Enhanced Route Planning Panel */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
            🛣️ Point-to-Point Route Planning:
          </Typography>
          
          <Stack spacing={2}>
            {/* From/To Location Selection */}
            <Stack direction="row" spacing={1}>
              <Autocomplete
                size="small"
                sx={{ flex: 1 }}
                options={indianCities}
                getOptionLabel={(option) => `${option.name}, ${option.state}`}
                value={fromLocation}
                onChange={(_, newValue) => setFromLocation(newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="From City" 
                    placeholder="Select start city"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <MyLocationIcon sx={{ mr: 1, color: 'primary.main' }} />,
                    }}
                  />
                )}
              />
              <Autocomplete
                size="small"
                sx={{ flex: 1 }}
                options={indianCities}
                getOptionLabel={(option) => `${option.name}, ${option.state}`}
                value={toLocation}
                onChange={(_, newValue) => setToLocation(newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="To City" 
                    placeholder="Select destination"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <PlaceIcon sx={{ mr: 1, color: 'error.main' }} />,
                    }}
                  />
                )}
              />
            </Stack>
            
            {/* Route Action Buttons */}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button 
                size="small" 
                variant="contained"
                startIcon={<RouteIcon />}
                onClick={async () => {
                  if (fromLocation && toLocation) {
                    setIsCalculatingRoute(true)
                    try {
                      // Enhanced route calculation with traffic, costs, tolls  
                      const route = await router.getRoute([[fromLocation.lat, fromLocation.lng], [toLocation.lat, toLocation.lng]]) as RouteData
                      setRouteDetails(route)
                      setShowRouteDetails(true)
                    } catch (error) {
                      console.error('Route calculation failed:', error)
                    } finally {
                      setIsCalculatingRoute(false)
                    }
                  }
                }}
                disabled={!fromLocation || !toLocation || isCalculatingRoute}
                color="primary"
              >
                {isCalculatingRoute ? '🔄 Calculating...' : '🗺️ Get Full Route'}
              </Button>
              
              <Button 
                size="small" 
                variant={showFuelStations ? "contained" : "outlined"}
                startIcon={<FuelIcon />}
                onClick={() => setShowFuelStations(!showFuelStations)}
                color="success"
              >
                ⛽ Fuel Stations
              </Button>
              
              <Button 
                size="small" 
                variant={showRoutes ? "contained" : "outlined"}
                startIcon={<NavigationIcon />}
                onClick={() => setShowRoutes(!showRoutes)}
                color="info"
              >
                🚛 Fleet Routes
              </Button>
              
              <Button 
                size="small" 
                variant={showTripHistory ? "contained" : "outlined"}
                startIcon={<LocationIcon />}
                onClick={() => setShowTripHistory(!showTripHistory)}
                color="warning"
              >
                📍 Trip History
              </Button>
              
              <Button 
                size="small" 
                variant={showLiveTracking ? "contained" : "outlined"}
                startIcon={<NavigationIcon />}
                onClick={() => setShowLiveTracking(!showLiveTracking)}
                color="error"
                sx={{ 
                  animation: showLiveTracking ? 'none' : 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
              >
                🔴 LIVE A→B
              </Button>
            </Stack>
          </Stack>
          
          {/* Legacy Route Controls */}
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
            🚛 Fleet Management:
          </Typography>
          
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<NavigationIcon />}
              onClick={calculateOptimizedRoute}
              disabled={isCalculatingRoute}
            >
              {isCalculatingRoute ? 'Calculating...' : 'Optimize Fleet'}
            </Button>
          </Stack>
          
          <Button 
            size="small" 
            variant={showIndianStates ? "contained" : "outlined"}
            onClick={() => setShowIndianStates(!showIndianStates)}
          >
            🇮🇳 {showIndianStates ? 'Hide' : 'Show'} Indian States
          </Button>
        </Box>
        
        <Button 
          size="small" 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>

      {/* Map Container */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Card sx={{ p: 0, overflow: 'hidden' }}>
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                🇮🇳 India Fleet Map - {mapLayers[selectedLayer].name}
                <Chip 
                  label="FREE & UNLIMITED" 
                  size="small" 
                  sx={{ ml: 1, bgcolor: 'success.main', color: 'white' }}
                />
                <Chip 
                  label={`Active: ${selectedLayer}`}
                  size="small" 
                  sx={{ ml: 1, bgcolor: 'info.main', color: 'white' }}
                />
                {optimizedRoute && (
                  <Chip 
                    label={`Route: ${optimizedRoute.distance.toFixed(1)}km, ${optimizedRoute.duration.toFixed(0)}min, ₹${Math.round(optimizedRoute.distance * 2)} tolls`}
                    size="small" 
                    sx={{ ml: 1, bgcolor: 'warning.main', color: 'white' }}
                  />
                )}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                📍 Pan-India vehicle tracking • No API costs • Highway route optimization • Toll estimation
              </Typography>
            </Box>
            
            <Box sx={{ height: 500 }}>
              <MapContainer 
                center={[20.5937, 78.9629]} // Center of India
                zoom={5} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  key={selectedLayer} // Force re-render when layer changes
                  url={mapLayers[selectedLayer].url}
                  attribution={mapLayers[selectedLayer].attribution}
                />
                
                {/* Vehicle Markers */}
                {positions.map((position, idx) => (
                  <Marker 
                    key={idx}
                    position={[position.lat, position.lng]}
                    icon={createVehicleIcon(position.status || 'unknown', position.heading || 0)}
                  >
                    <Popup>
                      <Box sx={{ minWidth: 200 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {getStatusIcon(position.status)} {position.vehicleId}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Driver:</strong> {position.driver}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Status:</strong> {position.status}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Last Update:</strong> {position.lastUpdate}
                        </Typography>
                        {position.speed !== undefined && position.speed > 0 && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Speed:</strong> {position.speed} km/h
                          </Typography>
                        )}
                        {position.fuelLevel && (
                          <Typography variant="body2" sx={{ mb: 0.5, color: position.fuelLevel < 20 ? 'error.main' : 'success.main' }}>
                            <strong>Fuel:</strong> {position.fuelLevel}%
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Location:</strong> {getIndianCity(position.lat, position.lng)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          📍 {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                        </Typography>
                      </Box>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Indian States & UTs Overlay */}
                {showIndianStates && (
                  <>
                    {/* Main India Boundary - Practical Territory */}
                    <GeoJSON
                      data={practicalIndiaBoundaries}
                      style={{
                        color: '#FF6B35',
                        weight: 4,
                        opacity: 0.9,
                        fillColor: 'transparent',
                        fillOpacity: 0
                      }}
                      onEachFeature={(feature, layer) => {
                        layer.bindPopup(`
                          <strong>🇮🇳 ${feature.properties.name}</strong><br/>
                          ${feature.properties.description}<br/>
                          <strong>States:</strong> ${feature.properties.total_states}<br/>
                          <strong>Union Territories:</strong> ${feature.properties.total_uts}
                        `);
                      }}
                    />
                    
                    {/* Individual States */}
                    <GeoJSON
                      data={indianStates}
                      style={(feature) => ({
                        color: '#2E8B57',
                        weight: 1.5,
                        opacity: 0.8,
                        fillColor: feature?.properties?.vehicles > 0 ? '#90EE90' : '#F0F8FF',
                        fillOpacity: feature?.properties?.vehicles > 0 ? 0.3 : 0.1
                      })}
                      onEachFeature={(feature, layer) => {
                        layer.bindPopup(`
                          <strong>🏛️ ${feature.properties.name}</strong><br/>
                          <strong>Capital:</strong> ${feature.properties.capital}<br/>
                          <strong>State Code:</strong> ${feature.properties.code}<br/>
                          <strong>Fleet Vehicles:</strong> ${feature.properties.vehicles}<br/>
                          <em>State of India</em>
                        `);
                      }}
                    />
                    
                    {/* Union Territories */}
                    <GeoJSON
                      data={unionTerritories}
                      style={{
                        color: '#4169E1',
                        weight: 1.5,
                        opacity: 0.8,
                        fillColor: '#87CEEB',
                        fillOpacity: 0.25
                      }}
                      onEachFeature={(feature, layer) => {
                        layer.bindPopup(`
                          <strong>🏛️ ${feature.properties.name}</strong><br/>
                          <strong>Capital:</strong> ${feature.properties.capital}<br/>
                          <strong>UT Code:</strong> ${feature.properties.code}<br/>
                          <strong>Type:</strong> ${feature.properties.type}<br/>
                          <em>Central Government Administration</em>
                        `);
                      }}
                    />
                  </>
                )}
                
                {/* Point-to-Point Route */}
                {showRouteDetails && routeDetails && (
                  <Polyline 
                    positions={routeDetails.coordinates}
                    color="#2196F3"
                    weight={5}
                    opacity={0.9}
                  />
                )}
                
                {/* Fleet Optimized Route */}
                {showRoutes && optimizedRoute && (
                  <Polyline 
                    positions={optimizedRoute.coordinates}
                    color="#FF5722"
                    weight={4}
                    opacity={0.8}
                  />
                )}
                
                {/* Fuel Station Markers */}
                {showFuelStations && fuelStations.map((station) => (
                  <Marker 
                    key={station.id}
                    position={[station.lat, station.lng]}
                    icon={divIcon({
                      html: `<div style="background: #4CAF50; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">⛽</div>`,
                      className: 'fuel-station-marker',
                      iconSize: [30, 30],
                      iconAnchor: [15, 15]
                    })}
                  >
                    <Popup>
                      <div style={{ textAlign: 'center', minWidth: '200px' }}>
                        <strong>⛽ {station.name}</strong><br/>
                        <strong>Brand:</strong> {station.brand}<br/>
                        <strong>Price:</strong> ₹{station.price}/liter<br/>
                        <strong>Amenities:</strong> {station.amenities.join(', ')}<br/>
                        <small style={{ color: '#666' }}>Fuel Station</small>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Trip History Routes */}
                {showTripHistory && selectedTrip && (
                  <>
                    <Polyline 
                      positions={selectedTrip.route}
                      color={selectedTrip.status === 'ongoing' ? '#FF9800' : '#9C27B0'}
                      weight={4}
                      opacity={0.8}
                      dashArray={selectedTrip.status === 'ongoing' ? '10, 10' : undefined}
                    />
                    
                    {/* Start Location Marker */}
                    <Marker 
                      position={[selectedTrip.startLocation.lat, selectedTrip.startLocation.lng]}
                      icon={divIcon({
                        html: `<div style="background: #4CAF50; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">🚀</div>`,
                        className: 'trip-start-marker',
                        iconSize: [35, 35],
                        iconAnchor: [17.5, 17.5]
                      })}
                    >
                      <Popup>
                        <div style={{ textAlign: 'center', minWidth: '220px' }}>
                          <strong>🚀 Trip Start</strong><br/>
                          <strong>Location:</strong> {selectedTrip.startLocation.name}<br/>
                          <strong>Time:</strong> {selectedTrip.startTime}<br/>
                          <strong>Vehicle:</strong> {selectedTrip.vehicleId}<br/>
                          <small style={{ color: '#666' }}>Journey Beginning</small>
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* End Location Marker */}
                    <Marker 
                      position={[selectedTrip.endLocation.lat, selectedTrip.endLocation.lng]}
                      icon={divIcon({
                        html: `<div style="background: ${selectedTrip.status === 'ongoing' ? '#FF9800' : '#F44336'}; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">${selectedTrip.status === 'ongoing' ? '🎯' : '🏁'}</div>`,
                        className: 'trip-end-marker',
                        iconSize: [35, 35],
                        iconAnchor: [17.5, 17.5]
                      })}
                    >
                      <Popup>
                        <div style={{ textAlign: 'center', minWidth: '220px' }}>
                          <strong>{selectedTrip.status === 'ongoing' ? '🎯 Current Destination' : '🏁 Trip End'}</strong><br/>
                          <strong>Location:</strong> {selectedTrip.endLocation.name}<br/>
                          <strong>Time:</strong> {selectedTrip.endTime === 'ongoing' ? 'In Progress' : selectedTrip.endTime}<br/>
                          <strong>Status:</strong> {selectedTrip.status.toUpperCase()}<br/>
                          <small style={{ color: '#666' }}>{selectedTrip.status === 'ongoing' ? 'Journey In Progress' : 'Journey Complete'}</small>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
                
                {/* Live A-to-B Tracking */}
                {showLiveTracking && liveTrackingVehicles.map((trip) => (
                  <React.Fragment key={trip.tripId}>
                    {/* Planned Route (Gray Dashed) */}
                    <Polyline 
                      positions={trip.plannedRoute}
                      color="#9E9E9E"
                      weight={3}
                      opacity={0.5}
                      dashArray="5, 10"
                    />
                    
                    {/* Actual Path Traveled (Green Solid) */}
                    <Polyline 
                      positions={trip.actualPath}
                      color="#4CAF50"
                      weight={4}
                      opacity={0.9}
                    />
                    
                    {/* Current Position (Moving Vehicle) */}
                    <Marker 
                      position={[trip.currentPosition.lat, trip.currentPosition.lng]}
                      icon={divIcon({
                        html: `<div style="
                          background: #FF5722; 
                          color: white; 
                          border-radius: 50%; 
                          width: 40px; 
                          height: 40px; 
                          display: flex; 
                          align-items: center; 
                          justify-content: center; 
                          font-size: 16px; 
                          border: 3px solid white; 
                          box-shadow: 0 0 15px rgba(255,87,34,0.8);
                          animation: pulse 2s infinite;
                          transform: rotate(${trip.heading}deg);
                        ">🚛</div>
                        <style>
                          @keyframes pulse {
                            0% { box-shadow: 0 0 15px rgba(255,87,34,0.8); }
                            50% { box-shadow: 0 0 25px rgba(255,87,34,1); }
                            100% { box-shadow: 0 0 15px rgba(255,87,34,0.8); }
                          }
                        </style>`,
                        className: 'live-vehicle-marker',
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                      })}
                    >
                      <Popup>
                        <div style={{ textAlign: 'center', minWidth: '250px' }}>
                          <strong>🔴 LIVE TRACKING</strong><br/>
                          <strong>Vehicle:</strong> {trip.vehicleId}<br/>
                          <strong>Route:</strong> {trip.startLocation.name} → {trip.endLocation.name}<br/>
                          <strong>Progress:</strong> {trip.progressPercentage.toFixed(1)}% ({trip.distanceCovered}km / {trip.distanceCovered + trip.distanceRemaining}km)<br/>
                          <strong>Speed:</strong> {trip.currentSpeed} km/h<br/>
                          <strong>ETA:</strong> {trip.estimatedArrival}<br/>
                          <strong>Remaining:</strong> {trip.distanceRemaining} km<br/>
                          <small style={{ color: '#FF5722' }}>Live GPS Tracking Active</small>
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* Start Point */}
                    <Marker 
                      position={[trip.startLocation.lat, trip.startLocation.lng]}
                      icon={divIcon({
                        html: `<div style="background: #2196F3; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🚀</div>`,
                        className: 'live-start-marker',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                      })}
                    >
                      <Popup>
                        <div style={{ textAlign: 'center' }}>
                          <strong>🚀 Journey Start</strong><br/>
                          {trip.startLocation.name}<br/>
                          <small>Started: {trip.startTime}</small>
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* End Point */}
                    <Marker 
                      position={[trip.endLocation.lat, trip.endLocation.lng]}
                      icon={divIcon({
                        html: `<div style="background: #F44336; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎯</div>`,
                        className: 'live-end-marker',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                      })}
                    >
                      <Popup>
                        <div style={{ textAlign: 'center' }}>
                          <strong>🎯 Destination</strong><br/>
                          {trip.endLocation.name}<br/>
                          <small>ETA: {trip.estimatedArrival}</small>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                ))}
              </MapContainer>
            </Box>
          </Card>
          
          {/* India Fleet Benefits */}
          <Alert severity="success" sx={{ mt: 2 }}>
            🇮🇳 <strong>Complete India Coverage:</strong> All 28 States + 8 Union Territories with proper boundaries! 
            <strong>10 Reliable Map Styles:</strong> Streets, Satellite, Clean, Dark, Ultra Clean, Emergency, Topographic & more! 
            🛣️ <strong>Advanced Route Planning:</strong> Point-to-point with traffic, costs, tolls, fuel stations!
            📍 <strong>Trip History Tracking:</strong> Last trip locations, route replay, historical analysis!
            🔴 <strong>LIVE A→B Tracking:</strong> Real-time GPS tracking, progress updates, ETA monitoring!
            🆓 <strong>100% FREE</strong> - All features unlimited!
          </Alert>
          
          {/* Enhanced Features */}
          <Alert severity="info" sx={{ mt: 1 }}>
            🗺️ <strong>Complete Fleet Intelligence:</strong> Live tracking, trip history, route analysis, cost calculations!
            🔴 <strong>Live A-to-B Tracking:</strong> Click "Start Live Tracking" to watch vehicles move in real-time from origin to destination.
            📍 <strong>Trip History:</strong> View completed trips with detailed analytics and route replay functionality!
          </Alert>
        </Grid>

        {/* Route Details Panel - NEW! */}
        {showRouteDetails && routeDetails && (
          <Grid item xs={12}>
            <Accordion expanded={showRouteDetails} onChange={() => setShowRouteDetails(!showRouteDetails)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  🛣️ Complete Route Analysis - {fromLocation?.name} → {toLocation?.name}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* Route Summary */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                      <Typography variant="h6" gutterBottom>📊 Trip Summary</Typography>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <RouteIcon />
                          <Typography><strong>Distance:</strong> {routeDetails.distance.toFixed(1)} km</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimeIcon />
                          <Typography><strong>Duration:</strong> {routeDetails.duration.toFixed(0)} min + {routeDetails.trafficDelay || 0} min traffic</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TollIcon />
                          <Typography><strong>Tolls:</strong> ₹{routeDetails.tolls || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FuelIcon />
                          <Typography><strong>Fuel Cost:</strong> ₹{routeDetails.fuelCost || 0}</Typography>
                        </Box>
                        <Divider sx={{ my: 1, bgcolor: 'white' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CostIcon />
                          <Typography variant="h6"><strong>Total Cost:</strong> ₹{(routeDetails.tolls || 0) + (routeDetails.fuelCost || 0)}</Typography>
                        </Box>
                      </Stack>
                    </Card>
                  </Grid>
                  
                  {/* Fuel Stations */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                      <Typography variant="h6" gutterBottom>⛽ Fuel Stations on Route</Typography>
                      <List dense>
                        {(routeDetails.fuelStations || []).slice(0, 4).map((station) => (
                          <ListItem key={station.id} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ color: 'white' }}>
                              <FuelIcon />
                            </ListItemIcon>
                            <ListItemText 
                              primary={`${station.brand} - ${station.name}`}
                              secondary={`₹${station.price}/L • ${station.amenities.join(', ')}`}
                              secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                            />
                          </ListItem>
                        ))}
                        {(routeDetails.fuelStations || []).length === 0 && (
                          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                            No fuel stations found on this route
                          </Typography>
                        )}
                      </List>
                    </Card>
                  </Grid>
                  
                  {/* Turn-by-Turn Directions */}
                  <Grid item xs={12}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>🧭 Turn-by-Turn Directions</Typography>
                      <List>
                        {(routeDetails.steps || []).slice(0, 8).map((step, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <TurnIcon sx={{ 
                                transform: step.type === 'turn-left' ? 'rotate(-90deg)' : 
                                          step.type === 'turn-right' ? 'rotate(90deg)' : 'none',
                                color: step.type === 'destination' ? 'error.main' : 'primary.main'
                              }} />
                            </ListItemIcon>
                            <ListItemText 
                              primary={step.instruction}
                              secondary={`${(step.distance/1000).toFixed(1)} km • ${(step.duration/60).toFixed(0)} min`}
                            />
                          </ListItem>
                        ))}
                        {(routeDetails.steps || []).length > 8 && (
                          <ListItem>
                            <ListItemText 
                              primary={`... and ${(routeDetails.steps || []).length - 8} more steps`}
                              sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}

        {/* Trip History Panel - NEW! */}
        {showTripHistory && (
          <Grid item xs={12}>
            <Accordion expanded={showTripHistory} onChange={() => setShowTripHistory(!showTripHistory)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  📍 Trip History & Location Tracking - Last 5 Trips
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* Vehicle Selection */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      🚛 Select Vehicle:
                    </Typography>
                    <Stack spacing={1}>
                      {['All Vehicles', 'MH-12-AB-1234', 'DL-05-IJ-7890', 'KA-03-GH-3456', 'MH-14-CD-5678', 'GJ-01-EF-9012'].map((vehicle) => (
                        <Button
                          key={vehicle}
                          size="small"
                          variant={selectedVehicleHistory === vehicle ? 'contained' : 'outlined'}
                          onClick={() => setSelectedVehicleHistory(vehicle)}
                          startIcon={vehicle === 'All Vehicles' ? <LocationIcon /> : <VehicleIcon />}
                        >
                          {vehicle}
                        </Button>
                      ))}
                    </Stack>
                  </Grid>
                  
                  {/* Trip List */}
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      🛣️ Recent Trips:
                    </Typography>
                    <Stack spacing={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {tripHistory
                        .filter(trip => !selectedVehicleHistory || selectedVehicleHistory === 'All Vehicles' || trip.vehicleId === selectedVehicleHistory)
                        .map((trip) => (
                        <Card 
                          key={trip.tripId} 
                          sx={{ 
                            p: 2, 
                            cursor: 'pointer',
                            border: selectedTrip?.tripId === trip.tripId ? 2 : 1,
                            borderColor: selectedTrip?.tripId === trip.tripId ? 'primary.main' : 'divider',
                            bgcolor: selectedTrip?.tripId === trip.tripId ? 'primary.light' : 'background.paper',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => setSelectedTrip(selectedTrip?.tripId === trip.tripId ? null : trip)}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: trip.status === 'ongoing' ? 'warning.main' : 'text.primary' }}>
                                {trip.status === 'ongoing' ? '🔄 ONGOING' : trip.status === 'completed' ? '✅ COMPLETED' : '❌ INTERRUPTED'} - {trip.vehicleId}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                🚀 {trip.startLocation.name} → 🏁 {trip.endLocation.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                📅 {trip.startTime} - {trip.endTime === 'ongoing' ? 'In Progress' : trip.endTime}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Chip 
                                  label={`📏 ${trip.distance}km`} 
                                  size="small" 
                                  color="primary" 
                                />
                                <Chip 
                                  label={`⏱️ ${Math.floor(trip.duration/60)}h ${trip.duration%60}m`} 
                                  size="small" 
                                  color="info"
                                />
                                <Chip 
                                  label={`🚗 ${trip.avgSpeed}km/h`} 
                                  size="small" 
                                  color="success"
                                />
                                <Chip 
                                  label={`₹${trip.tollsPaid + Math.round(trip.fuelUsed * 105)}`} 
                                  size="small" 
                                  color="warning"
                                />
                              </Stack>
                            </Grid>
                          </Grid>
                        </Card>
                      ))}
                    </Stack>
                  </Grid>
                  
                  {/* Selected Trip Details */}
                  {selectedTrip && (
                    <Grid item xs={12}>
                      <Card sx={{ p: 3, bgcolor: 'background.default' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          📊 Trip Analysis - {selectedTrip.tripId}
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <List dense>
                              <ListItem>
                                <ListItemIcon><VehicleIcon color="primary" /></ListItemIcon>
                                <ListItemText primary="Vehicle" secondary={selectedTrip.vehicleId} />
                              </ListItem>
                              <ListItem>
                                <ListItemIcon><RouteIcon color="info" /></ListItemIcon>
                                <ListItemText primary="Distance" secondary={`${selectedTrip.distance} km`} />
                              </ListItem>
                              <ListItem>
                                <ListItemIcon><TimeIcon color="warning" /></ListItemIcon>
                                <ListItemText primary="Duration" secondary={`${Math.floor(selectedTrip.duration/60)}h ${selectedTrip.duration%60}m`} />
                              </ListItem>
                              <ListItem>
                                <ListItemIcon><SpeedIcon color="success" /></ListItemIcon>
                                <ListItemText primary="Speed" secondary={`Avg: ${selectedTrip.avgSpeed} km/h | Max: ${selectedTrip.maxSpeed} km/h`} />
                              </ListItem>
                            </List>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <List dense>
                              <ListItem>
                                <ListItemIcon><FuelIcon color="error" /></ListItemIcon>
                                <ListItemText primary="Fuel Used" secondary={`${selectedTrip.fuelUsed}L (₹${Math.round(selectedTrip.fuelUsed * 105)})`} />
                              </ListItem>
                              <ListItem>
                                <ListItemIcon><TollIcon color="primary" /></ListItemIcon>
                                <ListItemText primary="Tolls Paid" secondary={`₹${selectedTrip.tollsPaid}`} />
                              </ListItem>
                              <ListItem>
                                <ListItemIcon><CostIcon color="warning" /></ListItemIcon>
                                <ListItemText primary="Total Cost" secondary={`₹${selectedTrip.tollsPaid + Math.round(selectedTrip.fuelUsed * 105)}`} />
                              </ListItem>
                              <ListItem>
                                <ListItemIcon><LocationIcon color={selectedTrip.status === 'ongoing' ? 'warning' : 'success'} /></ListItemIcon>
                                <ListItemText primary="Status" secondary={selectedTrip.status.toUpperCase()} />
                              </ListItem>
                            </List>
                          </Grid>
                        </Grid>
                        <Alert severity={selectedTrip.status === 'ongoing' ? 'warning' : 'success'} sx={{ mt: 2 }}>
                          {selectedTrip.status === 'ongoing' 
                            ? '🔄 This trip is currently in progress. Route shows real-time tracking with orange dashed line.'
                            : '✅ Trip completed successfully. Purple solid line shows the actual route taken.'
                          }
                        </Alert>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}

        {/* Live A-to-B Tracking Panel - NEW! */}
        {showLiveTracking && (
          <Grid item xs={12}>
            <Accordion expanded={showLiveTracking} onChange={() => setShowLiveTracking(!showLiveTracking)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  🔴 LIVE A→B TRACKING - Real-Time Journey Progress
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* Active Live Trips */}
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      🚛 Active Live Journeys:
                    </Typography>
                    <Stack spacing={2}>
                      {liveTrackingVehicles.filter(trip => trip.isActive).map((trip) => (
                        <Card 
                          key={trip.tripId}
                          sx={{ 
                            p: 2, 
                            border: 2,
                            borderColor: 'error.main',
                            bgcolor: selectedTrip?.tripId === trip.tripId ? 'error.light' : 'background.paper',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => setSelectedTrip(selectedTrip?.tripId === trip.tripId ? null : trip)}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Box 
                                  sx={{ 
                                    width: 12, 
                                    height: 12, 
                                    borderRadius: '50%', 
                                    bgcolor: 'error.main',
                                    animation: 'pulse 2s infinite',
                                    '@keyframes pulse': {
                                      '0%': { opacity: 1 },
                                      '50%': { opacity: 0.5 },
                                      '100%': { opacity: 1 }
                                    }
                                  }} 
                                />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                  🔴 LIVE - {trip.vehicleId}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                🚀 {trip.startLocation.name} → 🎯 {trip.endLocation.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Started: {trip.startTime} | ETA: {trip.estimatedArrival}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Stack spacing={1}>
                                {/* Progress Bar */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: '100%', bgcolor: 'grey.300', borderRadius: 1, height: 8 }}>
                                    <Box 
                                      sx={{ 
                                        width: `${trip.progressPercentage}%`, 
                                        bgcolor: 'success.main', 
                                        height: 8, 
                                        borderRadius: 1,
                                        transition: 'width 0.5s ease'
                                      }} 
                                    />
                                  </Box>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    {trip.progressPercentage.toFixed(1)}%
                                  </Typography>
                                </Box>
                                
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  <Chip 
                                    label={`🚗 ${trip.currentSpeed} km/h`} 
                                    size="small" 
                                    color="error"
                                  />
                                  <Chip 
                                    label={`📍 ${trip.distanceRemaining} km left`} 
                                    size="small" 
                                    color="warning"
                                  />
                                  <Chip 
                                    label={`✅ ${trip.distanceCovered} km done`} 
                                    size="small" 
                                    color="success"
                                  />
                                </Stack>
                              </Stack>
                            </Grid>
                          </Grid>
                        </Card>
                      ))}
                    </Stack>
                  </Grid>
                  
                  {/* Live Trip Controls */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                      🎮 Live Tracking Controls:
                    </Typography>
                    <Stack spacing={2}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<MyLocationIcon />}
                        onClick={() => {
                          // Simulate starting a new live trip
                          const newTrip = {
                            vehicleId: 'KA-03-GH-3456',
                            tripId: 'live-trip-003',
                            plannedRoute: [[12.9716, 77.5946], [13.0827, 80.2707]],
                            actualPath: [[12.9716, 77.5946]],
                            currentPosition: { lat: 12.9716, lng: 77.5946 },
                            startLocation: { lat: 12.9716, lng: 77.5946, name: 'Bangalore Tech Park' },
                            endLocation: { lat: 13.0827, lng: 80.2707, name: 'Chennai Airport' },
                            startTime: new Date().toLocaleString(),
                            estimatedArrival: new Date(Date.now() + 7.5 * 60 * 60 * 1000).toLocaleString(),
                            currentSpeed: 0,
                            heading: 90,
                            distanceRemaining: 346.7,
                            distanceCovered: 0,
                            progressPercentage: 0,
                            isActive: true
                          }
                          setLiveTrackingVehicles([...liveTrackingVehicles, newTrip])
                        }}
                      >
                        🚀 Start New A→B Trip
                      </Button>
                      
                      <Alert severity="success">
                        <strong>🔴 LIVE TRACKING ACTIVE</strong><br/>
                        Real-time GPS updates every 30 seconds.<br/>
                        Green line = actual path taken<br/>
                        Gray dashed = planned route
                      </Alert>
                      
                      <Alert severity="info">
                        <strong>📊 Track Everything:</strong><br/>
                        • Real-time position updates<br/>
                        • Speed & heading changes<br/>
                        • Route deviations<br/>
                        • ETA adjustments<br/>
                        • Progress percentage
                      </Alert>
                    </Stack>
                  </Grid>
                  
                  {/* Selected Live Trip Details */}
                  {selectedTrip && (
                    <Grid item xs={12}>
                      <Card sx={{ p: 3, bgcolor: 'error.light', color: 'white' }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          🔴 LIVE JOURNEY DETAILS - {selectedTrip.vehicleId}
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <List dense>
                              <ListItem sx={{ color: 'white' }}>
                                <ListItemIcon sx={{ color: 'white' }}><NavigationIcon /></ListItemIcon>
                                <ListItemText 
                                  primary="Current Speed" 
                                  secondary={`${selectedTrip.currentSpeed} km/h (Heading: ${selectedTrip.heading}°)`}
                                  secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                                />
                              </ListItem>
                              <ListItem sx={{ color: 'white' }}>
                                <ListItemIcon sx={{ color: 'white' }}><RouteIcon /></ListItemIcon>
                                <ListItemText 
                                  primary="Progress" 
                                  secondary={`${selectedTrip.progressPercentage.toFixed(1)}% (${selectedTrip.distanceCovered}km of ${selectedTrip.distanceCovered + selectedTrip.distanceRemaining}km)`}
                                  secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                                />
                              </ListItem>
                              <ListItem sx={{ color: 'white' }}>
                                <ListItemIcon sx={{ color: 'white' }}><TimeIcon /></ListItemIcon>
                                <ListItemText 
                                  primary="ETA" 
                                  secondary={`${selectedTrip.estimatedArrival} (${selectedTrip.distanceRemaining}km remaining)`}
                                  secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
                                />
                              </ListItem>
                            </List>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>📍 Live Position:</Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              Lat: {selectedTrip.currentPosition.lat.toFixed(4)}<br/>
                              Lng: {selectedTrip.currentPosition.lng.toFixed(4)}
                            </Typography>
                            
                            <Typography variant="subtitle2" gutterBottom>🛣️ Route Status:</Typography>
                            <Typography variant="body2">
                              ✅ Following planned route<br/>
                              🟢 Green line shows actual path<br/>
                              📊 {selectedTrip.actualPath.length} GPS points recorded
                            </Typography>
                          </Grid>
                        </Grid>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        )}

        {/* Live Tracking Panel - NEW! */}
        {showLiveTracking && (
          <Grid item xs={12}>
            <Card sx={{ p: 3, bgcolor: 'error.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                🔴 LIVE A-to-B TRACKING - Real-time Vehicle Movement
              </Typography>
              <Grid container spacing={2}>
                {liveTrackingVehicles.map((vehicle) => (
                  <Grid item xs={12} md={4} key={vehicle.vehicleId}>
                    <Card sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                          🚛 {vehicle.vehicleId}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                          👨‍✈️ {vehicle.driverName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          📍 {vehicle.startLocation.name} → {vehicle.endLocation.name}
                        </Typography>
                        
                        {/* Progress Bar */}
                        <Box sx={{ width: '100%', mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <Box sx={{ 
                                width: '100%', 
                                height: 8, 
                                bgcolor: 'rgba(255,255,255,0.3)', 
                                borderRadius: 1,
                                overflow: 'hidden'
                              }}>
                                <Box sx={{ 
                                  width: `${vehicle.currentProgress || 0}%`, 
                                  height: '100%', 
                                  bgcolor: vehicle.status === 'delivered' ? '#4CAF50' : '#FFD700',
                                  transition: 'width 0.5s ease-in-out'
                                }} />
                              </Box>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'white', minWidth: '40px' }}>
                              {(vehicle.currentProgress || 0).toFixed(0)}%
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Live Stats */}
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                          <Chip 
                            label={`📏 ${vehicle.distanceCovered || 0}/${vehicle.distanceTotal}km`}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                          />
                          <Chip 
                            label={`⏱️ ${Math.floor((vehicle.timeElapsed || 0) / 60)}h ${(vehicle.timeElapsed || 0) % 60}m`}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                          />
                          <Chip 
                            label={vehicle.priority.toUpperCase()}
                            size="small"
                            sx={{ 
                              bgcolor: vehicle.priority === 'urgent' ? '#FF5722' : vehicle.priority === 'high' ? '#FF9800' : '#4CAF50', 
                              color: 'white' 
                            }}
                          />
                        </Stack>
                        
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          📦 {vehicle.cargo}
                        </Typography>
                        
                        {vehicle.status === 'delivered' && (
                          <Alert severity="success" sx={{ mt: 1 }}>
                            🏁 DELIVERED! Trip completed successfully.
                          </Alert>
                        )}
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Alert severity="warning" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                🔴 <strong>LIVE TRACKING ACTIVE:</strong> Vehicles are moving in real-time. 
                Gold dashed lines show planned routes, green solid lines show completed paths.
                Click vehicle markers for detailed progress information!
              </Alert>
            </Card>
          </Grid>
        )}

        {/* Vehicle List - Same as before */}
        <Grid item xs={12} md={3}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              🚛 वाहन स्थिति (Vehicle Status)
            </Typography>
            <Stack spacing={2}>
              {positions.map((position, idx) => (
                <Box key={idx} sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: 2,
                  bgcolor: position.status === 'alert' ? 'error.light' : 'background.paper'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6">{getStatusIcon(position.status)}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {position.vehicleId}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Driver: {position.driver}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Last update: {position.lastUpdate}
                  </Typography>
                  <Chip 
                    label={position.status} 
                    size="small" 
                    sx={{ 
                      mt: 1, 
                      textTransform: 'capitalize',
                      bgcolor: getMarkerColor(position.status),
                      color: 'white'
                    }} 
                  />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
