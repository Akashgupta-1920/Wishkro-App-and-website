import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";

export default function MyDrawer(props) {
  const { user, logout } = useAuth();
  const { navigation } = props;

  const go = (path) => {
    // Jump to a specific tab screen
    router.push(path); // e.g. "/(app)/(tabs)/Profile"
    navigation?.closeDrawer?.();
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/LoginPage");
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.name ?? "User"}</Text>
        </View>

        {/* Keep auto items (only "(tabs)") if you like */}
        {/* <DrawerItemList {...props} /> */}

        {/* Explicit entries to tab screens */}
        <DrawerItem
          label="Home"
          icon={({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )}
          onPress={() => go("/(app)/(tabs)/home")}
        />
        <DrawerItem
          label="Refer"
          icon={({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          )}
          onPress={() => go("/(app)/(tabs)/Refer")}
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
          onPress={() => go("/(app)/(tabs)/Profile")}
        />
      </DrawerContentScrollView>

      {/* Logout */}
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
