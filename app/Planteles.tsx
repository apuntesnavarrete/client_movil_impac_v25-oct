import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function Planteles() {
  const { partidoId } = useLocalSearchParams();

  console.log("RECIBIDO:", partidoId);

  return (
    <View>
      <Text>Pantalla Planteles</Text>
      <Text>ID recibido: {partidoId}</Text>
    </View>
  );
}