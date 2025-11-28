import React, { useState } from 'react';
import { View, Text, TextInput, 
  TouchableOpacity, StyleSheet, 
  Modal, KeyboardAvoidingView, 
  Platform, ScrollView } from 'react-native';
import { Image } from 'react-native';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { app } from '../firebase';
import Header from '../components/Header';

export default function AuthScreen({ navigation, onLogoPress }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalSuccess, setModalSuccess] = useState(false);

  const auth = getAuth(app);
  const db = getFirestore(app);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        // Check existence in stores collection
        const storeSnap = await getDoc(doc(db, 'stores', 'main'));
        if (storeSnap.exists()) {
          const data = storeSnap.data();
          if (data.admins && !data.admins.some(a => a.email === email)) {
            setModalMessage("Cet email n'existe pas dans le magasin.");
            setModalSuccess(false);
            setModalVisible(true);
            setLoading(false);
            return;
          }
        }
        await signInWithEmailAndPassword(auth, email, password);
        setModalMessage('Connexion réussie.');
        setModalSuccess(true);
        setModalVisible(true);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          role: 'admin',
          createdAt: new Date().toISOString(),
        });
        // Add to stores collection
        const storeSnap = await getDoc(doc(db, 'stores', 'main'));
        let admins = [];
        if (storeSnap.exists()) {
          const data = storeSnap.data();
          admins = data.admins || [];
        }
        admins.push({ email });
        await setDoc(doc(db, 'stores', 'main'), { admins }, { merge: true });
        setModalMessage('Compte créé avec succès.');
        setModalSuccess(true);
        setModalVisible(true);
      }
    } catch (error) {
      setModalMessage(error.message);
      setModalSuccess(false);
      setModalVisible(true);
    }
    setLoading(false);
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
        <Header onLogoPress={onLogoPress} />
        <View style={styles.authBox}>
          <Image
            source={require('../assets/Admin.png')}
            style={{ width: 180, height: 180, alignSelf: 'center', marginTop: 4, marginBottom: 8, resizeMode: 'contain', borderRadius: 100 }}
          />
          <Text style={styles.title}>{isLogin ? 'Connexion Admin' : 'Créer un compte Admin'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading}>
            <Text style={styles.authBtnText}>{isLogin ? 'Se connecter' : 'Créer le compte'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
            </Text>
          </TouchableOpacity>
        </View>
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: modalSuccess ? '#00CFFF' : '#FF4F4F', textAlign: 'center' }]}> 
                {modalSuccess ? 'Succès' : 'Erreur'}
              </Text>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: modalSuccess ? '#00CFFF' : '#FF4F4F' }]}
                onPress={() => {
                  setModalVisible(false);
                  if (modalSuccess) navigation.replace('Admin');
                }}
              >
                <Text style={styles.closeModalText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 18,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#232B36',
    marginBottom: 18,
    textAlign: 'center',
  },
  closeModalBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignSelf: 'center',
  },
  closeModalText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    color: '#FFB347',
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
    backgroundColor: '#FFB347',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 10,
    alignItems: 'center',
    width: '100%',
  },
  authBtnText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    color: '#00CFFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 8,
  },
});
