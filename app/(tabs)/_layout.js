import { Tabs } from 'expo-router';
import { Activity, Bell, Flower2, House, Settings } from 'lucide-react-native';

import { TabBar } from '../../src/components/navigation/TabBar';

const TAB_ITEMS = {
  index: { label: 'Home', icon: House },
  notifications: { label: 'Inbox', icon: Bell },
  activity: { label: 'Activity', icon: Activity },
  period: { label: 'Period', icon: Flower2 },
  settings: { label: 'Settings', icon: Settings },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      tabBar={(props) => <TabBar {...props} items={TAB_ITEMS} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Inbox' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="period" options={{ title: 'Period' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
