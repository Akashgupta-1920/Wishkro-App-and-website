// src/screens/ReferScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import Header from "../../components/Header";
import { useAuth } from "../../../context/AuthContext";
import api from "../../utils/auth";
import * as Clipboard from "expo-clipboard";

/** ----- Config ----- **/
const USERS_FOR_PREMIUM = 1000;

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
    // data may be single user or object containing user array, so check for user-like keys
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
  const { token, user: ctxUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [referralCode, setReferralCode] = useState(null);

  const totalReferred = referrals.length;
  const usersLeftToPremium = Math.max(0, USERS_FOR_PREMIUM - totalReferred);

  const fetchReferrals = useCallback(
    async (opts = { showErrors: true }) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await api.get("/api/user/refferals", {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          timeout: 20000,
        });
        const payload = res?.data ?? null;
        if (!payload) {
          if (opts.showErrors)
            Alert.alert("Error", "Empty response from server");
          setReferrals([]);
          return;
        }

        const users = getUsersFromPayload(payload);
        setReferrals(users);

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
        setReferralCode(code);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          Alert.alert("Session expired", "Please log in again.");
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
    [token, ctxUser]
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
    const link = `https://wishkro.app/invite?code=${code}`;
    try {
      await Share.share({
        message: `Join WishKro with my referral code ${code} — ${link}`,
      });
    } catch (e) {
      console.log("share error", e);
    }
  }, [referralCode]);

  const renderItem = ({ item }) => {
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
      <View style={styles.userCard}>
        <View style={styles.userLeft}>
          <View style={styles.userAvatar}>
            <MaterialCommunityIcons name="account" size={20} color="#6C63FF" />
          </View>
        </View>

        <View style={styles.userBody}>
          <Text style={styles.userName}>{name}</Text>

          <View style={styles.userMetaRow}>
            <Ionicons name="mail-outline" size={14} color="#9CA3AF" />
            <Text style={styles.userMeta}>{email}</Text>
          </View>

          <View style={styles.userMetaRow}>
            <Ionicons name="call-outline" size={14} color="#9CA3AF" />
            <Text style={styles.userMeta}>{phone}</Text>
          </View>
        </View>

        <View style={styles.userRight}>
          <Text style={styles.userDateLabel}>Joined</Text>
          <Text style={styles.userDate}>{joined}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ marginTop: 35 }}>
        <Header />
      </View>

      <View style={{ height: 16 }} />

      <LinearGradient
        colors={["#6C35FF", "#9A2BFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.progressCard}
      >
        <View style={styles.progressLeft}>
          <MaterialCommunityIcons
            name="diamond-outline"
            size={34}
            color="#ffd84d"
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.progressTitle}>Premium Progress</Text>
            <Text style={styles.progressSub}>
              Only {usersLeftToPremium} users left to reach{"\n"}Premium
            </Text>
          </View>
        </View>

        <View style={styles.progressRight}>
          <Text style={styles.rightLabel}>Total{"\n"}Referred</Text>
          <Text style={styles.rightCount}>{totalReferred}</Text>
        </View>
      </LinearGradient>

      {/* <View style={styles.referralRow}>
        <View>
          <Text style={styles.refLabel}>Your Referral Code</Text>
          <Text style={styles.refCode}>{referralCode || "—"}</Text>
        </View>

        <View style={styles.refActions}>
          <TouchableOpacity style={styles.actionBtnWhite} onPress={copyCode}>
            <Ionicons name="copy" size={18} color="#2563eb" />
            <Text style={styles.actionTextBlue}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={shareReferral}>
            <Ionicons name="share-social" size={18} color="#fff" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View> */}

      <View style={{ height: 12 }} />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} size="large" />
      ) : referrals.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            No referrals yet. Start inviting!
          </Text>
        </View>
      ) : (
        <FlatList
          data={referrals}
          keyExtractor={(it, idx) => String(it._id || it.id || idx)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      <View style={{ height: 110 }} />
    </SafeAreaView>
  );
}

/** ----- Styles ----- **/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", padding: 12 },

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
  progressLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  progressTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  progressSub: {
    color: "rgba(255,255,255,0.95)",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },

  progressRight: { alignItems: "flex-end", minWidth: 80 },
  rightLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    textAlign: "right",
  },
  rightCount: { color: "#fff", fontSize: 30, fontWeight: "900", marginTop: 6 },

  referralRow: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eef2ff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refLabel: { color: "#6B7280", fontSize: 13 },
  refCode: { fontSize: 20, fontWeight: "800", marginTop: 6 },

  refActions: { flexDirection: "row", alignItems: "center" },
  actionBtn: {
    backgroundColor: "#2f66ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  actionText: { color: "#fff", marginLeft: 8, fontWeight: "700" },

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
  actionTextBlue: { color: "#2563eb", marginLeft: 8, fontWeight: "700" },

  emptyWrap: { alignItems: "center", justifyContent: "center", marginTop: 42 },
  emptyText: {
    marginTop: 10,
    fontSize: 18,
    color: "#6B7280",
    textAlign: "center",
  },

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
  userLeft: { width: 52, alignItems: "center", justifyContent: "center" },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  userBody: { flex: 1, paddingHorizontal: 12 },
  userName: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  userMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  userMeta: { color: "#64748b", fontSize: 13, marginLeft: 8 },

  userRight: { width: 86, alignItems: "flex-end", justifyContent: "center" },
  userDateLabel: { color: "#64748b", fontSize: 12 },
  userDate: { color: "#374151", fontSize: 13, fontWeight: "700", marginTop: 4 },
});
