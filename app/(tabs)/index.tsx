import { Router, useRouter } from "expo-router";
import { Button } from "react-native";
interface HomeScreenProps {
  onUserReadyToStart: (r: Router) => void;
}

export default function HomeScreen({
  onUserReadyToStart = (r: Router) => r.navigate("/exercises"),
}: HomeScreenProps) {
  const router = useRouter();
  return (
    <Button
      onPress={(_) => onUserReadyToStart(router)}
      title="Go!"
      testID="get-started"
    />
  );
}
