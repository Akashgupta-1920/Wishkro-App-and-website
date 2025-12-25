// // components/EditProfile.jsx

// import {
//   FontAwesome5,
//   Ionicons,
//   MaterialCommunityIcons,
//   MaterialIcons,
// } from "@expo/vector-icons";
// import axios from "axios";
// import * as Clipboard from "expo-clipboard";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useCallback, useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Dimensions,
//   KeyboardAvoidingView,
//   Linking,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useAuth } from "../../context/AuthContext";

// const isWeb = Platform.OS === "web";
// const { width: screenWidth } = Dimensions.get("window");
// const isLargeScreen = screenWidth >= 1024;

// //  Hints + Reusable hint component
// const EMAIL_HINT = "Valid email like user@example.com";
// const PHONE_HINT = "Indian mobile: 10 digits starting 6-9 (e.g., 9876543210)";
// const PIN_HINT = "Indian PIN: 6 digits, cannot start with 0 (e.g., 560001)";
// const PAN_HINT = "PAN: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)";
// const IFSC_HINT = "IFSC: 4 letters + 0 + 6 alphanumerics (e.g., HDFC0001234)";
// const DOB_HINT = "DOB format: DD/MM/YYYY";

// /* ---------- SUPPORT CONTACTS (unchanging) ---------- */
// const SUPPORT_EMAIL = "support@wishkro.com";
// const B2B_EMAIL = "b2b@wishkro.com";
// const JOIN_EMAIL = "join@wishkro.com";
// const WHATSAPP_NUMBER = "9990876324";

// /* ---------- Small UI helpers ---------- */
// const FieldHint = ({ text, valid, show = true, isWeb }) => {
//   if (!show) return null;
//   let color = "#6b7280";
//   if (valid === true) color = "#16a34a";
//   if (valid === false) color = "#dc2626";
//   return (
//     <View style={[styles.hintRow, isWeb && styles.webHintRow]}>
//       <Text style={[styles.hintText, isWeb && styles.webHintText, { color }]}>
//         {text}
//         {valid === true ? " ✓" : valid === false ? " ✗" : ""}
//       </Text>
//     </View>
//   );
// };

// const InputField = ({
//   label,
//   value,
//   onChangeText,
//   placeholder,
//   icon,
//   keyboardType = "default",
//   multiline = false,
//   secureTextEntry = false,
//   autoCapitalize,
//   editable = true,
//   isWeb,
//   maxLength,
// }) => (
//   <View style={[styles.inputGroup, isWeb && styles.webInputGroup]}>
//     <Text style={[styles.inputLabel, isWeb && styles.webInputLabel]}>
//       {icon}
//       <Text style={[styles.labelText, isWeb && styles.webLabelText]}>
//         {" "}
//         {label}
//       </Text>
//     </Text>
//     <TextInput
//       style={[
//         styles.textInput,
//         isWeb && styles.webTextInput,
//         multiline && { height: isWeb ? 100 : 80, textAlignVertical: "top" },
//         !editable && styles.textInputDisabled,
//       ]}
//       value={value}
//       onChangeText={onChangeText}
//       placeholder={placeholder}
//       placeholderTextColor="#9ca3af"
//       keyboardType={keyboardType}
//       multiline={multiline}
//       secureTextEntry={secureTextEntry}
//       autoCapitalize={
//         autoCapitalize ??
//         (keyboardType === "email-address" || secureTextEntry ? "none" : "words")
//       }
//       editable={editable}
//       selectTextOnFocus={editable}
//       maxLength={maxLength}
//     />
//   </View>
// );

// const SectionCard = ({ title, icon, children, isWeb }) => (
//   <View style={[styles.sectionCard, isWeb && styles.webSectionCard]}>
//     <View style={[styles.sectionHeader, isWeb && styles.webSectionHeader]}>
//       {icon}
//       <Text style={[styles.sectionTitle, isWeb && styles.webSectionTitle]}>
//         {title}
//       </Text>
//     </View>
//     {children}
//   </View>
// );

// //  Validators (match backend expectations)
// const isEmail = (e) =>
//   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());
// const isPhoneIN = (p) => /^[6-9]\d{9}$/.test(String(p || "").trim());
// const isPin = (pin) => /^[1-9][0-9]{5}$/.test(String(pin || "").trim());
// const isPAN = (pan) =>
//   /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(pan || "").toUpperCase());
// const isIFSC = (ifsc) =>
//   /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(ifsc || "").toUpperCase());

// // ---------------- Date helpers ----------------
// // Parse DD/MM/YYYY -> ISO string (UTC midnight) or null if invalid
// const parseDDMMYYYYToISO = (ddmmyyyy) => {
//   if (!ddmmyyyy) return null;
//   const m = String(ddmmyyyy)
//     .trim()
//     .match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
//   if (!m) return null;
//   const day = Number(m[1]);
//   const month = Number(m[2]);
//   const year = Number(m[3]);
//   if (month < 1 || month > 12 || day < 1 || day > 31) return null;
//   // Use UTC to avoid timezone shifts
//   const date = new Date(Date.UTC(year, month - 1, day));
//   if (
//     date.getUTCFullYear() !== year ||
//     date.getUTCMonth() !== month - 1 ||
//     date.getUTCDate() !== day
//   ) {
//     return null;
//   }
//   return date.toISOString(); // e.g. "2003-04-30T00:00:00.000Z"
// };

// // Format ISO or Date-ish value to DD/MM/YYYY for display (safe)
// const formatISOToDDMMYYYY = (iso) => {
//   if (!iso) return "";
//   try {
//     const d = new Date(iso);
//     if (Number.isNaN(d.getTime())) return "";
//     const day = String(d.getUTCDate()).padStart(2, "0");
//     const month = String(d.getUTCMonth() + 1).padStart(2, "0");
//     const year = d.getUTCFullYear();
//     return `${day}/${month}/${year}`;
//   } catch (e) {
//     return "";
//   }
// };

// const isEmpty = (v) => v === null || v === undefined || String(v).trim() === "";

// export default function EditProfile() {
//   const { user, token, refreshProfile } = useAuth();
//   const params = useLocalSearchParams();
//   const router = useRouter();

//   const initRef = useRef({});

//   const [saving, setSaving] = useState(false);
//   const [hasChanges, setHasChanges] = useState(false);

//   // States (single name split into first/last)
//   const [firstName, setFirstName] = useState("");
//   const [lastName, setLastName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [dob, setDob] = useState(""); // display as DD/MM/YYYY
//   const [pan, setPan] = useState("");

//   const [addressLine, setAddressLine] = useState("");
//   const [city, setCity] = useState("");
//   const [district, setDistrict] = useState("");
//   const [pinCode, setPinCode] = useState("");
//   const [country, setCountry] = useState("");

//   const [accountNumber, setAccountNumber] = useState("");
//   const [ifsc, setIfsc] = useState("");
//   const [bankName, setBankName] = useState("");
//   const [accountHolderName, setAccountHolderName] = useState("");

//   // NEW: password required by backend
//   const [password, setPassword] = useState("");

//   useEffect(() => {
//     if (__DEV__) {
//       console.log("[EditProfile] useAuth user:", user);
//       console.log("[EditProfile] route params:", params);
//     }
//   }, [user, params]);

//   // Prefill from user AND route params (params win if provided)
//   useEffect(() => {
//     const hasParams = params && Object.keys(params).length > 0;
//     if (!user && !hasParams) return;

//     let paramsKey = "";
//     try {
//       paramsKey = params ? JSON.stringify(params) : "";
//     } catch (e) {
//       paramsKey = String(params);
//     }
//     const userKey = user?.email || user?._id || "";
//     const key = `${paramsKey}::${userKey}`;

//     if (initRef.current[key]) return;

//     const pick = (k, fallback = "") => {
//       if (
//         params &&
//         params[k] !== undefined &&
//         params[k] !== null &&
//         String(params[k]) !== ""
//       )
//         return String(params[k]);
//       return fallback;
//     };

//     const fullName =
//       pick("name") ||
//       pick("fullName") ||
//       user?.name ||
//       `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

//     const parts = String(fullName || "")
//       .split(" ")
//       .filter(Boolean);

//     if (isEmpty(firstName)) {
//       setFirstName(
//         pick("firstName") || parts.slice(0, -1).join(" ") || parts[0] || ""
//       );
//     }
//     if (isEmpty(lastName)) {
//       setLastName(
//         pick("lastName") || (parts.length > 1 ? parts[parts.length - 1] : "")
//       );
//     }

//     if (isEmpty(email)) setEmail(pick("email", user?.email || ""));
//     if (isEmpty(phone))
//       setPhone(pick("phone", user?.phone || user?.mobile || ""));

//     const srcDob = pick("dob", user?.DOB || user?.dob || "");
//     if (isEmpty(dob)) {
//       setDob(
//         /^\d{2}\/\d{2}\/\d{4}$/.test(srcDob)
//           ? srcDob
//           : formatISOToDDMMYYYY(srcDob)
//       );
//     }

//     if (isEmpty(pan))
//       setPan((pick("pan", user?.PAN || user?.pan || "") || "").toUpperCase());

//     if (isEmpty(addressLine))
//       setAddressLine(pick("addressLine", user?.address || ""));
//     if (isEmpty(city)) setCity(pick("city", user?.city || ""));
//     if (isEmpty(district)) setDistrict(pick("district", user?.district || ""));
//     if (isEmpty(pinCode))
//       setPinCode(pick("pinCode", user?.pinCode || user?.pincode || ""));
//     if (isEmpty(country)) setCountry(pick("country", user?.country || ""));

//     if (isEmpty(accountNumber))
//       setAccountNumber(pick("accountNumber", user?.accountNumber || ""));
//     if (isEmpty(ifsc))
//       setIfsc(
//         (pick("ifsc", user?.IFSC || user?.ifsc || "") || "").toUpperCase()
//       );
//     if (isEmpty(bankName)) setBankName(pick("bankName", user?.bankName || ""));

//     const holderFromParams = pick("holderName", "");
//     const autoHolder = `${
//       pick("firstName") || parts.slice(0, -1).join(" ") || parts[0] || ""
//     }${
//       pick("lastName") || (parts.length > 1 ? parts[parts.length - 1] : "")
//         ? " " +
//           (pick("lastName") ||
//             (parts.length > 1 ? parts[parts.length - 1] : ""))
//         : ""
//     }`.trim();

//     if (isEmpty(accountHolderName)) {
//       setAccountHolderName(
//         holderFromParams ||
//           user?.holderName ||
//           user?.accountHolderName ||
//           autoHolder
//       );
//     }

//     initRef.current[key] = true;
//     setHasChanges(false);
//   }, [params, user]);

//   // Auto sync account holder with name if not manually overridden
//   useEffect(() => {
//     const auto = `${firstName}${lastName ? " " + lastName : ""}`.trim();
//     if (isEmpty(accountHolderName) || accountHolderName.trim() === auto) {
//       setAccountHolderName(auto);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [firstName, lastName]);

//   const trackChange = useCallback(
//     (setter) => (value) => {
//       setHasChanges(true);
//       setter(value);
//     },
//     []
//   );

//   const validateBeforeSubmit = () => {
//     if (!firstName.trim() && !lastName.trim()) return "Name is required";

//     if (!email.trim()) return "Email is required";
//     if (!isEmail(email)) return "Invalid email format";

//     if (!password.trim()) return "Password is required";
//     if (password.trim().length < 8)
//       return "Password must be at least 8 characters";

//     if (!phone.trim()) return "Phone is required";
//     if (!isPhoneIN(phone)) return "Invalid phone number";

//     if (!addressLine.trim()) return "Address is required";

//     if (!pinCode.trim()) return "Pincode is required";
//     if (!isPin(pinCode)) return "Invalid pincode";

//     if (!city.trim()) return "City is required";
//     if (!district.trim()) return "District is required";
//     if (!country.trim()) return "Country is required";

//     if (!dob.trim()) return "DOB is required";
//     if (!parseDDMMYYYYToISO(dob))
//       return "DOB must be a valid date in DD/MM/YYYY format";

//     if (!pan.trim()) return "PAN is required";
//     if (!isPAN(pan)) return "Invalid PAN format";

//     if (ifsc.trim() && !isIFSC(ifsc)) return "Invalid IFSC format";

//     return null;
//   };

//   // ---------- SUPPORT ACTIONS (minimal, safe) ----------
//   const openEmail = async (to, subject = "", body = "") => {
//     const mailto = `mailto:${encodeURIComponent(
//       to
//     )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
//     try {
//       const can = await Linking.canOpenURL(mailto);
//       if (!can) {
//         Alert.alert("Can't open mail app", "No mail client available.");
//         return;
//       }
//       await Linking.openURL(mailto);
//     } catch (e) {
//       console.warn("openEmail error:", e);
//       Alert.alert("Error", "Unable to open mail app.");
//     }
//   };

//   const openWhatsApp = async (phone, message = "") => {
//     const normalized = String(phone).replace(/[^\d]/g, "");
//     const text = encodeURIComponent(message || "Hi, I need support");
//     const scheme = `whatsapp://send?phone=${normalized}&text=${text}`;
//     const web = `https://wa.me/${normalized}?text=${text}`;
//     try {
//       if (Platform.OS !== "web") {
//         const canOpenScheme = await Linking.canOpenURL(scheme);
//         if (canOpenScheme) {
//           await Linking.openURL(scheme);
//           return;
//         }
//       }
//       const canOpenWeb = await Linking.canOpenURL(web);
//       if (canOpenWeb) {
//         await Linking.openURL(web);
//         return;
//       }
//       Alert.alert(
//         "Unable to open WhatsApp",
//         "Please install WhatsApp to chat."
//       );
//     } catch (e) {
//       console.warn("openWhatsApp error:", e);
//       Alert.alert("Error", "Unable to open WhatsApp.");
//     }
//   };

//   const copyToClipboard = async (value) => {
//     try {
//       await Clipboard.setStringAsync(String(value));
//       Alert.alert("Copied", "Copied to clipboard.");
//     } catch (e) {
//       console.warn("clipboard error:", e);
//       Alert.alert("Error", "Unable to copy.");
//     }
//   };

//   // Save Handler (unchanged)
//   const handleSave = async () => {
//     if (!hasChanges) {
//       Alert.alert("No Changes", "No changes were made to save.");
//       return;
//     }

//     const validationError = validateBeforeSubmit();
//     if (validationError) {
//       Alert.alert("Validation Error", validationError);
//       return;
//     }

//     if (!token) {
//       Alert.alert("Authentication", "You must be logged in to update profile.");
//       return;
//     }

//     setSaving(true);

//     const name = `${firstName} ${lastName}`.trim();
//     const isoDOB = parseDDMMYYYYToISO(dob);

//     const payload = {
//       name,
//       email: email.trim(),
//       password: password.trim(),
//       phone: phone.trim(),
//       address: addressLine.trim(),
//       pinCode: pinCode.trim(),
//       district: district.trim(),
//       city: city.trim(),
//       country: country.trim(),
//       DOB: isoDOB,
//       PAN: pan.trim().toUpperCase(),
//       accountNumber: accountNumber.trim() || undefined,
//       IFSC: ifsc.trim().toUpperCase() || undefined,
//       bankName: bankName.trim() || undefined,
//       holderName: accountHolderName.trim() || undefined,
//       inviterefferal: user?.inviterefferal || undefined,
//     };

//     try {
//       console.log("[EditProfile] Sending update payload:", payload);

//       const response = await axios.put(
//         "https://api.wishkro.com/api/user/updateuser",
//         payload,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//           timeout: 20000,
//         }
//       );

//       console.log("[EditProfile] server response:", response?.data);

//       const success =
//         response?.data?.success === true ||
//         (response.status >= 200 && response.status < 300);

//       if (success) {
//         try {
//           await refreshProfile?.();
//         } catch (e) {
//           console.warn("refreshProfile error after update:", e);
//         }

//         Alert.alert(
//           "Success",
//           "Profile updated successfully!",
//           [
//             {
//               text: "OK",
//               onPress: async () => {
//                 try {
//                   await new Promise((res) => setTimeout(res, 250));
//                   await router.back();
//                 } catch {
//                   try {
//                     router.back();
//                   } catch {}
//                 }
//               },
//             },
//           ],
//           { cancelable: false }
//         );

//         setHasChanges(false);
//       } else {
//         const message =
//           response?.data?.message || "Failed to update profile (server).";
//         Alert.alert("Error", message);
//       }
//     } catch (error) {
//       console.log(
//         "[EditProfile] update error:",
//         error?.response || error?.message || error
//       );
//       const srvMsg =
//         error?.response?.data?.message ||
//         (typeof error?.response?.data === "string"
//           ? error.response.data
//           : null);
//       if (srvMsg) {
//         Alert.alert("Error", String(srvMsg));
//       } else if (error.message && error.message.includes("timeout")) {
//         Alert.alert(
//           "Error",
//           "Request timed out. Check your internet connection."
//         );
//       } else {
//         Alert.alert("Error", "Network error. Please try again.");
//       }
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (!user && !params) {
//     return (
//       <SafeAreaView style={[styles.centered, isWeb && styles.webCentered]}>
//         <ActivityIndicator size="large" />
//         <Text style={[styles.loadingText, isWeb && styles.webLoadingText]}>
//           Loading profile...
//         </Text>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={[styles.container, isWeb && styles.webContainer]}>
//       {/* Header */}
//       <View style={[styles.header, isWeb && styles.webHeader]}>
//         <TouchableOpacity
//           style={[styles.backButton, isWeb && styles.webBackButton]}
//           onPress={() => router.back()}
//         >
//           <Ionicons name="arrow-back" size={isWeb ? 28 : 24} color="#1f2937" />
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, isWeb && styles.webHeaderTitle]}>
//           Edit Profile
//         </Text>
//         <View style={[styles.headerRight, isWeb && styles.webHeaderRight]} />
//       </View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         style={[styles.keyboardContainer, isWeb && styles.webKeyboardContainer]}
//       >
//         <ScrollView
//           style={[styles.scrollContainer, isWeb && styles.webScrollContainer]}
//           contentContainerStyle={[
//             styles.scrollContent,
//             isWeb && styles.webScrollContent,
//           ]}
//           showsVerticalScrollIndicator={false}
//         >
//           {/* Personal Info */}
//           <SectionCard
//             title="Personal Information"
//             icon={
//               <Ionicons name="person" size={isWeb ? 24 : 20} color="#2563eb" />
//             }
//             isWeb={isWeb}
//           >
//             <InputField
//               label="First Name"
//               value={firstName}
//               onChangeText={trackChange(setFirstName)}
//               placeholder="Enter first name"
//               icon={
//                 <FontAwesome5
//                   name="user"
//                   size={isWeb ? 16 : 14}
//                   color="#6b7280"
//                 />
//               }
//               editable={isEmpty(firstName)}
//               isWeb={isWeb}
//             />
//             <InputField
//               label="Last Name"
//               value={lastName}
//               onChangeText={trackChange(setLastName)}
//               placeholder="Enter last name"
//               icon={
//                 <FontAwesome5
//                   name="user"
//                   size={isWeb ? 16 : 14}
//                   color="#6b7280"
//                 />
//               }
//               editable={isEmpty(lastName)}
//               isWeb={isWeb}
//             />
//             <InputField
//               label="Email"
//               value={email}
//               onChangeText={trackChange(setEmail)}
//               placeholder="Enter email address"
//               keyboardType="email-address"
//               autoCapitalize="none"
//               icon={
//                 <Ionicons name="mail" size={isWeb ? 18 : 16} color="#6b7280" />
//               }
//               editable={isEmpty(email)}
//               isWeb={isWeb}
//             />
//             <FieldHint
//               text={EMAIL_HINT}
//               valid={email ? isEmail(email) : null}
//               show
//               isWeb={isWeb}
//             />

//             <InputField
//               label="Phone"
//               value={phone}
//               onChangeText={trackChange(setPhone)}
//               placeholder="Enter phone number"
//               keyboardType="phone-pad"
//               icon={
//                 <Ionicons name="call" size={isWeb ? 18 : 16} color="#6b7280" />
//               }
//               isWeb={isWeb}
//               maxLength={10}
//             />
//             <FieldHint
//               text={PHONE_HINT}
//               valid={phone ? isPhoneIN(phone) : null}
//               show
//               isWeb={isWeb}
//             />

//             <InputField
//               label="Password"
//               value={password}
//               onChangeText={trackChange(setPassword)}
//               placeholder="Enter new password (min 8 chars)"
//               secureTextEntry
//               autoCapitalize="none"
//               icon={
//                 <Ionicons
//                   name="lock-closed"
//                   size={isWeb ? 18 : 16}
//                   color="#6b7280"
//                 />
//               }
//               isWeb={isWeb}
//             />
//             <FieldHint
//               text={"At least 8 characters"}
//               valid={password ? password.trim().length >= 8 : null}
//               show
//               isWeb={isWeb}
//             />

//             <InputField
//               label="Date of Birth"
//               value={dob}
//               onChangeText={trackChange(setDob)}
//               placeholder="DD/MM/YYYY"
//               icon={
//                 <MaterialCommunityIcons
//                   name="calendar"
//                   size={isWeb ? 18 : 16}
//                   color="#6b7280"
//                 />
//               }
//               isWeb={isWeb}
//               maxLength={10}
//             />
//             <FieldHint
//               text={DOB_HINT}
//               valid={dob ? !!parseDDMMYYYYToISO(dob) : null}
//               show
//               isWeb={isWeb}
//             />

//             <InputField
//               label="PAN Number"
//               value={pan}
//               onChangeText={(v) => {
//                 setHasChanges(true);
//                 setPan(String(v || "").toUpperCase());
//               }}
//               placeholder="Enter PAN number"
//               icon={
//                 <FontAwesome5
//                   name="id-card"
//                   size={isWeb ? 16 : 14}
//                   color="#6b7280"
//                 />
//               }
//               maxLength={10}
//               editable={isEmpty(pan)} // <-- only editable when empty
//               isWeb={isWeb}
//             />
//             <FieldHint
//               text={PAN_HINT}
//               valid={pan ? isPAN(pan) : null}
//               show
//               isWeb={isWeb}
//             />
//           </SectionCard>

//           {/* Address Info */}
//           <SectionCard
//             title="Address Information"
//             icon={
//               <MaterialIcons
//                 name="location-on"
//                 size={isWeb ? 24 : 20}
//                 color="#059669"
//               />
//             }
//             isWeb={isWeb}
//           >
//             <InputField
//               label="Address"
//               value={addressLine}
//               onChangeText={trackChange(setAddressLine)}
//               placeholder="Enter full address"
//               multiline={true}
//               icon={
//                 <Ionicons name="home" size={isWeb ? 18 : 16} color="#6b7280" />
//               }
//               isWeb={isWeb}
//             />
//             <InputField
//               label="City"
//               value={city}
//               onChangeText={trackChange(setCity)}
//               placeholder="Enter city"
//               icon={
//                 <MaterialIcons
//                   name="location-city"
//                   size={isWeb ? 18 : 16}
//                   color="#6b7280"
//                 />
//               }
//               isWeb={isWeb}
//             />
//             <InputField
//               label="District"
//               value={district}
//               onChangeText={trackChange(setDistrict)}
//               placeholder="Enter district"
//               icon={
//                 <Ionicons name="map" size={isWeb ? 18 : 16} color="#6b7280" />
//               }
//               isWeb={isWeb}
//             />

//             <InputField
//               label="PIN Code"
//               value={pinCode}
//               onChangeText={trackChange(setPinCode)}
//               placeholder="Enter PIN code"
//               keyboardType="numeric"
//               icon={
//                 <MaterialIcons
//                   name="location-pin"
//                   size={isWeb ? 20 : 18}
//                   color="#ef4444"
//                 />
//               }
//               editable={isEmpty(pinCode)} // <-- only editable when empty
//               isWeb={isWeb}
//               maxLength={6}
//             />
//             <FieldHint
//               text={PIN_HINT}
//               valid={pinCode ? isPin(pinCode) : null}
//               show
//               isWeb={isWeb}
//             />

//             <InputField
//               label="Country"
//               value={country}
//               onChangeText={trackChange(setCountry)}
//               placeholder="Enter country"
//               icon={
//                 <Ionicons name="flag" size={isWeb ? 18 : 16} color="#6b7280" />
//               }
//               isWeb={isWeb}
//             />
//           </SectionCard>

//           {/* Bank Info */}
//           <SectionCard
//             title="Bank Details"
//             icon={
//               <MaterialCommunityIcons
//                 name="bank"
//                 size={isWeb ? 24 : 20}
//                 color="#7c3aed"
//               />
//             }
//             isWeb={isWeb}
//           >
//             <InputField
//               label="Account Number"
//               value={accountNumber}
//               onChangeText={trackChange(setAccountNumber)}
//               placeholder="Enter bank account number"
//               keyboardType="numeric"
//               icon={
//                 <MaterialCommunityIcons
//                   name="card-text-outline"
//                   size={isWeb ? 18 : 16}
//                   color="#6b7280"
//                 />
//               }
//               isWeb={isWeb}
//             />

//             <InputField
//               label="IFSC Code"
//               value={ifsc}
//               onChangeText={(v) => {
//                 setHasChanges(true);
//                 setIfsc(String(v || "").toUpperCase());
//               }}
//               placeholder="Enter IFSC code"
//               icon={
//                 <MaterialCommunityIcons
//                   name="numeric"
//                   size={isWeb ? 18 : 16}
//                   color="#6b7280"
//                 />
//               }
//               maxLength={11}
//               isWeb={isWeb}
//             />

//             <FieldHint
//               text={IFSC_HINT}
//               valid={ifsc ? isIFSC(ifsc) : null}
//               show
//               isWeb={isWeb}
//             />

//             <InputField
//               label="Bank Name"
//               value={bankName}
//               onChangeText={trackChange(setBankName)}
//               placeholder="Enter bank name"
//               icon={
//                 <MaterialCommunityIcons
//                   name="office-building-outline"
//                   size={isWeb ? 18 : 16}
//                   color="#6b7280"
//                 />
//               }
//               isWeb={isWeb}
//             />
//             <InputField
//               label="Account Holder Name"
//               value={accountHolderName}
//               placeholder="Account holder name"
//               icon={
//                 <MaterialCommunityIcons
//                   name="account-outline"
//                   size={isWeb ? 18 : 16}
//                   color="#6b7280"
//                 />
//               }
//               editable={false} // <-- read-only: always firstName + lastName
//               isWeb={isWeb}
//             />
//           </SectionCard>

//           {/* Save Button */}
//           <TouchableOpacity
//             style={[
//               styles.saveButton,
//               isWeb && styles.webSaveButton,
//               (!hasChanges || saving) && styles.saveButtonDisabled,
//             ]}
//             onPress={handleSave}
//             disabled={!hasChanges || saving}
//           >
//             {saving ? (
//               <View
//                 style={[
//                   styles.savingContainer,
//                   isWeb && styles.webSavingContainer,
//                 ]}
//               >
//                 <ActivityIndicator
//                   color="#ffffff"
//                   size={isWeb ? "large" : "small"}
//                 />
//                 <Text
//                   style={[
//                     styles.saveButtonText,
//                     isWeb && styles.webSaveButtonText,
//                   ]}
//                 >
//                   Saving...
//                 </Text>
//               </View>
//             ) : (
//               <Text
//                 style={[
//                   styles.saveButtonText,
//                   isWeb && styles.webSaveButtonText,
//                 ]}
//               >
//                 {hasChanges ? "Save Changes" : "No Changes"}
//               </Text>
//             )}
//           </TouchableOpacity>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// // ---------------- Styles ----------------
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f8fafc",
//   },
//   webContainer: {
//     maxWidth: isLargeScreen ? 1200 : "100%",
//     alignSelf: "center",
//     width: "100%",
//   },

//   centered: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   webCentered: {
//     minHeight: "100vh",
//     paddingTop: 100,
//   },

//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "#ffffff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e5e7eb",
//   },
//   webHeader: {
//     paddingHorizontal: 40,
//     paddingVertical: 16,
//     borderBottomWidth: 2,
//   },

//   backButton: {
//     padding: 8,
//   },
//   webBackButton: {
//     padding: 12,
//   },

//   headerTitle: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#1f2937",
//   },
//   webHeaderTitle: {
//     fontSize: 24,
//     fontWeight: "1200",
//   },

//   headerRight: {
//     width: 40,
//   },
//   webHeaderRight: {
//     width: 60,
//   },

//   loadingText: {
//     marginTop: 10,
//     color: "#6b7280",
//     fontSize: 16,
//   },
//   webLoadingText: {
//     fontSize: 18,
//     marginTop: 20,
//   },

//   keyboardContainer: {
//     flex: 1,
//   },
//   webKeyboardContainer: {
//     maxWidth: isLargeScreen ? 1200 : "100%",
//     alignSelf: "center",
//     width: "100%",
//   },

//   scrollContainer: {
//     flex: 1,
//   },
//   webScrollContainer: {
//     maxWidth: isLargeScreen ? 1200 : "100%",
//     alignSelf: "center",
//     width: "100%",
//   },

//   scrollContent: {
//     padding: 16,
//     paddingBottom: 100,
//   },
//   webScrollContent: {
//     padding: isLargeScreen ? 40 : 24,
//     paddingBottom: 160,
//   },

//   sectionCard: {
//     backgroundColor: "#ffffff",
//     borderRadius: 12,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 2 },
//     elevation: 2,
//   },
//   webSectionCard: {
//     borderRadius: 16,
//     marginBottom: 24,
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 4,
//     borderWidth: 1,
//     borderColor: "#e5e7eb",
//   },

//   sectionHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f3f4f6",
//     gap: 8,
//   },
//   webSectionHeader: {
//     paddingHorizontal: 20,
//     paddingVertical: 20,
//     gap: 12,
//   },

//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#1f2937",
//   },
//   webSectionTitle: {
//     fontSize: 20,
//   },

//   inputGroup: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//   },
//   webInputGroup: {
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//   },

//   inputLabel: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//     gap: 6,
//   },
//   webInputLabel: {
//     marginBottom: 12,
//     gap: 8,
//   },

//   labelText: {
//     fontSize: 14,
//     fontWeight: "600",
//     color: "#374151",
//   },
//   webLabelText: {
//     fontSize: 16,
//   },

//   textInput: {
//     borderWidth: 1,
//     borderColor: "#d1d5db",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 16,
//     color: "#1f2937",
//     backgroundColor: "#ffffff",
//     minHeight: 44,
//   },
//   webTextInput: {
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     fontSize: 17,
//     minHeight: 52,
//     borderRadius: 10,
//     borderWidth: 2,
//   },

//   textInputDisabled: {
//     backgroundColor: "#f3f4f6",
//     color: "#6b7280",
//   },

//   // Hints
//   hintRow: {
//     paddingHorizontal: 16,
//     marginTop: -4,
//     marginBottom: 8,
//   },
//   webHintRow: {
//     paddingHorizontal: 20,
//     marginTop: -6,
//     marginBottom: 12,
//   },

//   hintText: {
//     fontSize: 12,
//     lineHeight: 16,
//   },
//   webHintText: {
//     fontSize: 14,
//     lineHeight: 18,
//   },

//   saveButton: {
//     backgroundColor: "#2563eb",
//     borderRadius: 12,
//     paddingVertical: 16,
//     marginTop: 24,
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#2563eb",
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 4,
//   },
//   webSaveButton: {
//     paddingVertical: 20,
//     borderRadius: 16,
//     marginTop: 40,
//     shadowOpacity: 0.4,
//     shadowRadius: 16,
//     shadowOffset: { width: 0, height: 8 },
//   },

//   saveButtonDisabled: {
//     backgroundColor: "#9ca3af",
//     shadowOpacity: 0,
//     elevation: 0,
//   },

//   saveButtonText: {
//     color: "#ffffff",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   webSaveButtonText: {
//     fontSize: 18,
//   },

//   savingContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   webSavingContainer: {
//     gap: 12,
//   },
// });

// components/EditProfile.jsx

import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

const isWeb = Platform.OS === "web";
const { width: screenWidth } = Dimensions.get("window");
const isLargeScreen = screenWidth >= 1024;

// Hints
const EMAIL_HINT = "Valid email like user@example.com";
const PHONE_HINT = "Indian mobile: 10 digits starting 6-9 (e.g., 9876543210)";
const PIN_HINT = "Indian PIN: 6 digits, cannot start with 0 (e.g., 560001)";
const PAN_HINT = "PAN: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)";
const IFSC_HINT = "IFSC: 4 letters + 0 + 6 alphanumerics (e.g., HDFC0001234)";
const DOB_HINT = "DOB format: DD/MM/YYYY";

/* ---------- SUPPORT CONTACTS ---------- */
const SUPPORT_EMAIL = "support@wishkro.com";
const B2B_EMAIL = "b2b@wishkro.com";
const JOIN_EMAIL = "join@wishkro.com";
const WHATSAPP_NUMBER = "9990876324";

/* ---------- Small UI helpers ---------- */
const FieldHint = ({ text, valid, show = true, isWeb, error }) => {
  if (!show && !error) return null;

  let color = "#6b7280";
  if (error) color = "#dc2626";
  else if (valid === true) color = "#16a34a";
  else if (valid === false) color = "#dc2626";

  return (
    <View style={[styles.hintRow, isWeb && styles.webHintRow]}>
      <Text style={[styles.hintText, isWeb && styles.webHintText, { color }]}>
        {error || text}
        {valid === true && !error
          ? " ✓"
          : valid === false && !error
          ? " ✗"
          : ""}
      </Text>
    </View>
  );
};

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
  editable = true,
  isWeb,
  maxLength,
  onFocus,
  onBlur,
  error,
  locked = false,
}) => (
  <View style={[styles.inputGroup, isWeb && styles.webInputGroup]}>
    <Text style={[styles.inputLabel, isWeb && styles.webInputLabel]}>
      {icon}
      <Text style={[styles.labelText, isWeb && styles.webLabelText]}>
        {" "}
        {label}
      </Text>
      {locked && (
        <Text style={styles.lockedBadge}>
          {" "}
          <Ionicons name="lock-closed" size={isWeb ? 12 : 10} color="#dc2626" />
          {" LOCKED"}
        </Text>
      )}
    </Text>
    <TextInput
      style={[
        styles.textInput,
        isWeb && styles.webTextInput,
        multiline && { height: isWeb ? 100 : 80, textAlignVertical: "top" },
        !editable && styles.textInputDisabled,
        locked && styles.textInputLocked,
        error && styles.textInputError,
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
      editable={editable && !locked}
      selectTextOnFocus={editable && !locked}
      maxLength={maxLength}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  </View>
);

const SectionCard = ({ title, icon, children, isWeb }) => (
  <View style={[styles.sectionCard, isWeb && styles.webSectionCard]}>
    <View style={[styles.sectionHeader, isWeb && styles.webSectionHeader]}>
      {icon}
      <Text style={[styles.sectionTitle, isWeb && styles.webSectionTitle]}>
        {title}
      </Text>
    </View>
    {children}
  </View>
);

// Validators
const isEmail = (e) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim());
const isPhoneIN = (p) => /^[6-9]\d{9}$/.test(String(p || "").trim());
const isPin = (pin) => /^[1-9][0-9]{5}$/.test(String(pin || "").trim());
const isPAN = (pan) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(pan || "").toUpperCase());
const isIFSC = (ifsc) =>
  /^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(ifsc || "").toUpperCase());

// Date helpers
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
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString();
};

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

const isEmpty = (v) => v === null || v === undefined || String(v).trim() === "";

export default function EditProfile() {
  const { user, token, refreshProfile } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();

  const initRef = useRef({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track which fields are from server vs newly entered
  const [serverData, setServerData] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
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
  const [password, setPassword] = useState("");

  // Track field focus to allow editing even if field has content
  const [focusedField, setFocusedField] = useState(null);

  // Error states for duplicate validation
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [panError, setPanError] = useState("");

  // Track which fields have been manually edited by user
  const [manuallyEditedFields, setManuallyEditedFields] = useState(new Set());

  // Track which fields are locked (cannot be edited)
  const [lockedFields, setLockedFields] = useState(new Set());

  useEffect(() => {
    if (__DEV__) {
      console.log("[EditProfile] useAuth user:", user);
      console.log("[EditProfile] route params:", params);
    }
  }, [user, params]);

  // Prefill from user AND route params
  useEffect(() => {
    const hasParams = params && Object.keys(params).length > 0;
    if (!user && !hasParams) return;

    let paramsKey = "";
    try {
      paramsKey = params ? JSON.stringify(params) : "";
    } catch (e) {
      paramsKey = String(params);
    }
    const userKey = user?.email || user?._id || "";
    const key = `${paramsKey}::${userKey}`;

    if (initRef.current[key]) return;

    const pick = (k, fallback = "") => {
      if (
        params &&
        params[k] !== undefined &&
        params[k] !== null &&
        String(params[k]) !== ""
      )
        return String(params[k]);
      return fallback;
    };

    const fullName =
      pick("name") ||
      pick("fullName") ||
      user?.name ||
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

    const parts = String(fullName || "")
      .split(" ")
      .filter(Boolean);

    const newServerData = {};

    if (isEmpty(firstName)) {
      const val =
        pick("firstName") || parts.slice(0, -1).join(" ") || parts[0] || "";
      setFirstName(val);
      newServerData.firstName = val;
    }

    if (isEmpty(lastName)) {
      const val =
        pick("lastName") || (parts.length > 1 ? parts[parts.length - 1] : "");
      setLastName(val);
      newServerData.lastName = val;
    }

    if (isEmpty(email)) {
      const val = pick("email", user?.email || "");
      setEmail(val);
      newServerData.email = val;
    }

    if (isEmpty(phone)) {
      const val = pick("phone", user?.phone || user?.mobile || "");
      setPhone(val);
      newServerData.phone = val;
    }

    const srcDob = pick("dob", user?.DOB || user?.dob || "");
    if (isEmpty(dob)) {
      const val = /^\d{2}\/\d{2}\/\d{4}$/.test(srcDob)
        ? srcDob
        : formatISOToDDMMYYYY(srcDob);
      setDob(val);
      newServerData.dob = val;
    }

    if (isEmpty(pan)) {
      const val = (
        pick("pan", user?.PAN || user?.pan || "") || ""
      ).toUpperCase();
      setPan(val);
      newServerData.pan = val;
    }

    if (isEmpty(addressLine)) {
      const val = pick("addressLine", user?.address || "");
      setAddressLine(val);
      newServerData.addressLine = val;
    }

    if (isEmpty(city)) {
      const val = pick("city", user?.city || "");
      setCity(val);
      newServerData.city = val;
    }

    if (isEmpty(district)) {
      const val = pick("district", user?.district || "");
      setDistrict(val);
      newServerData.district = val;
    }

    if (isEmpty(pinCode)) {
      const val = pick("pinCode", user?.pinCode || user?.pincode || "");
      setPinCode(val);
      newServerData.pinCode = val;
    }

    if (isEmpty(country)) {
      const val = pick("country", user?.country || "");
      setCountry(val);
      newServerData.country = val;
    }

    if (isEmpty(accountNumber)) {
      const val = pick("accountNumber", user?.accountNumber || "");
      setAccountNumber(val);
      newServerData.accountNumber = val;
    }

    if (isEmpty(ifsc)) {
      const val = (
        pick("ifsc", user?.IFSC || user?.ifsc || "") || ""
      ).toUpperCase();
      setIfsc(val);
      newServerData.ifsc = val;
    }

    if (isEmpty(bankName)) {
      const val = pick("bankName", user?.bankName || "");
      setBankName(val);
      newServerData.bankName = val;
    }

    const holderFromParams = pick("holderName", "");
    const autoHolder = `${
      pick("firstName") || parts.slice(0, -1).join(" ") || parts[0] || ""
    }${
      pick("lastName") || (parts.length > 1 ? parts[parts.length - 1] : "")
        ? " " +
          (pick("lastName") ||
            (parts.length > 1 ? parts[parts.length - 1] : ""))
        : ""
    }`.trim();

    if (isEmpty(accountHolderName)) {
      const val =
        holderFromParams ||
        user?.holderName ||
        user?.accountHolderName ||
        autoHolder;
      setAccountHolderName(val);
      newServerData.accountHolderName = val;
    }

    setServerData(newServerData);

    // Initialize locked fields based on server data
    // UPDATED: Added 'pinCode' to locked fields
    const fieldsToLock = [
      "firstName",
      "lastName",
      "email",
      "dob",
      "pan",
      "pinCode",
    ]; // Added 'pinCode'

    const newLockedFields = new Set();
    fieldsToLock.forEach((field) => {
      if (newServerData[field] && String(newServerData[field]).trim() !== "") {
        newLockedFields.add(field);
      }
    });

    setLockedFields(newLockedFields);
    initRef.current[key] = true;
    setHasChanges(false);
    setIsDataLoaded(true);
  }, [params, user]);

  // Auto sync account holder with name
  useEffect(() => {
    const auto = `${firstName}${lastName ? " " + lastName : ""}`.trim();
    if (isEmpty(accountHolderName) || accountHolderName.trim() === auto) {
      setAccountHolderName(auto);
    }
  }, [firstName, lastName]);

  // Helper to check if field value has changed from original
  const hasFieldChanged = (fieldName, currentValue) => {
    const originalValue = serverData[fieldName] || "";
    return originalValue !== currentValue;
  };

  // Check if a field is locked
  const isFieldLocked = (fieldName) => {
    return lockedFields.has(fieldName);
  };

  const trackChange = useCallback(
    (setter, fieldName) => (value) => {
      // Check if field is locked
      if (isFieldLocked(fieldName)) {
        Alert.alert(
          "Field Locked",
          `This field (${fieldName}) cannot be changed as it has already been saved to the server.`,
          [{ text: "OK" }]
        );
        return;
      }

      setHasChanges(true);
      setter(value);

      // Mark field as manually edited
      setManuallyEditedFields((prev) => new Set(prev).add(fieldName));

      // Clear any validation errors when user starts typing
      if (fieldName === "email") setEmailError("");
      if (fieldName === "phone") setPhoneError("");
      if (fieldName === "pan") setPanError("");
    },
    [lockedFields]
  );

  // Helper function to check if a field should be editable
  const shouldBeEditable = (fieldName, currentValue) => {
    // If field is locked, not editable
    if (isFieldLocked(fieldName)) {
      return false;
    }

    // If field is currently focused, allow editing
    if (focusedField === fieldName) return true;

    // If field has never been saved (empty in server data), allow editing
    if (!serverData[fieldName] || serverData[fieldName] === "") return true;

    // If current value is empty, allow editing
    if (!currentValue || currentValue.trim() === "") return true;

    // If field has been manually edited by user, allow editing
    if (manuallyEditedFields.has(fieldName)) return true;

    // Otherwise, field is read-only (already has saved data and not being edited)
    return false;
  };

  const validateBeforeSubmit = () => {
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

  // Function to parse server error messages for duplicate fields
  const parseServerError = (errorMessage) => {
    if (!errorMessage)
      return { type: "general", message: "Unknown error occurred" };

    const msg = errorMessage.toLowerCase();

    console.log("Parsing error message:", msg);

    // Check for email errors
    if (
      msg.includes("email") &&
      (msg.includes("already") ||
        msg.includes("exist") ||
        msg.includes("taken") ||
        msg.includes("registered"))
    ) {
      return {
        type: "email",
        message:
          "This email is already registered. Please use a different email.",
      };
    }

    // Check for phone errors
    if (
      (msg.includes("phone") || msg.includes("mobile")) &&
      (msg.includes("already") ||
        msg.includes("exist") ||
        msg.includes("taken") ||
        msg.includes("registered"))
    ) {
      return {
        type: "phone",
        message:
          "This phone number is already registered. Please use a different number.",
      };
    }

    // Check for PAN errors
    if (
      msg.includes("pan") &&
      (msg.includes("already") ||
        msg.includes("exist") ||
        msg.includes("taken") ||
        msg.includes("registered"))
    ) {
      return {
        type: "pan",
        message:
          "This PAN number is already registered. Please use a different PAN.",
      };
    }

    // Check for generic duplicate errors
    if (msg.includes("already exist") || msg.includes("already exists")) {
      // Try to extract which field is duplicate
      if (msg.includes("email"))
        return { type: "email", message: "This email is already registered." };
      if (msg.includes("phone") || msg.includes("mobile"))
        return {
          type: "phone",
          message: "This phone number is already registered.",
        };
      if (msg.includes("pan"))
        return {
          type: "pan",
          message: "This PAN number is already registered.",
        };
    }

    return { type: "general", message: errorMessage };
  };

  // Save Handler
  const handleSave = async () => {
    if (!hasChanges) {
      Alert.alert("No Changes", "No changes were made to save.");
      return;
    }

    // Clear previous errors
    setEmailError("");
    setPhoneError("");
    setPanError("");

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

    const name = `${firstName} ${lastName}`.trim();
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
      DOB: isoDOB,
      PAN: pan.trim().toUpperCase(),
      accountNumber: accountNumber.trim() || undefined,
      IFSC: ifsc.trim().toUpperCase() || undefined,
      bankName: bankName.trim() || undefined,
      holderName: accountHolderName.trim() || undefined,
      inviterefferal: user?.inviterefferal || undefined,
    };

    try {
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

      const success =
        response?.data?.success === true ||
        (response.status >= 200 && response.status < 300);

      if (success) {
        try {
          await refreshProfile?.();
        } catch (e) {
          console.warn("refreshProfile error after update:", e);
        }

        // Update server data with current values after successful save
        const updatedServerData = {
          firstName,
          lastName,
          email,
          phone,
          dob,
          pan,
          addressLine,
          city,
          district,
          pinCode,
          country,
          accountNumber,
          ifsc,
          bankName,
          accountHolderName,
        };

        setServerData(updatedServerData);

        // Lock the critical fields after successful save
        // UPDATED: Added 'pinCode' to locked fields
        const fieldsToLock = [
          "firstName",
          "lastName",
          "email",
          "dob",
          "pan",
          "pinCode",
        ]; // Added 'pinCode'

        const newLockedFields = new Set();
        fieldsToLock.forEach((field) => {
          if (
            updatedServerData[field] &&
            String(updatedServerData[field]).trim() !== ""
          ) {
            newLockedFields.add(field);
          }
        });

        setLockedFields(newLockedFields);

        // Clear manually edited fields after successful save
        setManuallyEditedFields(new Set());

        Alert.alert(
          "Success",
          "Profile updated successfully!",
          [
            {
              text: "OK",
              onPress: async () => {
                try {
                  await new Promise((res) => setTimeout(res, 250));
                  await router.back();
                } catch {
                  try {
                    router.back();
                  } catch {}
                }
              },
            },
          ],
          { cancelable: false }
        );

        setHasChanges(false);
        setFocusedField(null); // Reset focused field
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

      // Extract error message from various possible locations
      let errorMessage = "";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error?.response?.data === "string") {
        errorMessage = error.response.data;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else {
        errorMessage = "Network error. Please try again.";
      }

      // Parse the error message to identify duplicate fields
      const parsedError = parseServerError(errorMessage);

      console.log("Parsed error:", parsedError);

      switch (parsedError.type) {
        case "email":
          setEmailError(parsedError.message);
          Alert.alert("Email Already Exists", parsedError.message);
          break;
        case "phone":
          setPhoneError(parsedError.message);
          Alert.alert("Phone Already Exists", parsedError.message);
          break;
        case "pan":
          setPanError(parsedError.message);
          Alert.alert("PAN Already Exists", parsedError.message);
          break;
        default:
          // For general errors, show alert
          if (errorMessage && errorMessage.includes("timeout")) {
            Alert.alert(
              "Error",
              "Request timed out. Check your internet connection."
            );
          } else {
            Alert.alert("Error", String(errorMessage));
          }
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user && !params) {
    return (
      <SafeAreaView style={[styles.centered, isWeb && styles.webCentered]}>
        <ActivityIndicator size="large" />
        <Text style={[styles.loadingText, isWeb && styles.webLoadingText]}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isWeb && styles.webContainer]}>
      {/* Header */}
      <View style={[styles.header, isWeb && styles.webHeader]}>
        <TouchableOpacity
          style={[styles.backButton, isWeb && styles.webBackButton]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={isWeb ? 28 : 24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isWeb && styles.webHeaderTitle]}>
          Edit Profile
        </Text>
        <View style={[styles.headerRight, isWeb && styles.webHeaderRight]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.keyboardContainer, isWeb && styles.webKeyboardContainer]}
      >
        <ScrollView
          style={[styles.scrollContainer, isWeb && styles.webScrollContainer]}
          contentContainerStyle={[
            styles.scrollContent,
            isWeb && styles.webScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Personal Info */}
          <SectionCard
            title="Personal Information"
            icon={
              <Ionicons name="person" size={isWeb ? 24 : 20} color="#2563eb" />
            }
            isWeb={isWeb}
          >
            <InputField
              label="First Name"
              value={firstName}
              onChangeText={trackChange(setFirstName, "firstName")}
              placeholder="Enter first name"
              icon={
                <FontAwesome5
                  name="user"
                  size={isWeb ? 16 : 14}
                  color="#6b7280"
                />
              }
              editable={shouldBeEditable("firstName", firstName)}
              locked={isFieldLocked("firstName")}
              onFocus={() => setFocusedField("firstName")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={false}
            />
            <InputField
              label="Last Name"
              value={lastName}
              onChangeText={trackChange(setLastName, "lastName")}
              placeholder="Enter last name"
              icon={
                <FontAwesome5
                  name="user"
                  size={isWeb ? 16 : 14}
                  color="#6b7280"
                />
              }
              editable={shouldBeEditable("lastName", lastName)}
              locked={isFieldLocked("lastName")}
              onFocus={() => setFocusedField("lastName")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={false}
            />
            <InputField
              label="Email"
              value={email}
              onChangeText={trackChange(setEmail, "email")}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              icon={
                <Ionicons name="mail" size={isWeb ? 18 : 16} color="#6b7280" />
              }
              editable={shouldBeEditable("email", email)}
              locked={isFieldLocked("email")}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={!!emailError}
            />
            <FieldHint
              text={EMAIL_HINT}
              valid={email ? isEmail(email) : null}
              show={!emailError}
              error={emailError}
              isWeb={isWeb}
            />

            {/* Phone Field - Editable (not locked) */}
            <InputField
              label="Phone"
              value={phone}
              onChangeText={trackChange(setPhone, "phone")}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              icon={
                <Ionicons name="call" size={isWeb ? 18 : 16} color="#6b7280" />
              }
              editable={true} // Phone is editable
              onFocus={() => setFocusedField("phone")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              maxLength={10}
              error={!!phoneError}
            />
            <FieldHint
              text={PHONE_HINT}
              valid={phone ? isPhoneIN(phone) : null}
              show={!phoneError}
              error={phoneError}
              isWeb={isWeb}
            />

            <InputField
              label="Password"
              value={password}
              onChangeText={trackChange(setPassword, "password")}
              placeholder="Enter new password (min 8 chars)"
              secureTextEntry
              autoCapitalize="none"
              icon={
                <Ionicons
                  name="lock-closed"
                  size={isWeb ? 18 : 16}
                  color="#6b7280"
                />
              }
              editable={true} // Password is always editable
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={false}
            />
            <FieldHint
              text={"At least 8 characters"}
              valid={password ? password.trim().length >= 8 : null}
              show
              isWeb={isWeb}
            />

            <InputField
              label="Date of Birth"
              value={dob}
              onChangeText={trackChange(setDob, "dob")}
              placeholder="DD/MM/YYYY"
              icon={
                <MaterialCommunityIcons
                  name="calendar"
                  size={isWeb ? 18 : 16}
                  color="#6b7280"
                />
              }
              editable={shouldBeEditable("dob", dob)}
              locked={isFieldLocked("dob")}
              onFocus={() => setFocusedField("dob")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              maxLength={10}
              error={false}
            />
            <FieldHint
              text={DOB_HINT}
              valid={dob ? !!parseDDMMYYYYToISO(dob) : null}
              show
              isWeb={isWeb}
            />

            {/* PAN Field */}
            <InputField
              label="PAN Number"
              value={pan}
              onChangeText={trackChange(setPan, "pan")}
              placeholder="Enter PAN number"
              icon={
                <FontAwesome5
                  name="id-card"
                  size={isWeb ? 16 : 14}
                  color="#6b7280"
                />
              }
              maxLength={10}
              editable={shouldBeEditable("pan", pan)}
              locked={isFieldLocked("pan")}
              onFocus={() => setFocusedField("pan")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={!!panError}
            />
            <FieldHint
              text={PAN_HINT}
              valid={pan ? isPAN(pan) : null}
              show={!panError}
              error={panError}
              isWeb={isWeb}
            />
          </SectionCard>

          {/* Address Info */}
          <SectionCard
            title="Address Information"
            icon={
              <MaterialIcons
                name="location-on"
                size={isWeb ? 24 : 20}
                color="#059669"
              />
            }
            isWeb={isWeb}
          >
            <InputField
              label="Address"
              value={addressLine}
              onChangeText={trackChange(setAddressLine, "addressLine")}
              placeholder="Enter full address"
              multiline={true}
              icon={
                <Ionicons name="home" size={isWeb ? 18 : 16} color="#6b7280" />
              }
              editable={shouldBeEditable("addressLine", addressLine)}
              onFocus={() => setFocusedField("addressLine")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={false}
            />
            <InputField
              label="City"
              value={city}
              onChangeText={trackChange(setCity, "city")}
              placeholder="Enter city"
              icon={
                <MaterialIcons
                  name="location-city"
                  size={isWeb ? 18 : 16}
                  color="#6b7280"
                />
              }
              editable={shouldBeEditable("city", city)}
              onFocus={() => setFocusedField("city")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={false}
            />
            <InputField
              label="District"
              value={district}
              onChangeText={trackChange(setDistrict, "district")}
              placeholder="Enter district"
              icon={
                <Ionicons name="map" size={isWeb ? 18 : 16} color="#6b7280" />
              }
              editable={shouldBeEditable("district", district)}
              onFocus={() => setFocusedField("district")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={false}
            />

            {/* PIN Code Field - NOW LOCKED */}
            <InputField
              label="PIN Code"
              value={pinCode}
              onChangeText={trackChange(setPinCode, "pinCode")}
              placeholder="Enter PIN code"
              keyboardType="numeric"
              icon={
                <MaterialIcons
                  name="location-pin"
                  size={isWeb ? 20 : 18}
                  color="#ef4444"
                />
              }
              editable={shouldBeEditable("pinCode", pinCode)}
              locked={isFieldLocked("pinCode")} // Added locked prop
              onFocus={() => setFocusedField("pinCode")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              maxLength={6}
              error={false}
            />
            <FieldHint
              text={PIN_HINT}
              valid={pinCode ? isPin(pinCode) : null}
              show
              isWeb={isWeb}
            />

            <InputField
              label="Country"
              value={country}
              onChangeText={trackChange(setCountry, "country")}
              placeholder="Enter country"
              icon={
                <Ionicons name="flag" size={isWeb ? 18 : 16} color="#6b7280" />
              }
              editable={shouldBeEditable("country", country)}
              onFocus={() => setFocusedField("country")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={false}
            />
          </SectionCard>

          {/* Bank Info */}
          <SectionCard
            title="Bank Details"
            icon={
              <MaterialCommunityIcons
                name="bank"
                size={isWeb ? 24 : 20}
                color="#7c3aed"
              />
            }
            isWeb={isWeb}
          >
            <InputField
              label="Account Number"
              value={accountNumber}
              onChangeText={trackChange(setAccountNumber, "accountNumber")}
              placeholder="Enter bank account number"
              keyboardType="numeric"
              icon={
                <MaterialCommunityIcons
                  name="card-text-outline"
                  size={isWeb ? 18 : 16}
                  color="#6b7280"
                />
              }
              editable={shouldBeEditable("accountNumber", accountNumber)}
              onFocus={() => setFocusedField("accountNumber")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={false}
            />

            <InputField
              label="IFSC Code"
              value={ifsc}
              onChangeText={trackChange(setIfsc, "ifsc")}
              placeholder="Enter IFSC code"
              icon={
                <MaterialCommunityIcons
                  name="numeric"
                  size={isWeb ? 18 : 16}
                  color="#6b7280"
                />
              }
              maxLength={11}
              editable={shouldBeEditable("ifsc", ifsc)}
              onFocus={() => setFocusedField("ifsc")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={false}
            />
            <FieldHint
              text={IFSC_HINT}
              valid={ifsc ? isIFSC(ifsc) : null}
              show
              isWeb={isWeb}
            />

            <InputField
              label="Bank Name"
              value={bankName}
              onChangeText={trackChange(setBankName, "bankName")}
              placeholder="Enter bank name"
              icon={
                <MaterialCommunityIcons
                  name="office-building-outline"
                  size={isWeb ? 18 : 16}
                  color="#6b7280"
                />
              }
              editable={shouldBeEditable("bankName", bankName)}
              onFocus={() => setFocusedField("bankName")}
              onBlur={() => setFocusedField(null)}
              isWeb={isWeb}
              error={false}
            />
            <InputField
              label="Account Holder Name"
              value={accountHolderName}
              placeholder="Account holder name"
              icon={
                <MaterialCommunityIcons
                  name="account-outline"
                  size={isWeb ? 18 : 16}
                  color="#6b7280"
                />
              }
              editable={false}
              isWeb={isWeb}
              error={false}
            />
          </SectionCard>

          {/* Locked Fields Notice */}
          {lockedFields.size > 0 && (
            <View
              style={[styles.lockedNotice, isWeb && styles.webLockedNotice]}
            >
              <Ionicons
                name="information-circle"
                size={isWeb ? 20 : 18}
                color="#3b82f6"
              />
              <Text
                style={[
                  styles.lockedNoticeText,
                  isWeb && styles.webLockedNoticeText,
                ]}
              >
                {lockedFields.size} field(s) are locked and cannot be changed
                after saving
              </Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              isWeb && styles.webSaveButton,
              (!hasChanges || saving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <View
                style={[
                  styles.savingContainer,
                  isWeb && styles.webSavingContainer,
                ]}
              >
                <ActivityIndicator
                  color="#ffffff"
                  size={isWeb ? "large" : "small"}
                />
                <Text
                  style={[
                    styles.saveButtonText,
                    isWeb && styles.webSaveButtonText,
                  ]}
                >
                  Saving...
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  isWeb && styles.webSaveButtonText,
                ]}
              >
                {hasChanges ? "Save Changes" : "No Changes"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Updated Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  webContainer: {
    maxWidth: isLargeScreen ? 1200 : "100%",
    alignSelf: "center",
    width: "100%",
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  webCentered: {
    minHeight: "100vh",
    paddingTop: 100,
  },

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
  webHeader: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderBottomWidth: 2,
  },

  backButton: {
    padding: 8,
  },
  webBackButton: {
    padding: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  webHeaderTitle: {
    fontSize: 24,
    fontWeight: "1200",
  },

  headerRight: {
    width: 40,
  },
  webHeaderRight: {
    width: 60,
  },

  loadingText: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 16,
  },
  webLoadingText: {
    fontSize: 18,
    marginTop: 20,
  },

  keyboardContainer: {
    flex: 1,
  },
  webKeyboardContainer: {
    maxWidth: isLargeScreen ? 1200 : "100%",
    alignSelf: "center",
    width: "100%",
  },

  scrollContainer: {
    flex: 1,
  },
  webScrollContainer: {
    maxWidth: isLargeScreen ? 1200 : "100%",
    alignSelf: "center",
    width: "100%",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  webScrollContent: {
    padding: isLargeScreen ? 40 : 24,
    paddingBottom: 160,
  },

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
  webSectionCard: {
    borderRadius: 16,
    marginBottom: 24,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
  webSectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  webSectionTitle: {
    fontSize: 20,
  },

  inputGroup: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  webInputGroup: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  inputLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  webInputLabel: {
    marginBottom: 12,
    gap: 8,
  },

  labelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  webLabelText: {
    fontSize: 16,
  },

  lockedBadge: {
    fontSize: 10,
    color: "#dc2626",
    fontWeight: "600",
    marginLeft: 4,
  },

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
  webTextInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 2,
  },

  textInputDisabled: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },

  textInputLocked: {
    backgroundColor: "#f9fafb",
    color: "#4b5563",
    borderColor: "#d1d5db",
    borderStyle: "dashed",
  },

  textInputError: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },

  hintRow: {
    paddingHorizontal: 16,
    marginTop: -4,
    marginBottom: 8,
  },
  webHintRow: {
    paddingHorizontal: 20,
    marginTop: -6,
    marginBottom: 12,
  },

  hintText: {
    fontSize: 12,
    lineHeight: 16,
  },
  webHintText: {
    fontSize: 14,
    lineHeight: 18,
  },

  lockedNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  webLockedNotice: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 10,
  },

  lockedNoticeText: {
    fontSize: 14,
    color: "#1e40af",
    flex: 1,
  },
  webLockedNoticeText: {
    fontSize: 16,
  },

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
  webSaveButton: {
    paddingVertical: 20,
    borderRadius: 16,
    marginTop: 40,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },

  saveButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0,
    elevation: 0,
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  webSaveButtonText: {
    fontSize: 18,
  },

  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  webSavingContainer: {
    gap: 12,
  },
});
