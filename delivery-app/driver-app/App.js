import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { supabase } from './src/lib/supabase';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderDetailScreen from './src/screens/OrderDetailScreen';
import EarningsScreen from './src/screens/EarningsScreen';
import LoginScreen from './src/screens/LoginScreen';

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
    <NavigationContainer>
      <Stack.Navigator>
        {session && session.user ? (
          <>
            <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Available Orders' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Detail' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      <Stack.Screen name="Earnings" component={EarningsScreen} options={{ title: 'My Wallet' }} />
          </Stack.Navigator>
    </NavigationContainer>
  );
}
