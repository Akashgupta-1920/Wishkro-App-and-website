// components/MyDrawer.jsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

export default function MyDrawer(props) {
  const { user, logout } = useAuth();
  const { navigation } = props;
  const insets = useSafeAreaInsets();

  // Try a list of candidate routes until one succeeds.
  // This lets the drawer work whether your files live under app/pages, app/screens or app/components.
  const tryNavigate = async (candidates = []) => {
    for (const p of candidates) {
      try {
        await router.push(p);
        navigation?.closeDrawer?.();
        return true;
      } catch (e) {
        // ignore, try next
      }
    }
    // Final fallback: just attempt the first path (will throw if invalid)
    if (candidates[0]) {
      try {
        await router.push(candidates[0]);
        navigation?.closeDrawer?.();
        return true;
      } catch (e) {
        console.warn("Navigation failed for candidates:", candidates, e);
        return false;
      }
    }
    return false;
  };

  const go = (pathOrCandidates) => {
    // Accept either a string path or an array of candidate paths
    const candidates = Array.isArray(pathOrCandidates)
      ? pathOrCandidates
      : [pathOrCandidates];
    tryNavigate(candidates);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    router.replace("/auth/LoginPage");
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.avatar}
          />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.name}>{user?.name ?? "User Name"}</Text>
            <Text style={styles.email} numberOfLines={1} ellipsizeMode="tail">
              {user?.email ?? "you@example.com"}
            </Text>
          </View>
        </View>

        {/* Primary section */}
        <View style={styles.sectionLabelWrap}>
          <Text style={styles.sectionLabel}>Main</Text>
        </View>

        <DrawerItem
          label="Home"
          icon={({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )}
          onPress={() =>
            go(["/(app)/(tabs)/home", "/(app)/home", "/home", "/(tabs)/home"])
          }
        />
        <DrawerItem
          label="Refer"
          icon={({ color, size }) => (
            <Ionicons name="person-add-outline" size={size} color={color} />
          )}
          onPress={() =>
            go(["/(app)/(tabs)/Refer", "/(app)/Refer", "/Refer", "/refer"])
          }
        />
        <DrawerItem
          label="Profile"
          icon={({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={size}
              color={color}
            />
          )}
          onPress={() =>
            go([
              "/(app)/(tabs)/Profile",
              "/(app)/Profile",
              "/Profile",
              "/profile",
            ])
          }
        />

        {/* Support */}
        <View style={styles.sectionLabelWrap}>
          <Text style={styles.sectionLabel}>Help</Text>
        </View>

        <DrawerItem
          label="Support"
          icon={({ color, size }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          )}
          // candidate paths for SupportPage — adjust if yours is different
          onPress={() =>
            go([
              "/components/SupportPage",
              "/(app)/components/SupportPage",
              "/SupportPage",
              "/support",
            ])
          }
        />

        {/* Legal / Info */}
        <View style={styles.sectionLabelWrap}>
          <Text style={styles.sectionLabel}>Legal</Text>
        </View>

        {/* <DrawerItem
          label="Legal (All)"
          icon={({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          )}
          onPress={() =>
            go([
              "/screens/LegalScreen",
              "/(app)/screens/LegalScreen",
              "/pages/Legal",
              "/legal",
            ])
          }
        /> */}
        <DrawerItem
          label="Privacy Policy"
          icon={({ color, size }) => (
            <Ionicons
              name="shield-checkmark-outline"
              size={size}
              color={color}
            />
          )}
          onPress={() => go(["/pages/PrivacyPolicy"])}
        />
        <DrawerItem
          label="Terms & Conditions"
          icon={({ color, size }) => (
            <MaterialCommunityIcons
              name="file-document-outline"
              size={size}
              color={color}
            />
          )}
          onPress={() => go(["/pages/TermsConditions"])}
        />
        <DrawerItem
          label="Agreements"
          icon={({ color, size }) => (
            <Ionicons name="list-circle-outline" size={size} color={color} />
          )}
          onPress={() => go(["/pages/Agreements"])}
        />

        {/* Promo (optional) */}
        <DrawerItem
          label="Promo / Why WishKro"
          icon={({ color, size }) => (
            <Ionicons name="megaphone-outline" size={size} color={color} />
          )}
          onPress={() => go(["/components/Promo2Screen"])}
        />
        <DrawerItem
          label="Promo 2"
          icon={({ color, size }) => (
            <Ionicons name="megaphone-outline" size={size} color={color} />
          )}
          onPress={() => go(["/components/PromoScreen"])}
        />
      </DrawerContentScrollView>

      <View
        style={[
          styles.footerRow,
          { marginBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <TouchableOpacity
          onPress={() => go(["/PrivacyPolicy", "/pages/PrivacyPolicy"])}
          style={styles.footerItem}
        >
          <Text style={styles.footerText}>Privacy</Text>
        </TouchableOpacity>
        <View style={styles.dot} />
        <TouchableOpacity
          onPress={() => go(["/pages/TermsConditions"])}
          style={styles.footerItem}
        >
          <Text style={styles.footerText}>Terms</Text>
        </TouchableOpacity>
        <View style={styles.dot} />
        <TouchableOpacity
          onPress={() => go(["/components/SupportPage"])}
          style={styles.footerItem}
        >
          <Text style={styles.footerText}>Support</Text>
        </TouchableOpacity>
      </View>

      {/* Logout button */}
      <TouchableOpacity
        style={[
          styles.logout,
          { marginHorizontal: 16, marginBottom: Math.max(insets.bottom, 20) },
        ]}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutTxt}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const MUTED = "#6b7280";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1, paddingTop: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#fff",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginRight: 12,
  },
  name: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  email: { fontSize: 12.5, color: MUTED, marginTop: 2, maxWidth: 180 },

  sectionLabelWrap: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#111827",
    opacity: 0.85,
  },

  logout: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    marginHorizontal: 16,
  },
  logoutTxt: {
    color: "#fff",
    fontWeight: "800",
    marginLeft: 8,
    fontSize: 15,
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  footerItem: { paddingHorizontal: 8, paddingVertical: 6 },
  footerText: {
    color: MUTED,
    opacity: 0.95,
    fontSize: 13,
    fontWeight: "600",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MUTED,
    opacity: 0.6,
    marginHorizontal: 6,
  },
});
