import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
import AddModal from '../components/features/modals/AddModal';
import { useState } from 'react';
import { COLORS } from '../styles/theme';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';

export default function HomeLayout() {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: '#141414' }}>
      <StatusBar
        style="light"
      />

      <Head>
        <style>{`body { background: #141414 !important; }`}</style>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content={COLORS.background} />
      </Head>

      {/* Three tabs for navigation: Home, Add, Settings */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: COLORS.text.primary,
          tabBarInactiveTintColor: '#64748b', 
          tabBarStyle: {
            backgroundColor: '#141414',
            borderTopColor: 'transparent',
            paddingBottom: insets.bottom,
            paddingTop: 10,
            height: 60 + insets.bottom,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '/home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();//
              setIsModalVisible(true);
            },
          }}
          options={{
            title: 'Add',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="lists"
          options={{
            href: null, 
            tabBarStyle: { display: 'none' },
          }}
        />
        {/* Don't feel like reconstructing the entire dir for the frontned, temp/permanent fix */}
        <Tabs.Screen name="friends" options={{ href: null }} />
        <Tabs.Screen name="create-wishlist" options={{ href: null}} />
        <Tabs.Screen name="add-item" options={{ href: null}} />
        <Tabs.Screen name="profile" options={{ href: null }} />
        <Tabs.Screen name="add-friend" options={{ href: null }} />

      </Tabs>
      <AddModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
}