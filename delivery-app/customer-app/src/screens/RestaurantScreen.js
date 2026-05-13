import React from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert } from 'react-native';

const dummyMenu = [
  { id: '1', name: 'Cheeseburger', price: '12.99' },
  { id: '2', name: 'Fries', price: '4.99' },
  { id: '3', name: 'Soda', price: '2.49' },
];

export default function RestaurantScreen({ route }) {
  const { name } = route.params;

  const handleOrder = (item) => {
    Alert.alert('Added to Cart', `Added ${item.name} to your order.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Menu for {name}</Text>
      <FlatList
        data={dummyMenu}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.menuItem}>
            <View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
            </View>
            <Button title="Add" onPress={() => handleOrder(item)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemPrice: {
    color: '#888',
    marginTop: 4,
  },
});
