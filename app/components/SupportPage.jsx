// app/components/SupportPage.jsx
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isWeb = Platform.OS === "web";
const SUPPORT_EMAIL = "Support@Wishkro.com";
const B2B_EMAIL = "b2b@wishkro.com";
const JOIN_EMAIL = "join@wishkro.com";
const WHATSAPP_NUMBER = "+919990876324";

export default function SupportPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openMail = async (to, subject = "", body = "") => {
    const mailto = `mailto:${encodeURIComponent(
      to
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      const can = await Linking.canOpenURL(mailto);
      if (!can) {
        Alert.alert("No mail app", "Can't open mail client on this device.");
        return;
      }
      await Linking.openURL(mailto);
    } catch (e) {
      console.warn("openMail error:", e);
      Alert.alert("Error", "Unable to open mail client.");
    }
  };

  const openWhatsApp = async (phone, text = "") => {
    const normalized = String(phone).replace(/[^\d+]/g, "");
    const encoded = encodeURIComponent(text || "Hi WishKro, I need support.");
    const scheme =
      Platform.OS === "android"
        ? `whatsapp://send?phone=${normalized}&text=${encoded}`
        : `whatsapp://send?text=${encoded}&phone=${normalized}`;
    const web = `https://wa.me/${normalized.replace(
      /^\+/,
      ""
    )}?text=${encoded}`;

    try {
      if (await Linking.canOpenURL(scheme)) {
        await Linking.openURL(scheme);
        return;
      }
      if (await Linking.canOpenURL(web)) {
        await Linking.openURL(web);
        return;
      }
      Alert.alert(
        "WhatsApp not available",
        "WhatsApp is not installed or cannot be opened on this device."
      );
    } catch (e) {
      console.warn("openWhatsApp error:", e);
      Alert.alert("Error", "Unable to open WhatsApp.");
    }
  };

  const copyToClipboard = async (value) => {
    try {
      await Clipboard.setStringAsync(String(value));
      Alert.alert("Copied", "Copied to clipboard.");
    } catch (e) {
      console.warn("clipboard error:", e);
      Alert.alert("Error", "Unable to copy.");
    }
  };

  const Row = ({ title, subtitle, leftIcon, onEmail, onWhatsApp, onCopy }) => (
    <View style={[styles.card, isWeb && styles.webCard]}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrap, isWeb && styles.webIconWrap]}>
          {leftIcon}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, isWeb && styles.webRowTitle]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.rowSubtitle, isWeb && styles.webRowSubtitle]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.rowActions, isWeb && styles.webRowActions]}>
        {onEmail && (
          <TouchableOpacity
            style={[styles.actionBtn, isWeb && styles.webActionBtn]}
            onPress={onEmail}
            activeOpacity={0.75}
          >
            <Ionicons name="mail" size={isWeb ? 22 : 18} color="#2563eb" />
          </TouchableOpacity>
        )}
        {onWhatsApp && (
          <TouchableOpacity
            style={[styles.actionBtn, isWeb && styles.webActionBtn]}
            onPress={onWhatsApp}
            activeOpacity={0.75}
          >
            <Ionicons
              name="logo-whatsapp"
              size={isWeb ? 22 : 18}
              color="#16a34a"
            />
          </TouchableOpacity>
        )}
        {onCopy && (
          <TouchableOpacity
            style={[styles.actionBtn, isWeb && styles.webActionBtn]}
            onPress={onCopy}
            activeOpacity={0.75}
          >
            <MaterialIcons
              name="content-copy"
              size={isWeb ? 22 : 18}
              color="#6b7280"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.safe, isWeb && styles.webSafe]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={["#2563eb", "#6a9bff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}
      >
        <View style={[styles.headerInner, isWeb && styles.webHeaderInner]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.headerBack, isWeb && styles.webHeaderBack]}
          >
            <Ionicons name="chevron-back" size={isWeb ? 26 : 22} color="#fff" />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, isWeb && styles.webHeaderTitle]}>
            Support
          </Text>

          <View style={{ width: isWeb ? 60 : 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          isWeb && styles.webContainer,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, isWeb && styles.webIntro]}>
          For edits or any support, contact WishKro using the channels below.
        </Text>

        <Row
          title="General Support"
          subtitle={SUPPORT_EMAIL}
          leftIcon={
            <Ionicons
              name="help-circle"
              size={isWeb ? 26 : 22}
              color="#2563eb"
            />
          }
          onEmail={() => openMail(SUPPORT_EMAIL, "Support request", "")}
          onCopy={() => copyToClipboard(SUPPORT_EMAIL)}
        />

        <Row
          title="Business (B2B) Communication"
          subtitle={B2B_EMAIL}
          leftIcon={
            <Ionicons name="business" size={isWeb ? 26 : 22} color="#7c3aed" />
          }
          onEmail={() => openMail(B2B_EMAIL, "B2B enquiry", "")}
          onCopy={() => copyToClipboard(B2B_EMAIL)}
        />

        <Row
          title="General / Signup queries"
          subtitle={JOIN_EMAIL}
          leftIcon={
            <Ionicons name="people" size={isWeb ? 26 : 22} color="#059669" />
          }
          onEmail={() => openMail(JOIN_EMAIL, "Signup / General query", "")}
          onCopy={() => copyToClipboard(JOIN_EMAIL)}
        />

        <View style={[styles.whatsappWrap, isWeb && styles.webWhatsappWrap]}>
          <Text style={[styles.whTitle, isWeb && styles.webWhTitle]}>
            Official Contact / WhatsApp
          </Text>
          <Text style={[styles.whNumber, isWeb && styles.webWhNumber]}>
            +91 9990876324
          </Text>

          <View style={[styles.whRow, isWeb && styles.webWhRow]}>
            <TouchableOpacity
              style={[styles.whPrimary, isWeb && styles.webWhPrimary]}
              onPress={() =>
                openWhatsApp(WHATSAPP_NUMBER, "Hello WishKro, I need support.")
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name="logo-whatsapp"
                size={isWeb ? 22 : 18}
                color="#fff"
              />
              <Text
                style={[styles.whPrimaryText, isWeb && styles.webWhPrimaryText]}
              >
                Open WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.whSecondary, isWeb && styles.webWhSecondary]}
              onPress={() => copyToClipboard("+91 9990876324")}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="content-copy"
                size={isWeb ? 22 : 18}
                color="#111827"
              />
              <Text
                style={[
                  styles.whSecondaryText,
                  isWeb && styles.webWhSecondaryText,
                ]}
              >
                Copy
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.note, isWeb && styles.webNote]}>
            Ye sirf vahi daalna jahan Bahut Zaruri ho — use WhatsApp only when
            absolutely necessary.
          </Text>
        </View>

        <Text style={[styles.footer, isWeb && styles.webFooter]}>
          Response times may vary. For urgent account issues (security, fraud)
          mention "URGENT" in the subject line.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f6ff" },
  webSafe: {
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },

  header: {
    width: "100%",
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  webHeader: {
    borderRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 40,
  },

  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webHeaderInner: {
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },

  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  webHeaderBack: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  webHeaderTitle: {
    fontSize: 24,
  },

  container: {
    padding: 16,
    paddingTop: 18,
  },
  webContainer: {
    paddingHorizontal: 40,
    paddingTop: 30,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },

  intro: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    lineHeight: 20,
  },
  webIntro: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 24,
    textAlign: "center",
    color: "#4b5563",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  webCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    flex: 1,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f6ff",
    marginRight: 12,
  },
  webIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 16,
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  webRowTitle: {
    fontSize: 18,
  },

  rowSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  webRowSubtitle: {
    fontSize: 15,
    marginTop: 6,
  },

  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  webRowActions: {
    gap: 12,
  },

  actionBtn: {
    padding: 8,
    borderRadius: 8,
  },
  webActionBtn: {
    padding: 10,
    borderRadius: 10,
  },

  whatsappWrap: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  webWhatsappWrap: {
    borderRadius: 16,
    padding: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },

  whTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
  webWhTitle: {
    fontSize: 16,
  },

  whNumber: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
    color: "#111827",
  },
  webWhNumber: {
    fontSize: 24,
    marginTop: 10,
  },

  whRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  webWhRow: {
    marginTop: 16,
    gap: 16,
  },

  whPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#16a34a",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  webWhPrimary: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  whPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    marginLeft: 4,
  },
  webWhPrimaryText: {
    fontSize: 16,
    marginLeft: 8,
  },

  whSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.06)",
  },
  webWhSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  whSecondaryText: {
    color: "#111827",
    fontWeight: "800",
    marginLeft: 4,
  },
  webWhSecondaryText: {
    fontSize: 16,
    marginLeft: 8,
  },

  note: {
    marginTop: 10,
    color: "#6b7280",
    fontSize: 12,
    fontStyle: "italic",
  },
  webNote: {
    fontSize: 14,
    marginTop: 16,
  },

  footer: {
    marginTop: 18,
    color: "#6b7280",
    fontSize: 13,
  },
  webFooter: {
    fontSize: 15,
    marginTop: 24,
    textAlign: "center",
  },
});
