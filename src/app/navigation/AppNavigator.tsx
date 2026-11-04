import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  ClipboardList,
  Cpu,
  LayoutDashboard,
  RefreshCw,
  Settings as SettingsIcon,
} from 'lucide-react-native';

import Colors from '../../constants/colors';
import { useSession } from '../../context/SessionContext';

// Screens
import { SplashScreen } from '../../screens/Splash/SplashScreen';
import { AuthenticationScreen } from '../../screens/Authentication/AuthenticationScreen';
import { DashboardScreen } from '../../screens/Dashboard/DashboardScreen';
import { WorkOrdersListScreen } from '../../screens/WorkOrders/WorkOrdersListScreen';
import { WorkOrderDetailScreen } from '../../screens/WorkOrderDetail/WorkOrderDetailScreen';
import { CameraCaptureScreen } from '../../screens/CameraCapture/CameraCaptureScreen';
import { AssetsListScreen } from '../../screens/Assets/AssetsListScreen';
import { AssetDetailScreen } from '../../screens/AssetDetail/AssetDetailScreen';
import { SyncScreen } from '../../screens/Sync/SyncScreen';
import { SettingsScreen } from '../../screens/Settings/SettingsScreen';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const WorkOrdersStack = createNativeStackNavigator();
const AssetsStack = createNativeStackNavigator();

// Work Orders Stack Navigator
function WorkOrdersStackNavigator() {
  return (
    <WorkOrdersStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.cardWhite },
        headerTintColor: Colors.darkBlue,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <WorkOrdersStack.Screen
        name="WorkOrdersList"
        component={WorkOrdersListScreen}
        options={{ title: 'Work Orders' }}
      />
      <WorkOrdersStack.Screen
        name="WorkOrderDetail"
        component={WorkOrderDetailScreen as any}
        options={{ title: 'Work Order Details' }}
      />
      <WorkOrdersStack.Screen
        name="CameraCapture"
        component={CameraCaptureScreen as any}
        options={{ headerShown: false }}
      />
    </WorkOrdersStack.Navigator>
  );
}

// Assets Stack Navigator
function AssetsStackNavigator() {
  return (
    <AssetsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.cardWhite },
        headerTintColor: Colors.darkBlue,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <AssetsStack.Screen
        name="AssetsList"
        component={AssetsListScreen}
        options={{ title: 'Industrial Assets' }}
      />
      <AssetsStack.Screen
        name="AssetDetail"
        component={AssetDetailScreen as any}
        options={{ title: 'Asset Details' }}
      />
      <AssetsStack.Screen
        name="WorkOrderDetail"
        component={WorkOrderDetailScreen as any}
        options={{ title: 'Work Order Details' }}
      />
    </AssetsStack.Navigator>
  );
}

// Bottom Tab Navigator
function MainBottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primaryBlue,
        tabBarInactiveTintColor: Colors.secondaryText,
        tabBarStyle: {
          backgroundColor: Colors.cardWhite,
          borderTopColor: Colors.borderGrey,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: Colors.cardWhite },
        headerTintColor: Colors.darkBlue,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size - 2} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkOrdersTab"
        component={WorkOrdersStackNavigator}
        options={{
          headerShown: false,
          title: 'Work Orders',
          tabBarLabel: 'Work Orders',
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size - 2} />
          ),
        }}
      />
      <Tab.Screen
        name="AssetsTab"
        component={AssetsStackNavigator}
        options={{
          headerShown: false,
          title: 'Assets',
          tabBarLabel: 'Assets',
          tabBarIcon: ({ color, size }) => (
            <Cpu color={color} size={size - 2} />
          ),
        }}
      />
      <Tab.Screen
        name="SyncTab"
        component={SyncScreen}
        options={{
          title: 'Sync Queue',
          tabBarLabel: 'Sync',
          tabBarIcon: ({ color, size }) => (
            <RefreshCw color={color} size={size - 2} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size - 2} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Root App Navigator with Session Guard
export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useSession();
  const [isSplashDone, setIsSplashDone] = useState<boolean>(false);

  if (!isSplashDone) {
    return <SplashScreen onInitialized={() => setIsSplashDone(true)} />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen
            name="Authentication"
            component={AuthenticationScreen}
          />
        ) : (
          <RootStack.Screen
            name="MainApp"
            component={MainBottomTabs}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
