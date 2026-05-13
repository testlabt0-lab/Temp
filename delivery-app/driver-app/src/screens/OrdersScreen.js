import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

const dummyOrders = [
  { id: '101', restaurant: 'Burger Joint', pickup: '123 Main St', dropoff: '456 Elm St', amount: '18.50' },
  { id: '102', restaurant: 'Pizza Paradise', pickup: '789 Oak Ave', dropoff: '321 Pine Rd', amount: '25.00' },
];

export default function OrdersScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <FlatList
        data={dummyOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetail', { order: item })}
          >
            <View style={styles.headerRow}>
              <Text style={styles.title}>Order #{item.id}</Text>
              <Text style={styles.amount}>${item.amount}</Text>
            </View>
            <Text style={styles.restaurant}>{item.restaurant}</Text>
            <Text style={styles.address}>Pickup: {item.pickup}</Text>
            <Text style={styles.address}>Dropoff: {item.dropoff}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  restaurant: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    color: '#666',
    marginTop: 2,
  },
});
