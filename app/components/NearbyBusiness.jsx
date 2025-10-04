import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NearbyBusinessScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);

      // ✅ Token from AsyncStorage
      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        Alert.alert("Error", "No token found. Please login again.");
        setLoading(false);
        return;
      }

      console.log(
        "📡 Fetching: https://fjfamily.drivexpert.in/api/user/nearby"
      );

      const response = await axios.get(
        "https://fjfamily.drivexpert.in/api/user/nearby",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        console.log("✅ Businesses fetched:", response.data.businesses);
        setBusinesses(response.data.businesses);
      } else {
        console.warn("❌ nearby:", response.data.message);
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching businesses:", error);
      Alert.alert("Error", "Unable to fetch nearby businesses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading nearby businesses...</Text>
      </View>
    );
  }

  if (!businesses.length) {
    return (
      <View style={styles.center}>
        <Text>No businesses found nearby.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏪 Nearby Businesses</Text>

      <FlatList
        data={businesses}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("BusinessDetails", { business: item })
            }
          >
            <Text style={styles.businessName}>{item.name}</Text>
            <Text>{item.category}</Text>
            <Text>{item.address}</Text>
            <Text>📞 {item.phone}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  businessName: { fontSize: 18, fontWeight: "bold" },
});

export default NearbyBusinessScreen;
