// app/screens/PrivacyPolicyScreen.jsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
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

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.safe, isWeb && styles.webSafe]}>
      <StatusBar
        translucent
        barStyle="light-content"
        backgroundColor="transparent"
      />

      <LinearGradient
        colors={["#2563eb", "#4f8ef7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}
      >
        <View style={[styles.headerRow, isWeb && styles.webHeaderRow]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, isWeb && styles.webBackBtn]}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={isWeb ? 26 : 22} color="#fff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isWeb && styles.webHeaderTitle]}>
            Privacy Policy
          </Text>
          <View style={{ width: isWeb ? 60 : 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          isWeb && styles.webContainer,
          { paddingBottom: Math.max(insets.bottom, 30) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, isWeb && styles.webCard]}>
          <Text style={[styles.title, isWeb && styles.webTitle]}>
            Privacy Policy
          </Text>
          <Text style={[styles.meta, isWeb && styles.webMeta]}>
            Effective Date: 15th August 2025
          </Text>
          <Text style={[styles.meta, isWeb && styles.webMeta]}>
            Last Updated: 15th August 2025
          </Text>

          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            WishKro.com ("WishKro", "we", "our", or "us") values your privacy
            and is committed to protecting your personal information. This
            Privacy Policy explains how we collect, use, and share information
            when you use our website, mobile application, and related services
            (collectively, the "Services").
          </Text>
          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            By using WishKro.com, you agree to the terms of this Privacy Policy.
            If you do not agree, please discontinue use of our Services.
          </Text>

          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            1. Information We Collect
          </Text>

          <Text style={[styles.subheading, isWeb && styles.webSubheading]}>
            1.1 Information You Provide
          </Text>
          {renderListItems([
            "Account Information - Name, email, phone, and password.",
            "Profile Details - Optional picture, bio, preferences.",
            "Payment Information - Securely processed via payment partners.",
            "Referral Data - Information about people you refer.",
            "Communication Data - Support and message interactions.",
          ])}

          <Text style={[styles.subheading, isWeb && styles.webSubheading]}>
            1.2 Information Collected Automatically
          </Text>
          {renderListItems([
            "Device Info - IP, OS, browser type, device identifiers.",
            "Usage Data - Pages visited, time spent, ads interacted.",
            "Location - Approximate (if permission is granted).",
          ])}

          <Text style={[styles.subheading, isWeb && styles.webSubheading]}>
            1.3 Information from Third Parties
          </Text>
          {renderListItems([
            "Referral partner and vendor data to verify activity.",
            "Publicly available info for fraud prevention.",
          ])}

          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            2. How We Use Your Information
          </Text>
          {renderListItems([
            "1. Account creation and management",
            "2. Processing rewards and referrals",
            "3. Personalized offers and marketing",
            "4. Communication of updates and newsletters",
            "5. Improving app experience",
            "6. Fraud detection and legal compliance",
          ])}

          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            3. How We Share Your Information
          </Text>
          {renderListItems([
            "With vendors, payment gateways, analytics tools",
            "Business partners for validation",
            "Legal authorities when required",
            "During merger, acquisition, or sale",
          ])}

          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            4. Cookies & Tracking
          </Text>
          {renderListItems([
            "For saving preferences and analytics",
            "To show personalized offers",
          ])}
          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            Disable cookies if desired (may affect features).
          </Text>

          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            5. Data Retention
          </Text>
          {renderListItems([
            "Stored only as long as needed for service and law.",
          ])}

          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            6. Your Rights
          </Text>
          {renderListItems([
            "Access, update, or delete data",
            "Withdraw marketing consent",
            "Request a copy of your data",
          ])}
          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            Email: privacy@wishkro.com
          </Text>

          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            7. Security
          </Text>
          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            We use strong encryption and modern security practices, but no
            method is 100% secure.
          </Text>

          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            8. Children's Privacy
          </Text>
          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            WishKro is not intended for children under 13 and we do not
            knowingly collect their data.
          </Text>

          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            9. Contact Us
          </Text>
          {renderListItems(["📧 privacy@wishkro.com", "🌐 www.wishkro.com"])}

          <TouchableOpacity
            style={[styles.button, isWeb && styles.webButton]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, isWeb && styles.webButtonText]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  function renderListItems(items) {
    return items.map((item, index) => (
      <Text key={index} style={[styles.list, isWeb && styles.webList]}>
        • {item}
      </Text>
    ));
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f6ff" },
  webSafe: {
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },

  header: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    paddingBottom: 14,
    paddingHorizontal: 12,
  },
  webHeader: {
    borderRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 40,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webHeaderRow: {
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },

  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  webBackBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },

  headerTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
  webHeaderTitle: {
    fontSize: 24,
  },

  container: { padding: 16 },
  webContainer: {
    paddingHorizontal: 40,
    paddingTop: 30,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.05)",
  },
  webCard: {
    borderRadius: 20,
    padding: 32,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  webTitle: {
    fontSize: 28,
    marginBottom: 10,
  },

  meta: {
    color: "#6b7280",
    marginBottom: 4,
    fontSize: 13,
  },
  webMeta: {
    fontSize: 15,
    marginBottom: 6,
  },

  paragraph: {
    color: "#374151",
    lineHeight: 22,
    marginBottom: 10,
    fontSize: 13.5,
  },
  webParagraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 12,
    color: "#4b5563",
  },

  heading: {
    fontSize: 16,
    fontWeight: "700",
    marginVertical: 8,
    color: "#0f172a",
  },
  webHeading: {
    fontSize: 20,
    marginVertical: 12,
    fontWeight: "800",
  },

  subheading: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
    color: "#111827",
  },
  webSubheading: {
    fontSize: 18,
    marginTop: 10,
    fontWeight: "700",
  },

  list: {
    color: "#4b5563",
    marginBottom: 6,
    lineHeight: 20,
    fontSize: 13.5,
  },
  webList: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    color: "#475569",
  },

  button: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  webButton: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 12,
    maxWidth: 300,
    alignSelf: "center",
    width: "100%",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  webButtonText: {
    fontSize: 18,
  },
});
