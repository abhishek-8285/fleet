import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, useTheme, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HOSScreen() {
    const theme = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>

            {/* Status Bar */}
            <Card style={styles.statusCard}>
                <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                        <Text variant="labelMedium" style={{ color: 'gray' }}>CURRENT STATUS</Text>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.secondary }}>ON DUTY</Text>
                        <Text variant="bodySmall" style={{ color: 'gray' }}>Since 08:00 AM (4h 12m)</Text>
                    </View>
                    <Button mode="contained" buttonColor={theme.colors.primary} onPress={() => { }}>
                        Change
                    </Button>
                </Card.Content>
            </Card>

            {/* Clocks Grid */}
            <View style={styles.clocksGrid}>
                <View style={styles.clockRow}>
                    <ClockCard label="BREAK" time="03:48" color={theme.colors.secondary} />
                    <ClockCard label="DRIVE" time="06:12" color={theme.colors.secondary} />
                </View>
                <View style={styles.clockRow}>
                    <ClockCard label="SHIFT" time="09:48" color={theme.colors.secondary} />
                    <ClockCard label="CYCLE" time="58:12" color={theme.colors.secondary} />
                </View>
            </View>

            {/* 24h Graph Placeholder */}
            <Card style={styles.graphCard}>
                <Card.Title title="Today's Log" left={(props) => <MaterialCommunityIcons {...props} name="chart-timeline" />} />
                <Card.Content>
                    <View style={styles.graphPlaceholder}>
                        <Text style={{ color: 'gray' }}>[24h Grid Graph Visualization]</Text>
                        {/* In real app, use SVG or Canvas here */}
                        <View style={{ height: 100, width: '100%', backgroundColor: '#E0E0E0', marginTop: 10, borderRadius: 4 }} />
                    </View>
                </Card.Content>
            </Card>

            {/* Certify Button */}
            <Button
                mode="contained"
                style={styles.certifyButton}
                icon="check-decagram"
                onPress={() => { }}
            >
                Certify Logs
            </Button>

        </ScrollView>
    );
}

const ClockCard = ({ label, time, color }) => (
    <Card style={styles.clockCard}>
        <Card.Content style={{ alignItems: 'center' }}>
            <Text variant="displaySmall" style={{ fontWeight: 'bold', color }}>{time}</Text>
            <Text variant="labelSmall" style={{ marginTop: 4 }}>{label}</Text>
        </Card.Content>
    </Card>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    statusCard: {
        marginBottom: 16,
        backgroundColor: 'white',
    },
    clocksGrid: {
        marginBottom: 16,
    },
    clockRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    clockCard: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    graphCard: {
        marginBottom: 24,
        backgroundColor: 'white',
    },
    graphPlaceholder: {
        alignItems: 'center',
        padding: 10,
    },
    certifyButton: {
        marginBottom: 32,
        paddingVertical: 6,
    }
});
