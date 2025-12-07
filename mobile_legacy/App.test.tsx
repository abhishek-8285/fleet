import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

describe('Simple', () => {
    it('renders text', () => {
        const { getByText } = render(<Text>Hello</Text>);
        expect(getByText('Hello')).toBeTruthy();
    });
});
