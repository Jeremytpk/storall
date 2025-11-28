import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function PickerScreen({ onLogoPress }) {
  const navigation = useNavigation();
  const [carts, setCarts] = useState([]);

  React.useEffect(() => {
    const fetchCarts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'carts'));
        const cartsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCarts(cartsList);
      } catch (err) {
        setCarts([]);
      }
    };
    fetchCarts();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('managerPickerSession');
    navigation.replace('ManagerPickerLogin', { role: 'picker' });
  };

  const renderCart = ({ item }) => (
    <TouchableOpacity style={styles.cartItem} onPress={() => navigation.navigate('ClientCart', { cartId: item.id, client: item.clientId })}>
      <View style={styles.cartRow}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={28} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cartText}>Panier de <Text style={styles.clientName}>{item.clientId}</Text></Text>
          <Text style={styles.cartSubText}>{item.itemCount ? item.itemCount : item.quantity ? item.quantity : 0} articles</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#00CFFF" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <View style={styles.profileRow}>
        <View style={styles.avatarCircleLarge}>
          <Ionicons name="person" size={32} color="#fff" />
        </View>
        <Text style={styles.title}>Préparateur</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#FF4F4F" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.subtitle}>Sélectionnez un panier client :</Text>
        <FlatList
          data={carts}
          renderItem={renderCart}
          keyExtractor={item => item.id}
          style={styles.cartList}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
        <TouchableOpacity style={styles.myStoreBtn} onPress={() => navigation.navigate('MyStore')}>
          <Ionicons name="storefront" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.myStoreBtnText}>Ma Boutique</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBFF',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 24,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  avatarCircleLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00CFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoutBtn: {
    padding: 6,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ED8C3',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#232B36',
    marginBottom: 18,
    fontWeight: '500',
  },
  cartList: {
    width: '100%',
    marginBottom: 8,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    width: '100%',
    shadowColor: '#232B36',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00CFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cartText: {
    fontSize: 17,
    color: '#232B36',
    fontWeight: '600',
  },
  clientName: {
    color: '#00CFFF',
    fontWeight: 'bold',
  },
  cartSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  myStoreBtn: {
    flexDirection: 'row',
    backgroundColor: '#00CFFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    bottom: 18,
    marginTop: 18,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  myStoreBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
});
