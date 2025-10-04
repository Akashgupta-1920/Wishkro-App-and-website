import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";

const WHITE = "#ffffff";
const BORDER = "rgba(255,255,255,0.4)";
const INPUT_BG = "rgba(255,255,255,0.15)";
const LOGIN_URL = "https://api.wishkro.com/api/user/login";

/** ---- Network connectivity test ---- */
const testNetworkConnectivity = async () => {
  try {
    console.log("🌐 Testing network connectivity...");

    // Test 1: Basic internet connectivity
    const googleTest = await fetch("https://www.google.com", {
      method: "HEAD",
      timeout: 5000,
    });
    console.log("✅ Internet connectivity: OK");

    // Test 2: API server reachability
    console.log("🔍 Testing API server reachability...");
    const apiTest = await fetch(LOGIN_URL, {
      method: "OPTIONS", // Preflight request
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
    console.log("✅ API server reachable:", apiTest.status);

    return true;
  } catch (error) {
    console.log("❌ Network test failed:", {
      name: error.name,
      message: error.message,
      cause: error.cause,
    });
    return false;
  }
};

/** ---- Helpers to normalize API response ---- */
const extractToken = (d) => {
  let t =
    d?.token ??
    d?.access_token ??
    d?.data?.token ??
    d?.data?.access_token ??
    null;

  if (t == null) return "";
  t = String(t);
  // strip quotes + any Bearer prefix
  t = t
    .replace(/^"+|"+$/g, "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  return t;
};

const extractUser = (d) => {
  const u =
    d?.user ??
    d?.data?.user ??
    (typeof d?.data === "object" && !Array.isArray(d?.data) ? d.data : null) ??
    (typeof d === "object" && d?.email ? d : null);
  return u && typeof u === "object" ? u : null;
};

const preview = (tok) =>
  tok?.length > 16
    ? `${tok.slice(0, 8)}…${tok.slice(-8)} (len ${tok.length})`
    : `${tok} (len ${tok?.length || 0})`;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const makeLoginRequest = async (credentials) => {
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("⏰ Request timeout - aborting");
      controller.abort();
    }, 30000); // 30 second timeout

    try {
      console.log("📤 Making login request...");
      console.log("📝 Request details:", {
        url: LOGIN_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        bodyPreview: {
          email: credentials.email,
          password: "[HIDDEN]",
        },
      });

      const response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Add additional headers that might help
          "User-Agent": "WishKroApp/1.0",
        },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Enhance error information
      console.log("🚨 Fetch error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack?.split("\n").slice(0, 3),
        cause: error.cause,
        code: error.code,
      });

      throw error;
    }
  };

  const handleSignIn = async () => {
    if (!email?.trim()) return Alert.alert("Error", "Email is required");
    if (!password?.trim()) return Alert.alert("Error", "Password is required");

    try {
      setLoading(true);

      // Test network connectivity first
      const isConnected = await testNetworkConnectivity();
      if (!isConnected) {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again."
        );
        return;
      }

      console.log("🔐 LOGIN START ->", LOGIN_URL);

      const res = await makeLoginRequest({
        email: email.trim(),
        password: password,
      });

      const status = res.status;
      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();

      console.log("📡 LOGIN RESPONSE:", {
        status,
        statusText: res.statusText,
        ok: res.ok,
        contentType,
        hasBody: !!raw,
        bodyLength: raw.length,
        bodyPreview: raw.slice(0, 400),
        headers: {
          server: res.headers.get("server"),
          date: res.headers.get("date"),
          connection: res.headers.get("connection"),
        },
      });

      let data = null;
      try {
        data = contentType.includes("application/json")
          ? JSON.parse(raw)
          : null;
        console.log("📋 PARSED DATA:", {
          hasData: !!data,
          success: data?.success,
          hasToken: !!(
            data?.token ||
            data?.access_token ||
            data?.data?.token ||
            data?.data?.access_token
          ),
          hasUser: !!(data?.user || data?.data?.user || data?.data),
          dataKeys: data ? Object.keys(data) : [],
          message: data?.message,
          // Don't log full structure in production
        });
      } catch (e) {
        console.warn("⚠️ JSON parse failed:", e?.message);
        console.log("📄 Raw response (first 200 chars):", raw.slice(0, 200));
      }

      // Handle different response scenarios
      if (!res.ok) {
        const errorMsg = data?.message || `HTTP ${status}: ${res.statusText}`;
        console.log("❌ HTTP ERROR:", {
          status,
          statusText: res.statusText,
          errorMsg,
          responseBody: raw.slice(0, 500),
        });

        Alert.alert(
          "Login Failed",
          status === 401 ? "Invalid email or password" : errorMsg
        );
        return;
      }

      if (!data?.success) {
        const errorMsg = data?.message || "Login failed";
        console.log("❌ API ERROR:", errorMsg);
        Alert.alert("Sign in failed", errorMsg);
        return;
      }

      const token = extractToken(data);
      const nextUser = extractUser(data);

      console.log("🔍 EXTRACTION RESULTS:", {
        tokenFound: !!token,
        tokenPreview: preview(token),
        userFound: !!nextUser,
        userKeys: nextUser ? Object.keys(nextUser) : null,
      });

      if (!token) {
        console.log("⚠️ No token found in successful response");
        console.log("🔍 Full data structure:", JSON.stringify(data, null, 2));
        Alert.alert(
          "Login succeeded",
          "But no authentication token was returned."
        );
        return;
      }

      console.log("💾 STORING AUTH DATA...");
      await login({ token, user: nextUser });
      console.log("✅ AUTH DATA STORED SUCCESSFULLY");

      // Verify storage (debug only)
      const storedToken = await AsyncStorage.getItem("authToken");
      const storedUser = await AsyncStorage.getItem("authUser");
      console.log("🔍 VERIFICATION:", {
        tokenStored: !!storedToken,
        userStored: !!storedUser,
        tokenMatches: storedToken === token,
      });

      console.log("🏠 NAVIGATING TO HOME...");
      router.replace("/(tabs)/home");
    } catch (err) {
      console.error("❌ LOGIN ERROR:", {
        name: err.name,
        message: err.message,
        stack: err.stack?.split("\n").slice(0, 5),
      });

      let userMessage = "Please try again.";

      if (err.name === "AbortError") {
        userMessage =
          "Request timed out. Please check your connection and try again.";
      } else if (err.message.includes("Network request failed")) {
        userMessage = "Network error. Please check your internet connection.";
      } else if (
        err.message.includes("ENOTFOUND") ||
        err.message.includes("ECONNREFUSED")
      ) {
        userMessage = "Unable to reach the server. Please try again later.";
      }

      Alert.alert("Connection Error", userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#8e2de2", "#ff0080", "#ff5f6d", "#ff7f50", "#ffb347"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
        >
          <Text style={styles.heading}>Sign In</Text>
          <Text style={styles.subheading}>
            Enter your email and password to sign in
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="rgba(255,255,255,0.7)"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.7)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            activeOpacity={0.9}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <ActivityIndicator color={WHITE} />
                <Text style={[styles.primaryText, { fontSize: 15 }]}>
                  Signing in...
                </Text>
              </View>
            ) : (
              <Text style={styles.primaryText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/auth/forgetpassword")}
            disabled={loading}
          >
            <Text style={[styles.linkMuted, loading && { opacity: 0.5 }]}>
              Forgot your password?
            </Text>
          </TouchableOpacity>

          <Text style={styles.metaRow}>
            <Text style={styles.muted}>Don't have an account? </Text>
            <Text
              style={[styles.link, loading && { opacity: 0.5 }]}
              onPress={() => !loading && router.push("/auth/SignupPage")}
            >
              Sign Up
            </Text>
          </Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, justifyContent: "center" },
  kav: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  heading: {
    fontSize: 32,
    fontWeight: "800",
    color: WHITE,
    marginBottom: 6,
    textAlign: "center",
  },
  subheading: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 20,
    textAlign: "center",
  },
  field: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: "700", color: WHITE, marginBottom: 8 },
  input: {
    width: "100%",
    height: 52,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: INPUT_BG,
    color: WHITE,
    fontSize: 16,
  },
  primaryBtn: {
    width: "100%",
    height: 54,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: WHITE,
  },
  primaryText: { color: WHITE, fontSize: 17, fontWeight: "800" },
  linkMuted: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 10,
    textAlign: "center",
  },
  metaRow: { alignSelf: "center", marginTop: 4 },
  muted: { color: "rgba(255,255,255,0.8)", fontSize: 15 },
  link: { color: WHITE, fontWeight: "800", fontSize: 15 },
});
