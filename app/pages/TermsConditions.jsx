// app/screens/TermsConditionsScreen.jsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React from "react";
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

export default function TermsConditionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safe, isWeb && styles.webSafe]}>
      <Stack.Screen options={{ headerShown: false }} />

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
            Terms & Conditions
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
            Terms & Conditions
          </Text>
          <Text style={[styles.meta, isWeb && styles.webMeta]}>
            Effective Date: 5th November 2025
          </Text>
          <Text style={[styles.meta, isWeb && styles.webMeta]}>
            Last Updated: 5th November 2025
          </Text>

          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            Welcome to WishKro.com ("WishKro", "we", "our", or "us"). These
            Terms & Conditions ("Terms") govern your use of our website, mobile
            application, and related services (collectively, the "Services").
          </Text>
          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            By accessing or using WishKro, you agree to be bound by these Terms.
            If you do not agree, please stop using our Services.
          </Text>

          {renderSection("1. Eligibility", [
            "You must be at least 18 years old (or the age of majority in your jurisdiction) to use WishKro.",
            "By registering, you confirm that the information you provide is accurate and complete.",
          ])}

          {renderSection("2. Account Registration", [
            "You must create an account to access certain features, including earning rewards and making referrals.",
            "You are responsible for maintaining the confidentiality of your login credentials.",
            "You agree to notify us immediately of any unauthorized use of your account.",
          ])}

          {renderSection("3. How WishKro Works", [
            "Earning - Users earn rewards by making purchases from approved sellers and referring others to do the same.",
            "Referral Program - Earnings from referrals are subject to validation and may take time to appear in your account.",
            "No Guarantee of Income - While many users earn regularly, earnings vary and are not guaranteed.",
            "Compliance - You must follow our referral rules and not engage in fraudulent or spammy activity.",
          ])}

          {renderSection("4. Payments & Rewards", [
            "Rewards will be credited in accordance with our payment schedule and after verification.",
            "You are responsible for providing accurate payment details.",
            "Any applicable taxes are your responsibility.",
          ])}

          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            5. Prohibited Activities
          </Text>
          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            You agree not to:
          </Text>
          {renderListItems([
            "Use the Services for any unlawful purpose",
            "Create fake accounts or engage in fraudulent transactions",
            "Attempt to hack, reverse-engineer, or disrupt our Services",
            "Mislead or deceive others for personal gain",
          ])}
          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            Violation of these rules may result in suspension or termination of
            your account and forfeiture of earnings.
          </Text>

          {renderSection("6. Intellectual Property", [
            "All content on WishKro (logo, design, text, graphics, software) is owned by or licensed to us.",
            "You may not copy, modify, distribute, or create derivative works without our written permission.",
          ])}

          {renderSection("7. Third-Party Services", [
            "WishKro may display offers, links, or promotions from third parties.",
            "We are not responsible for the content, accuracy, or practices of these third parties.",
          ])}

          {renderSection("8. Termination", [
            "We may suspend or terminate your account at any time, with or without notice, if you violate these Terms, engage in fraudulent activity, or harm WishKro or its users.",
          ])}

          {renderSection("9. Limitation of Liability", [
            "WishKro is provided 'as is' without warranties of any kind.",
            "We are not liable for any indirect, incidental, or consequential damages resulting from your use of our Services.",
          ])}

          {renderSection("10. Indemnification", [
            "You agree to indemnify and hold harmless WishKro and its affiliates from any claims, losses, damages, or expenses arising from your use of the Services or your violation of these Terms or applicable laws.",
          ])}

          {renderSection("11. Changes to These Terms", [
            "We may update these Terms from time to time. The revised version will be posted with the 'Last Updated' date, and continued use of our Services means you accept the changes.",
          ])}

          {renderSection("12. Governing Law", [
            "These Terms are governed by the laws of [Insert Jurisdiction/Country].",
          ])}

          {renderSection("13. Contact Us", [
            "📧 support@wishkro.com",
            "🌐 www.wishkro.com",
          ])}

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

  function renderSection(title, items) {
    return (
      <>
        <Text style={[styles.heading, isWeb && styles.webHeading]}>
          {title}
        </Text>
        {renderListItems(items)}
      </>
    );
  }

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
