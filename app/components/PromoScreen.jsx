// app/screens/PromoScreen.jsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isWeb = Platform.OS === "web";

export default function PromoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.screen, isWeb && styles.webScreen]}>
      <LinearGradient
        colors={["#6a5af9", "#2f66ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 18) }]}
      >
        <View style={[styles.headerRow, isWeb && styles.webHeaderRow]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, isWeb && styles.webBackBtn]}
          >
            <Ionicons name="chevron-back" size={isWeb ? 26 : 22} color="#fff" />
          </TouchableOpacity>

          <Text style={[styles.brand, isWeb && styles.webBrand]}>
            <Text style={[styles.brandW, isWeb && styles.webBrandW]}>W</Text>
            ishKro
          </Text>

          <View style={{ width: isWeb ? 60 : 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          isWeb && styles.webContainer,
          { paddingBottom: Math.max(insets.bottom, 28) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, isWeb && styles.webCard]}>
          <Text style={[styles.heading, isWeb && styles.webHeading]}>
            Earn Monthly Income{"\n"}
            <Text style={[styles.headingSub, isWeb && styles.webHeadingSub]}>
              without making any investment or wasting time!
            </Text>
          </Text>

          <Text style={[styles.lead, isWeb && styles.webLead]}>
            WishKro offers an opportunity to Earn for Referrals without changing
            purchasing habits—spend money on current Sellers and provide
            Recommendations to known ones!
          </Text>

          {/* Decorative hero area */}
          <View
            style={[styles.heroPlaceholder, isWeb && styles.webHeroPlaceholder]}
          >
            <Text style={[styles.heroText, isWeb && styles.webHeroText]}>
              [Hero illustration]
            </Text>
          </View>

          <View style={[styles.champs, isWeb && styles.webChamps]}>
            <Text style={[styles.champsTitle, isWeb && styles.webChampsTitle]}>
              WishKro Champs
            </Text>
            <Text style={[styles.champsDesc, isWeb && styles.webChampsDesc]}>
              WishKro Champs Earn Big Bucks and Get Freebies By Starting
              Ventures or Exploring Exclusive Offers & Deals
            </Text>
          </View>

          {/* Optional a row of user photos (placeholder) */}
          <View style={[styles.usersRow, isWeb && styles.webUsersRow]}>
            <View
              style={[
                styles.userPicPlaceholder,
                isWeb && styles.webUserPicPlaceholder,
              ]}
            />
            <View
              style={[
                styles.userPicPlaceholder,
                isWeb && styles.webUserPicPlaceholder,
              ]}
            />
            <View
              style={[
                styles.userPicPlaceholder,
                isWeb && styles.webUserPicPlaceholder,
              ]}
            />
          </View>

          <TouchableOpacity
            style={[styles.cta, isWeb && styles.webCta]}
            onPress={() => router.push("/(app)/(tabs)/home")}
          >
            <Text style={[styles.ctaText, isWeb && styles.webCtaText]}>
              Explore Offers
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f3f6ff" },
  webScreen: {
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },

  header: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingBottom: 12,
    paddingHorizontal: 14,
    elevation: 3,
  },
  webHeader: {
    borderRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 40,
  },

  headerRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webHeaderRow: {
    height: 72,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  webBackBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },

  brand: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  webBrand: {
    fontSize: 24,
  },

  brandW: {
    backgroundColor: "#2bb1ff",
    color: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 6,
    fontWeight: "900",
  },
  webBrandW: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  container: { padding: 16 },
  webContainer: {
    paddingHorizontal: 40,
    paddingTop: 30,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  webCard: {
    borderRadius: 20,
    padding: 32,
    marginTop: 24,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  heading: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0b1326",
    lineHeight: 34,
  },
  webHeading: {
    fontSize: 36,
    lineHeight: 44,
    textAlign: "center",
  },

  headingSub: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0b1326",
    lineHeight: 28,
  },
  webHeadingSub: {
    fontSize: 28,
    lineHeight: 36,
  },

  lead: {
    marginTop: 12,
    color: "#374151",
    fontSize: 14.5,
    lineHeight: 20,
  },
  webLead: {
    marginTop: 20,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    color: "#4b5563",
  },

  heroPlaceholder: {
    height: 180,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#eef4ff",
    alignItems: "center",
    justifyContent: "center",
  },
  webHeroPlaceholder: {
    height: 300,
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: "#f0f7ff",
  },

  heroText: { color: "#7b8aa3", fontSize: 13 },
  webHeroText: { fontSize: 16 },

  champs: {
    marginTop: 18,
    padding: 14,
    backgroundColor: "#f7f9ff",
    borderRadius: 10,
  },
  webChamps: {
    marginTop: 24,
    padding: 24,
    borderRadius: 14,
    backgroundColor: "#f8faff",
  },

  champsTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 6,
  },
  webChampsTitle: {
    fontSize: 24,
    marginBottom: 10,
  },

  champsDesc: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  webChampsDesc: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475569",
  },

  usersRow: {
    flexDirection: "row",
    marginTop: 14,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 12,
  },
  webUsersRow: {
    marginTop: 20,
    gap: 20,
    justifyContent: "center",
  },

  userPicPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    elevation: 1,
  },
  webUserPicPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 0,
  },

  cta: {
    marginTop: 18,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  webCta: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },

  ctaText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  webCtaText: {
    fontSize: 18,
  },
});
