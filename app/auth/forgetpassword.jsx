// app/auth/forgetpassword.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("https://api.wishkro.com/api/user/forget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", data.message || "Password reset link sent!");
        router.push("/auth/login");
      } else {
        Alert.alert("Error", data.message || "Something went wrong");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Text style={styles.heading}>Forgot Password</Text>
            <Text style={styles.subHeading}>
              Enter your email address to reset your password
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#8e2de2"
                style={{ marginRight: 8 }}
              />
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#999"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity onPress={() => router.push("/auth/LoginPage")}>
              <Text style={styles.backToLogin}>
                Back to <Text style={{ fontWeight: "bold" }}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.9)",
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8e2de2",
    marginBottom: 10,
    textAlign: "center",
  },
  subHeading: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#8e2de2",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  backToLogin: {
    color: "#333",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
});
