import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView, // <-- Added
  Platform, // <-- Added
  ScrollView, // <-- Added
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from '../firebase';
import { getFirestore, doc, getDoc, updateDoc, getDocs, collection, setDoc } from 'firebase/firestore';
import { sha256 } from 'js-sha256';
import Header from '../components/Header';

export default function ManagerPickerLogin({ navigation, route, onLogoPress }) {
  const { role } = route.params; // 'manager' or 'picker'
  const [username, setUsername] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [showNewPasscode, setShowNewPasscode] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [userDocRef, setUserDocRef] = useState(null);
  const [userDataState, setUserDataState] = useState(null);
  const [storeIdState, setStoreIdState] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    const db = getFirestore(app);
    let found = false;
    let userRef = null;
    let userData = null;
    let storeId = null;
    try {
      // Search all stores for the user
      const storesSnap = await getDocs(collection(db, 'stores'));
      storesSnap.forEach(docSnap => {
        const data = docSnap.data();
        ['managers', 'pickers'].forEach(roleKey => {
          if (data[roleKey]) {
            data[roleKey].forEach(u => {
              if (u.username === username && (u.passcode === passcode || u.passcode === sha256(passcode))) {
                found = true;
                userRef = { role: roleKey, index: data[roleKey].findIndex(x => x.username === username) };
                userData = u;
                setUserDataState(u); // Save for later use
                storeId = docSnap.id;
                setStoreIdState(docSnap.id); // Save storeId for later use
              }
            });
          }
        });
      });
      if (!found) {
        console.log('Login error:', { username, passcode, error: "Nom d'utilisateur ou code incorrect" });
        Alert.alert('Erreur', "Nom d'utilisateur ou code incorrect");
        setLoading(false);
        return;
      }
      if (userData.passcode === 'S2025') {
        setShowChangeModal(true);
        setUserDocRef(userRef);
        setLoading(false);
        return;
      }
      await AsyncStorage.setItem('managerPickerSession', JSON.stringify({ username, role: userRef.role, storeId, isAuthenticated: true }));
      navigation.replace(userRef.role === 'managers' ? 'Manager' : 'Picker');
      setLoading(false);
    } catch (err) {
      console.log('Login exception:', err);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion.');
      setLoading(false);
    }
  };

  const handleChangePasscode = async () => {
    if (!newPasscode || newPasscode.length < 6) {
      Alert.alert('Erreur', 'Le code doit contenir au moins 6 caractères.');
      return;
    }
    const db = getFirestore(app);
    try {
      // Use storeIdState from login
      let storeId = storeIdState;
      if (!storeId) {
        // Try session fallback
        const session = await AsyncStorage.getItem('managerPickerSession');
        if (session) {
          const s = JSON.parse(session);
          storeId = s.storeId;
        }
      }
      if (!storeId) {
        Alert.alert('Erreur', "Impossible de trouver le magasin de l'utilisateur.");
        return;
      }
      const storeRef = doc(db, 'stores', storeId);
      const storeSnap = await getDoc(storeRef);
      if (!storeSnap.exists()) return;
      const data = storeSnap.data();
      const { role, index } = userDocRef;
      // Encrypt passcode
      const encrypted = sha256(newPasscode);
      data[role][index].passcode = encrypted;
      await setDoc(storeRef, { [role]: data[role] }, { merge: true });
      setShowChangeModal(false);
      await AsyncStorage.setItem('managerPickerSession', JSON.stringify({ username, role, storeId, isAuthenticated: true }));
      navigation.replace(role === 'managers' ? 'Manager' : 'Picker');
    } catch (err) {
      console.log('Change passcode exception:', err);
      Alert.alert('Erreur', 'Impossible de changer le code.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={60}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Header onLogoPress={onLogoPress} />
          <View style={styles.authBox}>
            <Image
              source={role === 'manager' ? require('../assets/Manager.png') : require('../assets/Picker.png')}
              style={styles.roleManager}
            />
            <Text style={styles.title}>Connexion {role === 'manager' ? 'Manager' : 'Préparateur'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom d’utilisateur"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <View style={styles.passcodeInputRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Code"
                value={passcode}
                onChangeText={setPasscode}
                secureTextEntry={!showPasscode}
              />
              <TouchableOpacity onPress={() => setShowPasscode(v => !v)} style={styles.eyeIcon}>
                <Ionicons name={showPasscode ? 'eye' : 'eye-off'} size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.authBtn} onPress={handleLogin} disabled={loading}>
              <Text style={styles.authBtnText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
          {showChangeModal && (
            <Modal
              visible={showChangeModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowChangeModal(false)}
            >
              <View style={styles.modalBg}>
                <View style={styles.modalBox}>
                  <Text style={styles.modalTitle}>Changer le code</Text>
                  <Text style={styles.modalDesc}>Ceci est votre première connexion. Veuillez choisir un nouveau code (6+ caractères).</Text>
                  <View style={styles.passcodeInputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="Nouveau code"
                      value={newPasscode}
                      onChangeText={setNewPasscode}
                      secureTextEntry={!showNewPasscode}
                    />
                    <TouchableOpacity onPress={() => setShowNewPasscode(v => !v)} style={styles.eyeIcon}>
                      <Ionicons name={showNewPasscode ? 'eye' : 'eye-off'} size={24} color="#888" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalBtnRow}>
                    <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={handleChangePasscode}>
                      <Text style={styles.modalBtnText}>Confirmer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowChangeModal(false)}>
                      <Text style={styles.modalBtnText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  ); // <-- Added closing parenthesis and semicolon
} // <-- Added closing curly brace

const styles = StyleSheet.create({
  roleManager: {
    width: 180,
    height: 180,
    //top: 20,
    alignSelf: 'center',
    //marginBottom: 12,
    resizeMode: 'contain',
    borderRadius: 100,
  },
  passcodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    paddingRight: 10,
  },
  eyeIcon: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
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
    // Note: Removed width: '100%' here to allow flex: 1 in passcodeInputRow to manage width
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    // Removed border since the parent container now handles it for better alignment
    // borderWidth: 1,
    // borderColor: '#eee',
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
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  confirmBtn: {
    backgroundColor: '#00CFFF',
  },
  cancelBtn: {
    backgroundColor: '#FF4F4F',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});