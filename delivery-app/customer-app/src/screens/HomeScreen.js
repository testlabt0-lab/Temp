import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Button } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    fetchRestaurants();
  }, []);

  async function fetchRestaurants() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching restaurants', error);
      } else {
        setRestaurants(data || []);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>List View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>Map View</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={{ backgroundColor: '#2e7d32', padding: 10, marginHorizontal: 16, borderRadius: 8, alignItems: 'center', marginBottom: 10 }}
        onPress={() => navigation.navigate('MyOrders')}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>View My Orders</Text>
      </TouchableOpacity>

      {restaurants.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No restaurants available at the moment.</Text>
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('Restaurant', { restaurant: item, name: item.name })}
            >
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>
              {item.address && <Text style={styles.address}>{item.address}</Text>}
            </TouchableOpacity>
          )}
        />
      ) : (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: restaurants[0]?.latitude || 24.7136, // Default to Riyadh
            longitude: restaurants[0]?.longitude || 46.6753,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {restaurants.map((restaurant) => (
            restaurant.latitude && restaurant.longitude ? (
              <Marker
                key={restaurant.id}
                coordinate={{ latitude: restaurant.latitude, longitude: restaurant.longitude }}
                title={restaurant.name}
                description={restaurant.description}
                onCalloutPress={() => navigation.navigate('Restaurant', { restaurant: restaurant, name: restaurant.name })}
              />
            ) : null
          ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'center',
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2e7d32',
    backgroundColor: 'white',
  },
  toggleButtonActive: {
    backgroundColor: '#2e7d32',
  },
  toggleText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: 'white',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#666',
    marginBottom: 4,
  },
  address: {
    color: '#888',
    fontSize: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  }
});
