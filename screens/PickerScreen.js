import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';

export default function PickerScreen({ onLogoPress }) {
  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <View style={styles.content}>
        <Text style={styles.title}>Espace du Préparateur</Text>
        {/* TODO: Ajouter la gestion des paniers, pas de prix affichés */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2ED8C3',
  },
});
