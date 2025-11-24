import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from '../firebase';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { sha256 } from 'js-sha256';
import Header from '../components/Header';

export default function ManagerPickerLogin({ navigation, route, onLogoPress }) {
  const { role } = route.params; // 'manager' or 'picker'
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [userDocRef, setUserDocRef] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    const db = getFirestore(app);
    // Find user in stores collection
    let found = false;
    let userRef = null;
    let userData = null;
    let storeId = null;
    const storesSnap = await getDoc(doc(db, 'stores', 'main'));
    if (storesSnap.exists()) {
      const data = storesSnap.data();
      ['managers', 'pickers'].forEach(roleKey => {
        if (data[roleKey]) {
          data[roleKey].forEach(u => {
            if (u.username === username && (u.passcode === passcode || u.passcode === sha256(passcode))) {
              found = true;
              userRef = { role: roleKey, index: data[roleKey].findIndex(x => x.username === username) };
              userData = u;
              storeId = u.storeId || u.storeName || data.name || 'main';
            }
          });
        }
      });
    }
    if (!found) {
      Alert.alert('Erreur', "Nom d'utilisateur ou code incorrect");
      setLoading(false);
      return;
    }
    // If passcode is default, force change
    if (userData.passcode === 'S2025') {
      setShowChangeModal(true);
      setUserDocRef(userRef);
      setLoading(false);
      return;
    }
    // Save session with storeId
    await AsyncStorage.setItem('managerPickerSession', JSON.stringify({ username, role: userRef.role, storeId }));
    navigation.replace(userRef.role === 'managers' ? 'Manager' : 'Picker');
    setLoading(false);
  };

  const handleChangePasscode = async () => {
    if (!newPasscode || newPasscode.length < 6) {
      Alert.alert('Erreur', 'Le code doit contenir au moins 6 caractères.');
      return;
    }
    const db = getFirestore(app);
    const storesSnap = await getDoc(doc(db, 'stores', 'main'));
    if (!storesSnap.exists()) return;
    const data = storesSnap.data();
    const { role, index } = userDocRef;
    // Encrypt passcode
    const encrypted = sha256(newPasscode);
    data[role][index].passcode = encrypted;
    await updateDoc(doc(db, 'stores', 'main'), { [role]: data[role] });
    setShowChangeModal(false);
    await AsyncStorage.setItem('managerPickerSession', JSON.stringify({ username, role }));
    navigation.replace(role === 'managers' ? 'Manager' : 'Picker');
  };

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <View style={styles.authBox}>
        <Text style={styles.title}>Connexion {role === 'manager' ? 'Manager' : 'Picker'}</Text>
        <TextInput
          style={styles.input}
          placeholder="Nom d’utilisateur"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Code"
          value={passcode}
          onChangeText={setPasscode}
          secureTextEntry
        />
        <TouchableOpacity style={styles.authBtn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.authBtnText}>Se connecter</Text>
        </TouchableOpacity>
        <Modal visible={showChangeModal} transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Changer le code</Text>
              <Text style={styles.modalDesc}>Ceci est votre première connexion. Veuillez choisir un nouveau code (6+ caractères).</Text>
              <TextInput
                style={styles.input}
                placeholder="Nouveau code"
                value={newPasscode}
                onChangeText={setNewPasscode}
                secureTextEntry
              />
              <TouchableOpacity style={styles.authBtn} onPress={handleChangePasscode}>
                <Text style={styles.authBtnText}>Confirmer</Text>
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
    backgroundColor: '#fff',
  },
  authBox: {
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
    color: '#00CFFF',
    marginBottom: 18,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    marginBottom: 12,
  },
  authBtn: {
    backgroundColor: '#00CFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 10,
    alignItems: 'center',
    width: '100%',
  },
  authBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  modalDesc: {
    fontSize: 15,
    color: '#232B36',
    marginBottom: 16,
    textAlign: 'center',
  },
});
