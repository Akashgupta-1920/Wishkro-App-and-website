// src/screens/ReferScreen.js
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  Share as RNShare,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import Header from "../../components/Header";
import api from "../../utils/auth";

/** ----- Config ----- **/
const USERS_FOR_PREMIUM = 1000;
const isWeb = Platform.OS === "web";

/** ----- Helpers ----- **/
const safeText = (v, fallback = "—") =>
  v == null ? fallback : String(v).trim() || fallback;

const tryDate = (v) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString();
  } catch {
    return String(v);
  }
};

/**
 * Normalize different payload shapes (array / object / nested)
 * returns an array of user objects (possibly empty)
 */
const getUsersFromPayload = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.user)) return payload.user;
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  if (Array.isArray(payload?.data)) return payload.data;

  // single user shape -> wrap
  if (
    payload.user &&
    typeof payload.user === "object" &&
    !Array.isArray(payload.user)
  )
    return [payload.user];
  if (
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    if (payload.data._id || payload.data.email || payload.data.name)
      return [payload.data];
  }

  // fallback: find first array in values
  const arr = Object.values(payload).find((v) => Array.isArray(v));
  if (arr) return arr;
  return [];
};

/** ----- Component ----- **/
export default function ReferScreen() {
  const { token, user: ctxUser, logout } = useAuth();
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );
  const [isLargeScreen, setIsLargeScreen] = useState(screenWidth >= 1024);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [referralCode, setReferralCode] = useState(null);

  // Handle window resize on web
  useEffect(() => {
    if (isWeb) {
      const updateDimensions = () => {
        const newWidth = window.innerWidth;
        setScreenWidth(newWidth);
        setIsLargeScreen(newWidth >= 1024);
      };

      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, []);

  const totalReferred = referrals.length;
  const usersLeftToPremium = Math.max(0, USERS_FOR_PREMIUM - totalReferred);

  const extractReferralCodeFromPayload = (payload) => {
    // try many keys to extract referral code (includes misspellings)
    const code =
      payload?.referralCode ||
      payload?.inviterefferal ||
      payload?.invitereferal ||
      payload?.inviteReferral ||
      payload?.data?.inviterefferal ||
      payload?.data?.invitereferal ||
      ctxUser?.inviterefferal ||
      ctxUser?.invitereferal ||
      ctxUser?.inviteReferral ||
      ctxUser?.referralCode ||
      ctxUser?.user?.inviterefferal ||
      ctxUser?.user?.invitereferal ||
      null;
    return code;
  };

  const fetchReferrals = useCallback(
    async (opts = { showErrors: true }) => {
      if (!token) {
        if (opts.showErrors)
          Alert.alert("Not signed in", "Please sign in to view referrals.");
        return;
      }
      setLoading(true);
      try {
        // Use the api axios instance; pass Bearer token in Authorization header.
        // Do NOT set forbidden headers (the api instance should handle baseURL, CORS etc).
        const res = await api.get("/api/user/refferals", {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          timeout: 20000,
        });

        const payload = res?.data ?? null;
        if (!payload) {
          if (opts.showErrors)
            Alert.alert("Error", "Empty response from server");
          setReferrals([]);
          setReferralCode(extractReferralCodeFromPayload({}));
          return;
        }

        const users = getUsersFromPayload(payload);
        setReferrals(users);

        const code =
          extractReferralCodeFromPayload(payload) ||
          extractReferralCodeFromPayload(ctxUser) ||
          null;
        setReferralCode(code);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          // optional: call logout if you want to clear local state
          Alert.alert("Session expired", "Please log in again.", [
            {
              text: "OK",
              onPress: () => {
                try {
                  // clear auth and navigate to login
                  if (logout) logout();
                } catch {}
              },
            },
          ]);
          return;
        }

        if (opts.showErrors) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch referrals";
          Alert.alert("Error", msg);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, ctxUser, logout]
  );

  useEffect(() => {
    if (token) fetchReferrals({ showErrors: false });
  }, [token, fetchReferrals]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReferrals({ showErrors: true });
  }, [fetchReferrals]);

  const copyCode = useCallback(async () => {
    if (!referralCode)
      return Alert.alert("No referral code", "Referral code not available");
    try {
      await Clipboard.setStringAsync(String(referralCode));
      Alert.alert("Copied", "Referral code copied to clipboard.");
    } catch {
      Alert.alert("Error", "Unable to copy referral code.");
    }
  }, [referralCode]);

  const shareReferral = useCallback(async () => {
    const code = referralCode || "—";
    const link = `https://wishkro.app/invite?code=${encodeURIComponent(code)}`;

    const message = `Join WishKro with my referral code ${code} — ${link}`;
    try {
      // Try React Native Share API first (works on native and some web builds)
      if (RNShare && typeof RNShare.share === "function") {
        await RNShare.share({ message });
        return;
      }

      // Fallback to navigator.share on modern browsers
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "Join WishKro",
          text: message,
          url: link,
        });
        return;
      }

      // As last resort, copy link to clipboard and notify user
      await Clipboard.setStringAsync(link);
      Alert.alert("Share", "Link copied to clipboard. Paste to share.");
    } catch (e) {
      console.log("share error", e);
      Alert.alert("Error", "Unable to open share dialog.");
    }
  }, [referralCode]);

  const renderItem = ({ item, index }) => {
    const name = safeText(
      item.name || item.fullName || item.username,
      "Unnamed"
    );
    const email = safeText(item.email, "—");
    const phone = safeText(
      item.phone || item.contactNumber || item.mobile,
      "—"
    );
    const joined = tryDate(
      item.createdAt || item.joinedAt || item.usedAt || item.date
    );

    return (
      <View style={[styles.userCard, isWeb && styles.webUserCard]}>
        <View style={styles.userLeft}>
          <View style={[styles.userAvatar, isWeb && styles.webUserAvatar]}>
            <MaterialCommunityIcons
              name="account"
              size={isWeb ? 24 : 20}
              color="#6C63FF"
            />
          </View>
        </View>

        <View style={[styles.userBody, isWeb && styles.webUserBody]}>
          <Text style={[styles.userName, isWeb && styles.webUserName]}>
            {name}
          </Text>

          <View style={[styles.userMetaRow, isWeb && styles.webUserMetaRow]}>
            <Ionicons
              name="mail-outline"
              size={isWeb ? 16 : 14}
              color="#9CA3AF"
            />
            <Text style={[styles.userMeta, isWeb && styles.webUserMeta]}>
              {email}
            </Text>
          </View>

          <View style={[styles.userMetaRow, isWeb && styles.webUserMetaRow]}>
            <Ionicons
              name="call-outline"
              size={isWeb ? 16 : 14}
              color="#9CA3AF"
            />
            <Text style={[styles.userMeta, isWeb && styles.webUserMeta]}>
              {phone}
            </Text>
          </View>
        </View>

        <View style={[styles.userRight, isWeb && styles.webUserRight]}>
          <Text
            style={[styles.userDateLabel, isWeb && styles.webUserDateLabel]}
          >
            Joined
          </Text>
          <Text style={[styles.userDate, isWeb && styles.webUserDate]}>
            {joined}
          </Text>
        </View>
      </View>
    );
  };

  const keyExtractor = (it, idx) => String(it?._id || it?.id || idx);

  return (
    <SafeAreaView style={[styles.container, isWeb && styles.webContainer]}>
      <View style={{ marginTop: isWeb ? 20 : 35 }}>
        <Header />
      </View>

      <View style={{ height: isWeb ? 20 : 40 }} />

      <LinearGradient
        colors={["#6C35FF", "#9A2BFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.progressCard, isWeb && styles.webProgressCard]}
      >
        <View style={[styles.progressLeft, isWeb && styles.webProgressLeft]}>
          <MaterialCommunityIcons
            name="diamond-outline"
            size={isWeb ? 44 : 34}
            color="#ffd84d"
          />
          <View style={{ marginLeft: isWeb ? 20 : 12 }}>
            <Text
              style={[styles.progressTitle, isWeb && styles.webProgressTitle]}
            >
              Premium Progress
            </Text>
            <Text style={[styles.progressSub, isWeb && styles.webProgressSub]}>
              Only {usersLeftToPremium} users left to reach{"\n"}Premium
            </Text>
          </View>
        </View>

        <View style={[styles.progressRight, isWeb && styles.webProgressRight]}>
          <Text style={[styles.rightLabel, isWeb && styles.webRightLabel]}>
            Total{"\n"}Referred
          </Text>
          <Text style={[styles.rightCount, isWeb && styles.webRightCount]}>
            {totalReferred}
          </Text>
        </View>
      </LinearGradient>

      <View style={{ height: isWeb ? 24 : 12 }} />

      {/* Referral code card */}
      <View style={[styles.referralRow, isWeb && styles.webReferralRow]}>
        <View>
          <Text style={[styles.refLabel, isWeb && styles.webRefLabel]}>
            Your Referral Code
          </Text>
          <Text style={[styles.refCode, isWeb && styles.webRefCode]}>
            {referralCode || "—"}
          </Text>
        </View>

        <View style={[styles.refActions, isWeb && styles.webRefActions]}>
          <TouchableOpacity
            style={[styles.actionBtnWhite, isWeb && styles.webActionBtnWhite]}
            onPress={copyCode}
          >
            <Ionicons name="copy" size={isWeb ? 22 : 18} color="#2563eb" />
            <Text
              style={[styles.actionTextBlue, isWeb && styles.webActionTextBlue]}
            >
              Copy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, isWeb && styles.webActionBtn]}
            onPress={shareReferral}
          >
            <Ionicons name="share-social" size={isWeb ? 22 : 18} color="#fff" />
            <Text style={[styles.actionText, isWeb && styles.webActionText]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: isWeb ? 24 : 12 }} />

      {loading ? (
        <View
          style={[styles.loadingContainer, isWeb && styles.webLoadingContainer]}
        >
          <ActivityIndicator size={isWeb ? "large" : "large"} color="#6C63FF" />
          <Text style={[styles.loadingText, isWeb && styles.webLoadingText]}>
            Loading referrals...
          </Text>
        </View>
      ) : referrals.length === 0 ? (
        <View style={[styles.emptyWrap, isWeb && styles.webEmptyWrap]}>
          <Ionicons
            name="people-outline"
            size={isWeb ? 80 : 64}
            color="#9CA3AF"
          />
          <Text style={[styles.emptyText, isWeb && styles.webEmptyText]}>
            No referrals yet. Start inviting!
          </Text>
          {referralCode && (
            <Text
              style={[styles.emptySubText, isWeb && styles.webEmptySubText]}
            >
              Share your code:{" "}
              <Text style={{ fontWeight: "800" }}>{referralCode}</Text>
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={referrals}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={[
            styles.listContent,
            isWeb && styles.webListContent,
          ]}
          ItemSeparatorComponent={() => (
            <View style={{ height: isWeb ? 16 : 12 }} />
          )}
          showsVerticalScrollIndicator={isWeb}
        />
      )}

      <View style={{ height: isWeb ? 60 : 110 }} />
    </SafeAreaView>
  );
}

/** ----- Styles ----- **/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 12,
  },
  webContainer: {
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 40,
    paddingTop: 20,
  },

  // Progress Card
  progressCard: {
    marginHorizontal: 10,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  webProgressCard: {
    marginHorizontal: 30,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 32,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  progressLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  webProgressLeft: {
    marginRight: 20,
  },

  progressTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  webProgressTitle: {
    fontSize: 28,
    fontWeight: "900",
  },

  progressSub: {
    color: "rgba(255,255,255,0.95)",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  webProgressSub: {
    fontSize: 18,
    lineHeight: 24,
    marginTop: 8,
  },

  progressRight: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  webProgressRight: {
    minWidth: 120,
  },

  rightLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    textAlign: "right",
  },
  webRightLabel: {
    fontSize: 16,
  },

  rightCount: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 6,
  },
  webRightCount: {
    fontSize: 40,
    marginTop: 8,
  },

  // Referral Row
  referralRow: {
    marginHorizontal: 12,
    marginTop: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eef2ff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  webReferralRow: {
    marginHorizontal: 34,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  refLabel: {
    color: "#6B7280",
    fontSize: 13,
  },
  webRefLabel: {
    fontSize: 16,
  },

  refCode: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },
  webRefCode: {
    fontSize: 32,
    marginTop: 8,
  },

  refActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  webRefActions: {
    gap: 12,
  },

  actionBtn: {
    backgroundColor: "#2f66ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  webActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 0,
  },

  actionText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "700",
  },
  webActionText: {
    fontSize: 16,
    marginLeft: 10,
  },

  actionBtnWhite: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
  },
  webActionBtnWhite: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  actionTextBlue: {
    color: "#2563eb",
    marginLeft: 8,
    fontWeight: "700",
  },
  webActionTextBlue: {
    fontSize: 16,
    marginLeft: 10,
  },

  // Loading Container
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  webLoadingContainer: {
    marginTop: 100,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  webLoadingText: {
    fontSize: 20,
    marginTop: 16,
  },

  // Empty State
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 42,
  },
  webEmptyWrap: {
    marginTop: 100,
    padding: 40,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },

  emptyText: {
    marginTop: 10,
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
  },
  webEmptyText: {
    fontSize: 24,
    marginTop: 20,
    color: "#475569",
  },

  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  webEmptySubText: {
    fontSize: 16,
    marginTop: 12,
  },

  // List Content
  listContent: {
    padding: 12,
    paddingBottom: 120,
  },
  webListContent: {
    padding: 20,
    paddingBottom: 60,
  },

  // User Card
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  webUserCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  userLeft: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  webUserLeft: {
    width: 72,
  },

  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  webUserAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  userBody: {
    flex: 1,
    paddingHorizontal: 12,
  },
  webUserBody: {
    paddingHorizontal: 20,
  },

  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  webUserName: {
    fontSize: 20,
    fontWeight: "800",
  },

  userMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  webUserMetaRow: {
    marginTop: 8,
  },

  userMeta: {
    color: "#64748b",
    fontSize: 13,
    marginLeft: 8,
  },
  webUserMeta: {
    fontSize: 15,
    marginLeft: 12,
  },

  userRight: {
    width: 86,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  webUserRight: {
    width: 120,
  },

  userDateLabel: {
    color: "#64748b",
    fontSize: 12,
  },
  webUserDateLabel: {
    fontSize: 14,
  },

  userDate: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  webUserDate: {
    fontSize: 15,
    marginTop: 6,
  },
});
