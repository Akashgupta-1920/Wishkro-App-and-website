import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router"; // ⬅️ no Stack here
import { useNavigation } from "@react-navigation/native"; // ⬅️ add this
import api, { API_BASE } from "../../utils/auth";

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
          style={{ paddingHorizontal: 8, paddingVertical: 4 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} />
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

    const load = async () => {
      if (!businessId) return;
      try {
        setLoading(true);
        const { data } = await api.get(`/api/business/${businessId}`, {
          ...(controller ? { signal: controller.signal } : {}),
          timeout: 15000,
        });
        const record = data?.data || data;
        if (!aborted && record) setRaw(record); // full record
      } catch (err) {
        if (
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED"
        )
          return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load business details";
        Alert.alert("Error", msg);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    load();
    return () => {
      aborted = true;
      controller?.abort?.();
    };
  }, [businessId]);

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

  // 🔹 NEW: flattened view of raw for “More Details”
  const flatRaw = useMemo(() => flattenObject(raw), [raw]);

  const onCall = () => {
    const cleaned = String(model.phone || "").replace(/[^\d+]/g, "");
    if (cleaned) Linking.openURL(`tel:${cleaned}`);
  };
  const onEmail = () => {
    if (model.email) Linking.openURL(`mailto:${model.email}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.cover}>
        {model.image ? (
          <Image source={{ uri: model.image }} style={styles.coverImg} />
        ) : (
          <View style={styles.coverFallback}>
            <Ionicons name="business" size={44} color="#9ca3af" />
          </View>
        )}
      </View>

      <Text style={styles.title}>{L(model.name)}</Text>
      <Text style={styles.desc}>{L(model.desc)}</Text>

      {loading && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <ActivityIndicator />
          <Text style={{ color: "#6b7280" }}>Fetching latest details…</Text>
        </View>
      )}

      <View style={styles.actions}>
        {!!model.phone && (
          <TouchableOpacity style={styles.actionBtn} onPress={onCall}>
            <Ionicons name="call" size={16} color="#fff" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
        )}
        {!!model.email && (
          <TouchableOpacity style={styles.actionBtn} onPress={onEmail}>
            <Ionicons name="mail" size={16} color="#fff" />
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
        )}
      </View>

      <Card title="Business Info">
        <Row
          icon={<FontAwesome5 name="briefcase" size={14} color="#4b5563" />}
          label="Type"
          value={L(model.type)}
        />
        <Row
          icon={<Ionicons name="pricetags" size={16} color="#4b5563" />}
          label="Category"
          value={L(model.category)}
        />
        <Row
          icon={<Ionicons name="calendar" size={16} color="#4b5563" />}
          label="Since"
          value={L(model.year)}
        />
        <Row
          icon={<Ionicons name="call" size={16} color="#4b5563" />}
          label="Phone"
          value={L(model.phone)}
        />
        <Row
          icon={<Ionicons name="mail" size={16} color="#4b5563" />}
          label="Email"
          value={L(model.email)}
        />
        <Row
          icon={<Ionicons name="document-text" size={16} color="#4b5563" />}
          label="GST"
          value={L(model.gst)}
        />
        <Row
          icon={<Ionicons name="card" size={16} color="#4b5563" />}
          label="PAN"
          value={L(model.pan)}
        />
        <Row
          icon={<Ionicons name="star" size={16} color="#4b5563" />}
          label="Rating"
          value={L(model.rating)}
        />
        <Row
          icon={<Ionicons name="chatbox-ellipses" size={16} color="#4b5563" />}
          label="Reviews"
          value={L(model.reviews)}
        />
        <Row
          icon={
            <Ionicons name="information-circle" size={16} color="#4b5563" />
          }
          label="Status"
          value={L(model.status)}
        />
      </Card>

      <Card title="Location">
        <Row
          icon={<MaterialIcons name="location-pin" size={18} color="#4b5563" />}
          label="Pincode"
          value={L(model.pincode)}
        />
        <Row
          icon={<Ionicons name="business" size={16} color="#4b5563" />}
          label="City"
          value={L(model.city)}
        />
        <Row
          icon={<Ionicons name="map" size={16} color="#4b5563" />}
          label="District"
          value={L(model.district)}
        />
        <Row
          icon={<Ionicons name="flag" size={16} color="#4b5563" />}
          label="Country"
          value={L(model.country)}
        />
        <Row
          icon={<Ionicons name="home" size={16} color="#4b5563" />}
          label="Address"
          value={L(model.address)}
        />
      </Card>

      <Card title="Owner">
        <Row
          icon={<Ionicons name="person" size={16} color="#4b5563" />}
          label="Name"
          value={L(model.ownerName)}
        />
        {raw.businessOwnerImage || raw.ownerImage ? (
          <View style={{ marginTop: 8 }}>
            <Image source={{ uri: model.ownerImage }} style={styles.ownerImg} />
          </View>
        ) : null}
      </Card>

      {/* 🔹 UPDATED: pass flatRaw so nested fields get shown */}
      <ExtraFields raw={flatRaw} pickedKeys={PICKED_KEYS} />
    </ScrollView>
  );
}

function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ icon, label, value }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function ExtraFields({ raw, pickedKeys }) {
  // raw is now a FLAT object of path->value. Keep your original filter.
  const entries = Object.entries(raw || {}).filter(
    ([k, v]) => !pickedKeys.has(k) && (typeof v !== "object" || v == null)
  );
  if (!entries.length) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>More Details</Text>
      {entries.map(([k, v]) => (
        <Row
          key={k}
          icon={<Ionicons name="ellipse-outline" size={12} color="#4b5563" />}
          label={labelize(k)}
          value={L(v)}
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
  container: { padding: 16, paddingBottom: 40 },
  cover: {
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
    marginBottom: 12,
  },
  coverImg: { width: "100%", height: "100%" },
  coverFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  desc: { fontSize: 14, color: "#6b7280", marginTop: 6, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 10, marginBottom: 14 },
  actionBtn: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: { color: "#fff", fontWeight: "700" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.07)",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111827",
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 90 },
  rowLabel: { fontSize: 13, color: "#374151", fontWeight: "600" },
  rowValue: { fontSize: 13, color: "#6b7280", flex: 1, textAlign: "right" },
  ownerImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
});
