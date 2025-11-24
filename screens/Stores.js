import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import Header from '../components/Header';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';


import { app } from '../firebase';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';


export default function Stores({ navigation, onLogoPress }) {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [newStoreName, setNewStoreName] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const db = getFirestore(app);
        const querySnapshot = await getDocs(collection(db, 'stores'));
        const storeList = [];
        querySnapshot.forEach(doc => {
          storeList.push({ id: doc.id, ...doc.data() });
        });
        setStores(storeList);
      } catch (error) {
        // Optionally handle error
      }
    };
    fetchStores();
  }, []);

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(search.toLowerCase())
  );

  const db = getFirestore(app);

  const addStore = async () => {
    if (newStoreName.trim()) {
      const newStore = { name: newStoreName, totalPaid: 0 };
      try {
        const docRef = await addDoc(collection(db, 'stores'), newStore);
        setStores([
          ...stores,
          { id: docRef.id, ...newStore },
        ]);
        setNewStoreName('');
        navigation.navigate('StoreDetail', { storeId: docRef.id });
      } catch (error) {
        // Optionally handle error (e.g. show a message)
      }
    }
  };

  const renderStore = ({ item }) => (
    <TouchableOpacity style={styles.storeCard} onPress={() => navigation.navigate('StoreDetail', { storeId: item.id })}>
      <View style={styles.storeInfo}>
        <MaterialIcons name="store" size={32} color="#FFB347" style={{ marginRight: 12 }} />
        <View>
          <Text style={styles.storeName}>{item.name}</Text>
          <Text style={styles.storePaid}>Total payé: {item.totalPaid} €</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} color="#232B36" />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>
      <View style={styles.topSection}>
        <Text style={styles.title}>Liste des Magasins</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un magasin..."
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.addSection}>
          <TextInput
            style={styles.addInput}
            placeholder="Nom du nouveau magasin"
            value={newStoreName}
            onChangeText={setNewStoreName}
          />
          <TouchableOpacity style={styles.addButton} onPress={addStore}>
            <Text style={styles.addButtonText}>Créer</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={filteredStores}
        keyExtractor={item => item.id}
        renderItem={renderStore}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
} 


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: '#232B36',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  topSection: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
    fontSize: 16,
  },
  addSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#FFB347',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  addButtonText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#232B36',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232B36',
  },
  storePaid: {
    fontSize: 15,
    color: '#00CFFF',
    marginTop: 2,
  },
});