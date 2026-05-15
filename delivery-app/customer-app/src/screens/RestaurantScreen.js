import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function RestaurantScreen({ route, navigation }) {
  const { restaurant, name } = route.params;
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching menu', error);
      } else {
        setMenu(data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Cart empty', 'Please add items to your cart first.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const totalAmount = cart.reduce((sum, item) => sum + Number(item.price), 0);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          restaurant_id: restaurant.id,
          total_amount: totalAmount,
          delivery_address: '123 Test Street', // Mock address for MVP
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItemsToInsert = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: 1,
        price_at_time: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'Track Order', onPress: () => { setCart([]); navigation.navigate('TrackOrder', { orderId: orderData.id }); } },
        { text: 'OK', onPress: () => { setCart([]); navigation.goBack(); } }
      ]);

    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Menu for {name}</Text>

      {menu.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No menu items available.</Text>
        </View>
      ) : (
        <FlatList
          data={menu}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.menuItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
                <Text style={styles.itemPrice}>${item.price}</Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <Text style={styles.cartText}>{cart.length} items - ${cart.reduce((s, i) => s + Number(i.price), 0).toFixed(2)}</Text>
          <TouchableOpacity style={styles.orderButton} onPress={handleOrder}>
            <Text style={styles.orderButtonText}>Place Order</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
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
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    color: '#888',
    marginTop: 4,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cartText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  orderButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
