import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import Header from '../components/Header';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { app } from '../firebase';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// No dummy data, all from Firestore

export default function StoreDetail({ route, navigation, onLogoPress }) {
  const { storeId } = route.params;
  const db = getFirestore(app);
  const storeRef = doc(db, 'stores', storeId);

  useEffect(() => {
    setEditingStoreName(storeName);
  }, [storeName]);

  const handleEditStoreName = () => {
    setIsEditingStoreName(true);
  };
  const handleConfirmEditStoreName = async () => {
    try {
      await storeRef.update({ name: editingStoreName });
      setStoreName(editingStoreName);
      setIsEditingStoreName(false);
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'enregistrer le nom du magasin.");
    }
  };
  const handleCancelEditStoreName = () => {
    setEditingStoreName(storeName);
    setIsEditingStoreName(false);
  };

  // Store name editing
  const [editingStoreName, setEditingStoreName] = useState('');
  const [isEditingStoreName, setIsEditingStoreName] = useState(false);
  const [editingManagerId, setEditingManagerId] = useState(null);
  const [editingManagerName, setEditingManagerName] = useState('');
  const [editingPickerId, setEditingPickerId] = useState(null);
  const [editingPickerName, setEditingPickerName] = useState('');
  function handleEditManager(id, name) {
    setEditingManagerId(id);
    setEditingManagerName(name);
  }
  function handleConfirmEditManager() {
    setManagers(managers.map(m => m.id === editingManagerId ? { ...m, name: editingManagerName, username: generateUsername(editingManagerName) } : m));
    setEditingManagerId(null);
    setEditingManagerName('');
  }
  function handleCancelEditManager() {
    setEditingManagerId(null);
    setEditingManagerName('');
  }
  function handleEditPicker(id, name) {
    setEditingPickerId(id);
    setEditingPickerName(name);
  }
  function handleConfirmEditPicker() {
    setPickers(pickers.map(p => p.id === editingPickerId ? { ...p, name: editingPickerName, username: generateUsername(editingPickerName) } : p));
    setEditingPickerId(null);
    setEditingPickerName('');
  }
  function handleCancelEditPicker() {
    setEditingPickerId(null);
    setEditingPickerName('');
  }
  function generateUsername(name) {
    // Split name into parts
    const parts = name.trim().split(' ');
    let first = parts[0] || '';
    let last = parts[1] || '';
    // Take first 2 letters of first and last name
    let base = (first.slice(0,2) + last.slice(0,2)).toLowerCase();
    // Add random 3 digits
    let rand = Math.floor(100 + Math.random() * 900);
    let username = (base + rand).slice(0,7);
    return username;
  }
  const [newManager, setNewManager] = useState('');
  const [newPicker, setNewPicker] = useState('');
  const [storeName, setStoreName] = useState('');
  const [isActive, setIsActive] = useState(true);
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const db = getFirestore(app);
        const storeRef = doc(db, 'stores', storeId);
        const storeSnap = await getDoc(storeRef);
        if (storeSnap.exists()) {
          const data = storeSnap.data();
          setStoreName(data.name || '');
          setIsActive(data.isActive !== undefined ? data.isActive : true);
          setManagers(Array.isArray(data.managers) ? data.managers : []);
          setPickers(Array.isArray(data.pickers) ? data.pickers : []);
        }
      } catch (error) {
        // Optionally handle error
      }
    };
    fetchStore();
  }, [storeId]);
  const [managers, setManagers] = useState([]);
  const [pickers, setPickers] = useState([]);

  const addManager = async () => {
    if (newManager.trim()) {
      const username = generateUsername(newManager);
      const passcode = 'S2025';
      const newManagers = [...managers, { id: Date.now().toString(), name: newManager, username, passcode }];
      setManagers(newManagers);
      setNewManager('');
      try {
        await setDoc(storeRef, { managers: newManagers }, { merge: true });
      } catch (e) {
        Alert.alert('Erreur', "Impossible d'ajouter le manager dans la base.");
      }
    }
  };
  const removeManager = id => {
    setManagers(managers.filter(m => m.id !== id));
  };
  const addPicker = async () => {
    if (newPicker.trim()) {
      const username = generateUsername(newPicker);
      const passcode = 'S2025';
      const newPickers = [...pickers, { id: Date.now().toString(), name: newPicker, username, passcode }];
      setPickers(newPickers);
      setNewPicker('');
      try {
        await setDoc(storeRef, { pickers: newPickers }, { merge: true });
      } catch (e) {
        Alert.alert('Erreur', "Impossible d'ajouter le picker dans la base.");
      }
    }
  };
  const removePicker = id => {
    setPickers(pickers.filter(p => p.id !== id));
  };
  const deactivateStore = () => {
    setIsActive(false);
    Alert.alert('Magasin désactivé', 'Ce magasin ne sera plus visible côté client.');
  };
  const activateStore = () => {
    setIsActive(true);
    Alert.alert('Magasin activé', 'Ce magasin est maintenant visible côté client.');
  };
  const deleteStore = () => {
    Alert.alert(
      'Supprimer le magasin',
      'Êtes-vous sûr de vouloir supprimer ce magasin ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };
  function handleResetManagerPasscode(id) {
    Alert.alert(
      'Réinitialiser le code',
      'Voulez-vous vraiment réinitialiser le code de ce manager ? Il sera défini à S2025.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', style: 'destructive', onPress: () => {
          setManagers(managers.map(m => m.id === id ? { ...m, passcode: 'S2025' } : m));
          updateManagerPasscode(id, 'S2025');
        } }
      ]
    );
  }
  async function updateManagerPasscode(id, newPasscode) {
    const updatedManagers = managers.map(m => m.id === id ? { ...m, passcode: newPasscode } : m);
    try {
      await setDoc(storeRef, { managers: updatedManagers }, { merge: true });
    } catch (e) {
      Alert.alert('Erreur', "Impossible de réinitialiser le code du manager.");
    }
  }
  function handleResetPickerPasscode(id) {
    Alert.alert(
      'Réinitialiser le code',
      'Voulez-vous vraiment réinitialiser le code de ce picker ? Il sera défini à S2025.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', style: 'destructive', onPress: () => {
          setPickers(pickers.map(p => p.id === id ? { ...p, passcode: 'S2025' } : p));
          updatePickerPasscode(id, 'S2025');
        } }
      ]
    );
  }
  async function updatePickerPasscode(id, newPasscode) {
    const updatedPickers = pickers.map(p => p.id === id ? { ...p, passcode: newPasscode } : p);
    try {
      await setDoc(storeRef, { pickers: updatedPickers }, { merge: true });
    } catch (e) {
      Alert.alert('Erreur', "Impossible de réinitialiser le code du picker.");
    }
  }

  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={28} color="#232B36" />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>
      <View style={styles.section}>
        <Text style={styles.title}>{storeName}</Text>
        {isEditingStoreName ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={editingStoreName}
              onChangeText={setEditingStoreName}
              placeholder="Nom du magasin"
            />
            <TouchableOpacity onPress={handleConfirmEditStoreName} style={styles.confirmEditBtn}>
              <MaterialIcons name="check" size={22} color="#00CFFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelEditStoreName} style={styles.cancelEditBtn}>
              <MaterialIcons name="close" size={22} color="#FF4F4F" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]} 
              value={storeName}
              editable={false}
              placeholder="Nom du magasin"
            />
            <TouchableOpacity onPress={handleEditStoreName} style={styles.editIconBtn}>
              <MaterialIcons name="edit" size={18} color="#232B36" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Statut:</Text>
          <Text style={[styles.status, { color: isActive ? '#00CFFF' : '#FF4F4F' }]}>
            {isActive ? 'Actif' : 'Désactivé'}
          </Text>
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: isActive ? '#FF4F4F' : '#00CFFF' }]}
            onPress={isActive ? deactivateStore : activateStore}
          >
            <Text style={styles.statusButtonText}>{isActive ? 'Désactiver' : 'Activer'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={deleteStore}>
          <MaterialIcons name="delete" size={22} color="#fff" />
          <Text style={styles.deleteButtonText}>Supprimer le magasin</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.subtitle}>Managers</Text>
        {managers.length === 0 ? (
          <>
            <Text style={styles.noData}>AUCUNE DONNÉE</Text>
            <View style={styles.addUserRow}>
              <TextInput
                style={styles.input}
                value={newManager}
                onChangeText={setNewManager}
                placeholder="Ajouter un manager"
              />
              <TouchableOpacity style={styles.addUserButton} onPress={addManager}>
                <Text style={styles.addUserButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <FlatList
            data={managers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <FontAwesome5 name="user-tie" size={20} color="#FFB347" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  {editingManagerId === item.id ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={editingManagerName}
                        onChangeText={setEditingManagerName}
                      />
                      <TouchableOpacity onPress={handleConfirmEditManager} style={styles.confirmEditBtn}>
                        <MaterialIcons name="check" size={22} color="#00CFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEditManager} style={styles.cancelEditBtn}>
                        <MaterialIcons name="close" size={22} color="#FF4F4F" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <TouchableOpacity onPress={() => handleEditManager(item.id, item.name)} style={styles.editIconBtn}>
                        <MaterialIcons name="edit" size={18} color="#232B36" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleResetManagerPasscode(item.id)} style={styles.editIconBtn}>
                        <MaterialIcons name="restore" size={18} color="#00CFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text style={styles.userUsername}>Nom d'utilisateur: {item.username}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.subtitle}>Préparateurs</Text>
        {pickers.length === 0 ? (
          <>
            <Text style={styles.noData}>AUCUNE DONNÉE</Text>
            <View style={styles.addUserRow}>
              <TextInput
                style={styles.input}
                value={newPicker}
                onChangeText={setNewPicker}
                placeholder="Ajouter un picker"
              />
              <TouchableOpacity style={styles.addUserButton} onPress={addPicker}>
                <Text style={styles.addUserButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <FlatList
            data={pickers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <FontAwesome5 name="user" size={20} color="#00CFFF" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  {editingPickerId === item.id ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                        value={editingPickerName}
                        onChangeText={setEditingPickerName}
                      />
                      <TouchableOpacity onPress={handleConfirmEditPicker} style={styles.confirmEditBtn}>
                        <MaterialIcons name="check" size={22} color="#00CFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEditPicker} style={styles.cancelEditBtn}>
                        <MaterialIcons name="close" size={22} color="#FF4F4F" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <TouchableOpacity onPress={() => handleEditPicker(item.id, item.name)} style={styles.editIconBtn}>
                        <MaterialIcons name="edit" size={18} color="#232B36" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleResetPickerPasscode(item.id)} style={styles.editIconBtn}>
                        <MaterialIcons name="restore" size={18} color="#00CFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text style={styles.userUsername}>Nom d'utilisateur: {item.username}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editIconBtn: {
    marginLeft: 8,
    padding: 4,
  },
  confirmEditBtn: {
    marginLeft: 8,
    padding: 4,
  },
  cancelEditBtn: {
    marginLeft: 4,
    padding: 4,
  },
  userUsername: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232B36',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    marginBottom: 8,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  statusButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4F4F',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    color: '#232B36',
    flex: 1,
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginVertical: 12,
    fontStyle: 'italic',
  },
  addUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addUserButton: {
    backgroundColor: '#FFB347',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginLeft: 8,
  },
  addUserButtonText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
