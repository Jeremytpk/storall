import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import Header from '../components/Header';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { app } from '../firebase';

export default function ClientScreen({ onLogoPress, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);

  useEffect(() => {
    const fetchStores = async () => {
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, 'products'));
      // Get unique store names from products collection
      const storeNames = Array.from(new Set(snap.docs.map(doc => doc.data().storeName).filter(Boolean)));
      // Map to objects for FlatList compatibility
      const storeList = storeNames.map((name, idx) => ({ id: String(idx), name }));
      setStores(storeList);
      setFilteredStores(storeList);
    };
    fetchStores();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredStores([]);
    } else {
      setFilteredStores(
        stores.filter(s =>
          s.name?.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, stores]);

  const handleHowItWorks = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un magasin..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filteredStores}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.storeRow}
            onPress={async () => {
              // Fetch all products for this store name
              const db = getFirestore(app);
              const snap = await getDocs(collection(db, 'products'));
              const productsList = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(product => product.storeName && product.storeName === item.name);
              navigation.navigate('ClientStore', { store: item, products: productsList });
            }}
          >
            <Text style={styles.storeName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        style={styles.storeList}
      />
      <View style={styles.content}>
        <Image source={require('../assets/person_cart.png')} style={styles.person_cart} />
        <Text style={styles.title}>Bienvenue Client</Text>
        <Text style={styles.instruction}>
          Utilisez la caméra de votre téléphone pour scanner le QR Code du magasin ou recherchez le magasin dans la barre de recherche afin de commencer vos achats.
        </Text>
        <TouchableOpacity style={styles.howItWorksBtn} onPress={handleHowItWorks}>
          <Text style={styles.howItWorksText}>Comment ça marche ?</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 Jeremy Topaka. Tous droits réservés.</Text>
      </View>
      {/* Instruction Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image source={require('../assets/Scan_qrcode.png')} style={styles.Scan_qrcode} />
            <Text style={styles.modalTitle}>Comment ça marche ?</Text>
            <Text style={styles.modalStep}>1. Scannez le QR Code du magasin avec la caméra de votre téléphone.</Text>
            <Text style={styles.modalStep}>2. Consultez le stock et sélectionnez vos produits.</Text>
            <Text style={styles.modalStep}>3. Ajustez la quantité et la couleur si disponible.</Text>
            <Text style={styles.modalStep}>4. Validez votre panier et envoyez la commande.</Text>
            <TouchableOpacity style={styles.closeModalBtn} onPress={handleCloseModal}>
              <Text style={styles.closeModalText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: 320,
    shadowColor: '#232B36',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00CFFF',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalStep: {
    fontSize: 16,
    color: '#232B36',
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
  },
  closeModalBtn: {
    marginTop: 18,
    backgroundColor: '#FFB347',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignSelf: 'center',
  },
  closeModalText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00CFFF',
    marginBottom: 24,
  },
  person_cart: {
    width: 230,
    height: 230,
    resizeMode: 'contain',
    borderRadius: 16,
    marginBottom: 24,
  },
  Scan_qrcode: {
    width: 230,
    height: 230,
    resizeMode: 'contain',
    borderRadius: 16,
    marginBottom: 14,
  },
  instruction: {
    fontSize: 16,
    color: '#232B36',
    textAlign: 'center',
    marginBottom: 24,
    marginHorizontal: 24,
  },
  howItWorksBtn: {
    backgroundColor: '#FFB347',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginBottom: 16,
    alignSelf: 'center',
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  howItWorksText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  searchBox: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 2,
  },
  searchInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  storeList: {
    width: '100%',
    maxHeight: 120,
    marginBottom: 8,
  },
  storeRow: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  storeName: {
    fontSize: 16,
    color: '#00CFFF',
    fontWeight: 'bold',
  },
});