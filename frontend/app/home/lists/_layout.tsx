import { Stack } from 'expo-router';
import React from 'react';

export default function ListsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="edit-wishlist" />
    </Stack>
  );
}