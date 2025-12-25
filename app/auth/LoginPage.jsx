import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isTablet = width >= 768;
const isLargeScreen = width >= 1024;

// Colors
const WHITE = "#ffffff";
const BORDER = "rgba(255,255,255,0.4)";
const INPUT_BG = "rgba(255,255,255,0.15)";
const LOGIN_URL = "https://api.wishkro.com/api/user/login";

// Web-compatible storage
const getStorage = () => {
  if (isWeb) {
    return {
      getItem: async (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error("Web storage get error:", error);
          return null;
        }
      },
      setItem: async (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error("Web storage set error:", error);
        }
      },
      removeItem: async (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error("Web storage remove error:", error);
        }
      },
      clear: async () => {
        try {
          localStorage.clear();
        } catch (error) {
          console.error("Web storage clear error:", error);
        }
      },
    };
  }
  return AsyncStorage;
};

const storage = getStorage();

// Responsive font size
const responsiveFontSize = (mobileSize, webSize) => {
  if (isWeb) {
    return isLargeScreen ? webSize * 1.2 : webSize;
  }
  return mobileSize;
};

// Responsive spacing
const responsiveSpacing = (mobileSpacing, webSpacing) => {
  if (isWeb) {
    return isLargeScreen ? webSpacing * 1.2 : webSpacing;
  }
  return mobileSpacing;
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenWidth, setScreenWidth] = useState(width);
  const { login } = useAuth();

  // Handle window resize on web
  useEffect(() => {
    if (isWeb) {
      const updateDimensions = () => {
        setScreenWidth(window.innerWidth);
      };

      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, []);

  // Calculate responsive values
  const containerWidth = isWeb
    ? Math.min(screenWidth * (isLargeScreen ? 0.4 : 0.8), 500)
    : "100%";

  const containerPadding = isWeb ? responsiveSpacing(30, 40) : 20;

  const makeLoginRequest = async (credentials) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("⏰ Request timeout - aborting");
      controller.abort();
    }, 30000);

    try {
      console.log("📤 Making login request...");

      // Do NOT set User-Agent or manual Origin headers on web — browsers forbid / ignore these.
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      const fetchOptions = {
        method: "POST",
        headers: headers,
        body: JSON.stringify(credentials),
        signal: controller.signal,
      };

      // Explicitly set CORS mode on web (server must allow CORS)
      if (isWeb) {
        fetchOptions.mode = "cors";
        // DO NOT set credentials unless your server uses cookies for auth and is configured for credentials.
        // fetchOptions.credentials = 'include'; // uncomment only if server expects cookies and Access-Control-Allow-Credentials is enabled
      }

      const response = await fetch(LOGIN_URL, fetchOptions);

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      // Make error logging robust
      console.log("🚨 Fetch error details:", {
        name: error?.name,
        message: error?.message,
      });
      throw error;
    }
  };

  const handleSignIn = async () => {
    if (!email?.trim()) return Alert.alert("Error", "Email is required");
    if (!password?.trim()) return Alert.alert("Error", "Password is required");

    try {
      setLoading(true);
      console.log("🔐 LOGIN START ->", LOGIN_URL);

      const res = await makeLoginRequest({
        email: email.trim(),
        password: password,
      });

      const status = res.status;
      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();

      let data = null;
      try {
        data = contentType.includes("application/json")
          ? JSON.parse(raw)
          : null;
      } catch (e) {
        console.warn("⚠️ JSON parse failed:", e?.message);
      }

      if (!res.ok) {
        const errorMsg = data?.message || `HTTP ${status}: ${res.statusText}`;
        Alert.alert(
          "Login Failed",
          status === 401 ? "Invalid email or password" : errorMsg
        );
        return;
      }

      if (!data?.success) {
        const errorMsg = data?.message || "Login failed";
        Alert.alert("Sign in failed", errorMsg);
        return;
      }

      const token =
        data?.token || data?.access_token || data?.data?.token || "";
      const nextUser = data?.user || data?.data?.user || data?.data || null;

      if (!token) {
        Alert.alert(
          "Login succeeded",
          "But no authentication token was returned."
        );
        return;
      }

      try {
        await storage.setItem("authToken", token);
        if (nextUser) {
          await storage.setItem("authUser", JSON.stringify(nextUser));
        }

        if (login) {
          await login({ token, user: nextUser });
        }
      } catch (storageError) {
        console.error("❌ Storage error:", storageError);
        Alert.alert(
          "Storage Error",
          "Failed to save login data. Please try again."
        );
        return;
      }

      // Navigate based on platform
      if (isWeb) {
        router.replace("/home");
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (err) {
      console.error("❌ LOGIN ERROR:", err);
      let userMessage = "Please try again.";

      // handle AbortError names safely
      if (err?.name === "AbortError") {
        userMessage =
          "Request timed out. Please check your connection and try again.";
      } else {
        const msg = String(err?.message || "").toLowerCase();
        if (
          msg.includes("network request failed") ||
          msg.includes("failed to fetch")
        ) {
          // On web this often indicates CORS or network/SSL issue
          userMessage = isWeb
            ? "Network or CORS error. Open browser console (F12) and check network/CORS errors. Ensure the API accepts requests from this origin."
            : "Network error. Please check your internet connection.";
        } else if (msg.includes("enotfound") || msg.includes("econnrefused")) {
          userMessage = "Unable to reach the server. Please try again later.";
        }
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

      {isWeb ? (
        // Web Layout with centered card
        <View style={styles.webContainer}>
          <ScrollView
            contentContainerStyle={styles.webScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.webCard,
                { width: containerWidth, padding: containerPadding },
              ]}
            >
              <View style={styles.webCardInner}>
                <Text style={styles.webHeading}>Sign In</Text>
                <Text style={styles.webSubheading}>
                  Enter your email and password to sign in
                </Text>

                <View style={styles.webField}>
                  <Text style={styles.webLabel}>Email</Text>
                  <TextInput
                    style={styles.webInput}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>

                <View style={styles.webField}>
                  <Text style={styles.webLabel}>Password</Text>
                  <TextInput
                    style={styles.webInput}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.webPrimaryBtn, loading && { opacity: 0.6 }]}
                  activeOpacity={0.9}
                  onPress={handleSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.webButtonContent}>
                      <ActivityIndicator color={WHITE} />
                      <Text style={styles.webButtonText}>Signing in...</Text>
                    </View>
                  ) : (
                    <Text style={styles.webButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/auth/forgetpassword")}
                  disabled={loading}
                >
                  <Text
                    style={[styles.webLinkMuted, loading && { opacity: 0.5 }]}
                  >
                    Forgot your password?
                  </Text>
                </TouchableOpacity>

                <View style={styles.webMetaRow}>
                  <Text style={styles.webMuted}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => !loading && router.push("/auth/SignupPage")}
                    disabled={loading}
                  >
                    <Text style={[styles.webLink, loading && { opacity: 0.5 }]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        // Mobile Layout
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.kav}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
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
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color={WHITE} />
                    <Text style={styles.buttonText}>Signing in...</Text>
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

              <View style={styles.metaRow}>
                <Text style={styles.muted}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => !loading && router.push("/auth/SignupPage")}
                  disabled={loading}
                >
                  <Text style={[styles.link, loading && { opacity: 0.5 }]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // Shared styles
  container: {
    flex: 1,
  },

  // Mobile Styles
  safe: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  heading: {
    fontSize: responsiveFontSize(32, 36),
    fontWeight: "800",
    color: WHITE,
    marginBottom: 6,
    textAlign: "center",
  },
  subheading: {
    fontSize: responsiveFontSize(16, 18),
    color: "rgba(255,255,255,0.9)",
    marginBottom: responsiveSpacing(20, 30),
    textAlign: "center",
  },
  field: {
    marginBottom: responsiveSpacing(16, 20),
  },
  label: {
    fontSize: responsiveFontSize(15, 16),
    fontWeight: "700",
    color: WHITE,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: responsiveSpacing(52, 56),
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: responsiveSpacing(14, 16),
    backgroundColor: INPUT_BG,
    color: WHITE,
    fontSize: responsiveFontSize(16, 17),
  },
  primaryBtn: {
    width: "100%",
    height: responsiveSpacing(54, 60),
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: responsiveSpacing(4, 8),
    marginBottom: responsiveSpacing(16, 20),
    borderWidth: 1,
    borderColor: WHITE,
  },
  primaryText: {
    color: WHITE,
    fontSize: responsiveFontSize(17, 18),
    fontWeight: "800",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: WHITE,
    fontSize: responsiveFontSize(15, 16),
    fontWeight: "700",
  },
  linkMuted: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
    fontSize: responsiveFontSize(15, 16),
    marginBottom: responsiveSpacing(10, 12),
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: responsiveSpacing(4, 8),
  },
  muted: {
    color: "rgba(255,255,255,0.8)",
    fontSize: responsiveFontSize(15, 16),
  },
  link: {
    color: WHITE,
    fontWeight: "800",
    fontSize: responsiveFontSize(15, 16),
  },

  // Web Specific Styles
  webContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: isLargeScreen ? 40 : 20,
  },
  webScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: height,
  },
  webCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    // shadow for web/native
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 12 },
      web: {
        // React Native Web will convert boxShadow if provided inline elsewhere; keep minimal here.
      },
    }),
  },
  webCardInner: {
    width: "100%",
  },
  webHeading: {
    fontSize: responsiveFontSize(36, 42),
    fontWeight: "800",
    color: WHITE,
    marginBottom: 10,
    textAlign: "center",
  },
  webSubheading: {
    fontSize: responsiveFontSize(18, 20),
    color: "rgba(255,255,255,0.9)",
    marginBottom: responsiveSpacing(30, 40),
    textAlign: "center",
    lineHeight: responsiveFontSize(24, 28),
  },
  webField: {
    marginBottom: responsiveSpacing(20, 24),
  },
  webLabel: {
    fontSize: responsiveFontSize(16, 17),
    fontWeight: "700",
    color: WHITE,
    marginBottom: 10,
  },
  webInput: {
    width: "100%",
    height: responsiveSpacing(56, 60),
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: responsiveSpacing(16, 18),
    backgroundColor: INPUT_BG,
    color: WHITE,
    fontSize: responsiveFontSize(17, 18),
  },
  webPrimaryBtn: {
    width: "100%",
    height: responsiveSpacing(60, 64),
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: responsiveSpacing(8, 12),
    marginBottom: responsiveSpacing(20, 24),
    borderWidth: 2,
    borderColor: WHITE,
  },
  webButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  webButtonText: {
    color: WHITE,
    fontSize: responsiveFontSize(18, 20),
    fontWeight: "800",
  },
  webLinkMuted: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
    fontSize: responsiveFontSize(16, 17),
    marginBottom: responsiveSpacing(12, 16),
    textAlign: "center",
  },
  webMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: responsiveSpacing(8, 12),
    gap: 6,
  },
  webMuted: {
    color: "rgba(255,255,255,0.8)",
    fontSize: responsiveFontSize(16, 17),
  },
  webLink: {
    color: WHITE,
    fontWeight: "800",
    fontSize: responsiveFontSize(16, 17),
    textDecorationLine: "underline",
  },
});
