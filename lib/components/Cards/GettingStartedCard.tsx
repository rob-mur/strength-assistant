import { Router, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { Button, Card, Text } from "react-native-paper";

interface GettingStartedCardProps {
  content: string;
  call_to_action: string;
  on_get_started: (r: Router) => void;
}

const GettingStartedCard = ({
  content,
  call_to_action,
  on_get_started,
}: GettingStartedCardProps) => {
  const router = useRouter();
  return (
    <Card style={{ alignSelf: "flex-start", maxWidth: "80%" }}>
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
            onPress={(_) => on_get_started(router)}
          >
            {call_to_action}
          </Button>
        </Card.Actions>
      </View>
    </Card>
  );
};

export default GettingStartedCard;
