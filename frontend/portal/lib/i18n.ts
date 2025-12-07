import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Translation resources
const resources = {
  en: {
    translation: {
      // Home page
      home: {
        title: 'Track Your Shipment',
        heroTitle: 'Real-time Fleet Tracking',
        heroSubtitle: 'Track your cargo anywhere, anytime with live updates',
        trackingPlaceholder: 'Enter your tracking ID (e.g., RTC240801001)',
        trackButton: 'Track',
        tryDemo: 'Try Demo',
        enterTrackingId: 'Please enter a tracking ID',
        invalidFormat: 'Invalid tracking ID format',
        trackingError: 'Error tracking shipment',
        howItWorks: 'How It Works',
        howItWorksSubtitle: 'Simple steps to track your shipment',
        whyChooseUs: 'Why Choose FleetFlow',
        metaDescription: 'Track your shipments in real-time with FleetFlow - India\'s most reliable fleet tracking service',
      },
      
      // Features
      features: {
        realTimeTracking: {
          title: 'Real-time Tracking',
          description: 'Live GPS tracking with minute-by-minute updates'
        },
        estimatedDelivery: {
          title: 'Accurate ETA',
          description: 'Precise delivery time estimates based on live traffic'
        },
        secureShipping: {
          title: 'Secure & Safe',
          description: 'Your cargo is monitored 24/7 for maximum security'
        },
        fastDelivery: {
          title: 'Fast Delivery',
          description: 'Optimized routes for fastest delivery times'
        }
      },
      
      // Steps
      steps: {
        pickup: 'Pickup Scheduled',
        inTransit: 'In Transit',
        outForDelivery: 'Out for Delivery',
        delivered: 'Delivered'
      },
      
      // Tracking page
      tracking: {
        title: 'Track Shipment {{id}}',
        metaDescription: 'Track shipment {{id}} with real-time updates',
        loading: 'Loading tracking information...',
        notFound: 'Tracking ID not found. Please check your tracking number.',
        error: 'Unable to fetch tracking information',
        networkError: 'Network error. Please check your connection.',
        id: 'Tracking ID',
        lastUpdated: 'Last updated',
        currentStatus: 'Current Status',
        complete: 'Complete',
        currentLocation: 'Current Location',
        journey: 'Journey Progress',
        liveMap: 'Live Map',
        shipmentDetails: 'Shipment Details',
        from: 'From',
        to: 'To',
        estimatedDelivery: 'Estimated Delivery',
        charges: 'Charges',
        driverInfo: 'Driver & Vehicle',
        vehicleInfo: 'Vehicle Details',
        shareTracking: 'Share Tracking',
        qrHelp: 'Scan QR code to share this tracking link',
        companyInfo: 'Company Information'
      },
      
      // Status
      status: {
        pending: 'Pickup Pending',
        picked_up: 'Picked Up',
        in_transit: 'In Transit',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered'
      },
      
      // Charges
      charges: {
        baseRate: 'Base Rate',
        fuelSurcharge: 'Fuel Surcharge',
        total: 'Total Amount'
      },
      
      // Stats
      stats: {
        deliveries: 'Successful Deliveries',
        satisfaction: 'Customer Satisfaction',
        support: 'Support Available'
      },
      
      // Contact
      contact: {
        title: 'Need Help?',
        phone: 'Customer Support',
        email: 'Email Support',
        hours: 'Support Hours',
        available: '24/7 Available'
      },
      
      // Mobile
      mobile: {
        title: 'Download Our App',
        description: 'Get our mobile app for even better tracking experience',
        android: 'Android App',
        ios: 'iOS App'
      },
      
      // Demo
      demo: {
        title: 'Try Our Demo',
        description: 'Test our tracking system with these sample tracking IDs:',
        status1: 'In Transit to Delhi',
        status2: 'Out for Delivery in Bangalore',
        status3: 'Delivered in Mumbai',
        status4: 'Premium Service (Live)',
        status5: 'Long Distance (Live)'
      },
      
      // Share
      share: {
        title: 'FleetFlow Tracking',
        text: 'Track my shipment: {{trackingId}}',
        copied: 'Link copied to clipboard!'
      },
      
      // WhatsApp
      whatsapp: {
        message: 'Hi! I need an update on my shipment {{trackingId}}'
      },
      
      // Common
      common: {
        close: 'Close',
        refresh: 'Refresh',
        share: 'Share',
        call: 'Call',
        backHome: 'Back to Home'
      }
    }
  },
  hi: {
    translation: {
      // Home page
      home: {
        title: 'अपनी खेप ट्रैक करें',
        heroTitle: 'रियल-टाइम फ्लीट ट्रैकिंग',
        heroSubtitle: 'लाइव अपडेट के साथ कहीं भी, कभी भी अपना कार्गो ट्रैक करें',
        trackingPlaceholder: 'अपना ट्रैकिंग आईडी दर्ज करें (जैसे, RTC240801001)',
        trackButton: 'ट्रैक करें',
        tryDemo: 'डेमो आज़माएं',
        enterTrackingId: 'कृपया ट्रैकिंग आईडी दर्ज करें',
        invalidFormat: 'अमान्य ट्रैकिंग आईडी फॉर्मेट',
        trackingError: 'शिपमेंट ट्रैक करने में त्रुटि',
        howItWorks: 'यह कैसे काम करता है',
        howItWorksSubtitle: 'आपकी खेप को ट्रैक करने के सरल चरण',
        whyChooseUs: 'FleetFlow क्यों चुनें',
        metaDescription: 'FleetFlow के साथ अपनी खेप को रियल-टाइम में ट्रैक करें - भारत की सबसे विश्वसनीय फ्लीट ट्रैकिंग सेवा',
      },
      
      // Features
      features: {
        realTimeTracking: {
          title: 'रियल-टाइम ट्रैकिंग',
          description: 'मिनट-दर-मिनट अपडेट के साथ लाइव GPS ट्रैकिंग'
        },
        estimatedDelivery: {
          title: 'सटीक ETA',
          description: 'लाइव ट्रैफिक के आधार पर सटीक डिलीवरी समय अनुमान'
        },
        secureShipping: {
          title: 'सुरक्षित और सेफ',
          description: 'अधिकतम सुरक्षा के लिए आपके कार्गो की 24/7 निगरानी'
        },
        fastDelivery: {
          title: 'तेज़ डिलीवरी',
          description: 'सबसे तेज़ डिलीवरी समय के लिए अनुकूलित मार्ग'
        }
      },
      
      // Steps
      steps: {
        pickup: 'पिकअप निर्धारित',
        inTransit: 'रास्ते में',
        outForDelivery: 'डिलीवरी के लिए निकला',
        delivered: 'डिलीवर किया गया'
      },
      
      // Tracking page
      tracking: {
        title: 'शिपमेंट {{id}} ट्रैक करें',
        metaDescription: 'रियल-टाइम अपडेट के साथ शिपमेंट {{id}} ट्रैक करें',
        loading: 'ट्रैकिंग जानकारी लोड हो रही है...',
        notFound: 'ट्रैकिंग आईडी नहीं मिला। कृपया अपना ट्रैकिंग नंबर जांचें।',
        error: 'ट्रैकिंग जानकारी प्राप्त करने में असमर्थ',
        networkError: 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।',
        id: 'ट्रैकिंग आईडी',
        lastUpdated: 'अंतिम अपडेट',
        currentStatus: 'वर्तमान स्थिति',
        complete: 'पूर्ण',
        currentLocation: 'वर्तमान स्थान',
        journey: 'यात्रा प्रगति',
        liveMap: 'लाइव मैप',
        shipmentDetails: 'शिपमेंट विवरण',
        from: 'से',
        to: 'तक',
        estimatedDelivery: 'अनुमानित डिलीवरी',
        charges: 'शुल्क',
        driverInfo: 'ड्राइवर और वाहन',
        vehicleInfo: 'वाहन विवरण',
        shareTracking: 'ट्रैकिंग शेयर करें',
        qrHelp: 'इस ट्रैकिंग लिंक को शेयर करने के लिए QR कोड स्कैन करें',
        companyInfo: 'कंपनी की जानकारी'
      },
      
      // Status
      status: {
        pending: 'पिकअप लंबित',
        picked_up: 'उठाया गया',
        in_transit: 'रास्ते में',
        out_for_delivery: 'डिलीवरी के लिए निकला',
        delivered: 'डिलीवर किया गया'
      },
      
      // Charges
      charges: {
        baseRate: 'आधार दर',
        fuelSurcharge: 'ईंधन अधिभार',
        total: 'कुल राशि'
      },
      
      // Stats
      stats: {
        deliveries: 'सफल डिलीवरी',
        satisfaction: 'ग्राहक संतुष्टि',
        support: 'सहायता उपलब्ध'
      },
      
      // Contact
      contact: {
        title: 'सहायता चाहिए?',
        phone: 'ग्राहक सहायता',
        email: 'ईमेल सहायता',
        hours: 'सहायता समय',
        available: '24/7 उपलब्ध'
      },
      
      // Mobile
      mobile: {
        title: 'हमारा ऐप डाउनलोड करें',
        description: 'और भी बेहतर ट्रैकिंग अनुभव के लिए हमारा मोबाइल ऐप प्राप्त करें',
        android: 'Android ऐप',
        ios: 'iOS ऐप'
      },
      
      // Demo
      demo: {
        title: 'हमारा डेमो आज़माएं',
        description: 'इन नमूना ट्रैकिंग आईडी के साथ हमारे ट्रैकिंग सिस्टम का परीक्षण करें:',
        status1: 'दिल्ली के लिए रास्ते में',
        status2: 'बैंगलोर में डिलीवरी के लिए निकला',
        status3: 'मुंबई में डिलीवर किया गया',
        status4: 'प्रीमियम सेवा (लाइव)',
        status5: 'लंबी दूरी (लाइव)'
      },
      
      // Share
      share: {
        title: 'FleetFlow ट्रैकिंग',
        text: 'मेरी खेप ट्रैक करें: {{trackingId}}',
        copied: 'लिंक क्लिपबोर्ड में कॉपी किया गया!'
      },
      
      // WhatsApp
      whatsapp: {
        message: 'नमस्ते! मुझे अपनी खेप {{trackingId}} पर अपडेट चाहिए'
      },
      
      // Common
      common: {
        close: 'बंद करें',
        refresh: 'रीफ्रेश',
        share: 'शेयर',
        call: 'कॉल',
        backHome: 'होम पर वापस'
      }
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false // react already does escaping
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  })

export default i18n
