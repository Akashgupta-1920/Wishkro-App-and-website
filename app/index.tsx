// app/index.tsx
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");
const LOGO_SIZE = Math.min(width, height) * 0.35;

const WHITE = "#ffffff";
const BRAND = "#ff0080";

const IndexScreen: React.FC = () => {
  // cast to any if your useAuth is not typed yet
  const { hydrated, token } = (useAuth() as any) ?? {
    hydrated: false,
    token: null,
  };
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!hydrated) return;
    if (token) {
      router.replace("/(app)/(tabs)/home");
    }
  }, [hydrated, token, router]);

  const go = (path: string) => {
    try {
      router.push(path);
    } catch (e) {
      console.warn("Navigation error:", e);
    }
  };

  if (!hydrated) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator />
      </View>
    );
  }

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
      <SafeAreaView
        style={[
          styles.safe,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
        />

        <View style={styles.content}>
          <Text style={styles.title}>Welcome to WishKro</Text>
          <Text style={styles.subtitle}>Your gateway to exciting offers</Text>
          <Text style={styles.description}>
            Explore amazing deals and win big with our interactive platform.
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/auth/SignupPage")}
            style={styles.btnWrap}
          >
            <LinearGradient
              colors={["#ffffff", "#ffe8f3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnWrap, styles.secondaryBtn]}
            activeOpacity={0.9}
            onPress={() => router.push("/auth/LoginPage")}
          >
            <Text style={styles.secondaryText}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.footerRow, { marginBottom: 8 }]}>
          <TouchableOpacity onPress={() => go("/pages/PrivacyPolicy")}>
            <Text style={styles.footerText}>Privacy</Text>
          </TouchableOpacity>
          <View style={styles.dot} />
          <TouchableOpacity onPress={() => go("/pages/TermsConditions")}>
            <Text style={styles.footerText}>Terms</Text>
          </TouchableOpacity>
          <View style={styles.dot} />
          <TouchableOpacity onPress={() => go("/pages/Agreements")}>
            <Text style={styles.footerText}>Agreements</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    resizeMode: "contain",
    marginTop: 8,
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  btnWrap: { width: "100%", alignSelf: "center" },
  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginBottom: 10,
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: BRAND,
    fontSize: 16.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  secondaryText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  title: {
    color: WHITE,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: {
    color: WHITE,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.95,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  description: {
    color: WHITE,
    fontSize: 14.5,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.92,
    marginTop: 4,
    marginBottom: 18,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerText: { color: WHITE, opacity: 0.9, fontSize: 13.5, fontWeight: "600" },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: WHITE,
    opacity: 0.7,
  },
});
