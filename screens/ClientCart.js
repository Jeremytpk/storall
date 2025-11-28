import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function ClientCart({ route, navigation, onLogoPress }) {
  // Accept both clientId and cartId from route params
  const { clientId, cartId } = route.params || {};
  const [cartItems, setCartItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        let items = [];
        if (cartId) {
          // If cartId is provided, fetch only that cart document
          const docRef = doc(db, 'carts', cartId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            items = [{ id: docSnap.id, ...docSnap.data() }];
          }
        } else if (clientId) {
          // Otherwise, fetch all carts for the clientId
          const q = query(collection(db, 'carts'), where('clientId', '==', clientId));
          const querySnapshot = await getDocs(q);
          items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        setCartItems(items);
      } catch (err) {
        setCartItems([]);
      }
    };
    if (clientId || cartId) fetchCart();
  }, [clientId, cartId]);

  // Count of found products
  const foundCount = cartItems.filter(item => item.found).length;

  // Confirm product found or allow uncheck
  const handleProductFound = (item) => {
    if (!item.found) {
      Alert.alert(
        'Confirmation',
        `Confirmez-vous que le produit "${item.name}" a été trouvé ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'OK',
            onPress: () => {
              setCartItems(items => items.map(i => i.id === item.id ? { ...i, found: true } : i));
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Annuler la confirmation',
        `Voulez-vous annuler la confirmation pour "${item.name}" ?`,
        [
          { text: 'Non', style: 'cancel' },
          {
            text: 'Oui',
            onPress: () => {
              setCartItems(items => items.map(i => i.id === item.id ? { ...i, found: false } : i));
            },
          },
        ]
      );
    }
  };

  // Confirm all products found
  const handleConfirmAll = () => {
    if (foundCount !== cartItems.length) {
      Alert.alert('Erreur', 'Veuillez confirmer chaque produit avant de valider.');
      return;
    }
    Alert.alert(
      'Confirmation',
      'Confirmez-vous que tous les articles ont été trouvés ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            setCartItems([]);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleProductPress = (item) => {
    setSelectedProduct(item);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#00CFFF" />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          <View style={styles.completedBox}>
            <Ionicons name="checkmark-circle" size={20} color="#2ED8C3" />
            <Text style={styles.completedText}>{foundCount}/{cartItems.length}</Text>
          </View>
        </View>
        <FlatList
          data={cartItems}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => handleProductPress(item)}>
                <Text style={styles.itemName}>{item.productName || item.name}</Text>
                <Text style={styles.itemDetails}>{item.color} | {item.size} <Text style={styles.itemQty}>x{item.quantity}</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkIconBtn}
                onPress={() => handleProductFound(item)}
                disabled={item.found}
              >
                <Ionicons name={item.found ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={item.found ? '#2ED8C3' : '#bbb'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleProductPress(item)}>
                <Ionicons name="information-circle-outline" size={22} color="#00CFFF" />
              </TouchableOpacity>
            </View>
          )}
          style={styles.cartList}
        />
        {cartItems.length > 0 && (
          <TouchableOpacity style={styles.okBtn} onPress={handleConfirmAll}>
            <Ionicons name="checkmark" size={22} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.okBtnText}>OK</Text>
          </TouchableOpacity>
        )}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Détails du produit</Text>
              {selectedProduct && (
                <>
                  <Text style={styles.modalName}>{selectedProduct.productName || selectedProduct.name}</Text>
                  <Text style={styles.modalInfo}>Couleur: {selectedProduct.color}</Text>
                  <Text style={styles.modalInfo}>Taille: {selectedProduct.size}</Text>
                  <Text style={styles.modalInfo}>Quantité: {selectedProduct.quantity}</Text>
                  <Text style={styles.modalDesc}>{selectedProduct.details}</Text>
                </>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backText: {
    color: '#00CFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  completedText: {
    color: '#2ED8C3',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00CFFF',
    marginBottom: 18,
  },
  clientId: {
    fontWeight: 'normal',
    color: '#2ED8C3',
  },
  cartList: {
    width: '100%',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#232B36',
    fontWeight: '500',
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 15,
    color: '#888',
  },
  itemQty: {
    fontSize: 15,
    color: '#2ED8C3',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  checkIconBtn: {
    marginHorizontal: 8,
  },
  okBtn: {
    flexDirection: 'row',
    backgroundColor: '#2ED8C3',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  okBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: 320,
    alignItems: 'center',
    shadowColor: '#232B36',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00CFFF',
    marginBottom: 8,
  },
  modalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232B36',
    marginBottom: 4,
  },
  modalInfo: {
    fontSize: 15,
    color: '#888',
    marginBottom: 2,
  },
  modalDesc: {
    fontSize: 15,
    color: '#232B36',
    marginTop: 8,
    textAlign: 'center',
  },
  closeBtn: {
    backgroundColor: '#00CFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 18,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
