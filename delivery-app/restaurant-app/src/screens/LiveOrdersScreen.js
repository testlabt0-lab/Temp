import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LiveOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    fetchRestaurantAndOrders();
  }, []);

  async function fetchRestaurantAndOrders() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find restaurant owned by this user
      const { data: restData } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (restData) {
        setRestaurantId(restData.id);
        fetchOrders(restData.id);
        setupRealtimeSubscription(restData.id);
      } else {
        Alert.alert('Error', 'No restaurant linked to this account.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders(restId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles!orders_customer_id_fkey(full_name, phone_number)')
      .eq('restaurant_id', restId)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false });

    if (!error) setOrders(data || []);
  }

  function setupRealtimeSubscription(restId) {
    const subscription = supabase
      .channel('restaurant-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restId}`
      }, () => {
        fetchOrders(restId);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }

  const updateOrderStatus = async (orderId, currentStatus) => {
    let nextStatus = '';
    if (currentStatus === 'pending') nextStatus = 'accepted';
    else if (currentStatus === 'accepted') nextStatus = 'picking_up'; // Ready for driver

    if (!nextStatus) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders(restaurantId);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Live Orders</Text>
      {orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No active orders.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>Order #{item.id.substring(0,8)}</Text>
                <Text style={styles.amount}>${item.total_amount}</Text>
              </View>
              <Text style={styles.customer}>Customer: {item.profiles?.full_name || 'Guest'}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>

              <View style={styles.actionRow}>
                {item.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => updateOrderStatus(item.id, item.status)}
                  >
                    <Text style={styles.actionText}>Accept Order</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'accepted' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
                    onPress={() => updateOrderStatus(item.id, item.status)}
                  >
                    <Text style={styles.actionText}>Mark Ready for Driver</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
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
    color: '#333'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
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
    color: '#d32f2f',
  },
  customer: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#ffebee',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  statusText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
  }
});
