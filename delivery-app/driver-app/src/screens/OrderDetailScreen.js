import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';

export default function OrderDetailScreen({ route, navigation }) {
  const { order } = route.params;
  const [status, setStatus] = useState('Pending');

  const updateStatus = () => {
    if (status === 'Pending') setStatus('Accepted');
    else if (status === 'Accepted') setStatus('Picked Up');
    else if (status === 'Picked Up') {
      setStatus('Delivered');
      Alert.alert('Success', 'Order Delivered!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const getButtonTitle = () => {
    if (status === 'Pending') return 'Accept Order';
    if (status === 'Accepted') return 'Mark as Picked Up';
    if (status === 'Picked Up') return 'Mark as Delivered';
    return 'Completed';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order #{order.id}</Text>
      <View style={styles.detailBox}>
        <Text style={styles.label}>Restaurant:</Text>
        <Text style={styles.value}>{order.restaurant}</Text>
        <Text style={styles.label}>Pickup Address:</Text>
        <Text style={styles.value}>{order.pickup}</Text>
        <Text style={styles.label}>Dropoff Address:</Text>
        <Text style={styles.value}>{order.dropoff}</Text>
        <Text style={styles.label}>Payout:</Text>
        <Text style={styles.value}>${order.amount}</Text>
        <Text style={styles.label}>Current Status:</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
      <Button
        title={getButtonTitle()}
        onPress={updateStatus}
        disabled={status === 'Delivered'}
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
