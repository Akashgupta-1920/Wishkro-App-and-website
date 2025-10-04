// app/(app)/(tabs)/_layout.tsx
import React, { useEffect, useRef } from "react";
import { StyleSheet, Animated, Easing, Image, View } from "react-native";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { DrawerToggleButton } from "@react-navigation/drawer";
import Colors from "../../../constant/Colors";

/* ---------------- Animated helpers ---------------- */

function AnimatedTabIcon({
  focused,
  children,
}: {
  focused: boolean,
  children: React.ReactNode,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.12 : 1,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start();
  }, [focused, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
  );
}

function TabBarBackground() {
  const ty = useRef(new Animated.Value(24)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(ty, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(op, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [ty, op]);
  return (
    <Animated.View
      style={{
        flex: 1,
        borderRadius: 18,
        transform: [{ translateY: ty }],
        opacity: op,
        overflow: "hidden",
      }}
    >
      <LinearGradient colors={["#ffffff", "#ffffff"]} style={{ flex: 1 }} />
    </Animated.View>
  );
}

/* ---------------- Layout ---------------- */

export default function TabsLayout() {
  // keep this if you later add a FAB
  const fabScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fabScale, {
          toValue: 1.0,
          duration: 900,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [fabScale]);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        headerLeft: () => <DrawerToggleButton />, // drawer toggle button
        headerTitle: () => (
          <Image
            source={require("../../../assets/images/logo.png")}
            style={{ width: 120, height: 40 }}
            resizeMode="contain"
          />
        ),
        tabBarActiveTintColor: Colors.PRIME,
        tabBarInactiveTintColor: "#888",
        tabBarHideOnKeyboard: true,
        lazy: true,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 16,
          height: 62,
          borderRadius: 18,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.1)",
          borderColor: "rgba(0,0,0,0.1)",
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      <Tabs.Screen
        name="Refer"
        options={{
          tabBarLabel: "Refer",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <Ionicons name="list-outline" size={size} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <Ionicons name="home-outline" size={size} color={color} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={size}
                color={color}
              />
            </AnimatedTabIcon>
          ),
        }}
      />
    </Tabs>
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
  logo: { width: 120, height: 40 },
  menuBtn: { padding: 6 },
});
