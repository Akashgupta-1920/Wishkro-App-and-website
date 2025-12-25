// src/screens/HomeScreen.js
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import Header from "../../components/Header";
import api from "../../utils/auth";

const isWeb = Platform.OS === "web";
const isPin = (p) => /^[1-9][0-9]{5}$/.test(String(p || "").trim());

// helpers
const getArrayFromResponse = (data) => {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.businesses)) return data.businesses;
  if (Array.isArray(data)) return data;
  return [];
};

const shortText = (v = "", max = 120) => {
  if (v == null) return "";
  const s = typeof v === "string" ? v : String(v);
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trim() + "…";
};

const safe = (v, fallback = "") =>
  v === undefined || v === null || String(v).trim() === "" ? fallback : v;

const getPinFromItem = (item) => {
  if (!item || typeof item !== "object") return null;

  const tryKeys = (obj, keys) => {
    for (const k of keys) {
      if (!obj) continue;
      const val = obj[k];
      if (val !== undefined && val !== null) return val;
    }
    return null;
  };

  const direct = tryKeys(item, [
    "businessPincode",
    "businessPinCode",
    "pincode",
    "pinCode",
    "pin",
    "postalCode",
    "postal_code",
    "zip",
    "zipcode",
    "postal",
  ]);
  if (direct) return String(direct);

  const nestedContainers = [
    "address",
    "location",
    "meta",
    "details",
    "contact",
    "business",
  ];

  for (const containerKey of nestedContainers) {
    const container = item[containerKey];
    if (!container || typeof container !== "object") continue;

    const nested = tryKeys(container, [
      "pincode",
      "pinCode",
      "pin",
      "postalCode",
      "postal_code",
      "postal",
      "zipcode",
      "zip",
    ]);
    if (nested) return String(nested);
  }

  const arrCandidates = ["addresses", "locations", "places"];
  for (const a of arrCandidates) {
    const arr = item[a];
    if (Array.isArray(arr) && arr.length) {
      for (const el of arr) {
        if (!el || typeof el !== "object") continue;
        const maybe = tryKeys(el, [
          "pincode",
          "pinCode",
          "pin",
          "postalCode",
          "postal",
        ]);
        if (maybe) return String(maybe);
      }
    }
  }

  const values = JSON.stringify(item);
  const match = values.match(/([1-9][0-9]{5})/);
  if (match) return match[1];

  return null;
};

export default function HomeScreen() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchPincode, setSearchPincode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width
  );
  const [isLargeScreen, setIsLargeScreen] = useState(screenWidth >= 1024);

  // Handle window resize on web
  useEffect(() => {
    if (isWeb) {
      const updateDimensions = () => {
        const newWidth = window.innerWidth;
        setScreenWidth(newWidth);
        setIsLargeScreen(newWidth >= 1024);
      };

      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, []);

  // Calculate responsive values
  const containerMaxWidth = isWeb ? (isLargeScreen ? 1200 : 1000) : "100%";
  const cardGap = isWeb ? 20 : 12;
  const numColumns = isWeb
    ? isLargeScreen
      ? 4
      : screenWidth >= 768
      ? 3
      : 2
    : 2;

  const fetchNearbyBusinesses = useCallback(
    async (pincode = "") => {
      if (!token) return;
      const controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;

      try {
        if (!refreshing) setLoading(true);

        const { data } = await api.get("/api/business/nearby", {
          params: pincode ? { pincode } : undefined,
          ...(controller ? { signal: controller.signal } : {}),
          timeout: 15000,
        });

        let items = getArrayFromResponse(data);

        if (pincode && !isNaN(Number(pincode)) && pincode.length === 6) {
          items = items.filter((row) => {
            const pin =
              row.businessPincode ||
              row.businessPinCode ||
              row.pincode ||
              row.pinCode ||
              row.pin ||
              row.postalCode ||
              row.postal ||
              row.address?.pincode ||
              row.location?.pincode ||
              "" ||
              "";
            return String(pin).includes(pincode);
          });
        }

        items = items.map((it, idx) =>
          it && typeof it === "object" ? it : { _raw: it, idx }
        );

        setBusinesses(items);
      } catch (error) {
        if (
          error?.name === "CanceledError" ||
          error?.name === "AbortError" ||
          error?.code === "ERR_CANCELED"
        )
          return;

        if (error?.response?.status === 401) {
          Alert.alert("Session expired", "Please log in again.");
          logout?.();
          return;
        }
        const msg =
          error?.response?.data?.message ||
          (error?.message === "Network Error"
            ? "Network issue. Please check your connection."
            : error?.message || "Something went wrong");
        Alert.alert("Error", msg);
        setBusinesses([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsSearching(false);
      }

      return () => controller?.abort();
    },
    [token, refreshing, logout]
  );

  useEffect(() => {
    if (token) fetchNearbyBusinesses();
  }, [token, fetchNearbyBusinesses]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let cleanup;
      (async () => {
        cleanup = await fetchNearbyBusinesses();
      })();
      return () => {
        if (typeof cleanup === "function") cleanup();
      };
    }, [token, fetchNearbyBusinesses])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNearbyBusinesses(searchPincode.trim());
  }, [fetchNearbyBusinesses, searchPincode]);

  const debounceRef = useRef(null);
  const runSearch = useCallback(
    (pin) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setIsSearching(true);
        fetchNearbyBusinesses(pin);
      }, 300);
    },
    [fetchNearbyBusinesses]
  );

  const handleSearch = useCallback(() => {
    const pin = searchPincode.trim();
    if (!pin) return Alert.alert("Please enter a pincode");
    if (!isPin(pin))
      return Alert.alert(
        "Invalid pincode",
        "Enter a 6-digit PIN starting 1–9."
      );
    runSearch(pin);
  }, [searchPincode, runSearch]);

  const handleCall = useCallback((phone) => {
    const cleaned = String(phone || "").replace(/[^\d+]/g, "");
    if (!cleaned) return;
    Linking.openURL(`tel:${cleaned}`);
  }, []);

  const handleOpenDetails = useCallback(
    (item) => {
      router.push({
        pathname: "/(app)/business/[businessId]",
        params: {
          businessId: String(item._id || item.id || ""),
          fallback: JSON.stringify(item),
        },
      });
    },
    [router]
  );

  // Calculate card width based on screen size
  const calculateCardWidth = () => {
    const containerPadding = isWeb ? 40 : 24;
    const totalGap = cardGap * (numColumns - 1);
    const availableWidth = screenWidth - containerPadding - totalGap;
    return Math.floor(availableWidth / numColumns);
  };

  const cardWidth = calculateCardWidth();

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const renderCard = useCallback(
    ({ item, index }) => {
      const id = String(item._id || item.id || index);
      const title = safe(
        item.businessName || item.name || item.title,
        "Unnamed"
      );
      const subtitle = safe(
        item.category || item.type || item.businessType,
        ""
      ).toString();
      const phone =
        item.businessPhone || item.phone || item.contactNumber || null;

      const rawPin = getPinFromItem(item);
      let displayPin = null;
      if (rawPin) {
        const digits = String(rawPin).match(/\d+/g)?.join("") || String(rawPin);
        if (digits && digits.length >= 6) displayPin = digits.slice(0, 6);
        else displayPin = String(rawPin).slice(0, 6);
      }

      const address =
        item.address || item.locationAddress || item.line || item.street || "";
      const rating = item.rating || item.avgRating || item.stars || null;

      const businessDescription =
        item.businessDescription ||
        item.description ||
        item.about ||
        item.summary ||
        item.shortDescription ||
        "";

      const bannerUri =
        item.banner ||
        item.coverImage ||
        item.cover ||
        item.image ||
        item.businessBanner ||
        null;
      const avatarUri =
        item.logo ||
        item.avatar ||
        item.image ||
        item.photo ||
        item.ownerImage ||
        null;

      const expanded = expandedIds.has(id);

      const initials = (title || "B")
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

      return (
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => handleOpenDetails(item)}
          style={[
            styles.card,
            isWeb && styles.webCard,
            {
              width: cardWidth,
              marginRight: cardGap,
              marginBottom: cardGap,
            },
          ]}
        >
          {/* Banner */}
          <View style={styles.bannerWrap}>
            {bannerUri ? (
              <Image
                source={{ uri: bannerUri }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bannerPlaceholder} />
            )}

            {/* Circular avatar */}
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Body */}
          <View style={styles.cardBody}>
            <Text
              style={[styles.nameText, isWeb && styles.webNameText]}
              numberOfLines={1}
            >
              {title}
            </Text>

            {businessDescription ? (
              <Text
                style={[styles.description, isWeb && styles.webDescription]}
                numberOfLines={expanded ? 6 : 2}
                ellipsizeMode="tail"
              >
                {shortText(businessDescription, expanded ? 500 : 120)}
              </Text>
            ) : null}

            {subtitle ? (
              <Text
                style={[styles.taglineText, isWeb && styles.webTaglineText]}
                numberOfLines={1}
              >
                {shortText(subtitle, 60)}
              </Text>
            ) : null}

            {/* Contact info */}
            <View style={styles.infoRow}>
              <Ionicons name="call" size={isWeb ? 18 : 16} color="#10b981" />
              <Text style={[styles.phoneText, isWeb && styles.webPhoneText]}>
                {phone || "No phone"}
              </Text>
            </View>

            {/* Pincode */}
            <View style={styles.pinRow}>
              <MaterialIcons
                name="place"
                size={isWeb ? 16 : 14}
                color="#ef4444"
              />
              <Text style={[styles.pinLabel, isWeb && styles.webPinLabel]}>
                Pincode:
              </Text>
              <Text style={[styles.pinValue, isWeb && styles.webPinValue]}>
                {displayPin ? String(displayPin) : "—"}
              </Text>
            </View>

            {/* Footer actions */}
            <View style={[styles.footerRow, isWeb && styles.webFooterRow]}>
              <TouchableOpacity
                onPress={() => (phone ? handleCall(phone) : null)}
                style={[styles.callBtn, isWeb && styles.webCallBtn]}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={isWeb ? 16 : 14} color="#fff" />
                <Text
                  style={[styles.callBtnText, isWeb && styles.webCallBtnText]}
                >
                  Call
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOpenDetails(item)}
                style={[styles.detailsBtn, isWeb && styles.webDetailsBtn]}
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.detailsText, isWeb && styles.webDetailsText]}
                >
                  Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [cardWidth, cardGap, expandedIds, handleCall, handleOpenDetails]
  );

  const keyExtractor = useCallback((item, index) => {
    return String(item._id || item.id || index);
  }, []);

  const listEmpty = useMemo(
    () => (
      <View style={[styles.emptyContainer, isWeb && styles.webEmptyContainer]}>
        <Text style={[styles.emptyText, isWeb && styles.webEmptyText]}>
          {loading ? "Loading..." : "No businesses found"}
        </Text>
        {!loading && (
          <TouchableOpacity
            style={[styles.clearFilterBtn, isWeb && styles.webClearFilterBtn]}
            onPress={() => {
              setSearchPincode("");
              fetchNearbyBusinesses("");
            }}
          >
            <Text
              style={[
                styles.clearFilterText,
                isWeb && styles.webClearFilterText,
              ]}
            >
              Clear filter
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [loading, fetchNearbyBusinesses, isWeb]
  );

  return (
    <View style={[styles.container, isWeb && styles.webContainer]}>
      <View style={{ marginTop: isWeb ? 20 : 35 }}>
        <Header />
      </View>

      <View style={[styles.headerSection, isWeb && styles.webHeaderSection]}>
        <Text style={[styles.heading, isWeb && styles.webHeading]}>
          Nearby Businesses
        </Text>

        <View
          style={[styles.searchContainer, isWeb && styles.webSearchContainer]}
        >
          <View style={[styles.searchBox, isWeb && styles.webSearchBox]}>
            <Ionicons name="search" size={isWeb ? 22 : 18} color="#64748b" />
            <TextInput
              placeholder="Enter Pincode"
              style={[styles.input, isWeb && styles.webInput]}
              value={searchPincode}
              onChangeText={setSearchPincode}
              keyboardType="numeric"
              maxLength={6}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.searchBtn,
              isSearching && styles.searchBtnDisabled,
              isWeb && styles.webSearchBtn,
            ]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={[styles.searchBtnText, isWeb && styles.webSearchBtnText]}
              >
                Search
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View
          style={[styles.loadingContainer, isWeb && styles.webLoadingContainer]}
        >
          <ActivityIndicator size={isWeb ? "large" : "large"} color="#2563eb" />
          <Text style={[styles.loadingText, isWeb && styles.webLoadingText]}>
            Loading nearby businesses...
          </Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={keyExtractor}
          renderItem={renderCard}
          numColumns={numColumns}
          columnWrapperStyle={
            isWeb ? null : { justifyContent: "space-between" }
          }
          contentContainerStyle={[
            styles.listContent,
            isWeb && styles.webListContent,
            { paddingBottom: 40 },
          ]}
          ListEmptyComponent={listEmpty}
          showsVerticalScrollIndicator={isWeb}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          removeClippedSubviews
          initialNumToRender={isWeb ? 12 : 6}
          windowSize={isWeb ? 10 : 7}
          maxToRenderPerBatch={isWeb ? 15 : 8}
          updateCellsBatchingPeriod={50}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f8fa",
    padding: 12,
  },
  webContainer: {
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 40,
    paddingTop: 20,
  },

  headerSection: {
    marginBottom: 20,
  },
  webHeaderSection: {
    marginBottom: 40,
    alignItems: "center",
  },

  heading: {
    fontSize: 22,
    fontWeight: "700",
    margin: 16,
    textAlign: "center",
    color: "#1e293b",
  },
  webHeading: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 24,
    color: "#0f172a",
  },

  searchContainer: {
    flexDirection: "column",
  },
  webSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 12,
    height: 45,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  webSearchBox: {
    flex: 1,
    height: 52,
    borderRadius: 30,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    backgroundColor: "white",
  },

  input: {
    flex: 1,
    marginLeft: 6,
    fontSize: 16,
  },
  webInput: {
    fontSize: 18,
    marginLeft: 12,
  },

  searchBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 45,
  },
  webSearchBtn: {
    marginTop: 0,
    height: 52,
    width: 150,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#2563eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchBtnDisabled: { backgroundColor: "#94a3b8" },

  searchBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  webSearchBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },

  // Card Styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  webCard: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    transition: "transform 0.2s ease",
  },

  bannerWrap: {
    height: 110,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  webBannerWrap: {
    height: 140,
  },

  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  bannerPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#eef2ff",
  },

  avatarContainer: {
    position: "absolute",
    bottom: -28,
    left: 16,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  webAvatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    bottom: -32,
    left: 20,
    borderWidth: 5,
  },

  avatar: { width: 64, height: 64, borderRadius: 32 },
  webAvatar: { width: 74, height: 74, borderRadius: 37 },

  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e6eefc",
    alignItems: "center",
    justifyContent: "center",
  },
  webAvatarFallback: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#dbeafe",
  },

  avatarInitials: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 18,
  },
  webAvatarInitials: {
    fontSize: 22,
    fontWeight: "800",
  },

  cardBody: {
    paddingTop: 36,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  webCardBody: {
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  nameText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  webNameText: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },

  taglineText: {
    color: "#64748b",
    fontSize: 13,
    marginBottom: 8,
  },
  webTaglineText: {
    fontSize: 14,
    marginBottom: 12,
  },

  description: {
    fontSize: 13,
    color: "#334155",
    marginBottom: 10,
    lineHeight: 18,
  },
  webDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  webInfoRow: {
    marginBottom: 8,
  },

  phoneText: {
    marginLeft: 8,
    color: "#10b981",
    fontWeight: "700",
  },
  webPhoneText: {
    fontSize: 15,
    fontWeight: "800",
  },

  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  webPinRow: {
    marginBottom: 12,
  },

  pinLabel: {
    color: "#64748b",
    marginLeft: 6,
    marginRight: 4,
  },
  webPinLabel: {
    fontSize: 14,
  },

  pinValue: {
    marginLeft: 0,
    color: "#111827",
    fontWeight: "700",
  },
  webPinValue: {
    fontSize: 15,
    fontWeight: "800",
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webFooterRow: {
    marginTop: 8,
  },

  callBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  webCallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },

  callBtnText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },
  webCallBtnText: {
    fontSize: 15,
    marginLeft: 10,
  },

  detailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6eefc",
  },
  webDetailsBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },

  detailsText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  webDetailsText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#334155",
  },

  // List Content
  listContent: {
    marginTop: 15,
    paddingBottom: 20,
  },
  webListContent: {
    marginTop: 30,
    gap: 20,
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  webLoadingContainer: {
    marginTop: 100,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "gray",
  },
  webLoadingText: {
    fontSize: 18,
    color: "#64748b",
    marginTop: 16,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  webEmptyContainer: {
    marginTop: 100,
    padding: 40,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    maxWidth: 600,
    alignSelf: "center",
  },

  emptyText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
  },
  webEmptyText: {
    fontSize: 20,
    color: "#475569",
    marginBottom: 20,
  },

  clearFilterBtn: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  webClearFilterBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#2563eb",
    borderRadius: 10,
  },

  clearFilterText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  webClearFilterText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
