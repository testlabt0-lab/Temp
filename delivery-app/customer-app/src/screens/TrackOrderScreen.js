import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../lib/supabase';

export default function TrackOrderScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    fetchOrderDetails();

    const orderSubscription = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, fetchOrderDetails)
      .subscribe();

    return () => {
      supabase.removeChannel(orderSubscription);
    };
  }, [orderId]);

  // Subscribe to driver location if driver is assigned
  useEffect(() => {
    let driverSubscription;
    if (order?.driver_id) {
      fetchDriverLocation(order.driver_id);

      driverSubscription = supabase
        .channel(`driver-${order.driver_id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${order.driver_id}` }, (payload) => {
          if (payload.new.current_latitude && payload.new.current_longitude) {
            setDriverLocation({
              latitude: payload.new.current_latitude,
              longitude: payload.new.current_longitude,
            });
          }
        })
        .subscribe();
    }

    return () => {
      if (driverSubscription) supabase.removeChannel(driverSubscription);
    };
  }, [order?.driver_id]);

  async function fetchOrderDetails() {
    const { data } = await supabase
      .from('orders')
      .select('*, restaurants(latitude, longitude, name)')
      .eq('id', orderId)
      .single();
    if (data) setOrder(data);
  }

  async function fetchDriverLocation(driverId) {
    const { data } = await supabase
      .from('profiles')
      .select('current_latitude, current_longitude')
      .eq('id', driverId)
      .single();

    if (data && data.current_latitude) {
      setDriverLocation({
        latitude: data.current_latitude,
        longitude: data.current_longitude,
      });
    }
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>Status: {order.status.replace('_', ' ').toUpperCase()}</Text>
      </View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: order.restaurants?.latitude || 24.7136,
          longitude: order.restaurants?.longitude || 46.6753,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Restaurant Marker */}
        {order.restaurants?.latitude && (
          <Marker
            coordinate={{ latitude: order.restaurants.latitude, longitude: order.restaurants.longitude }}
            title={order.restaurants.name}
            pinColor="blue"
          />
        )}

        {/* Driver Marker */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Your Driver"
            pinColor="green"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBox: {
    padding: 16,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  map: {
    flex: 1,
  }
});
