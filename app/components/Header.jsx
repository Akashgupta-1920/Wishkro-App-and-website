// src/components/Header.jsx
import React, { useMemo } from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { DrawerActions } from "@react-navigation/native";

export default function Header() {
  const navigation = useNavigation();

  // Find the first ancestor whose state.type === 'drawer'
  const drawerNav = useMemo(() => {
    let nav = navigation;
    for (let i = 0; i < 8 && nav; i++) {
      const state = nav.getState?.();
      if (state?.type === "drawer") return nav;
      nav = nav.getParent?.();
    }
    return null;
  }, [navigation]);

  const openDrawer = () => {
    if (!drawerNav) {
      console.warn("No Drawer ancestor found — hiding menu.");
      return;
    }
    drawerNav.dispatch(DrawerActions.openDrawer());
  };

  const hasDrawer = !!drawerNav;

  return (
    <View style={styles.header}>
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      {hasDrawer ? (
        <TouchableOpacity onPress={openDrawer} style={styles.menuBtn}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 28, height: 28 }} /> // keep layout stable
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 80,
    alignSelf: "stretch",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 3,
    borderRadius: 20,
  },
  logo: { width: 120, height: 40, aspectRatio: 1.5 },
  menuBtn: { padding: 6 },
});
