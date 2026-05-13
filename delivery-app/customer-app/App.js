import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import RestaurantScreen from './src/screens/RestaurantScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Restaurants' }} />
        <Stack.Screen name="Restaurant" component={RestaurantScreen} options={({ route }) => ({ title: route.params?.name || 'Menu' })} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
