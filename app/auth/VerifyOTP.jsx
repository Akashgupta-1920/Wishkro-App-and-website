// app/(auth)/VerifyOTP.jsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

const API_VERIFY = "https://api.wishkro.com/api/user/verify-otp"; // update if different
const API_RESEND = "https://api.wishkro.com/api/user/resend-otp"; // update if different
const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function VerifyOTP() {
  const params = useLocalSearchParams();
  const email = (params?.email || "").trim();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const inputsRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  // start/resume countdown whenever secondsLeft > 0
  useEffect(() => {
    if (secondsLeft <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  // Autofocus first input on mount
  useEffect(() => {
    if (inputsRef.current[0]) inputsRef.current[0].focus();
  }, []);

  const setDigit = (idx, ch) => {
    if (!ch) {
      const next = [...digits];
      next[idx] = "";
      setDigits(next);
      return;
    }
    // accept only digits
    const d = ch.replace(/\D/g, "").slice(0, 1);
    if (!d) return;
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    // move focus
    const nextIdx = idx + 1;
    if (nextIdx < OTP_LENGTH && inputsRef.current[nextIdx]) {
      inputsRef.current[nextIdx].focus();
    } else {
      // dismiss keyboard (optional)
      if (Platform.OS !== "web") inputsRef.current[idx]?.blur?.();
    }
  };

  const handleKeyPress = (e, idx) => {
    // handle backspace to move back
    if (e.nativeEvent.key === "Backspace" && digits[idx] === "") {
      const prev = idx - 1;
      if (prev >= 0 && inputsRef.current[prev]) {
        inputsRef.current[prev].focus();
      }
    }
  };

  const buildOtp = () => digits.join("").trim();

  const handleVerify = async () => {
    const otp = buildOtp();
    if (otp.length !== OTP_LENGTH) {
      Alert.alert("Invalid OTP", `Please enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    if (!email) {
      Alert.alert(
        "Missing email",
        "Email missing from route. Please retry signup."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_VERIFY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok && (data?.success || data?.verified)) {
        Alert.alert("Verified", "OTP verified — welcome!", [
          {
            text: "Continue",
            onPress: () => {
              // go to home (change route if different)
              router.replace("/home");
            },
          },
        ]);
      } else {
        Alert.alert("Verification failed", data?.message || "Invalid OTP");
      }
    } catch (e) {
      console.error("verify error:", e);
      Alert.alert("Network error", "Could not verify OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert(
        "Missing email",
        "Email missing from route. Please retry signup."
      );
      return;
    }
    if (!canResend) return;
    setResendLoading(true);
    try {
      const res = await fetch(API_RESEND, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && (data?.success || data?.resent)) {
        Alert.alert("Sent", "OTP resent to your email.");
        setSecondsLeft(RESEND_SECONDS);
      } else {
        Alert.alert("Failed to resend", data?.message || "Try later.");
      }
    } catch (e) {
      console.error("resend error:", e);
      Alert.alert("Network error", "Unable to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the {OTP_LENGTH}-digit code we emailed to:
          </Text>
          <Text style={styles.email}>{email || "No email provided"}</Text>

          <View style={styles.otpRow}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <TextInput
                key={i}
                ref={(r) => (inputsRef.current[i] = r)}
                value={digits[i]}
                onChangeText={(v) => setDigit(i, v)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={1}
                style={styles.otpInput}
                textContentType="oneTimeCode"
                importantForAutofill="yes"
                autoComplete="sms-otp" // may help in some platforms
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyBtn, loading && { opacity: 0.7 }]}
            disabled={loading}
            onPress={handleVerify}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            <Text style={styles.muted}>Didn't receive the code? </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend || resendLoading}
            >
              <Text style={[styles.resendText, !canResend && styles.gray]}>
                {resendLoading
                  ? "Sending..."
                  : canResend
                  ? "Resend OTP"
                  : `Resend in ${secondsLeft}s`}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.changeEmail}
            onPress={() => router.replace("/auth/SignupPage")}
          >
            <Text style={styles.link}>Use different email</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1 },
  inner: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 6, color: "#111827" },
  subtitle: { color: "#6b7280", marginBottom: 2 },
  email: { color: "#374151", marginBottom: 18, fontWeight: "600" },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 18,
  },
  otpInput: {
    width: 44,
    height: 56,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    backgroundColor: "#fff",
  },
  verifyBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 32,
    marginTop: 6,
  },
  verifyText: { color: "#fff", fontWeight: "800" },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  muted: { color: "#6b7280" },
  resendText: { color: "#2563eb", fontWeight: "700", marginLeft: 6 },
  gray: { color: "#9ca3af" },
  changeEmail: { alignSelf: "center", marginTop: 18 },
  link: { color: "#2563eb", fontWeight: "700" },
});
