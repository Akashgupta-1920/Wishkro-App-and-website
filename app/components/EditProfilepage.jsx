// EditProfile.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import axios from "axios";

//  Hints + Reusable hint component
const EMAIL_HINT = "Valid email like user@example.com";
const PHONE_HINT = "Indian mobile: 10 digits starting 6-9 (e.g., 9876543210)";
const PIN_HINT = "Indian PIN: 6 digits, cannot start with 0 (e.g., 560001)";
const PAN_HINT = "PAN: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)";
const IFSC_HINT = "IFSC: 4 letters + 0 + 6 alphanumerics (e.g., HDFC0001234)";
const DOB_HINT = "DOB format: DD/MM/YYYY";

const FieldHint = ({ text, valid, show = true }) => {
  if (!show) return null;
  let color = "#6b7280"; // gray default
  if (valid === true) color = "#16a34a"; // green
  if (valid === false) color = "#dc2626"; // red
  return (
    <View style={styles.hintRow}>
      <Text style={[styles.hintText, { color }]}>
        {text}
        {valid === true ? " ✓" : valid === false ? " ✗" : ""}
      </Text>
    </View>
  );
};

//  Reusable Components
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType = "default",
  multiline = false,
  secureTextEntry = false,
  autoCapitalize,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>
      {icon}
      <Text style={styles.labelText}> {label}</Text>
    </Text>
    <TextInput
      style={[
        styles.textInput,
        multiline && { height: 80, textAlignVertical: "top" },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      keyboardType={keyboardType}
      multiline={multiline}
      secureTextEntry={secureTextEntry}
      autoCapitalize={
        autoCapitalize ??
        (keyboardType === "email-address" || secureTextEntry ? "none" : "words")
      }
    />
  </View>
);

const SectionCard = ({ title, icon, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

//  Validators (match backend expectations)
const isEmail = (e) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());
const isPhoneIN = (p) => /^[6-9]\d{9}$/.test(String(p || "").trim());
const isPin = (pin) => /^[1-9][0-9]{5}$/.test(String(pin || "").trim());
const isPAN = (pan) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(pan || "").toUpperCase());
const isIFSC = (ifsc) =>
  /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(ifsc || "").toUpperCase());

// ---------------- Date helpers ----------------
// Parse DD/MM/YYYY -> ISO string (UTC midnight) or null if invalid
const parseDDMMYYYYToISO = (ddmmyyyy) => {
  if (!ddmmyyyy) return null;
  const m = String(ddmmyyyy)
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Use UTC to avoid timezone shifts
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString(); // e.g. "2003-04-30T00:00:00.000Z"
};

// Format ISO or Date-ish value to DD/MM/YYYY for display (safe)
const formatISOToDDMMYYYY = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return "";
  }
};

export default function EditProfile() {
  const { user, token, refreshProfile } = useAuth();
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // States (single name split into first/last)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState(""); // display as DD/MM/YYYY
  const [pan, setPan] = useState("");

  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [country, setCountry] = useState("");

  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  // NEW: password required by backend
  const [password, setPassword] = useState("");

  // Prefill from user (robust mapping)
  useEffect(() => {
    if (!user) return;

    const fullName =
      user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const parts = fullName.split(" ").filter(Boolean);
    setFirstName(parts.slice(0, -1).join(" ") || parts[0] || "");
    setLastName(parts.length > 1 ? parts[parts.length - 1] : "");

    setEmail(user.email || "");
    setPhone(user.phone || user.mobile || "");

    // If backend returned ISO date, format it to DD/MM/YYYY for UI
    const displayDob = formatISOToDDMMYYYY(
      user.DOB || user.dob || user.DOB || ""
    );
    setDob(displayDob);

    setPan((user.PAN || user.pan || "").toUpperCase());

    setAddressLine(user.address || "");
    setCity(user.city || "");
    setDistrict(user.district || "");
    setPinCode(user.pinCode || user.pincode || "");
    setCountry(user.country || "");

    setAccountNumber(user.accountNumber || "");
    setIfsc((user.IFSC || user.ifsc || "").toUpperCase());
    setBankName(user.bankName || "");
    setAccountHolderName(user.holderName || user.accountHolderName || "");
  }, [user]);

  // Track changes helper
  const trackChange = useCallback(
    (setter) => (value) => {
      setHasChanges(true);
      setter(value);
    },
    []
  );

  const validateBeforeSubmit = () => {
    // Name combine check
    if (!firstName.trim() && !lastName.trim()) return "Name is required";

    if (!email.trim()) return "Email is required";
    if (!isEmail(email)) return "Invalid email format";

    if (!password.trim()) return "Password is required";
    if (password.trim().length < 8)
      return "Password must be at least 8 characters";

    if (!phone.trim()) return "Phone is required";
    if (!isPhoneIN(phone)) return "Invalid phone number";

    if (!addressLine.trim()) return "Address is required";

    if (!pinCode.trim()) return "Pincode is required";
    if (!isPin(pinCode)) return "Invalid pincode";

    if (!city.trim()) return "City is required";
    if (!district.trim()) return "District is required";
    if (!country.trim()) return "Country is required";

    if (!dob.trim()) return "DOB is required";
    if (!parseDDMMYYYYToISO(dob))
      return "DOB must be a valid date in DD/MM/YYYY format";

    if (!pan.trim()) return "PAN is required";
    if (!isPAN(pan)) return "Invalid PAN format";

    if (ifsc.trim() && !isIFSC(ifsc)) return "Invalid IFSC format";

    return null;
  };

  // Save Handler
  const handleSave = async () => {
    if (!hasChanges) {
      Alert.alert("No Changes", "No changes were made to save.");
      return;
    }

    const validationError = validateBeforeSubmit();
    if (validationError) {
      Alert.alert("Validation Error", validationError);
      return;
    }

    if (!token) {
      Alert.alert("Authentication", "You must be logged in to update profile.");
      return;
    }

    setSaving(true);

    // Combine name
    const name = `${firstName} ${lastName}`.trim();

    // Convert DOB to ISO for backend
    const isoDOB = parseDDMMYYYYToISO(dob);

    const payload = {
      name,
      email: email.trim(),
      password: password.trim(),
      phone: phone.trim(),
      address: addressLine.trim(),
      pinCode: pinCode.trim(),
      district: district.trim(),
      city: city.trim(),
      country: country.trim(),
      DOB: isoDOB, // ISO string now
      PAN: pan.trim().toUpperCase(),
      accountNumber: accountNumber.trim() || undefined,
      IFSC: ifsc.trim().toUpperCase() || undefined,
      bankName: bankName.trim() || undefined,
      holderName: accountHolderName.trim() || undefined,
      inviterefferal: user?.inviterefferal || undefined,
    };

    try {
      // Debug log (remove in production)
      console.log("[EditProfile] Sending update payload:", payload);

      const response = await axios.put(
        "https://api.wishkro.com/api/user/updateuser",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 20000,
        }
      );

      console.log("[EditProfile] server response:", response?.data);

      // Prefer server success flag, else fallback to HTTP 2xx
      const success =
        response?.data?.success === true ||
        (response.status >= 200 && response.status < 300);

      if (success) {
        // Try to refresh profile from server so the app has updated data
        let refreshed = false;
        try {
          refreshed = await refreshProfile?.();
        } catch (e) {
          console.warn("refreshProfile error after update:", e);
        }

        Alert.alert(
          "Success",
          "Profile updated successfully!",
          [
            {
              text: "OK",
              onPress: async () => {
                // Prefer to navigate to the Profile screen.
                // Try push to a common /profile route; if that fails, fallback to back().
                try {
                  // small delay to allow context to settle
                  await new Promise((res) => setTimeout(res, 250));
                  // if you have a route named 'profile' in your router, this will go there
                  await router.back();
                } catch (navErr) {
                  console.warn("router.push('/profile') failed:", navErr);
                  try {
                    // fallback: just go back to previous screen
                    router.back();
                  } catch {
                    /* ignore */
                  }
                }
              },
            },
          ],
          { cancelable: false }
        );

        // Clear change-tracking and saving state
        setHasChanges(false);
      } else {
        const message =
          response?.data?.message || "Failed to update profile (server).";
        Alert.alert("Error", message);
      }
    } catch (error) {
      console.log(
        "[EditProfile] update error:",
        error?.response || error?.message || error
      );
      // Prefer server-provided error message
      const srvMsg =
        error?.response?.data?.message ||
        (typeof error?.response?.data === "string"
          ? error.response.data
          : null);
      if (srvMsg) {
        Alert.alert("Error", String(srvMsg));
      } else if (error.message && error.message.includes("timeout")) {
        Alert.alert(
          "Error",
          "Request timed out. Check your internet connection."
        );
      } else {
        Alert.alert("Error", "Network error. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: "#6b7280" }}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Personal Info */}
          <SectionCard
            title="Personal Information"
            icon={<Ionicons name="person" size={20} color="#2563eb" />}
          >
            <InputField
              label="First Name"
              value={firstName}
              onChangeText={trackChange(setFirstName)}
              placeholder="Enter first name"
              icon={<FontAwesome5 name="user" size={14} color="#6b7280" />}
            />
            <InputField
              label="Last Name"
              value={lastName}
              onChangeText={trackChange(setLastName)}
              placeholder="Enter last name"
              icon={<FontAwesome5 name="user" size={14} color="#6b7280" />}
            />

            <InputField
              label="Email"
              value={email}
              onChangeText={trackChange(setEmail)}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Ionicons name="mail" size={16} color="#6b7280" />}
            />
            <FieldHint
              text={EMAIL_HINT}
              valid={email ? isEmail(email) : null}
              show
            />

            <InputField
              label="Phone"
              value={phone}
              onChangeText={trackChange(setPhone)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              icon={<Ionicons name="call" size={16} color="#6b7280" />}
            />
            <FieldHint
              text={PHONE_HINT}
              valid={phone ? isPhoneIN(phone) : null}
              show
            />

            <InputField
              label="Password"
              value={password}
              onChangeText={trackChange(setPassword)}
              placeholder="Enter new password (min 8 chars)"
              secureTextEntry
              autoCapitalize="none"
              icon={<Ionicons name="lock-closed" size={16} color="#6b7280" />}
            />
            <FieldHint
              text={"At least 8 characters"}
              valid={password ? password.trim().length >= 8 : null}
              show
            />

            <InputField
              label="Date of Birth"
              value={dob}
              onChangeText={trackChange(setDob)}
              placeholder="DD/MM/YYYY"
              icon={
                <MaterialCommunityIcons
                  name="calendar"
                  size={16}
                  color="#6b7280"
                />
              }
            />
            <FieldHint
              text={DOB_HINT}
              valid={dob ? !!parseDDMMYYYYToISO(dob) : null}
              show
            />

            <InputField
              label="PAN Number"
              value={pan}
              onChangeText={(v) => {
                setHasChanges(true);
                setPan(String(v || "").toUpperCase());
              }}
              placeholder="Enter PAN number"
              icon={<FontAwesome5 name="id-card" size={14} color="#6b7280" />}
            />
            <FieldHint text={PAN_HINT} valid={pan ? isPAN(pan) : null} show />
          </SectionCard>

          {/* Address Info */}
          <SectionCard
            title="Address Information"
            icon={
              <MaterialIcons name="location-on" size={20} color="#059669" />
            }
          >
            <InputField
              label="Address"
              value={addressLine}
              onChangeText={trackChange(setAddressLine)}
              placeholder="Enter full address"
              multiline={true}
              icon={<Ionicons name="home" size={16} color="#6b7280" />}
            />
            <InputField
              label="City"
              value={city}
              onChangeText={trackChange(setCity)}
              placeholder="Enter city"
              icon={
                <MaterialIcons name="location-city" size={16} color="#6b7280" />
              }
            />
            <InputField
              label="District"
              value={district}
              onChangeText={trackChange(setDistrict)}
              placeholder="Enter district"
              icon={<Ionicons name="map" size={16} color="#6b7280" />}
            />

            <InputField
              label="PIN Code"
              value={pinCode}
              onChangeText={trackChange(setPinCode)}
              placeholder="Enter PIN code"
              keyboardType="numeric"
              icon={
                <MaterialIcons name="location-pin" size={18} color="#ef4444" />
              }
            />
            <FieldHint
              text={PIN_HINT}
              valid={pinCode ? isPin(pinCode) : null}
              show
            />

            <InputField
              label="Country"
              value={country}
              onChangeText={trackChange(setCountry)}
              placeholder="Enter country"
              icon={<Ionicons name="flag" size={16} color="#6b7280" />}
            />
          </SectionCard>

          {/* Bank Info */}
          <SectionCard
            title="Bank Details"
            icon={
              <MaterialCommunityIcons name="bank" size={20} color="#7c3aed" />
            }
          >
            <InputField
              label="Account Number"
              value={accountNumber}
              onChangeText={trackChange(setAccountNumber)}
              placeholder="Enter bank account number"
              keyboardType="numeric"
              icon={
                <MaterialCommunityIcons
                  name="card-text-outline"
                  size={16}
                  color="#6b7280"
                />
              }
            />

            <InputField
              label="IFSC Code"
              value={ifsc}
              onChangeText={(v) => {
                setHasChanges(true);
                setIfsc(String(v || "").toUpperCase());
              }}
              placeholder="Enter IFSC code"
              icon={
                <MaterialCommunityIcons
                  name="numeric"
                  size={16}
                  color="#6b7280"
                />
              }
            />
            <FieldHint
              text={IFSC_HINT}
              valid={ifsc ? isIFSC(ifsc) : null}
              show
            />

            <InputField
              label="Bank Name"
              value={bankName}
              onChangeText={trackChange(setBankName)}
              placeholder="Enter bank name"
              icon={
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={16}
                  color="#6b7280"
                />
              }
            />
            <InputField
              label="Account Holder Name"
              value={accountHolderName}
              onChangeText={trackChange(setAccountHolderName)}
              placeholder="Enter account holder name"
              icon={
                <MaterialCommunityIcons
                  name="account-outline"
                  size={16}
                  color="#6b7280"
                />
              }
            />
          </SectionCard>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!hasChanges || saving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.saveButtonText}>Saving...</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>
                {hasChanges ? "Save Changes" : "No Changes"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------- Styles ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1f2937" },
  headerRight: { width: 40 },
  keyboardContainer: { flex: 1 },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
  inputGroup: { paddingHorizontal: 16, paddingVertical: 8 },
  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  labelText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#ffffff",
    minHeight: 44,
  },
  // Hints
  hintRow: { paddingHorizontal: 16, marginTop: -4, marginBottom: 8 },
  hintText: { fontSize: 12, lineHeight: 16 },

  saveButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  savingContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
});
