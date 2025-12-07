import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

// Screens (Placeholders for now)
import HomeScreen from '../screens/HomeScreen';
import HOSScreen from '../screens/HOSScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import SafetyScreen from '../screens/SafetyScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
    return (
        <PaperProvider theme={theme}>
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={{
                        headerStyle: { backgroundColor: theme.colors.primary },
                        headerTintColor: '#fff',
                        tabBarActiveTintColor: theme.colors.primary,
                        tabBarInactiveTintColor: 'gray',
                        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
                    }}
                >
                    <Tab.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{
                            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={24} color={color} />,
                            headerTitle: "FleetFlow Driver"
                        }}
                    />
                    <Tab.Screen
                        name="HOS"
                        component={HOSScreen}
                        options={{
                            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="clock-outline" size={24} color={color} />,
                            headerTitle: "Hours of Service"
                        }}
                    />
                    <Tab.Screen
                        name="Documents"
                        component={DocumentsScreen}
                        options={{
                            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-document-outline" size={24} color={color} />,
                            headerTitle: "Digital Wallet"
                        }}
                    />
                    <Tab.Screen
                        name="Safety"
                        component={SafetyScreen}
                        options={{
                            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="shield-check-outline" size={24} color={color} />,
                            headerTitle: "Safety Scorecard"
                        }}
                    />
                </Tab.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
}
