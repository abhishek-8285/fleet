import React from 'react'
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { colors, spacing } from '../../theme'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'elevated' | 'outlined' | 'filled'
  padding?: 'none' | 'small' | 'medium' | 'large'
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = 'medium',
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: spacing.borderRadius.lg,
      backgroundColor: colors.surface,
    }

    // Padding styles
    switch (padding) {
      case 'none':
        break
      case 'small':
        baseStyle.padding = spacing.md
        break
      case 'large':
        baseStyle.padding = spacing.xl
        break
      default:
        baseStyle.padding = spacing.lg
    }

    // Variant styles
    switch (variant) {
      case 'elevated':
        Object.assign(baseStyle, spacing.shadows.base)
        break
      case 'outlined':
        baseStyle.borderWidth = 1
        baseStyle.borderColor = colors.border
        break
      case 'filled':
        baseStyle.backgroundColor = colors.gray50
        break
    }

    return baseStyle
  }

  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  )
}

export default Card




