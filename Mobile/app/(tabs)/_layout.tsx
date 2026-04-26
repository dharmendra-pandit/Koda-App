import { Tabs } from 'expo-router';
import { Home, BookOpen, Timer, MessageCircle, User } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Colors } from '../../src/styles/colors';
import { Platform, View } from 'react-native';
import { Shadows } from '../../src/styles/shadows';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.card,
          height: Platform.OS === 'ios' ? 88 : 72,
          borderTopWidth: 1,
          borderTopColor: Colors.borderLight,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
          ...Shadows.lg,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: 60,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <MotiView animate={{ scale: focused ? 1.15 : 1, translateY: focused ? -2 : 0 }} transition={{ type: 'spring' }}>
              <Home size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
              {focused && <MotiView style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: -8, alignSelf: 'center' }} from={{ opacity: 0 }} animate={{ opacity: 1 }} />}
            </MotiView>
          ),
        }}
      />
      <Tabs.Screen
        name="subjects"
        options={{
          title: 'Subjects',
          tabBarIcon: ({ color, size, focused }) => (
            <MotiView animate={{ scale: focused ? 1.15 : 1, translateY: focused ? -2 : 0 }} transition={{ type: 'spring' }}>
              <BookOpen size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
              {focused && <MotiView style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: -8, alignSelf: 'center' }} from={{ opacity: 0 }} animate={{ opacity: 1 }} />}
            </MotiView>
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, size, focused }) => (
            <MotiView 
              animate={{ 
                scale: focused ? 1.15 : 1,
              }} 
              transition={{ type: 'spring' }}
            >
              <View style={{
                backgroundColor: focused ? Colors.primary : Colors.primaryLight,
                borderRadius: 24,
                width: 48,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
                ...Shadows.green,
              }}>
                <Timer size={24} color={focused ? Colors.white : Colors.primary} strokeWidth={focused ? 2.5 : 2} />
              </View>
            </MotiView>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size, focused }) => (
            <MotiView animate={{ scale: focused ? 1.15 : 1, translateY: focused ? -2 : 0 }} transition={{ type: 'spring' }}>
              <MessageCircle size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
              {focused && <MotiView style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: -8, alignSelf: 'center' }} from={{ opacity: 0 }} animate={{ opacity: 1 }} />}
            </MotiView>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <MotiView animate={{ scale: focused ? 1.15 : 1, translateY: focused ? -2 : 0 }} transition={{ type: 'spring' }}>
              <User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
              {focused && <MotiView style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color, position: 'absolute', bottom: -8, alignSelf: 'center' }} from={{ opacity: 0 }} animate={{ opacity: 1 }} />}
            </MotiView>
          ),
        }}
      />
    </Tabs>
  );
}
