import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, Card, Button, IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

export default function HomeScreen() {
    const theme = useTheme();
    const [status, setStatus] = useState('ON DUTY');
    const width = Dimensions.get('window').width;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

            {/* Header Info */}
            <View style={styles.headerInfo}>
                <View>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Good Morning, Rajesh</Text>
                    <Text variant="bodySmall" style={{ color: 'gray' }}>Vehicle: KA-01-HH-1234</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="weather-sunny" size={24} color="#FBC02D" />
                    <Text style={{ marginLeft: 4 }}>28°C</Text>
                </View>
            </View>

            {/* Hero Section: Duty Status Ring */}
            <View style={styles.heroSection}>
                <View style={styles.ringContainer}>
                    <Progress.Circle
                        size={220}
                        progress={0.75}
                        thickness={12}
                        color={theme.colors.secondary}
                        unfilledColor="#E0E0E0"
                        borderWidth={0}
                        strokeCap="round"
                    />
                    <View style={styles.ringContent}>
                        <Text variant="labelLarge" style={{ color: 'gray' }}>REMAINING</Text>
                        <Text variant="displayMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>4h 12m</Text>
                        <Text variant="headlineSmall" style={{ color: theme.colors.secondary, fontWeight: 'bold', marginTop: 8 }}>{status}</Text>
                    </View>
                </View>
            </View>

            {/* Quick Actions Grid */}
            <View style={styles.gridContainer}>
                <View style={styles.row}>
                    <Card style={styles.card} onPress={() => { }}>
                        <Card.Content style={styles.cardContent}>
                            <MaterialCommunityIcons name="truck-fast" size={32} color={theme.colors.secondary} />
                            <Text variant="titleMedium" style={{ marginTop: 8 }}>Start Trip</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.card} onPress={() => { }}>
                        <Card.Content style={styles.cardContent}>
                            <MaterialCommunityIcons name="clipboard-check" size={32} color="#1976D2" />
                            <Text variant="titleMedium" style={{ marginTop: 8 }}>DVIR</Text>
                        </Card.Content>
                    </Card>
                </View>
                <View style={styles.row}>
                    <Card style={styles.card} onPress={() => { }}>
                        <Card.Content style={styles.cardContent}>
                            <MaterialCommunityIcons name="gas-station" size={32} color="#FBC02D" />
                            <Text variant="titleMedium" style={{ marginTop: 8 }}>Fuel</Text>
                        </Card.Content>
                    </Card>
                    <Card style={styles.card} onPress={() => { }}>
                        <Card.Content style={styles.cardContent}>
                            <MaterialCommunityIcons name="email" size={32} color="gray" />
                            <Text variant="titleMedium" style={{ marginTop: 8 }}>Inbox</Text>
                        </Card.Content>
                    </Card>
                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    headerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    ringContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringContent: {
        position: 'absolute',
        alignItems: 'center',
    },
    gridContainer: {
        gap: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    card: {
        flex: 1,
        backgroundColor: 'white',
        elevation: 2,
    },
    cardContent: {
        alignItems: 'center',
        padding: 16,
    },
});
