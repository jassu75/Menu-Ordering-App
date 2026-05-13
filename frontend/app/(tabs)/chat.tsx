import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useBistroStore, ChatMessage } from '../../store/bistroStore';
import { useAiChat } from '../../hooks/useAiChat';
import { Colors, Fonts, Spacing, Radii } from '../../constants/design';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 150);
    const a3 = anim(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const DotAnim = ({ anim }: { anim: Animated.Value }) => (
    <Animated.View style={[styles.dot, { transform: [{ translateY: anim }] }]} />
  );

  return (
    <View style={styles.typingBubble}>
      <Text style={styles.aiAvatar}>✦</Text>
      <View style={styles.dotsWrap}>
        <DotAnim anim={dot1} />
        <DotAnim anim={dot2} />
        <DotAnim anim={dot3} />
      </View>
    </View>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const { sendMessage } = useAiChat();
  const isUser = message.role === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && <Text style={styles.aiAvatar}>✦</Text>}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {message.content}
          </Text>
        </View>
      </View>

      {/* Suggestion chips */}
      {!isUser && message.suggestions && message.suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {message.suggestions.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.chip}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                sendMessage(s);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

export default function ChatScreen() {
  const { messages, isAiTyping } = useBistroStore();
  const { sendMessage } = useAiChat();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isAiTyping]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(trimmed);
  };

  const QUICK_PROMPTS = [
    "What's popular tonight?",
    'Add a wagyu burger',
    'Something vegetarian',
    'Build me a full meal',
    'What drinks do you have?',
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <LinearGradient
            colors={[Colors.bgElevated, Colors.bg]}
            style={styles.header}
          >
            <View style={styles.headerLeft}>
              <View style={styles.aiDot} />
              <View>
                <Text style={styles.headerTitle}>Bistro AI</Text>
                <Text style={styles.headerSub}>Your personal dining assistant</Text>
              </View>
            </View>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>✦ Online</Text>
            </View>
          </LinearGradient>
        </SafeAreaView>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <MessageBubble message={item} />}
          ListHeaderComponent={
            messages.length <= 1 ? (
              <View style={styles.quickPromptsWrap}>
                <Text style={styles.quickPromptsLabel}>Try asking…</Text>
                <View style={styles.quickPrompts}>
                  {QUICK_PROMPTS.map((p, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.quickPrompt}
                      onPress={() => sendMessage(p)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.quickPromptText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={isAiTyping ? <TypingIndicator /> : null}
        />

        {/* Input */}
        <SafeAreaView edges={['bottom']}>
          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask me anything…"
                placeholderTextColor={Colors.textDim}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={input.trim() ? [Colors.gold, '#A87030'] : [Colors.bgElevated, Colors.bgElevated]}
                style={styles.sendBtnGrad}
              >
                <Feather name="arrow-up" size={18} color={input.trim() ? Colors.bg : Colors.textDim} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.goldGlow,
    borderWidth: 2,
    borderColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textDim,
  },
  headerBadge: {
    backgroundColor: 'rgba(76, 175, 125, 0.15)',
    borderRadius: Radii.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBadgeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.success,
  },
  messageList: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    gap: 8,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    fontSize: 16,
    color: Colors.gold,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAI: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.gold,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: Colors.bg,
  },
  chipsScroll: {
    marginTop: 6,
    marginLeft: 30,
  },
  chipsContent: {
    gap: 6,
    paddingBottom: 4,
  },
  chip: {
    backgroundColor: 'rgba(201, 147, 58, 0.12)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.goldLight,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
    paddingLeft: 4,
  },
  dotsWrap: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.gold,
    opacity: 0.7,
  },
  quickPromptsWrap: {
    marginBottom: Spacing.lg,
  },
  quickPromptsLabel: {
    fontFamily: Fonts.displayItalic,
    fontSize: 13,
    color: Colors.textDim,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickPrompt: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickPromptText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    borderRadius: Radii.full,
    overflow: 'hidden',
    width: 44,
    height: 44,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
