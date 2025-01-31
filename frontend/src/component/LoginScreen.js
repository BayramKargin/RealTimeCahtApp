import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import Login from "../../assets/login.webp";
import {API_URL} from '@env';
import Config from "react-native-config";
import io from "socket.io-client";


const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const socket = io(`${API_URL}`);


  const handleLogin = async () => {

    try {
      console.log(API_URL);
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        socket.emit('register', { userId: data._id, socketId: socket.id });
        Alert.alert("Giriş Başarılı", "Başarıyla giriş yapıldı!");
        await AsyncStorage.setItem('@userId', data._id);
        navigation.navigate("UserList");
      } else {
        Alert.alert("Hata", "Kullanıcı adı veya şifre hatalı2.");
      }
    } catch (error) {
      Alert.alert("Hata", "Bir hata oluştu: " + error.message);
    }
  };

  return (
    <View style={styles.container}> 
      <Image
        source={Login} // İmajınızın URL'sini buraya yerleştirin
        style={styles.logo}
      />
      <Text style={styles.title}>Sign In</Text>
      <TextInput
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <TouchableOpacity
        onPress={() => {
          /* Forgot password action */
        }}
      >
        <Text style={styles.forgotPassword}>Forgot password?</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <View style={styles.signupTextContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.signupButton}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#f1f3f6",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginVertical: 10,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginVertical: 15,
    color: "#6c63ff",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#6c63ff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  signupTextContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  signupText: {
    color: "#333",
    fontSize: 16,
  },
  signupButton: {
    color: "#6c63ff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;
