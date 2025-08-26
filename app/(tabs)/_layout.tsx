import TabBar from "@/lib/components/TabBar";
import { Locales } from "@/lib/locales";
import { PlatformIcon } from "@/lib/components/Icons";
import { Tabs } from "expo-router";
import React from "react";

const TabLayout = () => {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: Locales.t("titleHome"),
          tabBarIcon: (props) => (
            <PlatformIcon
              library="MaterialCommunityIcons"
              name={props.focused ? "home" : "home-outline"}
              size={24}
              color={props.color}
              focused={props.focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: Locales.t("titleExercises"),
          tabBarIcon: (props) => (
            <PlatformIcon
              library="MaterialIcons"
              name={props.focused ? "sports-gymnastics" : "sports-martial-arts"}
              size={24}
              color={props.color}
              focused={props.focused}
              testID="exercisesTab"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: Locales.t("titleWorkout"),
          tabBarIcon: (props) => (
            <PlatformIcon
              library={props.focused ? "MaterialCommunityIcons" : "MaterialIcons"}
              name={props.focused ? "weight-lifter" : "fitness-center"}
              size={24}
              color={props.color}
              focused={props.focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: (props) => (
            <PlatformIcon
              library="MaterialCommunityIcons"
              name={props.focused ? "account" : "account-outline"}
              size={24}
              color={props.color}
              focused={props.focused}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
