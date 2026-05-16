import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../lib/supabase';

// URL to our Next.js dashboard backend
const API_URL = 'http://192.168.1.100:3000/api'; // Change to local IP or deployed URL

export default function CheckoutScreen({ route, navigation }) {
  const { cart, restaurant } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const sum = cart.reduce((s, i) => s + Number(i.price), 0);
    setTotal(sum);
  }, [cart]);

  const fetchPaymentSheetParams = async () => {
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: total }),
    });
    const { paymentIntentId, clientSecret } = await response.json();
    return { paymentIntentId, clientSecret };
  };

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);
      const { paymentIntentId, clientSecret } = await fetchPaymentSheetParams();

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Delivery App",
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: 'Jane Doe',
        }
      });

      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return null;
      }
      return paymentIntentId;
    } catch (e) {
      Alert.alert('Error', 'Could not initialize payment sheet');
      setLoading(false);
      return null;
    }
  };

  const handleCheckout = async () => {
    const paymentIntentId = await initializePaymentSheet();
    if (!paymentIntentId) return;

    const { error } = await presentPaymentSheet();

    if (error) {
      Alert.alert(`Error code: ${error.code}`, error.message);
      setLoading(false);
    } else {
      // Payment Successful
      placeOrderInDatabase(paymentIntentId);
    }
  };

  const placeOrderInDatabase = async (paymentIntentId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          restaurant_id: restaurant.id,
          total_amount: total,
          delivery_address: '123 Test Street',
          status: 'pending',
          payment_status: 'paid',
          payment_method: 'card',
          stripe_payment_intent_id: paymentIntentId
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert Items
      const items = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: 1,
        price_at_time: item.price
      }));

      await supabase.from('order_items').insert(items);

      // Send push notification to restaurant/drivers (Triggered via Backend ideally)
      fetch(`${API_URL}/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'ExponentPushToken[mock-restaurant-token]', // In reality, fetch from restaurant profile
          title: 'New Order!',
          body: `Order received for $${total}`,
        })
      });

      setLoading(false);
      Alert.alert('Success', 'Your order is confirmed!', [
        { text: 'Track Order', onPress: () => navigation.navigate('TrackOrder', { orderId: orderData.id }) }
      ]);
    } catch (err) {
      setLoading(false);
      Alert.alert('Database Error', 'Payment succeeded but order failed to save.');
    }
  };

  const handleCashOnDelivery = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          restaurant_id: restaurant.id,
          total_amount: total,
          delivery_address: '123 Test Street',
          status: 'pending',
          payment_status: 'pending',
          payment_method: 'cash'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const items = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: 1,
        price_at_time: item.price
      }));

      await supabase.from('order_items').insert(items);

      setLoading(false);
      Alert.alert('Success', 'Order placed successfully!', [
        { text: 'Track Order', onPress: () => navigation.navigate('TrackOrder', { orderId: orderData.id }) }
      ]);
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Checkout</Text>
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>Total Amount: ${total.toFixed(2)}</Text>
        <Text style={styles.summarySubtext}>Deliver to: 123 Test Street</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 20 }}/>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.payButton} onPress={handleCheckout}>
            <Text style={styles.buttonText}>Pay with Card</Text>
          </TouchableOpacity>

          <Text style={{ textAlign: 'center', marginVertical: 10, color: '#666' }}>OR</Text>

          <TouchableOpacity style={styles.cashButton} onPress={handleCashOnDelivery}>
            <Text style={[styles.buttonText, { color: '#2e7d32' }]}>Cash on Delivery</Text>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  summaryText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summarySubtext: {
    color: '#666',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 10,
  },
  payButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cashButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
