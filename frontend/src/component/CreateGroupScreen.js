// CreateGroupScreen.js
import React, { useState, useEffect } from "react";
import { View, TextInput, Text, FlatList, Button } from "react-native";
import { Switch } from 'react-native';
import {API_URL} from '@env';


const CreateGroupScreen = ({ navigation }) => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Tüm kullanıcıları çek
  useEffect(() => {
    console.log(API_URL)
    fetch(`${API_URL}/users`) // Sunucudaki tüm kullanıcıları çekin
      .then((response) => response.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  // Kullanıcı seçimi işlemi
  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Grup oluşturma
  const handleCreateGroup = () => {
    console.log(selectedUsers)
    fetch(`${API_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: groupName,
        description: groupDescription,
        members: selectedUsers,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Group created:", data);
        // Yeni grubun mesajlaşma ekranına yönlendirme
        navigation.navigate("Chat", { groupId: data.groupId });
      })
      .catch(console.error);
  };

  return (
    <View>
      <TextInput
        placeholder="Group Name"
        value={groupName}
        onChangeText={setGroupName}
      />
      <TextInput
        placeholder="Group Description"
        value={groupDescription}
        onChangeText={setGroupDescription}
      />
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <View>
            <Text>{item.username}</Text>
            <Switch
              value={selectedUsers.includes(item._id)}
              onValueChange={() => handleSelectUser(item._id)}
            />
          </View>
        )}
        keyExtractor={(item) => item._id}
      />
      <Button title="Create Group" onPress={handleCreateGroup} />
    </View>
  );
};

export default CreateGroupScreen;
