import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useBistroStore, CartItem } from '../../store/bistroStore';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../../constants/design';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

function CartRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem } = useBistroStore();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handleRemove = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 60, duration: 200, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => removeItem(item.id));
  };

  const handleDecrement = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    if (item.quantity === 1) {
      handleRemove();
    } else {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    updateQuantity(item.id, item.quantity + 1);
  };

  return (
    <Animated.View
      style={[
        styles.cartRow,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.itemEmoji}>
        <Text style={styles.emojiText}>{item.emoji}</Text>
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price} each</Text>
      </View>

      <View style={styles.qtyControls}>
        <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement} activeOpacity={0.7}>
          <Feather name={item.quantity === 1 ? 'trash-2' : 'minus'} size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={handleIncrement} activeOpacity={0.7}>
          <Feather name="plus" size={14} color={Colors.bg} />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtotal}>${(item.price * item.quantity).toFixed(2)}</Text>
    </Animated.View>
  );
}

export default function CartScreen() {
  const { cartItems, cartTotal, clearCart } = useBistroStore();
  const router = useRouter();
  const [ordered, setOrdered] = React.useState(false);
  const checkAnim = useRef(new Animated.Value(0)).current;

  const subtotal = cartTotal();
  const tax = subtotal * 0.0875;
  const tip = subtotal * 0.18;
  const total = subtotal + tax + tip;

  const handleOrder = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOrdered(true);
    Animated.spring(checkAnim, { toValue: 1, useNativeDriver: true, bounciness: 12 }).start();
    setTimeout(() => {
      setOrdered(false);
      checkAnim.setValue(0);
      clearCart();
    }, 3000);
  };

  if (ordered) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[styles.successCheck, { transform: [{ scale: checkAnim }] }]}>
            <Text style={styles.successEmoji}>✓</Text>
          </Animated.View>
          <Text style={styles.successTitle}>Order Placed!</Text>
          <Text style={styles.successSub}>Your delicious meal is being prepared.</Text>
          <Text style={styles.successTime}>Estimated time: 20–25 min</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Order</Text>
          </View>
        </SafeAreaView>

        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Browse the menu or ask our AI to help you build the perfect meal.</Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/')} activeOpacity={0.8}>
              <Text style={styles.emptyBtnText}>Browse Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.emptyBtn, styles.emptyBtnGold]} onPress={() => router.push('/chat')} activeOpacity={0.8}>
              <LinearGradient colors={[Colors.gold, '#A87030']} style={styles.emptyBtnGrad}>
                <Text style={[styles.emptyBtnText, { color: Colors.bg }]}>✦ Ask AI</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Order</Text>
          <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FlatList
        data={cartItems}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <CartRow item={item} />}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (8.75%)</Text>
              <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Suggested Tip (18%)</Text>
              <Text style={styles.summaryValue}>${tip.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        }
      />

      {/* Order button */}
      <SafeAreaView edges={['bottom']}>
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.orderBtn}
            onPress={handleOrder}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.gold, '#A87030']}
              style={styles.orderBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.orderBtnText}>Place Order</Text>
              <Text style={styles.orderBtnTotal}>${total.toFixed(2)}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: Colors.textPrimary,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  itemEmoji: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  itemPrice: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textDim,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.full,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: {
    backgroundColor: Colors.gold,
  },
  qtyText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
    minWidth: 18,
    textAlign: 'center',
  },
  subtotal: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.gold,
    minWidth: 52,
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 8,
  },
  summary: {
    marginTop: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontFamily: Fonts.displayMedium,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.gold,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  orderBtn: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    ...Shadows.gold,
  },
  orderBtnGrad: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 16,
  },
  orderBtnText: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.bg,
  },
  orderBtnTotal: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.bg,
    opacity: 0.8,
  },
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.md,
  },
  emptyBtn: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  emptyBtnGold: {
    borderColor: 'transparent',
  },
  emptyBtnGrad: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  // Success state
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.goldGlow,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successEmoji: {
    fontFamily: Fonts.display,
    fontSize: 40,
    color: Colors.gold,
  },
  successTitle: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  successSub: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  successTime: {
    fontFamily: Fonts.displayItalic,
    fontSize: 14,
    color: Colors.gold,
    marginTop: 8,
  },
});
