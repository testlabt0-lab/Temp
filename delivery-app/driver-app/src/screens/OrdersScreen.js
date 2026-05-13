import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // Subscribe to new orders
    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          restaurants (
            name,
            address
          )
        `)
        .in('status', ['pending', 'accepted', 'picking_up', 'delivering'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading && orders.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0288d1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No available orders right now.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={fetchOrders}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('OrderDetail', { order: item })}
            >
              <View style={styles.headerRow}>
                <Text style={styles.title}>Order #{item.id.substring(0,8)}</Text>
                <Text style={styles.amount}>${item.total_amount}</Text>
              </View>
              <Text style={styles.restaurant}>{item.restaurants?.name || 'Unknown Restaurant'}</Text>
              <Text style={styles.address}>Pickup: {item.restaurants?.address || 'N/A'}</Text>
              <Text style={styles.address}>Dropoff: {item.delivery_address}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0288d1',
  },
  restaurant: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    color: '#666',
    marginTop: 2,
    fontSize: 13,
  },
  statusBadge: {
    marginTop: 10,
    backgroundColor: '#e1f5fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#0288d1',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
