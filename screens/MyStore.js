import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

// Dummy products data
const products = [
  { id: '1', name: 'Produit A', stock: 12 },
  { id: '2', name: 'Produit B', stock: 5 },
  { id: '3', name: 'Produit C', stock: 0 },
  { id: '4', name: 'Produit D', stock: 7 },
];

export default function MyStore({ navigation, onLogoPress }) {
  const [search, setSearch] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#00CFFF" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ma Boutique</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un produit..."
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.productRow}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={[styles.productStock, item.stock === 0 && { color: '#FF4F4F' }]}>Stock: {item.stock}</Text>
              <TouchableOpacity style={styles.sellBtn} disabled={item.stock === 0}>
                <Text style={styles.sellBtnText}>{item.stock === 0 ? 'Rupture' : 'Vendre'}</Text>
              </TouchableOpacity>
            </View>
          )}
          style={styles.productList}
        />
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00CFFF',
    marginBottom: 18,
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    marginBottom: 16,
  },
  productList: {
    width: '100%',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  productName: {
    fontSize: 16,
    color: '#232B36',
    fontWeight: '500',
    flex: 1,
  },
  productStock: {
    fontSize: 15,
    color: '#2ED8C3',
    fontWeight: 'bold',
    marginRight: 12,
  },
  sellBtn: {
    backgroundColor: '#00CFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  sellBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
