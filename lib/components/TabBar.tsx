import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import React from "react";
import { BottomNavigation } from "react-native-paper";

const TabBar = (props: BottomTabBarProps) => {
  const { state, navigation, descriptors, insets } = props;
  
  return (
    <BottomNavigation.Bar
      shifting
      navigationState={state}
      safeAreaInsets={insets}
      onTabPress={({ route, preventDefault }) => {
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });

        if (event.defaultPrevented) {
          preventDefault();
        } else {
          navigation.dispatch({
            ...CommonActions.navigate(route.name, route.params),
            target: state.key,
          });
        }
      }}
      renderIcon={({ route, focused, color }) => {
        const { options } = descriptors[route.key];
        if (options.tabBarIcon) {
          return options.tabBarIcon({ focused, color, size: 24 });
        }

        return null;
      }}
      getLabelText={({ route }) => {
        const { options } = descriptors[route.key];
        if (typeof options.tabBarLabel === "function") {
          throw new Error("Unsupported Label");
        }
        const label = options.tabBarLabel ?? options.title ?? route.name;

        return label;
      }}
    />
  );
};

export default TabBar;
