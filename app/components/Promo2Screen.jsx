// app/screens/Promo2Screen.jsx
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

export default function Promo2Screen() {
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
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={isWeb ? 26 : 22} color="#fff" />
          </TouchableOpacity>

          <Text style={[styles.brand, isWeb && styles.webBrand]}>
            <Text style={[styles.brandW, isWeb && styles.webBrandW]}>W</Text>
            ishKro
          </Text>

          <View style={{ width: isWeb ? 60 : 44 }} />
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
        <View style={[styles.heroCard, isWeb && styles.webHeroCard]}>
          <Text style={[styles.h1, isWeb && styles.webH1]}>
            Earn Monthly Income{"\n"}
            <Text style={[styles.h1sub, isWeb && styles.webH1sub]}>
              without making any investment or wasting time!
            </Text>
          </Text>

          <Text style={[styles.paragraph, isWeb && styles.webParagraph]}>
            WishKro provides you an opportunity to Earn and let your Referrals
            Earn Monthly Income without making any investment or wasting time.
            WishKro Users can keep their Buying Habits intact but can still Earn
            handsomely while spending money on their existing Sellers and
            Positively Advising their known ones to do the same.
          </Text>

          {/* Right-side illustration placeholder */}
          <View
            style={[
              styles.illustrationWrap,
              isWeb && styles.webIllustrationWrap,
            ]}
          >
            <Text
              style={[
                styles.illustrationText,
                isWeb && styles.webIllustrationText,
              ]}
            >
              [Promo Illustration]
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, isWeb && styles.webInfoCard]}>
          <Text style={[styles.sectionTitle, isWeb && styles.webSectionTitle]}>
            WishKro Champs
          </Text>

          <Text
            style={[
              styles.sectionParagraph,
              isWeb && styles.webSectionParagraph,
            ]}
          >
            WishKro Users can also become WishKro Champs to Earn Big Bucks and
            take the best Advantage of being a WishKro User. WishKro Champs can
            also get their Startups incubated and get their Freebies and various
            Exclusive Offers & Deals
          </Text>

          <TouchableOpacity
            style={[styles.cta, isWeb && styles.webCta]}
            activeOpacity={0.9}
            onPress={() => {
              router.push("/(app)/(tabs)/home");
            }}
          >
            <Text style={[styles.ctaText, isWeb && styles.webCtaText]}>
              Get Started
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

  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginTop: 18,
    flexDirection: "column",
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.04)",
  },
  webHeroCard: {
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
    gap: 20,
  },

  h1: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0b1326",
    lineHeight: 34,
  },
  webH1: {
    fontSize: 36,
    lineHeight: 44,
    textAlign: "center",
  },

  h1sub: {
    fontSize: 20,
    fontWeight: "800",
  },
  webH1sub: {
    fontSize: 28,
    lineHeight: 36,
  },

  paragraph: {
    marginTop: 12,
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },
  webParagraph: {
    marginTop: 0,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    color: "#4b5563",
  },

  illustrationWrap: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 160,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f6f9ff",
  },
  webIllustrationWrap: {
    marginTop: 20,
    minHeight: 280,
    borderRadius: 16,
    backgroundColor: "#f0f7ff",
  },

  illustrationText: {
    color: "#7b8aa3",
    fontSize: 13,
  },
  webIllustrationText: {
    fontSize: 16,
  },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    marginTop: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.04)",
  },
  webInfoCard: {
    borderRadius: 20,
    padding: 32,
    marginTop: 24,
    marginBottom: 40,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 10,
  },
  webSectionTitle: {
    fontSize: 28,
    marginBottom: 16,
    textAlign: "center",
  },

  sectionParagraph: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },
  webSectionParagraph: {
    fontSize: 18,
    lineHeight: 28,
    color: "#475569",
    textAlign: "center",
  },

  cta: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: "#2fb7d9",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  webCta: {
    marginTop: 24,
    alignSelf: "center",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 14,
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
