import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useBistroStore } from '../../store/bistroStore';
import { Colors, Fonts } from '../../constants/design';
import { Feather } from '@expo/vector-icons';

function TabBarIcon({ name, focused, label, badge }: {
  name: string;
  focused: boolean;
  label: string;
  badge?: number;
}) {
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Feather
          name={name as any}
          size={20}
          color={focused ? Colors.gold : Colors.textDim}
        />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const cartCount = useBistroStore(s => s.cartCount());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="grid" focused={focused} label="Menu" />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="message-circle" focused={focused} label="AI Chat" />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              name="shopping-bag"
              focused={focused}
              label="Cart"
              badge={cartCount || undefined}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.bgElevated,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapActive: {
    backgroundColor: Colors.goldGlow,
  },
  tabLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textDim,
  },
  tabLabelActive: {
    color: Colors.gold,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.gold,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.bg,
  },
});
