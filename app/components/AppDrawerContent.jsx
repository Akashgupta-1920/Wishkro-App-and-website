import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";

export default function AppDrawerContent(props) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/LoginPage");
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.name ?? "User"}</Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutTxt}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: "700" },
  logout: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutTxt: { color: "#fff", fontWeight: "800", marginLeft: 8 },
});
