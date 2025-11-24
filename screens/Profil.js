import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, updateProfile } from 'firebase/auth';
import { app } from '../firebase';
import Header from '../components/Header';

export default function Profil({ navigation, onLogoPress }) {
  const handleBack = () => navigation.goBack();
  const user = getAuth(app).currentUser;
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email] = useState(user?.email || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || 'https://ui-avatars.com/api/?name=Admin&background=232B36&color=fff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoURL(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await updateProfile(user, { displayName, photoURL });
      setEditMode(false);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <View style={styles.profileBox}>
        <Text style={styles.title}>Profil Administrateur</Text>
        <TouchableOpacity
          disabled={!editMode}
          onPress={editMode ? pickImage : undefined}
          style={styles.photoWrapper}
        >
          <Image source={{ uri: photoURL }} style={styles.profileImg} />
          {editMode && (
            <Text style={styles.editPhotoText}>Modifier la photo (cliquer)</Text>
          )}
        </TouchableOpacity>
        {/* ...existing code... */}
        {editMode ? (
          <TextInput
            style={styles.input}
            value={photoURL}
            onChangeText={setPhotoURL}
            placeholder="URL de la photo"
          />
        ) : null}
        <Text style={styles.label}>Nom</Text>
        {editMode ? (
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Nom"
          />
        ) : (
          <Text style={styles.value}>{displayName}</Text>
        )}
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{email}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => (editMode ? handleSave() : setEditMode(true))}
          disabled={loading}
        >
          <Text style={styles.editBtnText}>{editMode ? 'Enregistrer' : 'Modifier'}</Text>
        </TouchableOpacity>
        {editMode && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditMode(false)}>
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Text style={styles.backBtnText}>{'< Retour'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    top: 10,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtnText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileBox: {
    marginTop: 60,
    marginHorizontal: 24,
    padding: 24,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 18,
  },
  photoWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#eee',
    marginBottom: 4,
  },
  editPhotoText: {
    color: '#00CFFF',
    fontSize: 13,
    marginBottom: 6,
  },
  backBtn: {
    position: 'absolute',
    top: -50,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    //shadowColor: '#232B36',
    //shadowOpacity: 0.08,
    //shadowRadius: 4,
    //elevation: 2,
  },

  backBtnText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editBtn: {
    backgroundColor: '#FFB347',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 18,
    alignItems: 'center',
    width: '100%',
  },
  editBtnText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  cancelBtnText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 15,
  },
  error: {
    color: '#FF4F4F',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
});
