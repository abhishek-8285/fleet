import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { colors, typography, spacing } from '../../theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: spacing.borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row',
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      opacity: disabled ? 0.6 : 1,
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = spacing.md
        baseStyle.paddingVertical = spacing.sm
        baseStyle.minHeight = 36
        break
      case 'large':
        baseStyle.paddingHorizontal = spacing.xl
        baseStyle.paddingVertical = spacing.lg
        baseStyle.minHeight = 56
        break
      default:
        baseStyle.paddingHorizontal = spacing.lg
        baseStyle.paddingVertical = spacing.md
        baseStyle.minHeight = 48
    }

    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = colors.primary
        break
      case 'secondary':
        baseStyle.backgroundColor = colors.secondary
        break
      case 'success':
        baseStyle.backgroundColor = colors.success
        break
      case 'warning':
        baseStyle.backgroundColor = colors.warning
        break
      case 'error':
        baseStyle.backgroundColor = colors.error
        break
      case 'outline':
        baseStyle.backgroundColor = 'transparent'
        baseStyle.borderWidth = 2
        baseStyle.borderColor = colors.primary
        break
      case 'ghost':
        baseStyle.backgroundColor = 'transparent'
        break
    }

    return baseStyle
  }

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      textAlign: 'center',
    }

    // Size text styles
    switch (size) {
      case 'small':
        Object.assign(baseTextStyle, typography.styles.buttonSmall)
        break
      case 'large':
        Object.assign(baseTextStyle, typography.styles.buttonLarge)
        break
      default:
        Object.assign(baseTextStyle, typography.styles.buttonMedium)
    }

    // Variant text styles
    switch (variant) {
      case 'outline':
        baseTextStyle.color = colors.primary
        break
      case 'ghost':
        baseTextStyle.color = colors.primary
        break
      default:
        baseTextStyle.color = colors.textOnPrimary
    }

    return baseTextStyle
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.white} 
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Text style={[styles.icon, { marginRight: spacing.sm }]}>{icon}</Text>
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Text style={[styles.icon, { marginLeft: spacing.sm }]}>{icon}</Text>
          )}
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 18,
  },
})

export default Button
