import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Switch, Alert, Button } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    setupUser();
    fetchOrders();

    const subscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function setupUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data } = await supabase.from('profiles').select('is_online').eq('id', user.id).single();
      if (data) setIsOnline(data.is_online);
    }
  }

  useEffect(() => {
    let locationSubscription;
    (async () => {
      if (isOnline && userId) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission to access location was denied');
          setIsOnline(false);
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          (loc) => {
            supabase.from('profiles').update({
              current_latitude: loc.coords.latitude,
              current_longitude: loc.coords.longitude,
              last_location_update: new Date().toISOString()
            }).eq('id', userId).then();
          }
        );
      }
    })();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, [isOnline, userId]);

  const toggleOnlineStatus = async (value) => {
    setIsOnline(value);
    if (userId) {
      await supabase.from('profiles').update({ is_online: value }).eq('id', userId);
    }
  };

  async function fetchOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*, restaurants(name, address)')
        .in('status', ['pending', 'accepted', 'picking_up', 'delivering'])
        .order('created_at', { ascending: false });

      if (!error) setOrders(data || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.onlineContainer}>
          <Text style={styles.statusText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#767577', true: '#81c784' }}
            thumbColor={isOnline ? '#2e7d32' : '#f4f3f4'}
          />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Earnings')} style={styles.walletButton}>
          <Text style={styles.walletText}>Wallet</Text>
        </TouchableOpacity>
      </View>

      {!isOnline ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Go online to start receiving orders.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={fetchOrders}
          ListEmptyComponent={
            <View style={styles.centerList}>
              <Text style={styles.emptyText}>No available orders right now.</Text>
            </View>
          }
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
                <Text style={styles.statusTextBadge}>{item.status.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  onlineContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  walletButton: { backgroundColor: '#e1f5fe', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  walletText: { color: '#0288d1', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  centerList: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666', textAlign: 'center' },
  card: { backgroundColor: 'white', padding: 16, marginHorizontal: 16, borderRadius: 8, marginBottom: 12, marginTop: 12, elevation: 3 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 'bold' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#0288d1' },
  restaurant: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  address: { color: '#666', marginTop: 2, fontSize: 13 },
  statusBadge: { marginTop: 10, backgroundColor: '#e1f5fe', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusTextBadge: { color: '#0288d1', fontSize: 12, fontWeight: 'bold' }
});
