# FleetFlow Customer Portal

A Next.js-based customer portal for real-time fleet tracking and shipment monitoring.

## Prerequisites

- Node.js >= 18.17.0
- npm or yarn

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file and add:
   ```
   NEXT_PUBLIC_API_BASE=http://localhost:8080
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Features

- 🚛 Real-time shipment tracking
- 📱 Mobile-responsive design
- 🌍 Multi-language support (English/Hindi)
- 🗺️ Google Maps integration
- 📊 Progress visualization
- 💬 WhatsApp integration
- 📱 QR code sharing

## Demo Tracking IDs

Try these sample tracking IDs:
- `RTC240801001` - In Transit to Delhi
- `RTC240801002` - Out for Delivery in Bangalore
- `RTC240801003` - Delivered in Mumbai

## Tech Stack

- **Framework:** Next.js 14
- **UI Library:** Material-UI (MUI)
- **Styling:** Emotion
- **Maps:** Google Maps API
- **Internationalization:** i18next
- **Language:** TypeScript

## Project Structure

```
customer-portal/
├── pages/
│   ├── api/track/[id].ts    # Tracking API endpoint
│   ├── track/[id].tsx       # Tracking page
│   ├── index.tsx            # Home page
│   ├── _app.tsx             # App wrapper
│   └── _document.tsx        # Document wrapper
├── lib/
│   ├── i18n.ts              # Internationalization config
│   └── createEmotionCache.ts # Emotion cache setup
├── public/
│   └── favicon.ico          # Site favicon
├── next.config.js           # Next.js configuration
└── package.json
```

## Configuration

### Environment Variables

- `NEXT_PUBLIC_API_BASE`: Backend API URL
- `NEXT_PUBLIC_GOOGLE_MAPS_KEY`: Google Maps API key

### Google Maps Setup

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Places API (optional)
3. Add the key to your `.env.local` file

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Node.js Version Compatibility

This project requires Node.js >= 18.17.0 due to Next.js 14 requirements.

If you're using Node.js 16.x, you'll need to upgrade:

```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

## API Integration

The portal connects to the FleetFlow backend API. Ensure the backend is running on the configured `NEXT_PUBLIC_API_BASE` URL.

### API Endpoints Used

- `GET /api/track/{id}` - Get tracking information for a shipment

## Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## Troubleshooting

### Common Issues

1. **Node.js version error:** Upgrade to Node.js >= 18.17.0
2. **Google Maps not loading:** Check your API key and billing settings
3. **Translation missing:** Ensure i18n is properly initialized

### Support

For support, contact: support@fleetflow.in
