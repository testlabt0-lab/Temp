import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function OrderDetailScreen({ route, navigation }) {
  const { order } = route.params;
  const [status, setStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);

  const updateStatus = async () => {
    let nextStatus = '';
    if (status === 'pending') nextStatus = 'accepted';
    else if (status === 'accepted') nextStatus = 'picking_up';
    else if (status === 'picking_up') nextStatus = 'delivering';
    else if (status === 'delivering') nextStatus = 'delivered';
    else return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const updateData = { status: nextStatus };
      if (nextStatus === 'accepted') {
        updateData.driver_id = user.id;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', order.id);

      if (error) throw error;

      setStatus(nextStatus);

      if (nextStatus === 'delivered') {
        Alert.alert('Success', 'Order Delivered!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getButtonTitle = () => {
    if (status === 'pending') return 'Accept Order';
    if (status === 'accepted') return 'Head to Restaurant';
    if (status === 'picking_up') return 'Start Delivery';
    if (status === 'delivering') return 'Mark as Delivered';
    return 'Completed';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order #{order.id.substring(0,8)}</Text>
      <View style={styles.detailBox}>
        <Text style={styles.label}>Restaurant:</Text>
        <Text style={styles.value}>{order.restaurants?.name}</Text>
        <Text style={styles.label}>Pickup Address:</Text>
        <Text style={styles.value}>{order.restaurants?.address}</Text>
        <Text style={styles.label}>Dropoff Address:</Text>
        <Text style={styles.value}>{order.delivery_address}</Text>
        <Text style={styles.label}>Payout:</Text>
        <Text style={styles.value}>${order.total_amount}</Text>
        <Text style={styles.label}>Current Status:</Text>
        <Text style={styles.status}>{status.replace('_', ' ').toUpperCase()}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0288d1" />
      ) : (
        <Button
          title={getButtonTitle()}
          onPress={updateStatus}
          disabled={status === 'delivered' || status === 'cancelled'}
          color="#0288d1"
        />
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailBox: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0288d1',
    marginTop: 4,
  },
});
