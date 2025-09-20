import React from 'react'
import { render, screen } from '@testing-library/react-native'
import App from './App'

describe('App', () => {
  it('renders login screen text', () => {
    render(<App />)
    expect(screen.getByText(/Driver OTP Login/)).toBeTruthy()
  })
})


