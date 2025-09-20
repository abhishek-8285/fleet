import React from 'react'
import { Text } from 'react-native'
import { colors } from '../../theme'

interface IconProps {
  name: string
  size?: number
  color?: string
}

// Icon mapping from Material Icons names to emoji
const iconMap: Record<string, string> = {
  'home': '🏠',
  'local-shipping': '🚛',
  'local-gas-station': '⛽',
  'person': '👨‍✈️',
  'settings': '⚙️',
  'camera-alt': '📷',
  'phone': '📞',
  'emergency': '🚨',
  'location-on': '📍',
  'navigation': '🧭',
  'map': '🗺️',
  'qr-code-scanner': '📱',
  'check-circle': '✅',
  'warning': '⚠️',
  'error': '❌',
  'info': 'ℹ️',
  'star': '⭐',
  'schedule': '⏰',
  'play-arrow': '▶️',
  'pause': '⏸️',
  'stop': '⏹️',
  'refresh': '🔄',
  'close': '✕',
  'menu': '☰',
  'arrow-back': '←',
  'arrow-forward': '→',
  'cloud-upload': '☁️⬆️',
  'cloud-download': '☁️⬇️',
  'sync': '🔄',
  'cloud-off': '☁️❌',
  'cloud-done': '☁️✅',
  'edit': '✏️',
  'delete': '🗑️',
  'search': '🔍',
  'filter-list': '🔽',
  'more-vert': '⋮',
  'gps-fixed': '📡',
  'gps-off': '📡❌',
  'receipt': '🧾',
  'history': '🕒',
  'currency-rupee': '₹',
  'bar-chart': '📊',
  'attach-money': '💰',
  'directions': '🛣️',
  'keyboard-arrow-down': '⬇️'
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = colors.textPrimary,
}) => {
  const emoji = iconMap[name] || '❓'
  
  return (
    <Text style={{ 
      fontSize: size, 
      color: color,
      lineHeight: size + 2
    }}>
      {emoji}
    </Text>
  )
}

// Pre-defined icons for common use cases
export const AppIcons = {
  // Navigation
  home: { name: 'home' },
  trips: { name: 'local-shipping' },
  fuel: { name: 'local-gas-station' },
  profile: { name: 'person' },
  settings: { name: 'settings' },
  
  // Actions
  camera: { name: 'camera-alt' },
  phone: { name: 'phone' },
  emergency: { name: 'emergency' },
  location: { name: 'location-on' },
  navigation: { name: 'navigation' },
  map: { name: 'map' },
  qrCode: { name: 'qr-code-scanner' },
  
  // Status
  check: { name: 'check-circle' },
  warning: { name: 'warning' },
  error: { name: 'error' },
  info: { name: 'info' },
  star: { name: 'star' },
  clock: { name: 'schedule' },
  
  // Controls
  play: { name: 'play-arrow' },
  pause: { name: 'pause' },
  stop: { name: 'stop' },
  refresh: { name: 'refresh' },
  close: { name: 'close' },
  menu: { name: 'menu' },
  back: { name: 'arrow-back' },
  forward: { name: 'arrow-forward' },
  
  // Data
  upload: { name: 'cloud-upload' },
  download: { name: 'cloud-download' },
  sync: { name: 'sync' },
  offline: { name: 'cloud-off' },
  online: { name: 'cloud-done' },
  
  // Misc
  edit: { name: 'edit' },
  delete: { name: 'delete' },
  search: { name: 'search' },
  filter: { name: 'filter-list' },
  more: { name: 'more-vert' },
}

export default Icon
