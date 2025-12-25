// app/(app)/(tabs)/_layout.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

/* ---------------- Header component (Home-like) ---------------- */

function AppHeader() {
  const insets = useSafeAreaInsets();
  const top = insets.top ?? (Platform.OS === "ios" ? 44 : 24);

  return (
    <LinearGradient
      colors={["#f7f8fa", "#f7f8fa"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.header, { paddingTop: top - 8 }]}
    >
      <View style={styles.headerLeft}>
        <DrawerToggleButton tintColor="#111827" />
      </View>

      <Image
        source={require("../../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.headerRight}>
        <TouchableOpacity style={{ padding: 8 }}>
          <Ionicons name="notifications-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/* ---------------- Layout ---------------- */

export default function TabsLayout() {
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

  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom ?? 0;

  // hide header on Android phones (keeps header on iOS and Web)
  // if you want to show header on Android tablets, replace with a width check
  const showHeader = Platform.OS !== "android";

  // Position the bar so it touches the system nav if present,
  // or sits at the very bottom when there's no system nav (bottomInset === 0).
  const tabBarBottom = bottomInset;
  const tabBarHeight = 72;

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: showHeader,
        header: showHeader ? () => <AppHeader /> : undefined,
        tabBarActiveTintColor: Colors.PRIME,
        tabBarInactiveTintColor: "#888",
        tabBarHideOnKeyboard: true,
        lazy: true,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: tabBarBottom,
          height: tabBarHeight,
          borderRadius: 18,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.06)",
          borderColor: "rgba(0,0,0,0.06)",
          paddingBottom: bottomInset > 0 ? Math.max(6, bottomInset * 0.35) : 8,
          paddingTop: 6,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 6 },
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
    height: 84,
    alignSelf: "stretch",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 20,
    elevation: 2,
    borderBottomWidth: 0,
  },
  headerLeft: {
    width: 48,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerRight: {
    width: 48,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  logo: { width: 240, height: 46 },
});
