import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function MyCart({ route, navigation }) {
  const { clientId } = route.params || {};
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'carts'), where('clientId', '==', clientId));
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCartItems(items);
      } catch (err) {
        setCartItems([]);
      }
      setLoading(false);
    };
    if (clientId) fetchCart();
  }, [clientId]);

  const handleRemove = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'carts', itemId));
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      Alert.alert('Supprimé', 'Produit retiré du panier.');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de retirer le produit.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#00CFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Mon Panier <Text style={styles.clientId}>{clientId}</Text></Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#00CFFF" style={{ marginTop: 32 }} />
      ) : cartItems.length === 0 ? (
        <Text style={styles.emptyText}>Aucun produit dans le panier.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemBox}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemDetails}>Taille: {item.size} | Couleur: {item.color}</Text>
              <Text style={styles.itemDetails}>Quantité: {item.quantity}</Text>
              <Text style={styles.itemPrice}>{item.price?.toFixed(2)} $</Text>
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id)}>
                <Ionicons name="trash" size={20} color="#FF4F4F" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBFF',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 30 : 30, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00CFFF',
  },
  clientId: {
    fontSize: 26,
    color: '#888',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 32,
  },
  itemBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#232B36',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232B36',
    flex: 2,
  },
  itemDetails: {
    fontSize: 14,
    color: '#555',
    flex: 2,
  },
  itemPrice: {
    fontSize: 15,
    color: '#00CFFF',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  removeBtn: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
