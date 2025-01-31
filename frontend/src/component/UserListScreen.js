import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Button } from "react-native";
import useSocket from "./UseSocket";
import {API_URL} from "@env"

const UserList = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const socket = useSocket(API_URL);
  useEffect(() => {

    const fetchData = async () => {
      const userId = await AsyncStorage.getItem('@userId');
      try {
        console.log(API_URL);
        // Kullanıcıları çek
        const usersResponse = await fetch(`${API_URL}/users`);
        if (!usersResponse.ok) {
          throw new Error(`Error fetching users: ${usersResponse.status}`);
        }
        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Grupları çek
        const groupsResponse = await fetch(`${API_URL}/my-groups/${userId}`);
        if (!groupsResponse.ok) {
          // Eğer HTTP durum kodu başarılı değilse hata fırlat
          throw new Error(`Error fetching groups: ${groupsResponse.status}`);
        }
        const data = await groupsResponse.json();  // Cevabı JSON olarak parse et
        setGroups(data);  // Grupları state'e kaydet
        
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchData();
  }, []);

  const handlePress = (userId) => {
    // Kullanıcıya tıklanınca mesajlaşma ekranına yönlendir
    navigation.navigate("UserChat", { userId });
  };

  // "Grup Oluştur" butonuna tıklanınca CreateGroupScreen'e yönlendir
  const handleCreateGroup = () => {
    navigation.navigate("CreateGroup");
  };
  const handleNewBroadcastMessage = () => {
    navigation.navigate("BroadcastChat");
  };

  const handlePressGroup = (groupId) => {
    // socket.emit("joinGroup", {groupId: groupId});
    navigation.navigate('GroupChat', { groupId });
};

  return (
    <View>
      {/* Grup oluşturma butonu */}
      <Button title="Create Group" onPress={handleCreateGroup} />
      <View>
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handlePress(item._id)}>
              <Text>{item.username}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      <View>
        <Text>User Groups:</Text>
        <View>
          <FlatList
            data={groups}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handlePressGroup(item._id)}>
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
      <Button title="Broadcast Message" onPress={handleNewBroadcastMessage} />
    </View>
  );
};
export default UserList;
