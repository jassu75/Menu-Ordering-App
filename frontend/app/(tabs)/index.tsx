import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBistroStore, MenuItem } from "../../store/bistroStore";
import { Colors, Fonts, Spacing, Radii } from "../../constants/design";
import { API_URL } from "@/constants/config";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

const CATEGORIES = [
  { key: "starters", label: "Starters", icon: "🥗" },
  { key: "mains", label: "Mains", icon: "🍽️" },
  { key: "sides", label: "Sides", icon: "🍟" },
  { key: "drinks", label: "Drinks", icon: "🥤" },
  { key: "desserts", label: "Desserts", icon: "🍮" },
];

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  const cartItems = useBistroStore((s) => s.cartItems);
  const cartItem = cartItems.find((i) => i.id === item.id);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 6,
      }),
    ]).start();
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd();
  };

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.cardContent}>
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemPrice}>${item.price}</Text>
          </View>
          <Text style={styles.itemDesc} numberOfLines={2}>
            {item.description}
          </Text>
          {item.tags.length > 0 && (
            <View style={styles.tags}>
              {item.tags.map((tag) => (
                <View
                  key={tag}
                  style={[styles.tag, tag === "spicy" && styles.tagSpicy]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      tag === "spicy" && styles.tagTextSpicy,
                    ]}
                  >
                    {tag === "spicy" ? "🌶️ " : tag === "vegan" ? "🌱 " : "🥬 "}
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addBtn, cartItem && styles.addBtnActive]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {cartItem ? (
          <Text style={styles.addBtnCount}>{cartItem.quantity}</Text>
        ) : (
          <Feather name="plus" size={16} color={Colors.bg} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MenuScreen() {
  const { menu, setMenu, activeCategory, setActiveCategory, addItem } =
    useBistroStore();
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchMenu();
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`${API_URL}/api/menu`);
      const data = await res.json();
      if (data.menu) {
        const menuWithCategory: Record<string, MenuItem[]> = {};
        Object.entries(data.menu).forEach(([cat, items]) => {
          menuWithCategory[cat] = (items as MenuItem[]).map((i) => ({
            ...i,
            category: cat,
          }));
        });
        setMenu(menuWithCategory);
      }
    } catch (e) {
      console.warn("Could not fetch menu, using embedded fallback");
      // Menu fetch failed - items still visible via fallback
    } finally {
      setLoading(false);
    }
  };

  const currentItems = menu[activeCategory] || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={["top"]}>
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <View>
            <Text style={styles.headerSub}>Welcome to</Text>
            <Text style={styles.headerTitle}>The Intelligent{"\n"}Bistro</Text>
          </View>
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => router.push("/chat")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.gold, Colors.goldDim]}
              style={styles.aiBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.aiBtnText}>✦ AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      {/* Divider line */}
      <View style={styles.divider} />

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.catTab,
              activeCategory === cat.key && styles.catTabActive,
            ]}
            onPress={() => setActiveCategory(cat.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text
              style={[
                styles.catLabel,
                activeCategory === cat.key && styles.catLabelActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Menu items */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.gold} size="large" />
          <Text style={styles.loaderText}>Preparing your menu…</Text>
        </View>
      ) : (
        <FlatList
          data={currentItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {CATEGORIES.find((c) => c.key === activeCategory)?.icon}{" "}
              {CATEGORIES.find((c) => c.key === activeCategory)?.label}
              <Text style={styles.itemCount}> {currentItems.length} items</Text>
            </Text>
          }
          renderItem={({ item }) => (
            <MenuItemCard item={item} onAdd={() => addItem(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No items in this category yet.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerSub: {
    fontFamily: Fonts.displayItalic,
    fontSize: 14,
    color: Colors.gold,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 34,
  },
  aiBtn: {
    borderRadius: Radii.full,
    overflow: "hidden",
  },
  aiBtnGrad: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radii.full,
    alignItems: "center",
  },
  aiBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.bg,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  catScroll: {
    maxHeight: 70,
  },
  catContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  catTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgCard,
  },
  catTabActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldGlow,
  },
  catIcon: {
    fontSize: 14,
  },
  catLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  catLabelActive: {
    color: Colors.goldLight,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  itemCount: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textDim,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardContent: {
    flexDirection: "row",
    flex: 1,
    gap: 12,
  },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontFamily: Fonts.displayMedium,
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.gold,
  },
  itemDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  tag: {
    backgroundColor: "rgba(76, 175, 125, 0.1)",
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagSpicy: {
    backgroundColor: "rgba(232, 93, 58, 0.1)",
  },
  tagText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.success,
    textTransform: "capitalize",
  },
  tagTextSpicy: {
    color: Colors.spicy,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginTop: 2,
  },
  addBtnActive: {
    backgroundColor: Colors.goldLight,
  },
  addBtnCount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.bg,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderText: {
    fontFamily: Fonts.displayItalic,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  empty: {
    alignItems: "center",
    paddingTop: Spacing.xl,
  },
  emptyText: {
    fontFamily: Fonts.body,
    color: Colors.textDim,
  },
});
