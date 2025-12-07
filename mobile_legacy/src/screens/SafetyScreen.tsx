import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme, List, Avatar } from 'react-native-paper';
import * as Progress from 'react-native-progress';

export default function SafetyScreen() {
    const theme = useTheme();

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>

            {/* Score Header */}
            <View style={styles.scoreHeader}>
                <Progress.Circle
                    size={160}
                    progress={0.85}
                    thickness={10}
                    color={theme.colors.secondary}
                    unfilledColor="#E0E0E0"
                    borderWidth={0}
                    showsText={true}
                    formatText={() => "85"}
                    textStyle={{ fontSize: 48, fontWeight: 'bold', color: theme.colors.primary }}
                />
                <Text variant="titleLarge" style={{ marginTop: 16, fontWeight: 'bold' }}>Safety Score</Text>
                <Text variant="bodyMedium" style={{ color: 'green' }}>⬆️ 2 pts since last week</Text>
            </View>

            {/* Recent Events */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Recent Events</Text>
            <Card style={styles.card}>
                <List.Item
                    title="Harsh Braking"
                    description="Yesterday, 10:45 AM • MG Road"
                    left={props => <Avatar.Icon {...props} icon="alert-octagon" style={{ backgroundColor: '#FFEBEE' }} color="#D32F2F" />}
                    right={props => <Text {...props} style={{ alignSelf: 'center', color: '#D32F2F', fontWeight: 'bold' }}>-5 pts</Text>}
                />
                <Divider />
                <List.Item
                    title="Speeding (>85 km/h)"
                    description="Today, 02:15 PM • NH-44"
                    left={props => <Avatar.Icon {...props} icon="speedometer" style={{ backgroundColor: '#FFF3E0' }} color="#F57C00" />}
                    right={props => <Text {...props} style={{ alignSelf: 'center', color: '#F57C00', fontWeight: 'bold' }}>-3 pts</Text>}
                />
            </Card>

            {/* Coaching Tip */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Coaching</Text>
            <Card style={styles.card}>
                <Card.Cover source={{ uri: 'https://picsum.photos/700' }} style={{ height: 150 }} />
                <Card.Content style={{ paddingTop: 16 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Maintaining Safe Distance</Text>
                    <Text variant="bodyMedium" style={{ marginTop: 4, color: 'gray' }}>
                        Learn how the 3-second rule can prevent rear-end collisions.
                    </Text>
                </Card.Content>
            </Card>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    scoreHeader: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 24,
        elevation: 2,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: 'white',
        marginBottom: 24,
    },
});
