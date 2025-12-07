import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, FAB, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const documents = [
    { id: '1', title: 'Driving License', expiry: '2025-06-15', status: 'Valid', icon: 'card-account-details' },
    { id: '2', title: 'Vehicle Registration', expiry: '2024-12-20', status: 'Expiring Soon', icon: 'file-document' },
    { id: '3', title: 'Insurance Policy', expiry: '2025-01-01', status: 'Valid', icon: 'shield-check' },
    { id: '4', title: 'National Permit', expiry: '2026-03-10', status: 'Valid', icon: 'map-marker-path' },
];

export default function DocumentsScreen() {
    const theme = useTheme();

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <Card.Content style={styles.cardRow}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name={item.icon} size={32} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.title}</Text>
                    <Text variant="bodySmall" style={{ color: 'gray' }}>Expires: {item.expiry}</Text>
                </View>
                <Chip
                    icon={item.status === 'Valid' ? 'check' : 'alert'}
                    style={{ backgroundColor: item.status === 'Valid' ? '#E8F5E9' : '#FFF3E0' }}
                    textStyle={{ color: item.status === 'Valid' ? theme.colors.secondary : '#F57C00' }}
                >
                    {item.status}
                </Chip>
            </Card.Content>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={documents}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16 }}
            />
            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => console.log('Pressed')}
                label="Add Document"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E3F2FD',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
