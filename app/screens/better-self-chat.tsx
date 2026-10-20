import SubscriptionModal from "@/app/components/SubscriptionModal";
import { useAuth } from "@/app/context/AuthContext";
import { sendMessage } from "@/app/lib/better-self-chat-service";
import { purchaseSubscription } from "@/app/lib/in-app-purchase";
import {
  activateSubscription,
  canSendMessage,
  hasSeenFirstGoalPrompt,
  markFirstGoalPromptSeen,
} from "@/app/lib/subscription-service";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface MatchedGoal {
  goalId: string;
  goalTitle: string;
  goalTarget: string;
  userAchievement: string;
  completionPercentage: number;
  confidence: number;
  reasoning: string;
}

interface DetectedActivity {
  description: string;
  matchedGoals: MatchedGoal[];
  unrelatedActivities: string[];
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "better-self";
  timestamp: Date;
  detectedActivity?: DetectedActivity;
  activityLogged?: boolean;
}

const PRIMARY_GREEN = "#58CC02";
const DARK_BG = "#0F1419";
const LIGHT_BG = "#F5F1E8";
const DARK_TEXT = "#FFFFFF";
const LIGHT_TEXT = "#1F1F1F";
const DARK_SUBTITLE = "#B0B0B0";
const LIGHT_SUBTITLE = "#757575";
const DARK_CARD_BG = "#1A2332";
const LIGHT_CARD_BG = "#FFFFFF";
const DARK_INPUT_BG = "#2A3A4A";
const LIGHT_INPUT_BG = "#F5F5F5";
const DARK_BORDER = "#2A3A4A";
const LIGHT_BORDER = "#E0E0E0";

// Typing indicator component with bouncing dots
function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounceAnimation = (
      animValue: Animated.Value,
      delay: number,
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: -6,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    Animated.parallel([
      createBounceAnimation(dot1, 0),
      createBounceAnimation(dot2, 150),
      createBounceAnimation(dot3, 300),
    ]).start();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingContainer}>
      <Animated.View
        style={[
          styles.typingDot,
          {
            transform: [{ translateY: dot1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.typingDot,
          {
            transform: [{ translateY: dot2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.typingDot,
          {
            transform: [{ translateY: dot3 }],
          },
        ]}
      />
    </View>
  );
}

export default function BetterSelfChatScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [betterSelfAvatarUrl, setBetterSelfAvatarUrl] = useState<string | null>(null);
  const [currentSelfAvatarUrl, setCurrentSelfAvatarUrl] = useState<string | null>(null);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [subscriptionModalType, setSubscriptionModalType] = useState<"must_subscribe" | "upgrade_premium">("must_subscribe");
  const flatListRef = useRef<FlatList>(null);

  const bgColor = isDarkMode ? DARK_BG : LIGHT_BG;
  const textColor = isDarkMode ? DARK_TEXT : LIGHT_TEXT;
  const subtitleColor = isDarkMode ? DARK_SUBTITLE : LIGHT_SUBTITLE;
  const cardBg = isDarkMode ? DARK_CARD_BG : LIGHT_CARD_BG;
  const inputBg = isDarkMode ? DARK_INPUT_BG : LIGHT_INPUT_BG;
  const borderColor = isDarkMode ? DARK_BORDER : LIGHT_BORDER;

  useEffect(() => {
    if (user?.id) {
      loadConversationHistory();
      fetchBetterSelfAvatar();
    }
  }, [user?.id]);

  const fetchBetterSelfAvatar = async () => {
    try {
      const { data } = await (supabase.from("users") as any)
        .select("avatar_url, better_self_avatar_url")
        .eq("id", user?.id)
        .single();
      if (data?.better_self_avatar_url) {
        setBetterSelfAvatarUrl(data.better_self_avatar_url);
      }
      if (data?.avatar_url) {
        setCurrentSelfAvatarUrl(data.avatar_url);
      }
    } catch (err) {
      console.error("Error fetching avatars:", err);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("better_self_conversations")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        console.error("Error loading conversation history:", error);
        return;
      }

      if (data && data.length > 0) {
        const historyMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          text: msg.message_text,
          sender: msg.sender,
          timestamp: new Date(msg.created_at),
          detectedActivity: msg.detected_activity,
        }));

        setMessages(historyMessages);
      } else {
        // Fetch user's aspiration and first daily goal
        const { data: aspirationData } = await (supabase
          .from("aspirations") as any)
          .select("description")
          .eq("user_id", user?.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: firstGoal } = await (supabase
          .from("generated_goals") as any)
          .select("title, description")
          .eq("user_id", user?.id)
          .eq("status", "active")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        const aspiration = aspirationData?.description || "your goals";
        let welcomeText = `I'm your better self, and I'm going to guide you on how you can achieve ${aspiration}.`;

        if (firstGoal) {
          welcomeText += `\n\nThis is your first goal for today: "${firstGoal.title}". Go and complete this goal! When you complete your goals, come back to log it.`;
        }

        const welcomeMessage: Message = {
          id: "welcome",
          text: welcomeText,
          sender: "better-self",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("Error in loadConversationHistory:", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubscribe = async (tier: "basic" | "premium") => {
    try {
      console.log(`🛒 Purchasing ${tier} subscription...`);
      
      // Purchase the subscription
      const result = await purchaseSubscription(tier);
      
      if (result.success && result.transactionId && result.platform) {
        // Activate subscription in database
        await activateSubscription(
          user!.id,
          tier,
          result.transactionId,
          result.platform
        );
        
        console.log(`✅ ${tier} subscription activated!`);
        alert(`Success! Your ${tier} plan is now active.`);
        setSubscriptionModalVisible(false);
      } else {
        throw new Error(result.error || "Purchase failed");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      if (error.message !== "Purchase cancelled") {
        alert(`Failed to activate subscription: ${error.message}`);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !user?.id) return;

    // Check message limit before sending
    const messageCheck = await canSendMessage(user.id);
    if (!messageCheck.canSend) {
      if (messageCheck.reason === "must_subscribe_basic") {
        setSubscriptionModalType("must_subscribe");
      } else if (messageCheck.reason === "upgrade_premium") {
        setSubscriptionModalType("upgrade_premium");
      } else {
        setSubscriptionModalType("upgrade_premium");
      }
      setSubscriptionModalVisible(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    // Add typing indicator
    const typingMessageId = (Date.now() + 1).toString();
    const typingMessage: Message = {
      id: typingMessageId,
      text: "typing",
      sender: "better-self",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const response = await sendMessage(user.id, inputText);

      const betterSelfMessage: Message = {
        id: typingMessageId,
        text: response.message,
        sender: "better-self",
        timestamp: new Date(),
      };

      setMessages((prev) =>
        prev.map((msg) => msg.id === typingMessageId ? betterSelfMessage : msg)
      );

      // Show confirmation if goals were logged by the edge function
      const matched = (response as any).matchedGoals || [];
      console.log("🎯 Matched goals from edge function:", JSON.stringify(matched));
      if (matched.length > 0) {
        const confirmationMessage: Message = {
          id: (Date.now() + 3).toString(),
          text: `✓ Logged ${matched.length} goal${matched.length !== 1 ? "s" : ""} for you!`,
          sender: "better-self",
          timestamp: new Date(),
          activityLogged: true,
        };
        setMessages((prev) => [...prev, confirmationMessage]);

        // Check if this is the first goal logged and show subscription modal
        console.log("🎯 Goal logged! Checking if first goal prompt should show...");
        const seenPrompt = await hasSeenFirstGoalPrompt(user.id);
        console.log("🔍 Has seen first goal prompt:", seenPrompt);
        if (!seenPrompt) {
          console.log("🚀 Showing subscription modal for first goal!");
          await markFirstGoalPromptSeen(user.id);
          setSubscriptionModalType("must_subscribe");
          setSubscriptionModalVisible(true);
        } else {
          console.log("⚠️ User has already seen first goal prompt, not showing modal");
        }

        // Fetch the next incomplete goal
        const { data: nextGoal } = await (supabase
          .from("generated_goals") as any)
          .select("title, description")
          .eq("user_id", user?.id)
          .eq("status", "active")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (nextGoal) {
          const nextGoalMessage: Message = {
            id: (Date.now() + 4).toString(),
            text: `Great job! 🎉\n\nHere's your next goal: "${nextGoal.title}". Go complete this goal and come back to log it when you're done!`,
            sender: "better-self",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, nextGoalMessage]);
        } else {
          // All goals completed
          const allDoneMessage: Message = {
            id: (Date.now() + 4).toString(),
            text: `Amazing! 🌟 You've completed all your goals for today. You're crushing it!`,
            sender: "better-self",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, allDoneMessage]);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 5).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "better-self",
        timestamp: new Date(),
      };
      setMessages((prev) =>
        prev.map((msg) => (msg.id === typingMessageId ? errorMessage : msg)),
      );
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUserMessage = item.sender === "user";
    const isTyping = item.text === "typing";

    return (
      <View
        style={[
          styles.messageContainer,
          isUserMessage
            ? styles.userMessageContainer
            : styles.betterSelfMessageContainer,
        ]}
      >
        {!isUserMessage && (
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: PRIMARY_GREEN + "20" },
            ]}
          >
            {betterSelfAvatarUrl ? (
              <Image
                source={{ uri: betterSelfAvatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <MaterialCommunityIcons name="star" size={20} color={PRIMARY_GREEN} />
            )}
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUserMessage
              ? { backgroundColor: PRIMARY_GREEN }
              : { backgroundColor: cardBg, borderColor, borderWidth: 1 },
          ]}
        >
          {isTyping ? (
            <TypingIndicator />
          ) : (
            <>
              <Text
                style={[
                  styles.messageText,
                  { color: isUserMessage ? "#FFFFFF" : textColor },
                ]}
              >
                {item.text}
              </Text>

              {item.detectedActivity &&
                item.detectedActivity.matchedGoals.length > 0 && (
                  <View style={styles.activityInfo}>
                    <Text
                      style={[styles.activityLabel, { color: subtitleColor }]}
                    >
                      Detected:
                    </Text>
                    {item.detectedActivity.matchedGoals.map((goal, idx) => (
                      <Text
                        key={idx}
                        style={[styles.activityGoal, { color: subtitleColor }]}
                      >
                        • {goal.goalTitle} ({goal.completionPercentage}%)
                      </Text>
                    ))}
                  </View>
                )}
            </>
          )}
        </View>

        {isUserMessage && (
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: PRIMARY_GREEN + "20" },
            ]}
          >
            {currentSelfAvatarUrl ? (
              <Image
                source={{ uri: currentSelfAvatarUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={PRIMARY_GREEN}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: bgColor }]}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={textColor}
          />
        </TouchableOpacity>

        {/* Better Self Avatar */}
        <View style={styles.headerAvatarContainer}>
          {betterSelfAvatarUrl ? (
            <Image
              source={{ uri: betterSelfAvatarUrl }}
              style={styles.headerAvatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.headerAvatarFallback, { backgroundColor: PRIMARY_GREEN }]}>
              <MaterialCommunityIcons name="star" size={28} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Your Better Self
          </Text>
          <Text style={[styles.headerSubtitle, { color: PRIMARY_GREEN }]}>
            ● Online
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        scrollEnabled={true}
        onContentSizeChange={() => scrollToBottom()}
      />

      <View style={[styles.inputContainer, { borderTopColor: borderColor }]}>
        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: inputBg, borderColor },
          ]}
        >
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Ask your better self..."
            placeholderTextColor={subtitleColor}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: PRIMARY_GREEN, opacity: loading ? 0.6 : 1 },
            ]}
            onPress={handleSendMessage}
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
        onSubscribe={handleSubscribe}
        type={subscriptionModalType}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerAvatarContainer: {
    position: "relative",
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  headerAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: PRIMARY_GREEN,
    borderWidth: 2,
    borderColor: "#0F1419",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  messageContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  betterSelfMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  messageText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  typingContainer: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingVertical: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#999999",
  },
  activityInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(88, 204, 2, 0.2)",
  },
  activityLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityGoal: {
    fontSize: 11,
    fontWeight: "400",
    lineHeight: 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
