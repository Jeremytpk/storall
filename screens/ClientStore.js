import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, Image } from 'react-native';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { app } from '../firebase';
import { setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

function generateClientId() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const numbers = Math.floor(100 + Math.random() * 900); // ensures 3 digits
  return letter + numbers;
}

export default function ClientStore({ route, navigation, onLogoPress }) {
  const [quantity, setQuantity] = useState(1);
  const { store, products: initialProducts } = route.params || {};
  const [buyingStarted, setBuyingStarted] = useState(false);
  const [clientId, setClientId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [colorModalVisible, setColorModalVisible] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
      setLoading(false);
    } else {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const db = getFirestore(app);
          const productsRef = collection(db, 'products');
          const querySnapshot = await getDocs(productsRef);
          const productsList = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(product => product.storeName && store?.name && product.storeName === store.name);
          setProducts(productsList);
        } catch (err) {
          setProducts([]);
        }
        setLoading(false);
      };
      if (store?.id || store?.name) fetchProducts();
    }
  }, [store, initialProducts]); // Added initialProducts to dependency array

  const handleStartBuying = () => {
    if (!buyingStarted) {
      Alert.alert(
        'Commencer les achats',
        'Voulez-vous commencer vos achats ? Un identifiant client sera généré.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Oui',
            onPress: () => {
              setBuyingStarted(true);
              setClientId(generateClientId());
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Annuler les achats',
        'Voulez-vous annuler vos achats en cours ? Le panier sera réinitialisé.',
        [
          { text: 'Non', style: 'cancel' },
          {
            text: 'Oui',
            onPress: () => {
              setBuyingStarted(false);
              setClientId('');
              setCart([]);
            },
          },
        ]
      );
    }
  };

  const handleAddToCart = (product) => {
    if (!buyingStarted) {
      Alert.alert('Erreur', 'Veuillez commencer vos achats avant d’ajouter des produits.');
      return;
    }
    if (!selectedSize || !selectedColor) {
      Alert.alert('Erreur', 'Veuillez sélectionner une taille et une couleur.');
      return;
    }
    // Prepare order data
    const orderData = {
      clientId,
      storeId: store?.id,
      storeName: store?.name,
      productId: product.id,
      productName: product.name,
      price: product.price,
      size: selectedSize,
      color: selectedColor,
      quantity,
      timestamp: new Date().toISOString(),
    };
    setCart(prev => {
      // If already in cart, update quantity
      const exists = prev.find(c => c.productId === product.id);
      if (exists) {
        return prev.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + quantity } : c);
      }
      return [...prev, orderData];
    });
    setDoc(doc(db, 'carts', `${clientId}_${product.id}`), orderData);
    Alert.alert('Ajouté', 'Produit ajouté au panier !');
    setSelectedProduct(null);
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);
  };

  const openProductModal = (product) => {
  setSelectedProduct(product);
  setSelectedSize('');
  setSelectedColor('');
  setQuantity(1);
  };

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#00CFFF" />
        </TouchableOpacity>
  <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('MyCart', { clientId })}>
          <Ionicons name="cart" size={28} color="#00CFFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.storeTitle}>{store?.name || 'Magasin'}</Text>
        </View>
        <TouchableOpacity style={[styles.startBtn, buyingStarted && styles.cancelBtn]} onPress={handleStartBuying}>
          <Ionicons name={buyingStarted ? 'close' : 'play'} size={20} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.startBtnText}>{buyingStarted ? 'Annuler achat' : 'Commencer achat'}</Text>
        </TouchableOpacity>
      </View>
      {buyingStarted && (
        <Text style={styles.clientIdText}>ID: {clientId}</Text>
      )}
      {loading ? (
        <ActivityIndicator size="large" color="#00CFFF" style={{ marginTop: 32 }} />
      ) : products.length === 0 ? (
        <View style={styles.noDataBox}>
          <Ionicons name="alert-circle-outline" size={40} color="#FF4F4F" style={{ marginBottom: 8 }} />
          <Text style={styles.noDataText}>Aucun produit disponible dans ce magasin.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.storeCard}>
              <TouchableOpacity style={{width: '100%'}} onPress={() => openProductModal(item)}>
                {item.photos && item.photos[0] ? (
                  <Image
                    source={{ uri: item.photos[0] }}
                    style={styles.storeImage}
                  />
                ) : null}
                <Text style={styles.storeName}>{item.name}</Text>
                <Text style={styles.storePrice}>{item.price?.toFixed(2)} $</Text>
              </TouchableOpacity>
              {cart.some(c => c.productId === item.id) ? (
                <TouchableOpacity style={styles.checkBtn} onPress={() => {
                  setCart(prev => prev.filter(c => c.productId !== item.id));
                  deleteDoc(doc(db, 'carts', `${clientId}_${item.id}`));
                }}>
                  <Ionicons name="checkmark-circle" size={28} color="#2ED8C3" />
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          contentContainerStyle={styles.grid}
          style={styles.productList}
        />
      )}
      
      {/* FIX: This Modal was incorrectly structured and caused the syntax error. 
               It is now correctly defined to show product details. */}
      <Modal visible={!!selectedProduct} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selectedProduct?.name}</Text>
            {selectedProduct?.photos && selectedProduct.photos[0] ? (
              <Image
                source={{ uri: selectedProduct.photos[0] }}
                style={styles.modalImage}
              />
            ) : null}
            <Text style={styles.modalPrice}>{selectedProduct?.price?.toFixed(2)} $</Text>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setSizeModalVisible(true)}>
              <Text style={styles.selectBtnText}>Taille: {selectedSize || 'Choisir'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selectBtn} onPress={() => setColorModalVisible(true)}>
              <Text style={styles.selectBtnText}>Couleur: {selectedColor || 'Choisir'}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                <Ionicons name="remove-circle" size={28} color="#00CFFF" />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, marginHorizontal: 12 }}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => q + 1)}>
                <Ionicons name="add-circle" size={28} color="#00CFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(selectedProduct)}>
              <Ionicons name="cart" size={20} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.addBtnText}>Ajouter au panier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProduct(null)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={sizeModalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choisir une taille</Text>
            {/* Added check for selectedProduct before accessing sizes */}
            {selectedProduct?.sizes?.map(size => (
              <TouchableOpacity key={size} style={styles.selectBtn} onPress={() => { setSelectedSize(size); setSizeModalVisible(false); }}>
                <Text style={styles.selectBtnText}>{size}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSizeModalVisible(false)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={colorModalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choisir une couleur</Text>
            {/* Added check for selectedProduct before accessing colors */}
            {selectedProduct?.colors?.map(color => (
              <TouchableOpacity key={color} style={styles.selectBtn} onPress={() => { setSelectedColor(color); setColorModalVisible(false); }}>
                <Text style={styles.selectBtnText}>{color}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setColorModalVisible(false)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  qtyBtn: {
    padding: 4,
  },
  cancelBtn: {
    backgroundColor: '#FF4F4F',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
    marginLeft: 8,
  },
  cartBtn: {
    marginLeft: 280,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'flex-end',
    justifyContent: 'end',
  },
  checkBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    margin: 8,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#232B36',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 150,
    maxWidth: '48%',
  },
  storeImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  storeName: {
    fontSize: 16,
    color: '#00CFFF',
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  storePrice: {
    fontSize: 15,
    color: '#2ED8C3',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'start',
    justifyContent: 'center',
  },
  productImage: {
    width: 90,
    height: 90,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  modalImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  container: {
    flex: 1,
    backgroundColor: '#F7FBFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  storeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00CFFF',
  },
  startBtn: {
    flexDirection: 'row',
    backgroundColor: '#00CFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 4,
  },
  productList: {
    width: '100%',
  },
  grid: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    margin: 8,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  productName: {
    fontSize: 16,
    color: '#232B36',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 15,
    color: '#2ED8C3',
    fontWeight: 'bold',
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
  modalPrice: {
    fontSize: 16,
    color: '#2ED8C3',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  selectBtn: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginVertical: 6,
    alignItems: 'center',
    width: '100%',
  },
  selectBtnText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 15,
  },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#2ED8C3',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 12,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
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
  clientIdText: {
    fontSize: 15,
    color: '#888',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  noDataText: {
    fontSize: 16,
    color: '#FF4F4F',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});