import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { useIsWide } from '@/lib/layout';
import { colors, fontFamily, MIN_TOUCH_SIZE } from '@/lib/theme';
import { WeddingProvider } from '@/lib/wedding-context';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Navegação inferior dos noivos (briefing, seção 12). No computador vira menu
// lateral e ganha "Tarefas", que no celular fica dentro do Início (D29).
const TABS: { name: string; title: string; icon: IconName; wideOnly?: boolean }[] = [
  { name: 'inicio', title: 'Início', icon: 'home-outline' },
  { name: 'tarefas', title: 'Tarefas', icon: 'checkbox-outline', wideOnly: true },
  { name: 'orcamento', title: 'Orçamento', icon: 'wallet-outline' },
  { name: 'convidados', title: 'Convidados', icon: 'people-outline' },
  { name: 'fornecedores', title: 'Fornecedores', icon: 'storefront-outline' },
  { name: 'assistente', title: 'Assistente', icon: 'sparkles-outline' },
];

export default function TabsLayout() {
  const wide = useIsWide();

  return (
    <WeddingProvider>
      <Tabs
        screenOptions={{
          tabBarPosition: wide ? 'left' : 'bottom',
          tabBarVariant: wide ? 'material' : 'uikit',
          tabBarLabelPosition: wide ? 'beside-icon' : 'below-icon',
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            ...(wide ? { minWidth: 220 } : {}),
          },
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
              // Fora da barra no celular, mas a rota continua acessível pelo Início.
              ...(tab.wideOnly && !wide ? { href: null } : {}),
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={tab.icon} color={String(color)} size={size} />
              ),
            }}
          />
        ))}
        {/* Telas internas das abas: fora do menu. */}
        <Tabs.Screen name="tarefa/[id]" options={{ href: null, title: 'Tarefa' }} />
      </Tabs>
    </WeddingProvider>
  );
}
