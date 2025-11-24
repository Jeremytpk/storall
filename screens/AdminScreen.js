import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Header from '../components/Header';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '../firebase';

export default function AdminScreen({ navigation, onLogoPress }) {
  // Get current admin user from Firebase Auth
  const user = getAuth(app).currentUser;
  const adminName = user?.displayName || 'Admin';
  const adminEmail = user?.email || 'admin@email.com';
  const adminPhoto = user?.photoURL || 'https://ui-avatars.com/api/?name=Admin&background=232B36&color=fff';
  const handleStoresPress = () => {
    navigation.navigate('Stores');
  };
  const handleLogout = async () => {
    try {
  await signOut(getAuth(app));
      navigation.replace('Auth');
    } catch (error) {
      // Optionally show error
    }
  };
  return (
    <View style={styles.container}>
      <Header onLogoPress={onLogoPress} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Panneau d'Administration</Text>
        <Text style={styles.subtitle}>Gérez les magasins, managers et préparateurs</Text>
        <View style={styles.cardRow}>
          <View style={styles.card}>
            <MaterialIcons name="store" size={40} color="#FFB347" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Magasins</Text>
            <Text style={styles.cardDesc}>Créer, modifier et supprimer des magasins.</Text>
            <TouchableOpacity style={styles.cardButton} onPress={handleStoresPress}>
              <Text style={styles.cardButtonText}>Gérer les magasins</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <FontAwesome5 name="user-tie" size={36} color="#00CFFF" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Managers</Text>
            <Text style={styles.cardDesc}>Ajouter ou retirer des managers.</Text>
            <TouchableOpacity style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Gérer les managers</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.cardRow}>
          <View style={styles.card}>
            <FontAwesome5 name="user-cog" size={36} color="#232B36" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Préparateurs</Text>
            <Text style={styles.cardDesc}>Gérer les préparateurs de commandes.</Text>
            <TouchableOpacity style={styles.cardButton}>
              <Text style={styles.cardButtonText}>Gérer les préparateurs</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <View style={styles.profileImgWrapper}>
              <Image source={{ uri: adminPhoto }} style={styles.profileImg} />
            </View>
            <Text style={styles.cardTitle}>Profil Admin</Text>
            <Text style={styles.profileName}>{adminName}</Text>
            <Text style={styles.profileEmail}>{adminEmail}</Text>
            <TouchableOpacity style={styles.cardButton}>
              <Text style={styles.cardButtonText} onPress={() => navigation.navigate('Profil')}>Gérer le profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.logoutBtnWrapper}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialIcons name="logout" size={22} color="#FF4F4F" />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  profileImgWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#eee',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#232B36',
    marginTop: 4,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFB347',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#232B36',
    marginBottom: 24,
    textAlign: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    alignItems: 'center',
    width: 170,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: 260,
  },
  cardIcon: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232B36',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 14,
    color: '#232B36',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardButton: {
    backgroundColor: '#FFB347',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  cardButtonText: {
    color: '#232B36',
    fontWeight: 'bold',
    fontSize: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#232B36',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: '#FF4F4F',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
