import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import Header from '../components/Header';
import { app } from '../firebase';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';

const placeholderImg = 'https://ui-avatars.com/api/?name=Manager&background=00CFFF&color=fff&size=128';

export default function ManagerScreen({ onLogoPress, navigation }) {
  const [orders, setOrders] = useState([]);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [managerProfile, setManagerProfile] = useState({ name: 'Manager', username: '', photo: '' });
  const [storeName, setStoreName] = useState('');
  useEffect(() => {
    const fetchOrders = async () => {
      const db = getFirestore(app);
      const ordersRef = collection(db, 'orders');
      const snap = await getDocs(ordersRef);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    const fetchOOSCount = async () => {
      const db = getFirestore(app);
      const oosRef = collection(db, 'out_of_stock');
      const snap = await getDocs(oosRef);
      setOutOfStockCount(snap.size);
    };
    const fetchManagerProfile = async () => {
      const session = await AsyncStorage.getItem('managerPickerSession');
      if (!session) return;
      const { username } = JSON.parse(session);
      const db = getFirestore(app);
      const storesSnap = await getDoc(doc(db, 'stores', 'main'));
      if (storesSnap.exists()) {
        const data = storesSnap.data();
        let found = null;
        if (data.managers) {
          found = data.managers.find(m => m.username === username);
        }
        if (found) {
          setManagerProfile({ name: found.name || 'Manager', username: found.username, photo: found.photo || '' });
          setStoreName(found.storeName || data.name || '');
        }
      }
    };
    fetchOrders();
    fetchOOSCount();
    fetchManagerProfile();
  }, []);

  const handleConfirmPayment = async (orderId) => {
    const db = getFirestore(app);
    await updateDoc(doc(db, 'orders', orderId), { paymentConfirmed: true });
    setOrders(orders.map(o => o.id === orderId ? { ...o, paymentConfirmed: true } : o));
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('managerPickerSession');
    navigation.replace('ManagerPickerLogin', { role: 'manager' });
  };

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <View style={styles.profileRow}>
        <Image
          source={{ uri: managerProfile.photo ? managerProfile.photo : placeholderImg }}
          style={styles.profilePhotoSmall}
        />
        <Text style={styles.storeNameLarge}>{storeName}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#FF4F4F" />
        </TouchableOpacity>
      </View>
      <View style={styles.dashboardBox}>
        <Text style={styles.title}>Tableau de bord du Manager</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Commandes:</Text>
          <Text style={styles.value}>{orders.length}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Produits en rupture de stock:</Text>
          <TouchableOpacity onPress={() => navigation.navigate('OOS')}>
            <Text style={styles.oosValue}>{outOfStockCount}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        style={styles.ordersList}
        renderItem={({ item }) => (
          <View style={styles.orderRow}>
            <Text style={styles.orderTitle}>Commande #{item.id}</Text>
            <Text style={styles.orderProducts}>Produits: {item.products?.length || 0}</Text>
            <Text style={styles.orderTotal}>Total à payer: {item.total || 0}€</Text>
            <TouchableOpacity
              style={[styles.confirmBtn, item.paymentConfirmed && { backgroundColor: '#eee' }]}
              onPress={() => handleConfirmPayment(item.id)}
              disabled={item.paymentConfirmed}
            >
              <Text style={styles.confirmBtnText}>{item.paymentConfirmed ? 'Paiement confirmé' : 'Confirmer le paiement'}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 24,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  profilePhotoSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 10,
  },
  storeNameLarge: {
    fontSize: 15,
    color: '#00CFFF',
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  logoutBtn: {
    padding: 6,
    marginLeft: 8,
  },
  dashboardBox: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00CFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#232B36',
  },
  value: {
    fontSize: 16,
    color: '#232B36',
    fontWeight: 'bold',
  },
  oosValue: {
    fontSize: 16,
    color: '#FF4F4F',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ordersList: {
    marginHorizontal: 24,
    marginTop: 8,
  },
  orderRow: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232B36',
    marginBottom: 4,
  },
  orderProducts: {
    fontSize: 14,
    color: '#232B36',
    marginBottom: 2,
  },
  orderTotal: {
    fontSize: 14,
    color: '#00CFFF',
    marginBottom: 8,
  },
  confirmBtn: {
    backgroundColor: '#00CFFF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
