import { NextApiRequest, NextApiResponse } from 'next'

// Demo FleetFlow Tracking Data - Comprehensive scenarios for all user flows
const sampleTrackingData = {
  'RTC240801001': {
    trackingId: 'RTC240801001',
    customerName: 'Rajesh Kumar',
    customerPhone: '+91-9876543210',
    pickupAddress: 'Warehouse A, Sector 62, Noida, UP 201309',
    deliveryAddress: 'Connaught Place, New Delhi, DL 110001',
    currentStatus: 'in_transit',
    estimatedDelivery: '2024-08-02T15:30:00Z',
    progress: 65,
    currentLocation: {
      lat: 28.6139,
      lng: 77.2090,
      address: 'Ring Road, New Delhi',
      timestamp: '2024-08-01T14:30:00Z'
    },
    driver: {
      name: 'Suresh Sharma',
      phone: '+91-9123456789',
      photo: null,
      rating: 4.8,
      experience: '5 years experience'
    },
    vehicle: {
      licensePlate: 'DL 3C AB 1234',
      make: 'Tata',
      model: 'Ace',
      photo: null
    },
    statusHistory: [
      {
        id: '1',
        status: 'pending',
        timestamp: '2024-08-01T09:00:00Z',
        location: 'Warehouse A, Noida',
        description: 'Shipment scheduled for pickup'
      },
      {
        id: '2',
        status: 'picked_up',
        timestamp: '2024-08-01T10:30:00Z',
        location: 'Warehouse A, Noida',
        description: 'Package picked up successfully'
      },
      {
        id: '3',
        status: 'in_transit',
        timestamp: '2024-08-01T11:00:00Z',
        location: 'NH-24, Ghaziabad',
        description: 'Vehicle departed from pickup location'
      }
    ],
    route: [
      { lat: 28.5355, lng: 77.3910 }, // Noida
      { lat: 28.5706, lng: 77.3272 }, // Ghaziabad
      { lat: 28.6139, lng: 77.2090 }, // Current
      { lat: 28.6304, lng: 77.2177 }  // Destination
    ],
    charges: {
      baseRate: 800,
      distance: 45,
      fuelSurcharge: 120,
      total: 920,
      currency: 'INR'
    },
    companyInfo: {
      name: 'FleetFlow Logistics',
      phone: '+91-9999999999',
      email: 'support@fleetflow.in',
      logo: null
    }
  },
  'RTC240801002': {
    trackingId: 'RTC240801002',
    customerName: 'Priya Patel',
    customerPhone: '+91-9876543211',
    pickupAddress: 'Electronics City, Bangalore, KA 560100',
    deliveryAddress: 'Koramangala, Bangalore, KA 560034',
    currentStatus: 'out_for_delivery',
    estimatedDelivery: '2024-08-01T18:00:00Z',
    progress: 90,
    currentLocation: {
      lat: 12.9352,
      lng: 77.6245,
      address: 'Silk Board Junction, Bangalore',
      timestamp: '2024-08-01T16:45:00Z'
    },
    driver: {
      name: 'Ravi Reddy',
      phone: '+91-9123456788',
      photo: null,
      rating: 4.9,
      experience: '7 years experience'
    },
    vehicle: {
      licensePlate: 'KA 05 MN 7890',
      make: 'Mahindra',
      model: 'Bolero Pickup',
      photo: null
    },
    statusHistory: [
      {
        id: '1',
        status: 'pending',
        timestamp: '2024-08-01T08:00:00Z',
        location: 'Electronics City, Bangalore',
        description: 'Shipment scheduled for pickup'
      },
      {
        id: '2',
        status: 'picked_up',
        timestamp: '2024-08-01T09:15:00Z',
        location: 'Electronics City, Bangalore',
        description: 'Package picked up successfully'
      },
      {
        id: '3',
        status: 'in_transit',
        timestamp: '2024-08-01T09:30:00Z',
        location: 'Hosur Road, Bangalore',
        description: 'Vehicle departed from pickup location'
      },
      {
        id: '4',
        status: 'out_for_delivery',
        timestamp: '2024-08-01T16:30:00Z',
        location: 'Silk Board Junction',
        description: 'Out for delivery to customer location'
      }
    ],
    route: [
      { lat: 12.8456, lng: 77.6603 }, // Electronics City
      { lat: 12.9082, lng: 77.6476 }, // Hosur Road
      { lat: 12.9352, lng: 77.6245 }, // Current
      { lat: 12.9279, lng: 77.6271 }  // Koramangala
    ],
    charges: {
      baseRate: 450,
      distance: 22,
      fuelSurcharge: 68,
      total: 518,
      currency: 'INR'
    },
    companyInfo: {
      name: 'FleetFlow Logistics',
      phone: '+91-9999999999',
      email: 'support@fleetflow.in',
      logo: null
    }
  },
  'RTC240801003': {
    trackingId: 'RTC240801003',
    customerName: 'Amit Singh',
    customerPhone: '+91-9876543212',
    pickupAddress: 'Andheri East, Mumbai, MH 400069',
    deliveryAddress: 'Bandra West, Mumbai, MH 400050',
    currentStatus: 'delivered',
    estimatedDelivery: '2024-08-01T12:00:00Z',
    progress: 100,
    currentLocation: {
      lat: 19.0596,
      lng: 72.8295,
      address: 'Bandra West, Mumbai',
      timestamp: '2024-08-01T11:45:00Z'
    },
    driver: {
      name: 'Mohan Joshi',
      phone: '+91-9123456787',
      photo: null,
      rating: 4.7,
      experience: '4 years experience'
    },
    vehicle: {
      licensePlate: 'MH 02 CX 5678',
      make: 'Ashok Leyland',
      model: 'Dost',
      photo: null
    },
    statusHistory: [
      {
        id: '1',
        status: 'pending',
        timestamp: '2024-08-01T07:00:00Z',
        location: 'Andheri East, Mumbai',
        description: 'Shipment scheduled for pickup'
      },
      {
        id: '2',
        status: 'picked_up',
        timestamp: '2024-08-01T08:00:00Z',
        location: 'Andheri East, Mumbai',
        description: 'Package picked up successfully'
      },
      {
        id: '3',
        status: 'in_transit',
        timestamp: '2024-08-01T08:30:00Z',
        location: 'Western Express Highway',
        description: 'Vehicle departed from pickup location'
      },
      {
        id: '4',
        status: 'out_for_delivery',
        timestamp: '2024-08-01T11:00:00Z',
        location: 'Bandra Kurla Complex',
        description: 'Out for delivery to customer location'
      },
      {
        id: '5',
        status: 'delivered',
        timestamp: '2024-08-01T11:45:00Z',
        location: 'Bandra West, Mumbai',
        description: 'Package delivered successfully to customer'
      }
    ],
    route: [
      { lat: 19.1136, lng: 72.8697 }, // Andheri East
      { lat: 19.0728, lng: 72.8826 }, // WEH
      { lat: 19.0596, lng: 72.8295 }  // Bandra West
    ],
    charges: {
      baseRate: 350,
      distance: 18,
      fuelSurcharge: 53,
      total: 403,
      currency: 'INR'
    },
    companyInfo: {
      name: 'FleetFlow Logistics',
      phone: '+91-9999999999',
      email: 'support@fleetflow.in',
      logo: null
    }
  },
  
  // Additional Demo Scenarios
  'DEMO001': {
    trackingId: 'DEMO001',
    customerName: 'Demo Customer - Premium Service',
    customerPhone: '+91-9999888777',
    pickupAddress: 'ITC Maurya, Diplomatic Enclave, New Delhi, DL 110021',
    deliveryAddress: 'Taj Palace Hotel, Diplomatic Enclave, New Delhi, DL 110021',
    currentStatus: 'in_transit',
    estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    progress: 40,
    currentLocation: {
      lat: 28.5946,
      lng: 77.2014,
      address: 'Connaught Place Metro Station, New Delhi',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
    },
    driver: {
      name: 'Rajesh Kumar Sharma',
      phone: '+91-9876543210',
      photo: null,
      rating: 4.9,
      experience: '8 years experience'
    },
    vehicle: {
      licensePlate: 'DL 3C AB 1234',
      make: 'Mahindra',
      model: 'Bolero Camper Gold',
      photo: null
    },
    statusHistory: [
      {
        id: '1',
        status: 'pending',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        location: 'ITC Maurya, New Delhi',
        description: 'High-priority shipment scheduled for immediate pickup'
      },
      {
        id: '2',
        status: 'picked_up',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        location: 'ITC Maurya, New Delhi',
        description: 'Premium cargo secured and loaded by trained personnel'
      },
      {
        id: '3',
        status: 'in_transit',
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
        location: 'Sardar Patel Marg',
        description: 'Vehicle en route via premium secure route'
      }
    ],
    route: [
      { lat: 28.5946, lng: 77.1944 }, // ITC Maurya
      { lat: 28.5946, lng: 77.2014 }, // Current location
      { lat: 28.6139, lng: 77.2090 }, // Destination area
    ],
    charges: {
      baseRate: 1200,
      distance: 25,
      fuelSurcharge: 180,
      total: 1380,
      currency: 'INR'
    },
    companyInfo: {
      name: 'FleetFlow Logistics',
      phone: '+91-9999999999',
      email: 'support@fleetflow.in',
      logo: null
    }
  },

  'DEMO002': {
    trackingId: 'DEMO002',
    customerName: 'Tech Startup Solutions',
    customerPhone: '+91-8888777666',
    pickupAddress: 'Cyber City, DLF Phase 2, Gurugram, HR 122002',
    deliveryAddress: 'Whitefield, Bangalore, KA 560066',
    currentStatus: 'out_for_delivery',
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutes from now
    progress: 95,
    currentLocation: {
      lat: 12.9698,
      lng: 77.7500,
      address: 'Near ITPL Main Gate, Whitefield, Bangalore',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
    },
    driver: {
      name: 'Venkat Reddy',
      phone: '+91-9988776655',
      photo: null,
      rating: 4.8,
      experience: '6 years experience'
    },
    vehicle: {
      licensePlate: 'KA 51 MA 9876',
      make: 'Tata',
      model: 'Ace Gold CX',
      photo: null
    },
    statusHistory: [
      {
        id: '1',
        status: 'pending',
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        location: 'Cyber City, Gurugram',
        description: 'Inter-city electronics shipment scheduled'
      },
      {
        id: '2',
        status: 'picked_up',
        timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        location: 'Cyber City, Gurugram',
        description: 'Server equipment loaded with special handling'
      },
      {
        id: '3',
        status: 'in_transit',
        timestamp: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
        location: 'NH-48, Gurugram',
        description: 'Started journey to Bangalore'
      },
      {
        id: '4',
        status: 'out_for_delivery',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        location: 'Whitefield Main Road',
        description: 'Reached destination city, final delivery in progress'
      }
    ],
    route: [
      { lat: 28.4595, lng: 77.0266 }, // Cyber City
      { lat: 28.4089, lng: 77.3178 }, // Delhi border
      { lat: 12.9698, lng: 77.7500 }, // Current - Whitefield
      { lat: 12.9698, lng: 77.7500 }  // Destination
    ],
    charges: {
      baseRate: 8500,
      distance: 2100,
      fuelSurcharge: 1275,
      total: 9775,
      currency: 'INR'
    },
    companyInfo: {
      name: 'FleetFlow Logistics',
      phone: '+91-9999999999',
      email: 'support@fleetflow.in',
      logo: null
    }
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid tracking ID' })
  }

  const trackingData = sampleTrackingData[id.toUpperCase()]

  if (!trackingData) {
    return res.status(404).json({ message: 'Tracking ID not found' })
  }

  // Simulate API delay
  setTimeout(() => {
    res.status(200).json(trackingData)
  }, 500)
}
