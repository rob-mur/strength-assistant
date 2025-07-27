import { Router, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";

interface GettingStartedCardProps {
  explanation: string;
  call_to_action: string;
  on_get_started: (r: Router) => void;
}

const GettingStartedCard = ({
  explanation,
  call_to_action,
  on_get_started,
}: GettingStartedCardProps) => {
  const router = useRouter();
  return (
    <View>
      <p style={{ fontSize: "1.2em", marginBottom: "20px", color: "#333" }}>
        {explanation}
      </p>
      <button
        onClick={(_) => on_get_started(router)}
        style={{
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "1em",
        }}
      >
        {call_to_action}
      </button>
    </View>
  );
};

export default GettingStartedCard;
