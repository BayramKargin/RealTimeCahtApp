import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from './src/component/LoginScreen';
import SignUpScreen from './src/component/SignUpScreen';
import ChatScreen from './src/component/ChatScreen';
import UserList from './src/component/UserListScreen';
import UserChatScreen from './src/component/UserChatScreen';
import CreateGroupScreen from './src/component/CreateGroupScreen';
import GroupChatScreen from './src/component/GroupChatScreen';
import BroadcastChatScreen from './src/component/BroadcastChatScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen}/>
        <Stack.Screen name="Chat" component={ChatScreen}/>
        <Stack.Screen name="UserList" component={UserList}/>
        <Stack.Screen name="UserChat" component={UserChatScreen}/>
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen}/>
        <Stack.Screen name="GroupChat" component={GroupChatScreen}/>
        <Stack.Screen name="BroadcastChat" component={BroadcastChatScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
