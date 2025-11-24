import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';

const brandColors = {
  client: '#00CFFF', // bleu
  manager: '#FFB347', // orange
  picker: '#2ED8C3', // vert
  admin: '#232B36', // gris foncé
  accent: '#2ED8C3',
  dark: '#232B36',
};

const roles = [
  { label: 'Client', value: 'client', color: brandColors.client },
  { label: 'Manager', value: 'manager', color: brandColors.manager },
  { label: 'Préparateur', value: 'picker', color: brandColors.picker },
  { label: 'Admin', value: 'admin', color: brandColors.admin },
];

export default function RoleSelectionModal({ visible, onSelect, onClose }) {
  const handleSelect = (role) => {
    if (role === 'admin' && typeof onSelect === 'function' && typeof onClose === 'function') {
      // If admin, navigate to AuthScreen
      onSelect('auth');
      onClose();
    } else {
      onSelect(role);
      onClose();
    }
  };
  return (
    <Modal visible={!!visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Choisissez votre rôle</Text>
          {roles.map(role => (
            <TouchableOpacity
              key={role.value}
              style={[styles.button, { backgroundColor: role.color }]}
              onPress={() => handleSelect(role.value)}
            >
              <Text style={[styles.buttonText, role.value === 'admin' ? { color: '#fff' } : { color: brandColors.dark }]}>{role.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: 300,
    shadowColor: brandColors.dark,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 130,
    height: 130,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: brandColors.client,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: brandColors.gradientStart,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
    marginVertical: 6,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: brandColors.dark,
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: 16,
  },
  closeText: {
    color: brandColors.accent,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
