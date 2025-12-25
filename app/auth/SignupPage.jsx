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
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const isWeb = Platform.OS === "web";
const isLargeScreen = width >= 1024;

const WHITE = "#fff";
const BORDER = "rgba(255,255,255,0.4)";
const INPUT_BG = "rgba(255,255,255,0.15)";
const REGISTER_URL = "https://api.wishkro.com/api/user/register";

/* ---------- storage wrapper (web/native) ---------- */
const getStorage = () => {
  if (isWeb) {
    return {
      getItem: async (k) => {
        try {
          return localStorage.getItem(k);
        } catch (e) {
          console.error("localStorage.get error", e);
          return null;
        }
      },
      setItem: async (k, v) => {
        try {
          localStorage.setItem(k, v);
        } catch (e) {
          console.error("localStorage.set error", e);
        }
      },
      removeItem: async (k) => {
        try {
          localStorage.removeItem(k);
        } catch (e) {
          console.error("localStorage.remove error", e);
        }
      },
      clear: async () => {
        try {
          localStorage.clear();
        } catch (e) {
          console.error("localStorage.clear error", e);
        }
      },
    };
  }
  return AsyncStorage;
};

const storage = getStorage();

/* ---------- small helpers ---------- */
const responsiveFontSize = (mobileSize, webSize) =>
  isWeb ? webSize : mobileSize;
const responsiveSpacing = (mobileSpacing, webSpacing) =>
  isWeb ? webSpacing : mobileSpacing;

/* ---------- Field component ---------- */
const Field = ({ label, style, ...props }) => (
  <View style={[styles.field, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholderTextColor="rgba(255,255,255,0.7)"
      allowFontScaling={false}
      style={styles.input}
      {...props}
    />
  </View>
);

/* ---------- main component ---------- */
export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    pin: "",
    referral: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [screenWidth, setScreenWidth] = useState(width);

  useEffect(() => {
    if (isWeb) {
      const onResize = () => setScreenWidth(window.innerWidth);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, []);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const { name, email, password, phone, pin } = form;
    if (!name.trim()) return "Name is required";
    if (!email.trim()) return "Email is required";
    // basic email regex
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (!phone.trim()) return "Phone is required";
    if (!/^\d{10}$/.test(phone.trim())) return "Phone must be 10 digits";
    if (!pin.trim()) return "Pin Code is required";
    if (!/^\d{4,6}$/.test(pin.trim()))
      return "Pin code should be 4 to 6 digits";
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) return Alert.alert("Validation", err);

    try {
      setLoading(true);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      // Build payload matching your API keys
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        pinCode: form.pin.trim(),
        inviterefferal: form.referral.trim(),
      };

      // Do not set User-Agent or manual Origin headers in browser
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      const opts = {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      };

      if (isWeb) {
        opts.mode = "cors";
        // only use credentials if your backend uses cookie auth and is configured for credentials:
        // opts.credentials = 'include'
      }

      const res = await fetch(REGISTER_URL, opts);
      clearTimeout(timeout);

      const contentType = res.headers.get("content-type") || "";
      const raw = await res.text();
      let data = null;
      try {
        data = contentType.includes("application/json")
          ? JSON.parse(raw)
          : null;
      } catch (e) {
        console.warn("Failed parsing JSON:", e);
      }

      if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}: ${res.statusText}`;
        return Alert.alert("Registration failed", msg);
      }

      if (!data?.success) {
        return Alert.alert(
          "Registration failed",
          data?.message || "Signup failed"
        );
      }

      Alert.alert("Success", "Registration successful!");

      // Optionally store something or navigate
      // clear form or auto-login (not doing auto-login by default)
      if (isWeb)
        router.replace("/auth/LoginPage" /* or /home if you auto-login */);
      else router.replace("/auth/LoginPage");
    } catch (err) {
      console.error("Signup error:", err);
      const msg =
        err?.name === "AbortError"
          ? "Request timed out. Try again."
          : String(err?.message || "").includes("Failed to fetch") && isWeb
          ? "Network/CORS error. Check browser console (F12) for details."
          : "Network error. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  // responsive container width for web card
  const containerWidth = isWeb
    ? Math.min(screenWidth * (isLargeScreen ? 0.38 : 0.85), 680)
    : "100%";
  const containerPadding = isWeb ? responsiveSpacing(28, 36) : 20;

  return (
    <LinearGradient
      colors={["#8e2de2", "#ff0080", "#ff5f6d", "#ff7f50", "#ffb347"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      {isWeb ? (
        <View style={styles.webOuter}>
          <ScrollView
            contentContainerStyle={styles.webScroll}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.card,
                { width: containerWidth, padding: containerPadding },
              ]}
            >
              <Text style={styles.heading}>Create Account</Text>
              <Text style={styles.subheading}>
                Fill the form below to create your account
              </Text>

              <Field
                label="Name"
                placeholder="Your Name"
                value={form.name}
                onChangeText={(v) => update("name", v)}
              />
              <Field
                label="Email"
                placeholder="you@example.com"
                value={form.email}
                onChangeText={(v) => update("email", v)}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { paddingRight: 48 }]}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    secureTextEntry={!showPass}
                    value={form.password}
                    onChangeText={(v) => update("password", v)}
                    autoCapitalize="none"
                    allowFontScaling={false}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPass((s) => !s)}
                  >
                    <Text style={{ color: WHITE, fontWeight: "700" }}>
                      {showPass ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Field
                label="Phone"
                placeholder="1234567890"
                value={form.phone}
                onChangeText={(v) => update("phone", v.replace(/[^0-9]/g, ""))}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <Field
                label="Pin Code"
                placeholder="110001"
                value={form.pin}
                onChangeText={(v) => update("pin", v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Field
                label="Invite Referral"
                placeholder="Enter Invite Referral"
                value={form.referral}
                onChangeText={(v) => update("referral", v)}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                activeOpacity={0.9}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={WHITE} />
                    <Text style={styles.primaryText}>Please wait...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryText}>Register</Text>
                )}
              </TouchableOpacity>

              <View style={styles.metaRow}>
                <Text style={styles.muted}>Already have an account? </Text>
                <Text
                  style={styles.link}
                  onPress={() => router.push("/auth/LoginPage")}
                >
                  Sign In
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      ) : (
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.kav}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.heading}>Sign Up</Text>
              <Text style={styles.subheading}>
                Fill the form below to create your account
              </Text>

              <Field
                label="Name"
                placeholder="Your Name"
                value={form.name}
                onChangeText={(v) => update("name", v)}
              />
              <Field
                label="Email"
                placeholder="you@example.com"
                value={form.email}
                onChangeText={(v) => update("email", v)}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, { paddingRight: 48 }]}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    secureTextEntry={!showPass}
                    value={form.password}
                    onChangeText={(v) => update("password", v)}
                    autoCapitalize="none"
                    allowFontScaling={false}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPass((s) => !s)}
                  >
                    <Text style={{ color: WHITE, fontWeight: "700" }}>
                      {showPass ? "Hide" : "Show"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Field
                label="Phone"
                placeholder="1234567890"
                value={form.phone}
                onChangeText={(v) => update("phone", v.replace(/[^0-9]/g, ""))}
                keyboardType="phone-pad"
                maxLength={10}
              />
              <Field
                label="Pin Code"
                placeholder="110001"
                value={form.pin}
                onChangeText={(v) => update("pin", v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Field
                label="Invite Referral"
                placeholder="Enter Invite Referral"
                value={form.referral}
                onChangeText={(v) => update("referral", v)}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                activeOpacity={0.9}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color={WHITE} />
                    <Text style={styles.primaryText}>Please wait...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryText}>Register</Text>
                )}
              </TouchableOpacity>

              <View style={styles.metaRow}>
                <Text style={styles.muted}>Already have an account? </Text>
                <Text
                  style={styles.link}
                  onPress={() => router.push("/auth/LoginPage")}
                >
                  Sign In
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      )}
    </LinearGradient>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  root: { flex: 1 },
  // web container
  webOuter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: isLargeScreen ? 40 : 20,
  },
  webScroll: {
    minHeight: height,
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  // shared
  safe: { flex: 1 },
  kav: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  heading: {
    fontSize: responsiveFontSize(32, 36),
    fontWeight: "800",
    color: WHITE,
    marginBottom: 6,
    textAlign: "center",
  },
  subheading: {
    fontSize: responsiveFontSize(14, 16),
    color: "rgba(255,255,255,0.9)",
    marginBottom: responsiveSpacing(18, 22),
    textAlign: "center",
  },

  field: { marginBottom: responsiveSpacing(12, 16) },
  label: {
    fontSize: responsiveFontSize(14, 15),
    fontWeight: "700",
    color: WHITE,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: INPUT_BG,
    color: WHITE,
    fontSize: responsiveFontSize(15, 16),
  },

  passwordRow: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 8,
    top: 10,
    height: 32,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryBtn: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.34)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: WHITE,
  },
  primaryText: {
    color: WHITE,
    fontSize: responsiveFontSize(16, 18),
    fontWeight: "800",
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  metaRow: {
    alignSelf: "center",
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  muted: {
    color: "rgba(255,255,255,0.8)",
    fontSize: responsiveFontSize(14, 15),
  },
  link: {
    color: WHITE,
    fontWeight: "800",
    fontSize: responsiveFontSize(14, 15),
    marginLeft: 6,
  },
});
