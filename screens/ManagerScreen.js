import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions, Alert, Modal, TextInput } from 'react-native';
import Header from '../components/Header';
import { app } from '../firebase';
import { getFirestore, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDoc } from 'firebase/firestore';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

const placeholderImg = 'https://ui-avatars.com/api/?name=Manager&background=00CFFF&color=fff&size=128';
const numColumns = 2;
const screenWidth = Dimensions.get('window').width;

function ProductGridItem({ item, onPress, onDelete, onEdit }) {
  let photoSource;
  if (item.photos && item.photos.length > 0) {
    const firstPhoto = item.photos[0];
    // Try to use as a remote URL if it looks like one
    if (typeof firstPhoto === 'string') {
      if (firstPhoto.startsWith('http') || firstPhoto.startsWith('https')) {
        photoSource = { uri: firstPhoto };
      } else if (firstPhoto.startsWith('file://')) {
        photoSource = { uri: firstPhoto };
      } else if (firstPhoto.includes('.jpeg') || firstPhoto.includes('.jpg') || firstPhoto.includes('.png')) {
        // Try to use as a file path or fallback
        photoSource = { uri: firstPhoto };
      }
    } else if (firstPhoto && firstPhoto.uri) {
      photoSource = { uri: firstPhoto.uri };
    }
  }
  return (
    <TouchableOpacity style={{ flex: 1, margin: 8, backgroundColor: '#F9F9F9', borderRadius: 12, alignItems: 'center', padding: 12, maxWidth: (screenWidth/numColumns)-32 }} onPress={() => onPress(item)}>
      {photoSource ? (
        <Image
          source={photoSource}
          style={{ width: 90, height: 90, borderRadius: 8, marginBottom: 8, backgroundColor: '#eee' }}
          defaultSource={require('../assets/items.png')}
          onError={() => {}}
        />
      ) : (
        <Image
          source={require('../assets/items.png')}
          style={{ width: 90, height: 90, borderRadius: 8, marginBottom: 8, backgroundColor: '#eee' }}
        />
      )}
      <Text style={{ fontWeight: 'bold', color: '#232B36', fontSize: 15, marginBottom: 4 }} numberOfLines={1}>{item.name || item.id}</Text>
      <Text style={{ color: '#00CFFF', fontSize: 14, marginBottom: 2 }}>
        {item.price ? `${item.price} $` : ''}
      </Text>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <TouchableOpacity onPress={() => onEdit(item)} style={{ marginHorizontal: 6 }}>
          <Ionicons name="create-outline" size={22} color="#00CFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item)} style={{ marginHorizontal: 6 }}>
          <Ionicons name="trash-outline" size={22} color="#FF4F4F" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function ManagerScreen({ onLogoPress, navigation }) {
  const [orders, setOrders] = useState([]);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [managerProfile, setManagerProfile] = useState({ name: 'Manager', username: '', photo: '' });
  const [storeName, setStoreName] = useState('');
  const [products, setProducts] = useState([]);
  const [managerStoreData, setManagerStoreData] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsName, setDetailsName] = useState('');
  const [detailsPrice, setDetailsPrice] = useState('');
  const [detailsPhotos, setDetailsPhotos] = useState([]);
  const [dashboardVisible, setDashboardVisible] = useState(true);

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
      const storesSnap = await getDocs(collection(db, 'stores'));
      let foundStore = null;
      storesSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.managers) {
          const found = data.managers.find(m => m.username === username);
          if (found) {
            foundStore = { id: docSnap.id, ...data };
            setManagerProfile({ name: found.name || 'Manager', username: found.username, photo: found.photo || '' });
            setStoreName(found.storeName || data.name || '');
          }
        }
      });
      if (foundStore) {
        setManagerStoreData(foundStore);
      } else {
        setManagerStoreData(null);
      }
    };
    const fetchProducts = async () => {
      const session = await AsyncStorage.getItem('managerPickerSession');
      if (!session) return;
      const { username } = JSON.parse(session);
      const db = getFirestore(app);
      // Find the store for the manager
      const storesSnap = await getDocs(collection(db, 'stores'));
      let storeId = null;
      storesSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.managers && data.managers.find(m => m.username === username)) {
          storeId = docSnap.id;
        }
      });
      if (!storeId) {
        setProducts([]);
        return;
      }
      // Get products for this store only
      const productsRef = collection(db, 'products');
      const snap = await getDocs(productsRef);
      const filtered = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(product => product.storeId === storeId);
      setProducts(filtered);
    };
    fetchOrders();
    fetchOOSCount();
    fetchManagerProfile();
    fetchProducts();
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

  const handleDeleteProduct = async (product) => {
    Alert.alert(
      'Supprimer le produit',
      `Voulez-vous vraiment supprimer le produit "${product.name || product.id}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          const db = getFirestore(app);
          await deleteDoc(doc(db, 'products', product.id));
          setProducts(products.filter(p => p.id !== product.id));
        }},
      ]
    );
  };

  const openEditModal = (product) => {
    setEditProduct(product);
    setEditName(product.name || '');
    setEditPrice(product.price ? String(product.price) : '');
    setEditModalVisible(true);
  };

  const handleEditConfirm = async () => {
    if (!editProduct) return;
    const db = getFirestore(app);
    await updateDoc(doc(db, 'products', editProduct.id), {
      name: editName,
      price: editPrice,
      // photo not changed here
    });
    setProducts(products.map(p => p.id === editProduct.id ? { ...p, name: editName, price: editPrice } : p));
    setEditModalVisible(false);
  };

  const openDetailsModal = (product) => {
    setDetailsProduct(product);
    setDetailsName(product.name || '');
    setDetailsPrice(product.price ? String(product.price) : '');
    setDetailsPhotos(product.photos || []);
    setDetailsModalVisible(true);
  };

  const handleDetailsConfirm = async () => {
    if (!detailsProduct) return;
    const db = getFirestore(app);
    await updateDoc(doc(db, 'products', detailsProduct.id), {
      name: detailsName,
      price: detailsPrice,
      photos: detailsPhotos,
    });
    setProducts(products.map(p => p.id === detailsProduct.id ? { ...p, name: detailsName, price: detailsPrice, photos: detailsPhotos } : p));
    setDetailsModalVisible(false);
  };

  // Count all products in stock
  const productsInStockCount = products.filter(p => (typeof p.stock === 'number' ? p.stock > 0 : true)).length;

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 24, marginTop: 24, marginBottom: dashboardVisible ? 0 : 12 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={{ uri: managerProfile.photo ? managerProfile.photo : placeholderImg }}
            style={styles.profilePhotoSmall}
          />
          <Text style={styles.storeNameLarge}>{storeName}</Text>
        </View>
        <TouchableOpacity onPress={() => setDashboardVisible(v => !v)} style={{ marginLeft: 8 }}>
          <Ionicons name={dashboardVisible ? 'eye-off-outline' : 'eye-outline'} size={24} color="#00CFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#FF4F4F" />
        </TouchableOpacity>
      </View>
      {dashboardVisible && (
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
          <View style={styles.row}>
            <Text style={styles.label}>Produits en stock:</Text>
            <Text style={styles.value}>{productsInStockCount}</Text>
          </View>
          <TouchableOpacity style={styles.addProductBtn} onPress={() => navigation.navigate('AddProduct')}>
            <Text style={styles.addProductBtnText}>Ajouter un produit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FIX: Conditionally render the Orders FlatList ONLY if there are orders (orders.length > 0). 
                 This prevents the empty list from consuming vertical space when there are no orders. */}
      {orders.length > 0 && (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          style={styles.ordersList} 
          renderItem={({ item }) => (
            <View style={styles.orderRow}>
              <Text style={styles.orderTitle}>Commande #{item.id}</Text>
              <Text style={styles.orderProducts}>Produits: {item.products?.length || 0}</Text>
              <Text style={styles.orderTotal}>Total à payer: {item.total || 0}$</Text>
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
      )}
      
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, marginTop: 0 }}
        renderItem={({ item }) => (
          <ProductGridItem
            item={item}
            onPress={() => openDetailsModal(item)}
            onDelete={handleDeleteProduct}
            onEdit={() => openEditModal(item)}
          />
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>Aucun produit trouvé</Text>}
      />
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 320 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#00CFFF', marginBottom: 12 }}>Modifier le prix du produit</Text>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>{editProduct?.name}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginBottom: 12 }}
              value={editPrice}
              onChangeText={setEditPrice}
              placeholder="Prix ($)"
              keyboardType="numeric"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={{ padding: 12, borderRadius: 8, backgroundColor: '#FF4F4F', flex: 1, marginRight: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditConfirm} style={{ padding: 12, borderRadius: 8, backgroundColor: '#00CFFF', flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={detailsModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 340, alignItems: 'center' }}>
            {/* Show product photo big */}
            {detailsPhotos && detailsPhotos.length > 0 ? (
              <Image
                source={{ uri: typeof detailsPhotos[0] === 'string' ? detailsPhotos[0] : detailsPhotos[0]?.uri }}
                style={{ width: 180, height: 180, borderRadius: 12, marginBottom: 16, backgroundColor: '#eee' }}
              />
            ) : (
              <Image
                source={require('../assets/items.png')}
                style={{ width: 180, height: 180, borderRadius: 12, marginBottom: 16, backgroundColor: '#eee' }}
              />
            )}
            <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#232B36', marginBottom: 8 }}>{detailsName}</Text>
            <Text style={{ fontSize: 16, color: '#00CFFF', marginBottom: 8 }}>Prix: {detailsPrice} $</Text>
            {/* Add more details if needed */}
            <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={{ padding: 12, borderRadius: 8, backgroundColor: '#00CFFF', width: '100%', marginTop: 12 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 4,
    padding: 10,
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
  addProductBtn: {
    backgroundColor: '#00CFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  addProductBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  ordersList: {
    marginHorizontal: 24,
    // FIX: Set marginTop to 0. Combined with conditional rendering, this eliminates space when no orders exist.
    marginTop: 0, 
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