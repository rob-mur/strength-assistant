import TabBar from "@/lib/components/TabBar";
import { Locales } from "@/lib/locales";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import React from "react";

// Tab icon components
interface TabIconProps {
  focused: boolean;
  color: string;
  size?: number;
}

const HomeTabIcon = (props: TabIconProps) => (
  <MaterialCommunityIcons
    {...props}
    size={24}
    name={props.focused ? "home" : "home-outline"}
  />
);

const ExercisesTabIcon = (props: TabIconProps) => (
  <MaterialIcons
    {...props}
    size={24}
    name={props.focused ? "sports-gymnastics" : "sports-martial-arts"}
  />
);

const WorkoutTabIcon = (props: TabIconProps) =>
  props.focused ? (
    <MaterialCommunityIcons {...props} size={24} name={"weight-lifter"} />
  ) : (
    <MaterialIcons {...props} size={24} name={"fitness-center"} />
  );

const ProfileTabIcon = (props: TabIconProps) => (
  <MaterialCommunityIcons
    {...props}
    size={24}
    name={props.focused ? "account" : "account-outline"}
  />
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTabBar = (props: any) => <TabBar {...props} />;

const TabLayout = () => {
  return (
    <Tabs
      tabBar={CustomTabBar}
      screenOptions={{
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: Locales.t("titleHome"),
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: Locales.t("titleExercises"),
          tabBarIcon: ExercisesTabIcon,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: Locales.t("titleWorkout"),
          tabBarIcon: WorkoutTabIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ProfileTabIcon,
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
