import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native'
import { colors, typography, spacing } from '../../theme'

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: string
  rightIcon?: string
  variant?: 'outlined' | 'filled'
  size?: 'small' | 'medium' | 'large'
  style?: ViewStyle
  inputStyle?: TextStyle
  required?: boolean
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  variant = 'outlined',
  size = 'medium',
  style,
  inputStyle,
  required = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: spacing.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.minHeight = 40
        baseStyle.paddingHorizontal = spacing.md
        break
      case 'large':
        baseStyle.minHeight = 56
        baseStyle.paddingHorizontal = spacing.lg
        break
      default:
        baseStyle.minHeight = 48
        baseStyle.paddingHorizontal = spacing.lg
    }

    // Variant styles
    switch (variant) {
      case 'outlined':
        baseStyle.borderWidth = 2
        baseStyle.borderColor = error
          ? colors.error
          : isFocused
          ? colors.primary
          : colors.border
        baseStyle.backgroundColor = colors.surface
        break
      case 'filled':
        baseStyle.backgroundColor = error
          ? colors.errorBackground
          : isFocused
          ? colors.primaryBackground
          : colors.gray100
        break
    }

    return baseStyle
  }

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      color: colors.textPrimary,
      paddingVertical: 0,
    }

    // Size text styles
    switch (size) {
      case 'small':
        Object.assign(baseStyle, typography.styles.bodySmall)
        break
      case 'large':
        Object.assign(baseStyle, typography.styles.bodyLarge)
        break
      default:
        Object.assign(baseStyle, typography.styles.bodyMedium)
    }

    return baseStyle
  }

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={getContainerStyle()}>
        {leftIcon && (
          <Text style={[styles.icon, styles.leftIcon]}>{leftIcon}</Text>
        )}
        
        <TextInput
          {...props}
          style={[getInputStyle(), inputStyle]}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          placeholderTextColor={colors.textSecondary}
        />
        
        {rightIcon && (
          <Text style={[styles.icon, styles.rightIcon]}>{rightIcon}</Text>
        )}
      </View>
      
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.styles.labelMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  labelError: {
    color: colors.error,
  },
  required: {
    color: colors.error,
  },
  icon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  error: {
    ...typography.styles.caption,
    color: colors.error,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.styles.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
})

export default Input




