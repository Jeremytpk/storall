import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native'; 

export default function Header({ onLogoPress }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>StorAll</Text>
      <TouchableOpacity onPress={onLogoPress}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 87,
    backgroundColor: '#FFB347',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingHorizontal: 24,
    shadowColor: '#232B36',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 0,
  },
  logo: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
    borderRadius: 8,
    top: 10,
  },
});