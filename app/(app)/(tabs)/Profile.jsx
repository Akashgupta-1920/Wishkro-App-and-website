import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";
import api from "../../utils/auth";

const isWeb = Platform.OS === "web";
const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = screenWidth >= 1024;

/* ---------------- support contacts (as requested) ---------------- */
const SUPPORT_EMAIL = "support@wishkro.com";
const B2B_EMAIL = "b2b@wishkro.com";
const JOIN_EMAIL = "join@wishkro.com";
const WHATSAPP_NUMBER = "9990876324";

/* ---------------- helpers ---------------- */
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

  const arr = Object.values(payload).find((v) => Array.isArray(v));
  if (arr) return arr;
  return [];
};

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

  const [referralsList, setReferralsList] = useState([]);
  const [referralCodeFromEndpoint, setReferralCodeFromEndpoint] =
    useState(null);

  const effectiveUser = ctxUser || remoteUser;

  const userData = useMemo(() => {
    if (!effectiveUser) return {};
    const raw =
      effectiveUser.user && typeof effectiveUser.user === "object"
        ? effectiveUser.user
        : effectiveUser;
    return transformUserDataFromApi(raw);
  }, [effectiveUser]);

  const referralCount = useMemo(() => {
    if (Array.isArray(referralsList) && referralsList.length > 0)
      return referralsList.length;
    if (
      userData.referralCount !== null &&
      userData.referralCount !== undefined &&
      String(userData.referralCount).trim() !== ""
    ) {
      const asNum = Number(userData.referralCount);
      if (!isNaN(asNum)) return asNum;
      return userData.referralCount;
    }
    return null;
  }, [referralsList, userData.referralCount]);

  const displayReferralCount = useMemo(() => {
    if (referralCount === null || referralCount === undefined) return "—";
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

      fetchReferrals({ showErrors: false }).catch(() => {});
    })();
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

  const onShare = useCallback(async () => {
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

  // ---------- NAV: Go to Edit (passes params) ----------
  const goToEdit = async () => {
    try {
      await refreshProfile?.();
    } catch (e) {
      /* ignore */
    }

    const parts = String(userData.fullName || "")
      .split(" ")
      .filter(Boolean);
    const first = parts.slice(0, -1).join(" ") || parts[0] || "";
    const last = parts.length > 1 ? parts.slice(-1)[0] : "";

    const params = {
      firstName: String(first || ""),
      lastName: String(last || ""),
      email: String(userData.email || ""),
      phone: String(userData.phone || ""),
      dob: String(userData.dob || ""),
      pan: String(userData.pan || ""),
      addressLine: String(userData.addressLine || ""),
      city: String(userData.city || ""),
      district: String(userData.district || ""),
      pinCode: String(userData.pinCode || ""),
      country: String(userData.country || ""),
      accountNumber: String(userData.accountNumber || ""),
      ifsc: String(userData.ifsc || ""),
      bankName: String(userData.bankName || ""),
      holderName: String(userData.holderName || ""),
    };

    try {
      router.push({
        pathname: "components/EditProfilepage",
        params,
      });
    } catch (e) {
      router.push("components/EditProfilepage");
    }
  };

  /* ---------- Guards ---------- */
  if (!hydrated) {
    return (
      <SafeAreaView style={[styles.centered, isWeb && styles.webCentered]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, isWeb && styles.webLoadingText]}>
          Loading...
        </Text>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={[styles.centered, isWeb && styles.webCentered]}>
        <Text style={[styles.noAuthText, isWeb && styles.webNoAuthText]}>
          You're not signed in. Please log in to view your profile.
        </Text>
      </SafeAreaView>
    );
  }

  if (!effectiveUser && (ctxLoading || loading)) {
    return (
      <SafeAreaView style={[styles.centered, isWeb && styles.webCentered]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, isWeb && styles.webLoadingText]}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (!effectiveUser && !ctxLoading && !loading) {
    return (
      <SafeAreaView style={[styles.centered, isWeb && styles.webCentered]}>
        <Text style={[styles.errorText, isWeb && styles.webErrorText]}>
          Failed to load profile data.
        </Text>
        <TouchableOpacity
          style={[styles.retryBtn, isWeb && styles.webRetryBtn]}
          onPress={() => onRefresh()}
        >
          <Text style={[styles.retryText, isWeb && styles.webRetryText]}>
            Retry
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* ---------- Render ---------- */
  return (
    <SafeAreaView style={[styles.container, isWeb && styles.webContainer]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && styles.webScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={ctxLoading || loading}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Header Section */}
        <View style={[styles.headerWrap, isWeb && styles.webHeaderWrap]}>
          <LinearGradient
            colors={["#2f66ff", "#6a9bff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerCard, isWeb && styles.webHeaderCard]}
          >
            <View
              style={[styles.headerContent, isWeb && styles.webHeaderContent]}
            >
              <Text style={[styles.name, isWeb && styles.webName]}>
                {safeText(userData.fullName)}
              </Text>
              <Text style={[styles.email, isWeb && styles.webEmail]}>
                {safeText(userData.email)}
              </Text>
              <Text style={[styles.phone, isWeb && styles.webPhone]}>
                {safeText(userData.phone)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.editBtn, isWeb && styles.webEditBtn]}
              activeOpacity={0.85}
              onPress={goToEdit}
            >
              <Ionicons name="pencil" size={isWeb ? 20 : 16} color="#fff" />
              <Text style={[styles.editText, isWeb && styles.webEditText]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={[styles.avatarWrap, isWeb && styles.webAvatarWrap]}>
            {userData.raw?.avatar ? (
              <Image
                source={{ uri: userData.raw.avatar }}
                style={[styles.avatar, isWeb && styles.webAvatar]}
              />
            ) : (
              <MaterialCommunityIcons
                name="account"
                size={isWeb ? 60 : 44}
                color="#9ca3af"
              />
            )}
          </View>
        </View>

        {/* PERSONAL INFO CARD - Single Column for both mobile and web */}
        <View style={[styles.card, isWeb && styles.webCard]}>
          <View style={[styles.cardHeader, isWeb && styles.webCardHeader]}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="person" size={isWeb ? 20 : 16} color="#6b7280" />
              <Text style={[styles.cardTitle, isWeb && styles.webCardTitle]}>
                Personal Info
              </Text>
            </View>
          </View>

          <View style={[styles.cardBody, isWeb && styles.webCardBody]}>
            <Row
              label="Full Name"
              icon={
                <FontAwesome5
                  name="id-card"
                  size={isWeb ? 16 : 14}
                  color="#4b5563"
                />
              }
              value={userData.fullName}
              isWeb={isWeb}
            />
            <Row
              label="Email"
              icon={
                <Ionicons name="mail" size={isWeb ? 18 : 16} color="#4b5563" />
              }
              value={userData.email}
              isWeb={isWeb}
            />
            <Row
              label="Phone"
              icon={
                <Ionicons name="call" size={isWeb ? 18 : 16} color="#4b5563" />
              }
              value={userData.phone}
              isWeb={isWeb}
            />
            <Row
              label="DOB"
              icon={
                <MaterialCommunityIcons
                  name="calendar"
                  size={isWeb ? 18 : 16}
                  color="#4b5563"
                />
              }
              value={formatDOBForDisplay(userData.dob)}
              isWeb={isWeb}
            />
            <Row
              label="PAN"
              icon={
                <FontAwesome5
                  name="passport"
                  size={isWeb ? 16 : 14}
                  color="#4b5563"
                />
              }
              value={userData.pan}
              isWeb={isWeb}
            />
          </View>
        </View>

        {/* REFERRAL INFO CARD - Single Column for both mobile and web */}
        <View style={[styles.card, isWeb && styles.webCard]}>
          <View style={[styles.cardHeader, isWeb && styles.webCardHeader]}>
            <View style={styles.cardHeaderLeft}>
              <MaterialCommunityIcons
                name="gift-outline"
                size={isWeb ? 20 : 16}
                color="#6b7280"
              />
              <Text style={[styles.cardTitle, isWeb && styles.webCardTitle]}>
                Referral Info
              </Text>
            </View>
          </View>

          <View style={[styles.cardBody, isWeb && styles.webCardBody]}>
            <Row
              label="Your Referral"
              icon={
                <Ionicons
                  name="person-add"
                  size={isWeb ? 18 : 16}
                  color="#4b5563"
                />
              }
              value={
                referralCodeFromEndpoint
                  ? `IND${referralCodeFromEndpoint}`
                  : userData?.referralCode
                  ? `IND${userData.referralCode}`
                  : userData?.senderReferral
                  ? `IND${userData.senderReferral}`
                  : "—"
              }
              isWeb={isWeb}
            />

            <Row
              label="Sender Referral"
              icon={
                <Ionicons
                  name="people"
                  size={isWeb ? 18 : 16}
                  color="#4b5563"
                />
              }
              value={
                userData?.senderReferral ? `IND${userData.senderReferral}` : "—"
              }
              isWeb={isWeb}
            />

            <Row
              label="Referral Count"
              icon={
                <Ionicons
                  name="stats-chart"
                  size={isWeb ? 18 : 16}
                  color="#4b5563"
                />
              }
              value={displayReferralCount}
              isWeb={isWeb}
            />
          </View>
        </View>

        {/* ADDRESS INFO CARD - Single Column for both mobile and web */}
        <View style={[styles.card, isWeb && styles.webCard]}>
          <View style={[styles.cardHeader, isWeb && styles.webCardHeader]}>
            <View style={styles.cardHeaderLeft}>
              <MaterialIcons
                name="home-work"
                size={isWeb ? 20 : 16}
                color="#6b7280"
              />
              <Text style={[styles.cardTitle, isWeb && styles.webCardTitle]}>
                Address Info
              </Text>
            </View>
          </View>
          <View style={[styles.cardBody, isWeb && styles.webCardBody]}>
            <Row
              label="Pin Code"
              icon={
                <MaterialIcons
                  name="location-pin"
                  size={isWeb ? 20 : 18}
                  color="#ef4444"
                />
              }
              value={userData.pinCode}
              isWeb={isWeb}
            />
            <Row
              label="City"
              icon={
                <MaterialIcons
                  name="location-city"
                  size={isWeb ? 18 : 16}
                  color="#4b5563"
                />
              }
              value={userData.city}
              isWeb={isWeb}
            />
            <Row
              label="District"
              icon={
                <Ionicons name="map" size={isWeb ? 18 : 16} color="#4b5563" />
              }
              value={userData.district}
              isWeb={isWeb}
            />
            <Row
              label="Country"
              icon={
                <Ionicons name="flag" size={isWeb ? 18 : 16} color="#4b5563" />
              }
              value={userData.country}
              isWeb={isWeb}
            />
            <Row
              label="Address"
              icon={
                <Ionicons name="home" size={isWeb ? 18 : 16} color="#4b5563" />
              }
              value={userData.addressLine}
              isWeb={isWeb}
            />
          </View>
        </View>

        {/* PAYOUT DETAILS CARD - Single Column for both mobile and web */}
        <View style={[styles.card, isWeb && styles.webCard]}>
          <View style={[styles.cardHeader, isWeb && styles.webCardHeader]}>
            <View style={styles.cardHeaderLeft}>
              <MaterialCommunityIcons
                name="bank-outline"
                size={isWeb ? 20 : 16}
                color="#6b7280"
              />
              <Text style={[styles.cardTitle, isWeb && styles.webCardTitle]}>
                Payout Details
              </Text>
            </View>
          </View>
          <View style={[styles.cardBody, isWeb && styles.webCardBody]}>
            <Row
              label="Bank Account"
              icon={
                <MaterialCommunityIcons
                  name="card-text-outline"
                  size={isWeb ? 18 : 16}
                  color="#4b5563"
                />
              }
              value={userData.accountNumber}
              isWeb={isWeb}
            />
            <Row
              label="IFSC"
              icon={
                <MaterialCommunityIcons
                  name="numeric"
                  size={isWeb ? 18 : 16}
                  color="#4b5563"
                />
              }
              value={userData.ifsc}
              isWeb={isWeb}
            />
            <Row
              label="Bank Name"
              icon={
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={isWeb ? 18 : 16}
                  color="#4b5563"
                />
              }
              value={userData.bankName}
              isWeb={isWeb}
            />
            <Row
              label="Holder Name"
              icon={
                <MaterialCommunityIcons
                  name="account-outline"
                  size={isWeb ? 18 : 16}
                  color="#4b5563"
                />
              }
              value={userData.holderName}
              isWeb={isWeb}
            />
          </View>
        </View>

        {/* Share Button */}
        <TouchableOpacity
          style={[styles.shareBtn, isWeb && styles.webShareBtn]}
          activeOpacity={0.9}
          onPress={onShare}
        >
          <Ionicons name="share-social" size={isWeb ? 22 : 18} color="#fff" />
          <Text style={[styles.shareText, isWeb && styles.webShareText]}>
            Share Referral Link
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* Row Component with Web Support */
const Row = ({ icon, label, value, isWeb }) => (
  <View style={[styles.row, isWeb && styles.webRow]}>
    <View style={[styles.rowLeft, isWeb && styles.webRowLeft]}>
      {icon}
      <Text style={[styles.rowLabel, isWeb && styles.webRowLabel]}>
        {label}
      </Text>
    </View>
    <View style={[styles.rowRight, isWeb && styles.webRowRight]}>
      <Text
        style={[styles.rowValue, isWeb && styles.webRowValue]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {safeText(value)}
      </Text>
    </View>
  </View>
);

const CARD_BG = "#ffffff";
const BORDER = "rgba(0,0,0,0.08)";

const styles = StyleSheet.create({
  // Centered Loading/Error States
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f8fb",
  },
  webCentered: {
    minHeight: "100vh",
    paddingTop: 100,
  },

  loadingText: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 16,
  },
  webLoadingText: {
    fontSize: 18,
    marginTop: 20,
  },

  noAuthText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    padding: 20,
  },
  webNoAuthText: {
    fontSize: 20,
    maxWidth: 500,
    lineHeight: 28,
  },

  errorText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },
  webErrorText: {
    fontSize: 20,
    marginBottom: 30,
  },

  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2f66ff",
    borderRadius: 8,
  },
  webRetryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },

  retryText: {
    color: "#2f66ff",
    fontWeight: "600",
  },
  webRetryText: {
    fontSize: 16,
    fontWeight: "700",
  },

  // Main Container
  container: {
    flex: 1,
    backgroundColor: "#f7f8fb",
  },
  webContainer: {
    maxWidth: isLargeScreen ? 1200 : "100%",
    alignSelf: "center",
    width: "100%",
  },

  // Scroll Content
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  webScrollContent: {
    padding: isLargeScreen ? 40 : 24,
    paddingBottom: 160,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },

  // Header Section
  headerWrap: {
    marginBottom: 54,
  },
  webHeaderWrap: {
    marginBottom: 70,
  },

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
  webHeaderCard: {
    minHeight: 150,
    borderRadius: 20,
    padding: 24,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },

  headerContent: {
    flex: 1,
  },
  webHeaderContent: {
    marginBottom: 8,
  },

  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    width: "100%",
  },
  webName: {
    fontSize: 28,
    fontWeight: "900",
  },

  email: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
    width: "100%",
    fontSize: 14,
  },
  webEmail: {
    fontSize: 16,
    marginTop: 6,
  },

  phone: {
    color: "rgba(255,255,255,0.95)",
    marginTop: 2,
    letterSpacing: 0.3,
    width: "100%",
    fontSize: 14,
  },
  webPhone: {
    fontSize: 16,
    marginTop: 4,
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
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  webEditBtn: {
    right: 20,
    top: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  editText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  webEditText: {
    fontSize: 14,
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
  webAvatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    bottom: -35,
    left: 40,
    borderWidth: 4,
    borderColor: "#fff",
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  webAvatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },

  // Card Styles - Single Column for both
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: "hidden",
    width: "100%",
  },
  webCard: {
    marginBottom: 24,
    borderRadius: 16,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  cardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: "#fff",
  },
  webCardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  webCardTitle: {
    fontSize: 18,
  },

  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  webCardBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Row Styles
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
  webRow: {
    paddingVertical: 12,
    minHeight: 48,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  webRowLeft: {
    gap: 10,
  },

  rowLabel: {
    color: "#374151",
    fontSize: 14,
    flexShrink: 0,
    minWidth: 80,
  },
  webRowLabel: {
    fontSize: 15,
    minWidth: 120,
    fontWeight: "600",
  },

  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  webRowRight: {
    flex: 1.5,
  },

  rowValue: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "right",
    flex: 1,
  },
  webRowValue: {
    fontSize: 15,
    fontWeight: "500",
  },

  // Share Button
  shareBtn: {
    marginTop: 16,
    marginBottom: 30,
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
  webShareBtn: {
    marginTop: 30,
    marginBottom: 60,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },

  shareText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  webShareText: {
    fontSize: 18,
  },
});
