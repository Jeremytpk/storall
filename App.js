import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import ClientScreen from './screens/ClientScreen';
import ManagerScreen from './screens/ManagerScreen';
import PickerScreen from './screens/PickerScreen';
import ManagerPickerLogin from './screens/ManagerPickerLogin';
import AdminScreen from './screens/AdminScreen';
import Stores from './screens/Stores';
import StoreDetail from './screens/StoreDetail';
import RoleSelectionModal from './components/RoleSelectionModal';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthScreen from './screens/AuthScreen';
import Profil from './screens/Profil';
import { createRef } from 'react';

const navigationRef = createRef();

const brandColors = {
  gradientStart: '#FFB347',
  gradientEnd: '#00CFFF',
  accent: '#2ED8C3',
  dark: '#232B36',
};

const Stack = createStackNavigator();

function MainScreens({ role, onLogoPress, ...props }) {
  const { navigation } = props;
  if (role === 'manager') return <ManagerScreen onLogoPress={onLogoPress} navigation={navigation} />;
  if (role === 'picker') return <PickerScreen onLogoPress={onLogoPress} navigation={navigation} />;
  if (role === 'admin') return <AdminScreen onLogoPress={onLogoPress} navigation={navigation} />;
  return <ClientScreen onLogoPress={onLogoPress} navigation={navigation} />;
}

export default function App() {
  const [modalVisible, setModalVisible] = useState(false);
  const [role, setRole] = useState('client');

  const handleLogoPress = () => setModalVisible(true);
  const handleRoleSelect = async (selectedRole) => {
    if (selectedRole === 'auth') {
      setModalVisible(false);
      navigationRef.current?.navigate('Auth');
    } else if (selectedRole === 'admin') {
      setModalVisible(false);
      const user = getAuth().currentUser;
      if (user) {
        setRole('admin');
        navigationRef.current?.navigate('Admin');
      } else {
        navigationRef.current?.navigate('Auth');
      }
    } else if (selectedRole === 'manager' || selectedRole === 'picker') {
      setModalVisible(false);
      const session = await AsyncStorage.getItem(`${selectedRole}Session`);
      if (session) {
        setRole(selectedRole);
        navigationRef.current?.navigate(selectedRole === 'manager' ? 'Manager' : 'Picker');
      } else {
        navigationRef.current?.navigate('ManagerPickerLogin', { role: selectedRole });
      }
    } else {
      setRole(selectedRole);
      setModalVisible(false);
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={styles.container}>
        <Stack.Navigator initialRouteName="Client" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Client">
            {props => (
              <ClientScreen onLogoPress={handleLogoPress} {...props} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Stores">
            {props => <Stores {...props} onLogoPress={handleLogoPress} />}
          </Stack.Screen>
          <Stack.Screen name="StoreDetail">
            {props => <StoreDetail {...props} onLogoPress={handleLogoPress} />}
          </Stack.Screen>
          <Stack.Screen name="Auth">
            {props => <AuthScreen {...props} onLogoPress={handleLogoPress} />}
          </Stack.Screen>
          <Stack.Screen name="Admin">
            {props => <AdminScreen {...props} onLogoPress={handleLogoPress} />}
          </Stack.Screen>
          <Stack.Screen name="Manager">
            {props => <ManagerScreen {...props} onLogoPress={handleLogoPress} />}
          </Stack.Screen>
          <Stack.Screen name="Picker">
            {props => <PickerScreen {...props} onLogoPress={handleLogoPress} />}
          </Stack.Screen>
          <Stack.Screen name="ManagerPickerLogin">
            {props => <ManagerPickerLogin {...props} onLogoPress={handleLogoPress} />}
          </Stack.Screen>
          <Stack.Screen name="Profil">
            {props => <Profil {...props} onLogoPress={handleLogoPress} />}
          </Stack.Screen>
        </Stack.Navigator>
        <RoleSelectionModal
          visible={modalVisible}
          onSelect={handleRoleSelect}
          onClose={() => setModalVisible(false)}
        />
        <StatusBar style="auto" />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 80,
    backgroundColor: brandColors.gradientStart,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
    shadowColor: brandColors.dark,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  logo: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
