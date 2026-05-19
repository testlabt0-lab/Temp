import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../lib/supabase';

const API_URL = 'http://192.168.1.100:3000/api';

export default function CheckoutScreen({ route, navigation }) {
  const { cart, restaurant } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [subTotal, setSubTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null);

  useEffect(() => {
    const sum = cart.reduce((s, i) => s + Number(i.finalPrice), 0);
    setSubTotal(sum);
    setTotal(sum); // Initial total before discount
  }, [cart]);

  const applyPromoCode = async () => {
    if (!promoCode) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !promo) {
        Alert.alert('Invalid Code', 'This promo code is invalid or expired.');
        setLoading(false);
        return;
      }

      if (new Date() > new Date(promo.valid_until)) {
        Alert.alert('Expired', 'This promo code has expired.');
        setLoading(false);
        return;
      }

      if (promo.usage_limit && promo.times_used >= promo.usage_limit) {
        Alert.alert('Limit Reached', 'This promo code has reached its usage limit.');
        setLoading(false);
        return;
      }

      if (subTotal < promo.min_order_amount) {
        Alert.alert('Min Order Not Met', \`You need to spend at least $\${promo.min_order_amount} to use this code.\`);
        setLoading(false);
        return;
      }

      // Check if user already used it
      const { count } = await supabase
        .from('user_promo_usages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('promo_code_id', promo.id);

      if (count && count > 0) {
        Alert.alert('Already Used', 'You have already used this promo code.');
        setLoading(false);
        return;
      }

      // Calculate discount
      let discountAmount = (subTotal * Number(promo.discount_percentage)) / 100;
      if (promo.max_discount_amount && discountAmount > promo.max_discount_amount) {
        discountAmount = promo.max_discount_amount;
      }

      setDiscountInfo({ id: promo.id, amount: discountAmount, code: promo.code });
      setTotal(subTotal - discountAmount);
      Alert.alert('Success', 'Promo code applied!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not apply promo code.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSheetParams = async () => {
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  const handleCheckout = async (paymentMethod) => {
    if (paymentMethod === 'card') {
      const paymentIntentId = await initializePaymentSheet();
      if (!paymentIntentId) return;
      const { error } = await presentPaymentSheet();
      if (error) {
        Alert.alert(`Error code: ${error.code}`, error.message);
        setLoading(false);
        return;
      }
      placeOrderInDatabase(paymentIntentId, 'card', 'paid');
    } else {
      setLoading(true);
      placeOrderInDatabase(null, 'cash', 'pending');
    }
  };

  const placeOrderInDatabase = async (paymentIntentId, method, status) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          restaurant_id: restaurant.id,
          total_amount: total,
          discount_amount: discountInfo ? discountInfo.amount : 0,
          promo_code_id: discountInfo ? discountInfo.id : null,
          delivery_address: '123 Test Street',
          status: 'pending',
          payment_status: status,
          payment_method: method,
          stripe_payment_intent_id: paymentIntentId
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert Items and selections
      for (const item of cart) {
        const { data: orderItem } = await supabase.from('order_items').insert({
          order_id: orderData.id,
          menu_item_id: item.id,
          quantity: 1,
          price_at_time: item.finalPrice
        }).select().single();

        if (item.selectedOptions && item.selectedOptions.length > 0) {
          const selections = item.selectedOptions.map(opt => ({
            order_item_id: orderItem.id,
            modifier_option_id: opt.id,
            price_at_time: opt.price
          }));
          await supabase.from('order_item_selections').insert(selections);
        }
      }

      // Record promo usage if applicable
      if (discountInfo) {
        await supabase.from('user_promo_usages').insert({
          user_id: user.id,
          promo_code_id: discountInfo.id,
          order_id: orderData.id
        });

        // Call RPC to increment times_used (Assuming we'd build an RPC, or we can just let admin handle it for now)
      }

      setLoading(false);
      Alert.alert('Success', 'Your order is confirmed!', [
        { text: 'Track Order', onPress: () => navigation.navigate('TrackOrder', { orderId: orderData.id }) }
      ]);
    } catch (err) {
      setLoading(false);
      console.error(err);
      Alert.alert('Database Error', 'Payment succeeded but order failed to save.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Checkout</Text>

      <View style={styles.summaryBox}>
        <View style={styles.row}>
          <Text style={styles.label}>Subtotal:</Text>
          <Text style={styles.value}>${subTotal.toFixed(2)}</Text>
        </View>
        {discountInfo && (
          <View style={styles.row}>
            <Text style={styles.label}>Discount ({discountInfo.code}):</Text>
            <Text style={[styles.value, {color: '#d32f2f'}]}>-${discountInfo.amount.toFixed(2)}</Text>
          </View>
        )}
        <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#ddd', paddingTop: 10, marginTop: 10 }]}>
          <Text style={styles.summaryText}>Total:</Text>
          <Text style={styles.summaryText}>${total.toFixed(2)}</Text>
        </View>
        <Text style={styles.summarySubtext}>Deliver to: 123 Test Street</Text>
      </View>

      <View style={styles.promoContainer}>
        <TextInput
          style={styles.promoInput}
          placeholder="Promo Code"
          value={promoCode}
          onChangeText={setPromoCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.applyBtn} onPress={applyPromoCode}>
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 20 }}/>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.payButton} onPress={() => handleCheckout('card')}>
            <Text style={styles.buttonText}>Pay with Card</Text>
          </TouchableOpacity>

          <Text style={{ textAlign: 'center', marginVertical: 10, color: '#666' }}>OR</Text>

          <TouchableOpacity style={styles.cashButton} onPress={() => handleCheckout('cash')}>
            <Text style={[styles.buttonText, { color: '#2e7d32' }]}>Cash on Delivery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  summaryBox: { backgroundColor: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 16, color: '#555' },
  value: { fontSize: 16, fontWeight: '500' },
  summaryText: { fontSize: 20, fontWeight: 'bold' },
  summarySubtext: { color: '#666', marginTop: 8 },
  promoContainer: { flexDirection: 'row', marginBottom: 30 },
  promoInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginRight: 10, fontSize: 16 },
  applyBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 8 },
  applyBtnText: { color: 'white', fontWeight: 'bold' },
  buttonContainer: { marginTop: 10 },
  payButton: { backgroundColor: '#000', padding: 16, borderRadius: 8, alignItems: 'center' },
  cashButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#2e7d32', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
