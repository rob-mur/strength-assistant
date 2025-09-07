import { Router, useRouter } from "expo-router";
import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { Button, Card, Text } from "react-native-paper";

interface GettingStartedCardProps {
  content: string;
  call_to_action: string;
  on_get_started: (r: Router) => void;
  style?: StyleProp<ViewStyle>;
}

const GettingStartedCard = ({
  style,
  content,
  call_to_action,
  on_get_started,
}: GettingStartedCardProps) => {
  const router = useRouter();
  return (
    <View style={style}>
      <Card style={{ alignSelf: "flex-start" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Card.Content>
            <Text variant="bodyMedium">{content}</Text>
          </Card.Content>
          <Card.Actions>
            <Button
              testID="get-started"
              mode="contained"
              icon="arrow-right"
              contentStyle={{ flexDirection: "row-reverse" }}
              onPress={(_) => {
                // Debug logging for Chrome tests
                if (process.env.CHROME_TEST === 'true' || process.env.CI === 'true') {
                  console.log("🔍 GettingStartedCard: Get started button tapped, navigating to exercises");
                }
                on_get_started(router);
              }}
            >
              {call_to_action}
            </Button>
          </Card.Actions>
        </View>
      </Card>
    </View>
  );
};

export default GettingStartedCard;
