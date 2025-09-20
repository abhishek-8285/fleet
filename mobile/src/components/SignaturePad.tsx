import React, { useState, useRef } from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState
} from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface SignaturePadProps {
  onSignatureChange: (signature: string) => void
  strokeColor?: string
  strokeWidth?: number
  backgroundColor?: string
}

interface Point {
  x: number
  y: number
}

const { width: screenWidth } = Dimensions.get('window')
const SIGNATURE_WIDTH = screenWidth - 40
const SIGNATURE_HEIGHT = 200

export default function SignaturePad({
  onSignatureChange,
  strokeColor = '#000000',
  strokeWidth = 3,
  backgroundColor = '#ffffff'
}: SignaturePadProps) {
  const [paths, setPaths] = useState<string[]>([])
  const [currentPath, setCurrentPath] = useState<string>('')
  const [isDrawing, setIsDrawing] = useState(false)
  const pathRef = useRef<Point[]>([])

  const createSVGPath = (points: Point[]): string => {
    if (points.length < 2) return ''
    
    let path = `M${points[0].x},${points[0].y}`
    
    for (let i = 1; i < points.length - 1; i++) {
      const currentPoint = points[i]
      const nextPoint = points[i + 1]
      const controlPointX = (currentPoint.x + nextPoint.x) / 2
      const controlPointY = (currentPoint.y + nextPoint.y) / 2
      path += ` Q${currentPoint.x},${currentPoint.y} ${controlPointX},${controlPointY}`
    }
    
    if (points.length > 1) {
      const lastPoint = points[points.length - 1]
      path += ` L${lastPoint.x},${lastPoint.y}`
    }
    
    return path
  }

  const generateSignatureString = (allPaths: string[]): string => {
    // Create a simple SVG string representation
    const svgContent = `
      <svg width="${SIGNATURE_WIDTH}" height="${SIGNATURE_HEIGHT}" viewBox="0 0 ${SIGNATURE_WIDTH} ${SIGNATURE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        ${allPaths.map(path => `<path d="${path}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}
      </svg>
    `
    
    // Convert SVG to base64 data URI
    const base64SVG = btoa(svgContent)
    return `data:image/svg+xml;base64,${base64SVG}`
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: (event: GestureResponderEvent) => {
      const { locationX, locationY } = event.nativeEvent
      pathRef.current = [{ x: locationX, y: locationY }]
      setIsDrawing(true)
    },

    onPanResponderMove: (event: GestureResponderEvent) => {
      if (!isDrawing) return
      
      const { locationX, locationY } = event.nativeEvent
      pathRef.current.push({ x: locationX, y: locationY })
      
      const newPath = createSVGPath(pathRef.current)
      setCurrentPath(newPath)
    },

    onPanResponderRelease: () => {
      if (isDrawing && currentPath) {
        const newPaths = [...paths, currentPath]
        setPaths(newPaths)
        setCurrentPath('')
        setIsDrawing(false)
        pathRef.current = []
        
        // Generate signature data
        const signatureData = generateSignatureString(newPaths)
        onSignatureChange(signatureData)
      }
    }
  })

  const clearSignature = () => {
    setPaths([])
    setCurrentPath('')
    setIsDrawing(false)
    pathRef.current = []
    onSignatureChange('')
  }

  return (
    <View style={styles.container}>
      <View 
        style={[styles.signatureArea, { backgroundColor }]}
        {...panResponder.panHandlers}
      >
        <Svg 
          width={SIGNATURE_WIDTH} 
          height={SIGNATURE_HEIGHT}
          style={StyleSheet.absoluteFillObject}
        >
          {/* Render completed paths */}
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          
          {/* Render current drawing path */}
          {currentPath && (
            <Path
              d={currentPath}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>
    </View>
  )
}

// Export clear function for external use
export { SignaturePad }

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  signatureArea: {
    width: SIGNATURE_WIDTH,
    height: SIGNATURE_HEIGHT,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    position: 'relative'
  }
})




