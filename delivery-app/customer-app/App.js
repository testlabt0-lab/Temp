import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from './src/lib/supabase';
import HomeScreen from './src/screens/HomeScreen';
import RestaurantScreen from './src/screens/RestaurantScreen';
import LoginScreen from './src/screens/LoginScreen';
import TrackOrderScreen from './src/screens/TrackOrderScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import MyOrdersScreen from './src/screens/MyOrdersScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';

const Stack = createStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) registerForPushNotificationsAsync(session.user.id);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) registerForPushNotificationsAsync(session.user.id);
    });
  }, []);

  async function registerForPushNotificationsAsync(userId) {
    let token;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    token = (await Notifications.getExpoPushTokenAsync()).data;

    if (token) {
      await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
    }
  }

  return (
    <StripeProvider publishableKey="pk_test_TYooMQauvdEDq54NiTphI7jx">
      <NavigationContainer>
        <Stack.Navigator>
          {session && session.user ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Restaurants' }} />
              <Stack.Screen name="Restaurant" component={RestaurantScreen} options={({ route }) => ({ title: route.params?.name || 'Menu' })} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
              <Stack.Screen name="TrackOrder" component={TrackOrderScreen} options={{ title: 'Track Order' }} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          )}
        <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Rate Order', headerLeft: ()=> null }} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
            </Stack.Navigator>
      </NavigationContainer>
    </StripeProvider>
  );
}
