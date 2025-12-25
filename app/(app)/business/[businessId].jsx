import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api, { API_BASE } from "../../utils/auth";

const isWeb = Platform.OS === "web";
const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = screenWidth >= 1024;

const L = (v) => (v == null || v === "" ? "—" : String(v));
const normalizeUrl = (u) => {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_BASE.replace(/\/+$/, "")}/${String(u).replace(/^\/+/, "")}`;
};
const toStr = (v) => (Array.isArray(v) ? v[0] : v ?? "");

// 🔹 NEW: flatten nested objects/arrays into dot paths, so they can be shown
function flattenObject(obj, prefix = "", out = {}) {
  if (obj == null) return out;
  Object.entries(obj).forEach(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v == null) {
      out[path] = v;
    } else if (Array.isArray(v)) {
      // show arrays as comma-separated (stringify objects inside arrays)
      out[path] = v
        .map((x) =>
          typeof x === "object" && x !== null ? JSON.stringify(x) : String(x)
        )
        .join(", ");
    } else if (typeof v === "object") {
      flattenObject(v, path, out);
    } else {
      out[path] = v;
    }
  });
  return out;
}

const PICKED_KEYS = new Set([
  "businessName",
  "name",
  "businessDescription",
  "description",
  "businessPhone",
  "phone",
  "contactNumber",
  "businessEmail",
  "email",
  "businessType",
  "type",
  "businessCategory",
  "category",
  "businessYear",
  "year",
  "businessGst",
  "gst",
  "businessPan",
  "pan",
  "businessPincode",
  "pincode",
  "pinCode",
  "postalCode",
  "businessCity",
  "city",
  "businessDistrict",
  "district",
  "businessCountry",
  "country",
  "businessAddress",
  "address",
  "addressLine1",
  "addressLine2",
  "businessOwnerName",
  "ownerName",
  "owner",
  "contactPerson",
  "businessOwnerImage",
  "ownerImage",
  "businessImage",
  "image",
  "businessRating",
  "rating",
  "businessReviews",
  "reviews",
  "businessStatus",
  "status",
  "_id",
  "id",
]);

export default function BusinessDetails() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  // header back button (Drawer/Stack safe)
  useEffect(() => {
    navigation.setOptions({
      title: "Business Details",
      headerShadowVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, isWeb && styles.webBackButton]}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={isWeb ? 28 : 24} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

  const businessId =
    toStr(params.businessId) || toStr(params.id) || toStr(params._id);

  // If the list passed a trimmed fallback, we'll still fetch full by id.
  const fallbackObj = useMemo(() => {
    try {
      const s = toStr(params.fallback);
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  }, [params.fallback]);

  const [raw, setRaw] = useState(fallbackObj || {});
  const [loading, setLoading] = useState(!!businessId);

  useEffect(() => {
    let aborted = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    // If caller supplied a fallback object (from navigation) we prefer that and skip fetch.
    const hasFallback = !!(fallbackObj && Object.keys(fallbackObj).length > 0);

    // only fetch if we have a businessId AND no useful fallback
    if (!businessId || hasFallback) {
      if (__DEV__) {
        console.log(
          "[BusinessDetails] fetch skipped",
          "businessId:",
          businessId,
          "hasFallback:",
          hasFallback
        );
      }
      // If there is a fallback, ensure the UI uses it (it already does via initial state)
      // and early return — no need to make network calls that produce 404 logs.
      setLoading(Boolean(businessId && !hasFallback));
      return () => {
        aborted = true;
        controller?.abort?.();
      };
    }

    const tryEndpoints = [
      (id) => `/api/business/${id}`,
      (id) => `/api/businesses/${id}`,
      (id) => `/api/business/detail/${id}`,
      (id) => `/api/businesses/detail/${id}`,
    ];

    const load = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      if (__DEV__) console.log("[BusinessDetails] API_BASE:", API_BASE);

      let lastError = null;

      for (let buildUrl of tryEndpoints) {
        const path = buildUrl(businessId);
        if (__DEV__) console.log("[BusinessDetails] attempting:", path);

        try {
          const { data } = await api.get(path, {
            ...(controller ? { signal: controller.signal } : {}),
            timeout: 15000,
          });

          const record = data?.data || data;
          if (!aborted && record) {
            setRaw(record);
            lastError = null;
            break; // got data -> done
          }
        } catch (err) {
          lastError = err;

          // helpful debug logging
          const status = err?.response?.status;
          const serverMsg =
            err?.response?.data?.message ||
            (err?.response?.data && typeof err.response.data === "string"
              ? err.response.data
              : err?.message);

          console.warn(
            `[BusinessDetails] attempt failed (${path}) status=${status} message=`,
            serverMsg
          );

          // continue on 404 to try next candidate; stop on other statuses
          if (status && status !== 404) break;
        }

        if (aborted) return;
      }

      // Show alert only if we have no data at all (no fallback and no successful fetch)
      if (!aborted && lastError && !fallbackObj) {
        const status = lastError?.response?.status;
        const msg =
          lastError?.response?.data?.message ||
          lastError?.message ||
          "Failed to load business details";
        Alert.alert(
          "Error",
          status === 404
            ? "Business not found (404). Please check the business ID or the API path."
            : `Error: ${String(msg)}`
        );
      }

      if (!aborted) setLoading(false);
    };

    load();

    return () => {
      aborted = true;
      controller?.abort?.();
    };
  }, [businessId, fallbackObj]);

  const model = useMemo(() => {
    const r = raw || {};
    const name = r.businessName || r.name || "Business";
    const desc =
      r.businessDescription || r.description || "No description available";
    const phone = r.businessPhone || r.phone || r.contactNumber;
    const email = r.businessEmail || r.email;

    const type = r.businessType || r.type || r.category;
    const category = r.businessCategory || r.category;
    const year = r.businessYear || r.year;
    const gst = r.businessGst || r.gst;
    const pan = r.businessPan || r.pan;

    const pincode = r.businessPincode || r.pincode || r.pinCode || r.postalCode;
    const city = r.businessCity || r.city;
    const district = r.businessDistrict || r.district;
    const country = r.businessCountry || r.country;

    const address =
      r.businessAddress ||
      r.address ||
      [r.addressLine1, r.addressLine2, city, district, pincode, country]
        .filter(Boolean)
        .join(", ");

    const ownerName =
      r.businessOwnerName || r.ownerName || r.owner || r.contactPerson;
    const ownerImage = normalizeUrl(r.businessOwnerImage || r.ownerImage);
    const image = normalizeUrl(r.businessImage || r.image);

    const rating = r.businessRating || r.rating;
    const reviews = r.businessReviews || r.reviews;
    const status = r.businessStatus || r.status;

    return {
      name,
      desc,
      phone,
      email,
      type,
      category,
      year,
      gst,
      pan,
      pincode,
      city,
      district,
      country,
      address,
      ownerName,
      ownerImage,
      image,
      rating,
      reviews,
      status,
    };
  }, [raw]);

  // 🔹 NEW: flattened view of raw for "More Details"
  const flatRaw = useMemo(() => flattenObject(raw), [raw]);

  const onCall = () => {
    const cleaned = String(model.phone || "").replace(/[^\d+]/g, "");
    if (cleaned) Linking.openURL(`tel:${cleaned}`);
  };
  const onEmail = () => {
    if (model.email) Linking.openURL(`mailto:${model.email}`);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, isWeb && styles.webContainer]}
    >
      <View style={[styles.cover, isWeb && styles.webCover]}>
        {model.image ? (
          <Image
            source={{ uri: model.image }}
            style={[styles.coverImg, isWeb && styles.webCoverImg]}
          />
        ) : (
          <View
            style={[styles.coverFallback, isWeb && styles.webCoverFallback]}
          >
            <Ionicons name="business" size={isWeb ? 80 : 44} color="#9ca3af" />
          </View>
        )}
      </View>

      <Text style={[styles.title, isWeb && styles.webTitle]}>
        {L(model.name)}
      </Text>
      <Text style={[styles.desc, isWeb && styles.webDesc]}>
        {L(model.desc)}
      </Text>

      {loading && (
        <View
          style={[styles.loadingContainer, isWeb && styles.webLoadingContainer]}
        >
          <ActivityIndicator size={isWeb ? "large" : "small"} />
          <Text style={[styles.loadingText, isWeb && styles.webLoadingText]}>
            Fetching latest details…
          </Text>
        </View>
      )}

      <View style={[styles.actions, isWeb && styles.webActions]}>
        {!!model.phone && (
          <TouchableOpacity
            style={[styles.actionBtn, isWeb && styles.webActionBtn]}
            onPress={onCall}
          >
            <Ionicons name="call" size={isWeb ? 20 : 16} color="#fff" />
            <Text style={[styles.actionText, isWeb && styles.webActionText]}>
              Call
            </Text>
          </TouchableOpacity>
        )}
        {!!model.email && (
          <TouchableOpacity
            style={[styles.actionBtn, isWeb && styles.webActionBtn]}
            onPress={onEmail}
          >
            <Ionicons name="mail" size={isWeb ? 20 : 16} color="#fff" />
            <Text style={[styles.actionText, isWeb && styles.webActionText]}>
              Email
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Card title="Business Info" isWeb={isWeb}>
        <Row
          icon={
            <FontAwesome5
              name="briefcase"
              size={isWeb ? 16 : 14}
              color="#4b5563"
            />
          }
          label="Type"
          value={L(model.type)}
          isWeb={isWeb}
        />
        <Row
          icon={
            <Ionicons name="pricetags" size={isWeb ? 18 : 16} color="#4b5563" />
          }
          label="Category"
          value={L(model.category)}
          isWeb={isWeb}
        />
        <Row
          icon={
            <Ionicons name="calendar" size={isWeb ? 18 : 16} color="#4b5563" />
          }
          label="Since"
          value={L(model.year)}
          isWeb={isWeb}
        />
        <Row
          icon={<Ionicons name="call" size={isWeb ? 18 : 16} color="#4b5563" />}
          label="Phone"
          value={L(model.phone)}
          isWeb={isWeb}
        />
        <Row
          icon={<Ionicons name="mail" size={isWeb ? 18 : 16} color="#4b5563" />}
          label="Email"
          value={L(model.email)}
          isWeb={isWeb}
        />
        <Row
          icon={
            <Ionicons
              name="document-text"
              size={isWeb ? 18 : 16}
              color="#4b5563"
            />
          }
          label="GST"
          value={L(model.gst)}
          isWeb={isWeb}
        />
        <Row
          icon={<Ionicons name="card" size={isWeb ? 18 : 16} color="#4b5563" />}
          label="PAN"
          value={L(model.pan)}
          isWeb={isWeb}
        />
        <Row
          icon={<Ionicons name="star" size={isWeb ? 18 : 16} color="#4b5563" />}
          label="Rating"
          value={L(model.rating)}
          isWeb={isWeb}
        />
        <Row
          icon={
            <Ionicons
              name="chatbox-ellipses"
              size={isWeb ? 18 : 16}
              color="#4b5563"
            />
          }
          label="Reviews"
          value={L(model.reviews)}
          isWeb={isWeb}
        />
        <Row
          icon={
            <Ionicons
              name="information-circle"
              size={isWeb ? 18 : 16}
              color="#4b5563"
            />
          }
          label="Status"
          value={L(model.status)}
          isWeb={isWeb}
        />
      </Card>

      <Card title="Location" isWeb={isWeb}>
        <Row
          icon={
            <MaterialIcons
              name="location-pin"
              size={isWeb ? 20 : 18}
              color="#4b5563"
            />
          }
          label="Pincode"
          value={L(model.pincode)}
          isWeb={isWeb}
        />
        <Row
          icon={
            <Ionicons name="business" size={isWeb ? 18 : 16} color="#4b5563" />
          }
          label="City"
          value={L(model.city)}
          isWeb={isWeb}
        />
        <Row
          icon={<Ionicons name="map" size={isWeb ? 18 : 16} color="#4b5563" />}
          label="District"
          value={L(model.district)}
          isWeb={isWeb}
        />
        <Row
          icon={<Ionicons name="flag" size={isWeb ? 18 : 16} color="#4b5563" />}
          label="Country"
          value={L(model.country)}
          isWeb={isWeb}
        />
        <Row
          icon={<Ionicons name="home" size={isWeb ? 18 : 16} color="#4b5563" />}
          label="Address"
          value={L(model.address)}
          isWeb={isWeb}
        />
      </Card>

      <Card title="Owner" isWeb={isWeb}>
        <Row
          icon={
            <Ionicons name="person" size={isWeb ? 18 : 16} color="#4b5563" />
          }
          label="Name"
          value={L(model.ownerName)}
          isWeb={isWeb}
        />
        {raw.businessOwnerImage || raw.ownerImage ? (
          <View style={{ marginTop: isWeb ? 16 : 8 }}>
            <Image
              source={{ uri: model.ownerImage }}
              style={[styles.ownerImg, isWeb && styles.webOwnerImg]}
            />
          </View>
        ) : null}
      </Card>

      {/* 🔹 UPDATED: pass flatRaw so nested fields get shown */}
      <ExtraFields raw={flatRaw} pickedKeys={PICKED_KEYS} isWeb={isWeb} />
    </ScrollView>
  );
}

function Card({ title, children, isWeb }) {
  return (
    <View style={[styles.card, isWeb && styles.webCard]}>
      <Text style={[styles.cardTitle, isWeb && styles.webCardTitle]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ icon, label, value, isWeb }) {
  return (
    <View style={[styles.row, isWeb && styles.webRow]}>
      <View style={[styles.rowLeft, isWeb && styles.webRowLeft]}>
        {icon}
        <Text style={[styles.rowLabel, isWeb && styles.webRowLabel]}>
          {label}
        </Text>
      </View>
      <Text
        style={[styles.rowValue, isWeb && styles.webRowValue]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function ExtraFields({ raw, pickedKeys, isWeb }) {
  // raw is now a FLAT object of path->value. Keep your original filter.
  const entries = Object.entries(raw || {}).filter(
    ([k, v]) => !pickedKeys.has(k) && (typeof v !== "object" || v == null)
  );
  if (!entries.length) return null;

  return (
    <View style={[styles.card, isWeb && styles.webCard]}>
      <Text style={[styles.cardTitle, isWeb && styles.webCardTitle]}>
        More Details
      </Text>
      {entries.map(([k, v]) => (
        <Row
          key={k}
          icon={
            <Ionicons
              name="ellipse-outline"
              size={isWeb ? 14 : 12}
              color="#4b5563"
            />
          }
          label={labelize(k)}
          value={L(v)}
          isWeb={isWeb}
        />
      ))}
    </View>
  );
}

const labelize = (k) =>
  k
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\./g, " / ") // pretty-print dotted paths
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#f8fafc",
  },
  webContainer: {
    maxWidth: isLargeScreen ? 1200 : "100%",
    alignSelf: "center",
    width: "100%",
    paddingTop: 24,
    paddingBottom: 80,
  },

  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  webBackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  cover: {
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    marginBottom: 12,
  },
  webCover: {
    height: 240,
    borderRadius: 16,
    marginBottom: 20,
  },

  coverImg: {
    width: "100%",
    height: "100%",
  },
  webCoverImg: {
    height: "100%",
  },

  coverFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  webCoverFallback: {
    height: 240,
  },

  title: {
    fontSize: 20,
    fontWeight: "1200",
  },
  webTitle: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },

  desc: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 12,
  },
  webDesc: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 26,
    paddingHorizontal: 20,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  webLoadingContainer: {
    justifyContent: "center",
    marginBottom: 20,
    gap: 12,
  },

  loadingText: {
    color: "#6b7280",
  },
  webLoadingText: {
    fontSize: 16,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  webActions: {
    justifyContent: "center",
    gap: 16,
    marginBottom: 30,
  },

  actionBtn: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  webActionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
    justifyContent: "center",
  },

  actionText: {
    color: "#fff",
    fontWeight: "700",
  },
  webActionText: {
    fontSize: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
  },
  webCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111827",
  },
  webCardTitle: {
    fontSize: 20,
    marginBottom: 12,
  },

  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  webRow: {
    paddingVertical: 12,
    minHeight: 48,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 90,
  },
  webRowLeft: {
    gap: 12,
    minWidth: 140,
  },

  rowLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
  },
  webRowLabel: {
    fontSize: 16,
    fontWeight: "700",
  },

  rowValue: {
    fontSize: 13,
    color: "#6b7280",
    flex: 1,
    textAlign: "right",
  },
  webRowValue: {
    fontSize: 16,
    fontWeight: "500",
  },

  ownerImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  webOwnerImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
});
