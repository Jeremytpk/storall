import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Alert, ScrollView, Platform } from 'react-native';
// NOTE: Assuming Header and firebase imports are correctly configured in your project
// import Header from '../components/Header'; // Uncomment if you are using this component
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import { app } from '../firebase';
import * as ImagePicker from 'expo-image-picker';


const mostUsedColors = ['Rouge', 'Bleu', 'Vert', 'Noir', 'Blanc', 'Jaune', 'Orange', 'Violet', 'Gris', 'Rose'];
const availableSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

function generateProductName() {
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const numbers = Math.floor(100 + Math.random() * 900); // ensures 3 digits
  return letters + numbers;
}

export default function AddProduct({ navigation, onLogoPress }) {
  // Get all current store info for the connected manager
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [managerUsername, setManagerUsername] = useState('');
  const [managerName, setManagerName] = useState('');

  React.useEffect(() => {
    (async () => {
      const session = await AsyncStorage.getItem('managerPickerSession');
      if (session) {
        const { username } = JSON.parse(session);
        setManagerUsername(username);
        try {
          const db = getFirestore(app);
          const storesSnap = await getDocs(collection(db, 'stores'));
          let foundStore = null;
          storesSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.managers) {
              const found = data.managers.find(m => m.username === username);
              if (found) {
                foundStore = { id: docSnap.id, ...data };
                setStoreId(docSnap.id);
                setStoreName(data.name || '');
                setManagerName(found.name || '');
              }
            }
          });
          if (!foundStore) {
            setStoreName('Non trouvé');
          } else {
            // Optionally, set more store data here
            // setStoreData(foundStore);
          }
        } catch (err) {
          console.log('Error fetching store info:', err);
          setStoreName('Erreur');
        }
      } else {
        setStoreName('Non trouvé');
      }
    })();
  }, []);
  const [name, setName] = useState(generateProductName());
  const [price, setPrice] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [photos, setPhotos] = useState([]); // Array of { uri, isMain }

  const handleAddColor = (color) => {
    if (!selectedColors.includes(color)) {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const handleRemoveColor = (color) => {
    setSelectedColors(selectedColors.filter(c => c !== color));
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 4) {
      Alert.alert('Limite atteinte', 'Vous pouvez ajouter jusqu’à 4 photos.');
      return;
    }
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une option',
      [
        {
          text: 'Galerie',
          onPress: async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              // Ensure the first photo added is marked as main
              const isMain = photos.length === 0; 
              setPhotos([...photos, { uri: result.assets[0].uri, isMain }]);
            }
          },
        },
        {
          text: 'Caméra',
          onPress: async () => {
            let result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.7,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              // Ensure the first photo added is marked as main
              const isMain = photos.length === 0;
              setPhotos([...photos, { uri: result.assets[0].uri, isMain }]);
            }
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleSetMainPhoto = (index) => {
    setPhotos(photos.map((p, i) => ({ ...p, isMain: i === index })));
  };

  const handleRemovePhoto = (index) => {
    // If the main photo is removed, set the next photo (if it exists) as main
    const newPhotos = photos.filter((_, i) => i !== index);
    if (photos[index].isMain && newPhotos.length > 0) {
        newPhotos[0].isMain = true;
    }
    setPhotos(newPhotos);
  };

  const handleSaveProduct = async () => {
    if (!name || !price || selectedColors.length === 0 || sizes.length === 0 || photos.length < 1) {
      console.log('DEBUG: Missing required product fields', { name, price, selectedColors, sizes, photos });
      Alert.alert('Erreur', 'Veuillez remplir tous les champs et ajouter au moins une photo.');
      return;
    }
    if (!storeId || !storeName || !managerUsername || !managerName) {
      console.log('DEBUG: Missing store/manager info', { storeId, storeName, managerUsername, managerName });
      Alert.alert('Erreur', "Impossible d'associer le produit au magasin ou au manager. Veuillez vérifier la connexion et les droits du compte.");
      return;
    }

    try {
      const db = getFirestore(app);
      const productData = {
  name,
  price: parseFloat(price),
  colors: selectedColors,
  sizes,
  photos: photos.map(p => p.uri),
  mainPhoto: photos.find(p => p.isMain)?.uri || photos[0]?.uri,
  createdAt: new Date().toISOString(),
  storeId: storeId,
  storeName: storeName,
  managerUsername: managerUsername,
  managerName: managerName,
      };
      const docRef = await addDoc(collection(db, 'products'), productData);
      Alert.alert('Succès', `Produit ${name} enregistré avec l'ID: ${docRef.id}`);
      setName(generateProductName());
      setPrice('');
      setSelectedColors([]);
      setSizes([]);
      setPhotos([]);
      navigation.goBack();
    } catch (error) {
  console.log('DEBUG: Firestore error when saving product', error);
  Alert.alert('Erreur', "Échec de l'enregistrement du produit. Vérifiez votre connexion Firebase.");
    }
  };

  // --- START OF CORRECT JSX RETURN ---
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#00CFFF" />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <View style={styles.managerInfoBox}>
          <Text style={styles.managerInfoText}>{managerUsername ? managerUsername : ''}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Ajouter un produit</Text>
          <TextInput
            style={styles.input}
            placeholder="Nom du produit"
            value={name}
            // If you want to allow editing the generated name, set editable={true}
            editable={false} 
          />
          <TextInput
            style={styles.input}
            placeholder="Prix ($)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <Text style={styles.label}>Couleurs les plus utilisées :</Text>
          <View style={styles.colorsRow}>
            {mostUsedColors.map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.colorBtn, selectedColors.includes(color) && styles.colorBtnSelected]}
                onPress={() => selectedColors.includes(color) ? handleRemoveColor(color) : handleAddColor(color)}
              >
                <Text style={[styles.colorBtnText, selectedColors.includes(color) && { color: '#fff' }]}>{color}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Tailles :</Text>
          <View style={styles.sizesRow}>
            {availableSizes.map(size => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeBtn, sizes.includes(size) && styles.sizeBtnSelected]}
                onPress={() => sizes.includes(size) ? setSizes(sizes.filter(s => s !== size)) : setSizes([...sizes, size])}
              >
                <Text style={[styles.sizeBtnText, sizes.includes(size) && { color: '#fff' }]}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Photos (max 4, choisir la principale) :</Text>
          <FlatList
            data={photos}
            horizontal
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.photoBox}>
                <TouchableOpacity onPress={() => handleSetMainPhoto(index)}>
                  <Image source={{ uri: item.uri }} style={[styles.photo, item.isMain && styles.mainPhoto]} />
                  {item.isMain && <Text style={styles.mainPhotoLabel}>Principale</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.removePhotoBtn} onPress={() => handleRemovePhoto(index)}>
                  <Ionicons name="close-circle" size={22} color="#FF4F4F" />
                </TouchableOpacity>
              </View>
            )}
            style={styles.photosList}
          />
          <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto}>
            <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.addPhotoBtnText}>Ajouter une photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct}>
            <Ionicons name="checkmark" size={22} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>Enregistrer le produit</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
  // --- END OF CORRECT JSX RETURN ---
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginHorizontal: 8,
  },
  managerInfoBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
    top: 19,
  },
  managerInfoText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 15,
  },
  container: {
    // flex: 1 removed from container to allow ScrollView content to size correctly
    backgroundColor: '#F7FBFF',
    paddingHorizontal: 16,
    paddingTop: 24,
    minHeight: '100%', // Ensure it fills the screen height initially
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00CFFF',
    marginBottom: 18,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#232B36',
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  colorBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  colorBtnSelected: {
    backgroundColor: '#00CFFF',
  },
  colorBtnText: {
    color: '#232B36',
    fontWeight: 'bold',
  },
  sizesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  sizeBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  sizeBtnSelected: {
    backgroundColor: '#00CFFF',
  },
  sizeBtnText: {
    color: '#232B36',
    fontWeight: 'bold',
  },
  photosList: {
    marginBottom: 10,
    minHeight: 100, // Reduced from 120, looks better for 80x80 photos
  },
  photoBox: {
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#eee',
  },
  mainPhoto: {
    borderColor: '#00CFFF',
    borderWidth: 3,
  },
  mainPhotoLabel: {
    color: '#00CFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 2,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 0,
    right: -8,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    backgroundColor: '#00CFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'center',
    // Removed 'bottom: 20' to let ScrollView manage spacing
  },
  addPhotoBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#2ED8C3',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 30, // Added bottom padding for spacing in ScrollView
    alignSelf: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 8,
    alignSelf: 'flex-start',
    bottom: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  backText: {
    color: '#00CFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});