// src/screens/ProfileScreen.js
import React, { useEffect, useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "expo-router";
import api from "../../utils/auth"; // <-- ensure this path is correct

/* ---------------- Helpers ---------------- */
const safeText = (v, fallback = "—") =>
  v == null ? fallback : String(v).trim() || fallback;

const formatDOBForDisplay = (value) => {
  if (!value && value !== 0) return "";
  const s = String(value).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  const ymd = s.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return s;
};

/* Normalize different payload shapes (array / object / nested)
   returns an array of user objects (possibly empty)
*/
const getUsersFromPayload = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.user)) return payload.user;
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  if (Array.isArray(payload?.data)) return payload.data;

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

  // fallback: find first array inside payload values
  const arr = Object.values(payload).find((v) => Array.isArray(v));
  if (arr) return arr;
  return [];
};

/* Robust transform mapping (includes misspelled referral keys you shared) */
const transformUserDataFromApi = (u = {}) => {
  if (!u) return {};
  const get = (k) => {
    if (!k) return null;
    if (k.includes(".")) {
      const parts = k.split(".");
      let cur = u;
      for (const p of parts) {
        if (!cur || cur[p] === undefined) return null;
        cur = cur[p];
      }
      return cur;
    }
    return u[k] !== undefined ? u[k] : null;
  };

  const pick = (...keys) => {
    for (const k of keys) {
      const v = get(k);
      if (v !== null && v !== undefined && String(v).trim() !== "") return v;
    }
    return null;
  };

  return {
    id: pick("_id", "id", "userId"),
    fullName:
      pick("name", "fullName", "displayName", "user.name", "data.user.name") ||
      "",
    email: pick("email", "emailAddress", "user.email", "data.user.email") || "",
    phone: pick("phone", "mobile", "user.phone", "data.user.phone") || "",
    dob: pick("DOB", "dob", "dateOfBirth", "user.DOB", "data.user.DOB") || "",
    pan: pick("PAN", "pan", "user.PAN", "data.user.PAN") || "",
    ifsc: pick("IFSC", "ifsc", "user.IFSC", "data.user.IFSC") || "",
    accountNumber:
      pick(
        "accountNumber",
        "account_number",
        "account",
        "user.accountNumber",
        "data.user.accountNumber"
      ) || "",
    bankName:
      pick("bankName", "bank", "user.bankName", "data.user.bankName") || "",
    holderName:
      pick(
        "holderName",
        "holdername",
        "accountHolderName",
        "user.holderName",
        "data.user.holderName"
      ) || "",
    addressLine:
      pick(
        "address",
        "addressLine",
        "locationAddress",
        "user.address",
        "data.user.address"
      ) || "",
    city: pick("city", "locationCity", "user.city", "data.user.city") || "",
    district: pick("district", "state", "region", "user.district") || "",
    pinCode:
      pick(
        "pinCode",
        "pincode",
        "pin",
        "postalCode",
        "user.pinCode",
        "data.user.pinCode"
      ) || "",
    country: pick("country", "user.country", "data.user.country") || "",

    referralCode:
      pick(
        "inviterefferal",
        "invitereferal",
        "inviteReferral",
        "invite_referral",
        "referral",
        "referralCode",
        "data.inviterefferal",
        "data.user.inviterefferal"
      ) || null,

    senderReferral:
      pick(
        "sendrefferal",
        "senderreferral",
        "senderReferral",
        "sender_referral",
        "sendrefferal"
      ) || null,

    referralCount:
      pick(
        "refferalCount",
        "referralCount",
        "referredCount",
        "referrals",
        "data.refferalCount"
      ) ?? null,

    raw: u,
  };
};

/* ---------------- ProfileScreen ---------------- */
export default function ProfileScreen() {
  const {
    user: ctxUser,
    token,
    hydrated,
    loading: ctxLoading,
    refreshProfile,
    logout,
  } = useAuth();
  const router = useRouter();

  const [remoteUser, setRemoteUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFullToken, setShowFullToken] = useState(false);

  // referrals state (fetched from /api/user/refferals)
  const [referralsList, setReferralsList] = useState([]);
  const [referralCodeFromEndpoint, setReferralCodeFromEndpoint] =
    useState(null);

  // pick context user first, else remote fetch result
  const effectiveUser = ctxUser || remoteUser;

  const userData = useMemo(() => {
    if (!effectiveUser) return {};
    const raw =
      effectiveUser.user && typeof effectiveUser.user === "object"
        ? effectiveUser.user
        : effectiveUser;
    return transformUserDataFromApi(raw);
  }, [effectiveUser]);

  // compute referralCount from referralsList (fallback to userData.referralCount)
  const referralCount = useMemo(() => {
    if (Array.isArray(referralsList) && referralsList.length > 0)
      return referralsList.length;
    if (
      userData.referralCount !== null &&
      userData.referralCount !== undefined &&
      String(userData.referralCount).trim() !== ""
    ) {
      // try numeric
      const asNum = Number(userData.referralCount);
      if (!isNaN(asNum)) return asNum;
      // otherwise return raw
      return userData.referralCount;
    }
    return null;
  }, [referralsList, userData.referralCount]);

  // display with IND prefix when we have a count
  const displayReferralCount = useMemo(() => {
    if (referralCount === null || referralCount === undefined) return "—";
    // If you want the prefix "IND " (as you asked earlier), uncomment next line:
    // return `IND ${referralCount}`;
    return `${referralCount}`;
  }, [referralCount]);

  const fetchProfileDirectly = useCallback(
    async (opts = { showErrors: true }) => {
      if (!token) return null;
      setLoading(true);
      try {
        const res = await api.get("/api/user/fetch", {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          timeout: 20000,
        });

        const payload = res?.data ?? null;
        if (!payload) {
          if (opts.showErrors)
            Alert.alert("Error", "Empty response from server.");
          return null;
        }

        // try many shapes: payload.user, payload.data.user, payload.data
        let maybeUser = null;
        if (payload.user && typeof payload.user === "object") {
          maybeUser = payload.user;
        } else if (
          payload.data &&
          payload.data.user &&
          typeof payload.data.user === "object"
        ) {
          maybeUser = payload.data.user;
        } else if (
          payload.data &&
          typeof payload.data === "object" &&
          !Array.isArray(payload.data)
        ) {
          maybeUser = payload.data;
        } else if (
          payload &&
          typeof payload === "object" &&
          (payload._id || payload.email || payload.name)
        ) {
          maybeUser = payload;
        }

        if (maybeUser && typeof maybeUser === "object") {
          setRemoteUser(maybeUser);
          if (__DEV__) console.log("ProfileScreen: fetched user:", maybeUser);
          return maybeUser;
        } else {
          if (opts.showErrors)
            Alert.alert("Error", "Server response didn't include user object.");
          if (__DEV__)
            console.log("ProfileScreen: unexpected payload:", payload);
          return null;
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          Alert.alert("Session expired", "Please login again.");
          try {
            await logout?.();
          } catch {}
          return null;
        }
        if (opts.showErrors) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Failed to fetch profile";
          Alert.alert("Error", msg);
        }
        if (__DEV__) console.warn("fetchProfileDirectly error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, logout]
  );

  // Fetch referrals from referrals endpoint (same logic as ReferScreen)
  const fetchReferrals = useCallback(
    async (opts = { showErrors: false }) => {
      if (!token) return;
      try {
        const res = await api.get("/api/user/refferals", {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          timeout: 20000,
        });
        const payload = res?.data ?? null;
        if (!payload) {
          if (opts.showErrors)
            Alert.alert("Error", "Empty response from server");
          setReferralsList([]);
          setReferralCodeFromEndpoint(null);
          return;
        }

        const users = getUsersFromPayload(payload);
        setReferralsList(users);

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

        setReferralCodeFromEndpoint(code ?? null);
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
        if (__DEV__) console.warn("fetchReferrals error:", err);
      }
    },
    [token, ctxUser]
  );

  // On mount: try context refresh first, otherwise direct fetch. Also fetch referrals.
  useEffect(() => {
    if (!token) return;
    (async () => {
      if (!ctxUser) {
        try {
          const ok = await refreshProfile?.();
          if (!ok) await fetchProfileDirectly({ showErrors: false });
        } catch (e) {
          await fetchProfileDirectly({ showErrors: false });
        }
      } else {
        // if ctxUser exists but may lack referral fields, fetch profile quietly
        const raw =
          ctxUser.user && typeof ctxUser.user === "object"
            ? ctxUser.user
            : ctxUser;
        const hasReferral =
          raw &&
          (raw.inviterefferal ||
            raw.invitereferal ||
            raw.referral ||
            raw.referralCode);
        if (!hasReferral) {
          fetchProfileDirectly({ showErrors: false }).catch(() => {});
        }
      }

      // always attempt to fetch referrals quietly
      fetchReferrals({ showErrors: false }).catch(() => {});
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, ctxUser]);

  const onRefresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const ok = await refreshProfile?.();
      if (!ok) {
        await fetchProfileDirectly({ showErrors: true });
      }
      await fetchReferrals({ showErrors: true });
    } finally {
      setLoading(false);
    }
  }, [token, refreshProfile, fetchProfileDirectly, fetchReferrals]);

  // ---------- IMPORTANT CHANGE ----------
  // Share should use senderReferral first (as requested).
  const onShare = useCallback(async () => {
    // prefer senderReferral first
    const code =
      userData.senderReferral ||
      referralCodeFromEndpoint ||
      userData.referralCode ||
      "—";
    const link = `https://wishkro.app/invite?code=${code}`;
    try {
      await Share.share({
        message: `Join WishKro with my referral code ${code} — ${link}`,
      });
    } catch (err) {
      console.log("Share err:", err);
    }
  }, [
    referralCodeFromEndpoint,
    userData.referralCode,
    userData.senderReferral,
  ]);

  // Copy will mirror share behaviour (copies what share uses).
  const copyReferral = async () => {
    const code =
      userData.senderReferral ||
      referralCodeFromEndpoint ||
      userData.referralCode ||
      null;
    if (!code) {
      Alert.alert("No referral code", "You don't have a referral code yet.");
      return;
    }
    try {
      await Clipboard.setStringAsync(String(code));
      Alert.alert("Copied", "Referral code copied to clipboard.");
    } catch (e) {
      console.log("Clipboard error:", e);
      Alert.alert("Error", "Unable to copy referral code.");
    }
  };

  const handleRevealToken = () => {
    Alert.alert(
      "Reveal full token?",
      "This will display the full token on-screen. Do not show on public devices.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reveal",
          style: "destructive",
          onPress: () => setShowFullToken(true),
        },
      ]
    );
  };
  const handleHideToken = () => setShowFullToken(false);
  const handleCopyToken = async () => {
    if (!token) {
      Alert.alert("No token", "There is no token to copy.");
      return;
    }
    try {
      await Clipboard.setStringAsync(token);
      Alert.alert("Copied", "Token copied to clipboard.");
    } catch (e) {
      console.log("Clipboard error", e);
      Alert.alert("Error", "Unable to copy token.");
    }
  };

  // debug
  useEffect(() => {
    if (__DEV__) {
      console.log("ProfileScreen effectiveUser:", effectiveUser);
      console.log("ProfileScreen normalized userData:", userData);
      console.log("ProfileScreen referralsList length:", referralsList.length);
      console.log(
        "ProfileScreen referralCodeFromEndpoint:",
        referralCodeFromEndpoint
      );
    }
  }, [effectiveUser, userData, referralsList, referralCodeFromEndpoint]);

  /* ---------- Guards ---------- */
  if (!hydrated) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: "#6b7280" }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={[styles.centered, { padding: 24 }]}>
        <Text style={{ fontSize: 16, color: "#6b7280", textAlign: "center" }}>
          You're not signed in. Please log in to view your profile.
        </Text>
      </SafeAreaView>
    );
  }

  if (!effectiveUser && (ctxLoading || loading)) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: "#6b7280" }}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (!effectiveUser && !ctxLoading && !loading) {
    return (
      <SafeAreaView style={[styles.centered, { padding: 24 }]}>
        <Text
          style={{
            fontSize: 16,
            color: "#6b7280",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Failed to load profile data.
        </Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => onRefresh()}>
          <Text style={{ color: "#2f66ff", fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* ---------- Render ---------- */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8fb" }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={ctxLoading || loading}
            onRefresh={onRefresh}
          />
        }
      >
        <View style={styles.headerWrap}>
          <LinearGradient
            colors={["#2f66ff", "#6a9bff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{safeText(userData.fullName)}</Text>
              <Text style={styles.email}>{safeText(userData.email)}</Text>
              <Text style={styles.phone}>{safeText(userData.phone)}</Text>
            </View>

            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.85}
              onPress={() => router.push("components/EditProfilepage")}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.avatarWrap}>
            {userData.raw?.avatar ? (
              <Image
                source={{ uri: userData.raw.avatar }}
                style={styles.avatar}
              />
            ) : (
              <MaterialCommunityIcons
                name="account"
                size={44}
                color="#9ca3af"
              />
            )}
          </View>
        </View>

        {/* PERSONAL */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="person" size={16} color="#6b7280" />
              <Text style={styles.cardTitle}>Personal Info</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            <Row
              label="Full Name"
              icon={<FontAwesome5 name="id-card" size={14} color="#4b5563" />}
              value={userData.fullName}
            />
            <Row
              label="Email"
              icon={<Ionicons name="mail" size={16} color="#4b5563" />}
              value={userData.email}
            />
            <Row
              label="Phone"
              icon={<Ionicons name="call" size={16} color="#4b5563" />}
              value={userData.phone}
            />
            <Row
              label="DOB"
              icon={
                <MaterialCommunityIcons
                  name="calendar"
                  size={16}
                  color="#4b5563"
                />
              }
              value={formatDOBForDisplay(userData.dob)}
            />
            <Row
              label="PAN"
              icon={<FontAwesome5 name="passport" size={14} color="#4b5563" />}
              value={userData.pan}
            />
          </View>
        </View>

        {/* REFERRAL */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <MaterialCommunityIcons
                name="gift-outline"
                size={16}
                color="#6b7280"
              />
              <Text style={styles.cardTitle}>Referral Info</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            <Row
              label="Your Referral"
              icon={<Ionicons name="person-add" size={16} color="#4b5563" />}
              // prefer code from referrals endpoint then user data
              value={
                referralCodeFromEndpoint ||
                userData.referralCode ||
                userData.senderReferral
              }
            />
            <Row
              label="Sender Referral"
              icon={<Ionicons name="people" size={16} color="#4b5563" />}
              value={userData.senderReferral}
            />
            <Row
              label="Referral Count"
              icon={<Ionicons name="stats-chart" size={16} color="#4b5563" />}
              value={displayReferralCount}
            />

            {/* Buttons: copy and share (commented out) */}
            {/* <View style={{ flexDirection: "row", marginTop: 12 }}>
              ...
            </View> */}
          </View>
        </View>

        {/* ADDRESS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <MaterialIcons name="home-work" size={16} color="#6b7280" />
              <Text style={styles.cardTitle}>Address Info</Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            <Row
              label="Pin Code"
              icon={
                <MaterialIcons name="location-pin" size={18} color="#ef4444" />
              }
              value={userData.pinCode}
            />
            <Row
              label="City"
              icon={
                <MaterialIcons name="location-city" size={16} color="#4b5563" />
              }
              value={userData.city}
            />
            <Row
              label="District"
              icon={<Ionicons name="map" size={16} color="#4b5563" />}
              value={userData.district}
            />
            <Row
              label="Country"
              icon={<Ionicons name="flag" size={16} color="#4b5563" />}
              value={userData.country}
            />
            <Row
              label="Address"
              icon={<Ionicons name="home" size={16} color="#4b5563" />}
              value={userData.addressLine}
            />
          </View>
        </View>

        {/* PAYOUT */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <MaterialCommunityIcons
                name="bank-outline"
                size={16}
                color="#6b7280"
              />
              <Text style={styles.cardTitle}>Payout Details</Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            <Row
              label="Bank Account"
              icon={
                <MaterialCommunityIcons
                  name="card-text-outline"
                  size={16}
                  color="#4b5563"
                />
              }
              value={userData.accountNumber}
            />
            <Row
              label="IFSC"
              icon={
                <MaterialCommunityIcons
                  name="numeric"
                  size={16}
                  color="#4b5563"
                />
              }
              value={userData.ifsc}
            />
            <Row
              label="Bank Name"
              icon={
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={16}
                  color="#4b5563"
                />
              }
              value={userData.bankName}
            />
            <Row
              label="Holder Name"
              icon={
                <MaterialCommunityIcons
                  name="account-outline"
                  size={16}
                  color="#4b5563"
                />
              }
              value={userData.holderName}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.shareBtn}
          activeOpacity={0.9}
          onPress={onShare}
        >
          <Ionicons name="share-social" size={18} color="#fff" />
          <Text style={styles.shareText}>Share Referral Link</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* small Row component used throughout */
const Row = ({ icon, label, value }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      {icon}
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View style={styles.rowRight}>
      <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="tail">
        {safeText(value)}
      </Text>
    </View>
  </View>
);

const CARD_BG = "#ffffff";
const BORDER = "rgba(0,0,0,0.08)";

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerWrap: { marginBottom: 54 },
  headerCard: {
    minHeight: 130,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  editBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.6)",
  },
  editText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  name: { color: "#fff", fontSize: 20, fontWeight: "800", width: "100%" },
  email: { color: "rgba(255,255,255,0.9)", marginTop: 4, width: "100%" },
  phone: {
    color: "rgba(255,255,255,0.95)",
    marginTop: 2,
    letterSpacing: 0.3,
    width: "100%",
  },
  avatarWrap: {
    position: "absolute",
    left: 24,
    bottom: -28,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: "#fff",
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 44,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    color: "#374151",
    fontSize: 14,
    flexShrink: 0,
    minWidth: 80,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  rowValue: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "right",
    flex: 1,
  },
  shareBtn: {
    marginTop: 6,
    alignSelf: "center",
    backgroundColor: "#2f66ff",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  shareText: { color: "#fff", fontWeight: "700" },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2f66ff",
    borderRadius: 8,
  },
});
