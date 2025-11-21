import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Switch, SafeAreaView, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { API_URL } from "../src/config/config";

interface PlantelType {
  id: number;
  dorsal: string;
  participants: { name: string };
  teams: { name: string };
  asistencia?: boolean;
}

export default function Planteles() {
  const { partidoId, torneoId, team } = useLocalSearchParams();

  // Teams
  let teamsArray: string[] = [];
  if (typeof team === "string") teamsArray = team.split(",");
  else if (Array.isArray(team)) teamsArray = team;

  const [selectedTeam, setSelectedTeam] = useState(
    teamsArray.length > 0 ? teamsArray[0] : ""
  );

  const [planteles, setPlanteles] = useState<PlantelType[]>([]);
  const [filtered, setFiltered] = useState<PlantelType[]>([]);

  const url = `${API_URL}/planteles/${torneoId}`;

  // Load players
  useEffect(() => {
    if (!torneoId) return;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setPlanteles(data);

        const firstTeam = teamsArray[0];
        if (firstTeam) {
          setFiltered(data.filter((p: { teams: { name: string; }; }) => p.teams.name === firstTeam));
        }
      })
      .catch(console.log);
  }, [torneoId]);

  // When user changes team
  const changeTeam = (teamName: string) => {
    setSelectedTeam(teamName);

    const result = planteles.filter((p) => p.teams.name === teamName);
    setFiltered(result);
  };

  const getSelectedCount = () =>
    filtered.filter((j) => j.asistencia).length;

  const getTotal = () => filtered.length;

  const enviarAsistencia = () => {
    console.log("SEND:", filtered);
  };

return (
  <View style={{ flex: 1, paddingTop: 40 }}>
    <View style={{ flex: 1, padding: 20 }}>

      {/* TEAM SELECTOR */}
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Choose team</Text>

     
<View style={{ flexDirection: "row", marginVertical: 10 }}>
          {teamsArray.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => changeTeam(t)}
            style={{
        paddingVertical: 6,       // smaller height
        paddingHorizontal: 10,    // smaller width
        backgroundColor: t === selectedTeam ? "#ccc" : "#eee",
        marginRight: 6,           // smaller spacing
        borderRadius: 4,          // optional
      }}
            >
              <Text>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

      {/* PLAYER LIST */}
      {selectedTeam !== "" && (
        <View style={{ flex: 1, maxHeight: "65%" }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
            {selectedTeam}
          </Text>

          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 8,
                  padding: 10,
                  backgroundColor: item.asistencia ? "#d0ffd0" : "#f5f5f5",
                  borderRadius: 5,
                }}
              >
                <Switch
                  value={item.asistencia || false}
                  onValueChange={(value) => {
                    item.asistencia = value;
                    setFiltered([...filtered]);
                  }}
                />

                <Text style={{ marginLeft: 10, flexShrink: 1 }}>
                  {item.participants.name} — #{item.dorsal}
                </Text>
              </View>
            )}
          />

          <Text style={{ marginTop: 10, fontWeight: "bold" }}>
            Selected: {getSelectedCount()} / {getTotal()}
          </Text>

          <TouchableOpacity
            onPress={enviarAsistencia}
            style={{
              backgroundColor: "#007bff",
              padding: 12,
              marginTop: 10,
              borderRadius: 5,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
);


}

