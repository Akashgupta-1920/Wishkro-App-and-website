// app/(app)/_layout.jsx
import React from "react";
import { Drawer } from "expo-router/drawer";
import MyDrawer from "../components/_drawer";

export default function AppDrawerLayout() {
  return (
    <Drawer
      id="root-drawer"
      screenOptions={{ headerShown: false }}
      drawerContent={(p) => <MyDrawer {...p} />}
    >
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: "Home" }} />
    </Drawer>
  );
}
