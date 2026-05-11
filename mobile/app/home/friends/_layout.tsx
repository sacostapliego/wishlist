import { Stack } from 'expo-router';
import React from 'react';

export default function FriendsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tabs/WishlistsTab"/>
      <Stack.Screen name="tabs/FriendsTab"/>
      <Stack.Screen name="tabs/RequestsTab"/>
    </Stack>
  );
}