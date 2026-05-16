import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ReviewScreen({ route, navigation }) {
  const { order } = route.params;
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('reviews').insert({
        order_id: order.id,
        customer_id: user.id,
        restaurant_id: order.restaurant_id,
        driver_id: order.driver_id,
        restaurant_rating: restaurantRating,
        driver_rating: driverRating,
        comment: comment
      });

      if (error) throw error;

      Alert.alert('Thank You', 'Your feedback has been submitted!', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Could not submit review: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating, setRating) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, rating >= star ? styles.starFilled : styles.starEmpty]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>How was your order?</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Rate the Restaurant ({order.restaurants?.name})</Text>
        {renderStars(restaurantRating, setRestaurantRating)}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Rate the Driver</Text>
        {renderStars(driverRating, setDriverRating)}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Any comments?</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Tell us what you liked or how we can improve..."
          value={comment}
          onChangeText={setComment}
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  star: {
    fontSize: 40,
    marginHorizontal: 5,
  },
  starFilled: {
    color: '#f5b041',
  },
  starEmpty: {
    color: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },
  submitButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
