import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { colors, fontFamily, MIN_TOUCH_SIZE } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Navegação inferior dos noivos (briefing, seção 12).
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'inicio', title: 'Início', icon: 'home-outline' },
  { name: 'orcamento', title: 'Orçamento', icon: 'wallet-outline' },
  { name: 'convidados', title: 'Convidados', icon: 'people-outline' },
  { name: 'fornecedores', title: 'Fornecedores', icon: 'storefront-outline' },
  { name: 'assistente', title: 'Assistente', icon: 'sparkles-outline' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fontFamily.body },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: fontFamily.heading, color: colors.text },
        headerShadowVisible: false,
        headerRight: () => (
          <Link href="/conta" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Minha conta"
              style={{
                minWidth: MIN_TOUCH_SIZE,
                minHeight: MIN_TOUCH_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person-circle-outline" size={28} color={colors.text} />
            </Pressable>
          </Link>
        ),
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} color={String(color)} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
