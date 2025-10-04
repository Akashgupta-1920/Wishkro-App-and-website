// src/screens/HomeScreen.js
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { useAuth } from "../../../context/AuthContext";
import Header from "../../components/Header";
import api from "../../utils/auth";

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

/**
 * Robust pin extraction helper:
 * tries many common keys and nested objects for pincode/postalCode/pin/pinCode
 * Returns either the raw string or null.
 */
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

  // direct keys on root
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

  // check nested likely objects
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

  // sometimes item has an array of addresses or locations
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

  // fallback: try to find any value in object values that looks like a pin (6-digit)
  const values = JSON.stringify(item);
  const match = values.match(/([1-9][0-9]{5})/); // first 6-digit starting 1-9
  if (match) return match[1];

  return null;
};

export default function HomeScreen() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [businesses, setBusinesses] = useState([]); // raw objects
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchPincode, setSearchPincode] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // which items have expanded "show more"
  const [expandedIds, setExpandedIds] = useState(() => new Set());

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

        // Ensure items are objects and not null
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

  // card sizing
  const { width } = Dimensions.get("window");
  const horizontalPadding = 12 * 2;
  const gutter = 12;
  const cardWidth = Math.floor((width - horizontalPadding - gutter) / 2);

  // toggle expand
  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // render concise card with banner + circular avatar and details
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

      // NEW: robust pin extraction
      const rawPin = getPinFromItem(item);
      // If we got a pin-like string, use the first 6 digits; otherwise null
      let displayPin = null;
      if (rawPin) {
        const digits = String(rawPin).match(/\d+/g)?.join("") || String(rawPin);
        if (digits && digits.length >= 6) displayPin = digits.slice(0, 6);
        else displayPin = String(rawPin).slice(0, 6);
      }

      const address =
        item.address || item.locationAddress || item.line || item.street || "";
      const rating = item.rating || item.avgRating || item.stars || null;

      // businessDescription (tries several keys)
      const businessDescription =
        item.businessDescription ||
        item.description ||
        item.about ||
        item.summary ||
        item.shortDescription ||
        "";

      // images (try common keys)
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

      // create initials fallback for avatar
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
          style={[styles.card, { width: cardWidth }]}
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

            {/* circular avatar overlaps */}
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
            <Text style={styles.nameText} numberOfLines={1}>
              {title}
            </Text>

            {/* NEW: business description (shows truncated unless expanded) */}
            {businessDescription ? (
              <Text
                style={styles.description}
                numberOfLines={expanded ? 6 : 2}
                ellipsizeMode="tail"
              >
                {shortText(businessDescription, expanded ? 500 : 120)}
              </Text>
            ) : null}

            {/* subtitle / tagline */}
            {subtitle ? (
              <Text style={styles.taglineText} numberOfLines={1}>
                {shortText(subtitle, 60)}
              </Text>
            ) : null}

            {/* phone row */}
            <View style={styles.infoRow}>
              <Ionicons name="call" size={16} color="#10b981" />
              <Text style={styles.phoneText}>{phone || "No phone"}</Text>
            </View>

            {/* pincode row - now robustly extracted */}
            <View style={styles.pinRow}>
              <MaterialIcons name="place" size={14} color="#ef4444" />
              <Text style={styles.pinLabel}>Pincode:</Text>
              <Text style={styles.pinValue}>
                {displayPin ? String(displayPin) : "—"}
              </Text>
            </View>

            {/* footer actions */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => (phone ? handleCall(phone) : null)}
                style={styles.callBtn}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={14} color="#fff" />
                <Text style={styles.callBtnText}>Call</Text>
              </TouchableOpacity>

              <View style={styles.rightActions}>
                {/* <TouchableOpacity
                  onPress={() => toggleExpand(id)}
                  style={styles.showMoreBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.showMoreText}>
                    {expanded ? "Hide" : "Show more"}
                  </Text>
                </TouchableOpacity> */}

                <TouchableOpacity
                  onPress={() => handleOpenDetails(item)}
                  style={styles.detailsBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.detailsText}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* expanded JSON (optional debug) */}
            {expanded && (
              <View style={styles.expandedJson}>
                <Text style={styles.jsonText}>
                  {JSON.stringify(item, null, 2)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [cardWidth, expandedIds, handleCall, handleOpenDetails, toggleExpand]
  );

  const keyExtractor = useCallback((item, index) => {
    return String(item._id || item.id || index);
  }, []);

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {loading ? "Loading..." : "No businesses found"}
        </Text>
        {!loading && (
          <TouchableOpacity
            style={{ marginTop: 8 }}
            onPress={() => {
              setSearchPincode("");
              fetchNearbyBusinesses("");
            }}
          >
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>
              Clear filter
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [loading, fetchNearbyBusinesses]
  );

  return (
    <View style={styles.container}>
      <View style={{ marginTop: 35 }}>
        <Header />
      </View>

      <Text style={styles.heading}>Nearby Businesses</Text>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} />
        <TextInput
          placeholder="Enter Pincode"
          style={styles.input}
          value={searchPincode}
          onChangeText={setSearchPincode}
          keyboardType="numeric"
          maxLength={6}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
      </View>

      <TouchableOpacity
        style={[styles.searchBtn, isSearching && styles.searchBtnDisabled]}
        onPress={handleSearch}
        disabled={isSearching}
      >
        {isSearching ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.searchBtnText}>Search</Text>
        )}
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading nearby businesses...</Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={keyExtractor}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ marginTop: 15, paddingBottom: 20 }}
          ListEmptyComponent={listEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          removeClippedSubviews
          initialNumToRender={6}
          windowSize={7}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fa", padding: 12 },
  heading: { fontSize: 22, fontWeight: "700", margin: 16, textAlign: "center" },
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
  input: { flex: 1, marginLeft: 6 },
  searchBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 45,
  },
  searchBtnDisabled: { backgroundColor: "#94a3b8" },
  searchBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },

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

  /* banner & avatar */
  bannerWrap: {
    height: 110,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
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
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e6eefc",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#0f172a", fontWeight: "700", fontSize: 18 },

  cardBody: {
    paddingTop: 36, // space for overlapping avatar
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  taglineText: { color: "#64748b", fontSize: 13, marginBottom: 8 },

  description: {
    fontSize: 13,
    color: "#334155",
    marginBottom: 10,
    lineHeight: 18,
  },

  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  phoneText: { marginLeft: 8, color: "#10b981", fontWeight: "700" },

  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    // make pin visually light
  },
  pinLabel: { color: "#64748b", marginLeft: 6, marginRight: 4 },
  pinValue: { marginLeft: 0, color: "#111827", fontWeight: "700" },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  callBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  callBtnText: { color: "#fff", fontWeight: "700", marginLeft: 8 },

  rightActions: { flexDirection: "row", alignItems: "center" },
  showMoreBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  showMoreText: { color: "#2563eb", fontWeight: "600" },

  detailsBtn: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6eefc",
  },
  detailsText: { color: "#0f172a", fontWeight: "700" },

  expandedJson: {
    marginTop: 10,
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
  },
  jsonText: { fontSize: 11, color: "#0f172a" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "gray" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: { fontSize: 16, color: "gray", textAlign: "center" },
});
