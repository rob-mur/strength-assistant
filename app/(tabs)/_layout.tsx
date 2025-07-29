import TabBar from "@/lib/components/TabBar";
import { Locales } from "@/lib/locales";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
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
            <MaterialCommunityIcons
              {...props}
              size={24}
              name={props.focused ? "home" : "home-outline"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: Locales.t("titleExercises"),
          tabBarIcon: (props) => (
            <MaterialIcons
              testID="exercisesTab"
              {...props}
              size={24}
              name={props.focused ? "sports-gymnastics" : "sports-martial-arts"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: Locales.t("titleWorkout"),
          tabBarIcon: (props) =>
            props.focused ? (
              <MaterialCommunityIcons
                {...props}
                size={24}
                name={"weight-lifter"}
              />
            ) : (
              <MaterialIcons {...props} size={24} name={"fitness-center"} />
            ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
