import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { supabase } from './src/lib/supabase';
import HomeScreen from './src/screens/HomeScreen';
import RestaurantScreen from './src/screens/RestaurantScreen';
import TrackOrderScreen from './src/screens/TrackOrderScreen';
import LoginScreen from './src/screens/LoginScreen';

const Stack = createStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Restaurants' }} />
            <Stack.Screen name="Restaurant" component={RestaurantScreen} options={({ route }) => ({ title: route.params?.name || 'Menu' })} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      <Stack.Screen name="TrackOrder" component={TrackOrderScreen} options={{ title: 'Track Order' }} />
          </Stack.Navigator>
    </NavigationContainer>
  );
}
