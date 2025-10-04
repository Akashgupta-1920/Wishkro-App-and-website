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
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const WHITE = "#fff",
  BORDER = "rgba(255,255,255,0.4)",
  INPUT_BG = "rgba(255,255,255,0.15)";

const Field = ({ label, ...props }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholderTextColor="rgba(255,255,255,0.7)"
      allowFontScaling={false}
      {...props}
    />
  </View>
);

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

  const update = (key, val) => setForm({ ...form, [key]: val });

  const handleRegister = async () => {
    for (let k in form) if (!form[k].trim()) return alert(`${k} is required`);

    try {
      setLoading(true);
      const res = await fetch("https://api.wishkro.com/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          pinCode: form.pin.trim(),
          inviterefferal: form.referral.trim(),
        }),
      });
      const data = await res.json();
      if (!data?.success) return alert(data?.message || "Signup failed");
      alert("Registration successful!");
      router.replace("/auth/LoginPage");
    } catch (e) {
      console.error(e);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#8e2de2", "#ff0080", "#ff5f6d", "#ff7f50", "#ffb347"]}
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
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
            <Field
              label="Password"
              placeholder="Password"
              value={form.password}
              onChangeText={(v) => update("password", v)}
              secureTextEntry
            />
            <Field
              label="Phone"
              placeholder="1234567890"
              value={form.phone}
              onChangeText={(v) => update("phone", v)}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <Field
              label="Pin Code"
              placeholder="110001"
              value={form.pin}
              onChangeText={(v) => update("pin", v)}
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
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryText}>
                {loading ? "Please wait..." : "Register"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.metaRow}>
              <Text style={styles.muted}>Already have an account? </Text>
              <Text
                style={styles.link}
                onPress={() => router.push("/auth/LoginPage")}
              >
                Sign In
              </Text>
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1, paddingHorizontal: 20 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },

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
    height: 44,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: INPUT_BG,
    color: WHITE,
    fontSize: 15,
  },

  primaryBtn: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: WHITE,
  },
  primaryText: { color: WHITE, fontSize: 17, fontWeight: "800" },
  metaRow: { alignSelf: "center", marginTop: 4 },
  muted: { color: "rgba(255,255,255,0.8)", fontSize: 15 },
  link: { color: WHITE, fontWeight: "800", fontSize: 15 },
});
