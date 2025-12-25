// app/components/Drawer/AppDrawerContent.jsx
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

export default function AppDrawerContent(props) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/LoginPage");
  };

  return (
    <View style={styles.container}>
      {/* Ensure scroll area leaves space at bottom for system nav */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.name ?? "User"}</Text>
        </View>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Logout button placed at bottom, but lifted above system nav using insets */}
      <TouchableOpacity
        style={[
          styles.logout,
          {
            marginBottom: Math.max(insets.bottom, 12),
            paddingBottom: Math.max(insets.bottom ? 8 : 12, 12),
          },
        ]}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutTxt}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: {
    // keeps drawer items scrollable and leaves room for logout button
    paddingTop: 0,
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "700" },
  logout: {
    marginHorizontal: 16,
    // marginBottom will be overridden by insets in inline style to avoid overlap
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutTxt: { color: "#fff", fontWeight: "800", marginLeft: 8 },
});
