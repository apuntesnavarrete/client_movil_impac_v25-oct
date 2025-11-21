

import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Alert, StyleSheet } from 'react-native';
import PartidoItem from './PartidoItem';
import { Picker } from '@react-native-picker/picker';
import { API_URL } from '../src/config/config';
import { fetchWithToken } from "../src/utils/fetchWithToken";
import { useRouter } from 'expo-router';

interface Partido {
  torneoId: number;
  id: number;
  equipo1: string;
  equipo2: string;
  g1?: number | null;
  g2?: number | null;
  desempate: string;
  editando: boolean;
  liga: number;
  categoria: number;
  dia: string;
}

const diasDisponibles = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];

// Dummy Auth and API for demo purposes
const auth = {
  getUser: () => ({ role: 'pro' }),
  logout: () => {},
};

const baseUrl = API_URL; // Replace with your API URL
const urlPartidos = baseUrl + '/partidos';
const router = useRouter();

export default function TrabajoDiario() {
  const [diaSeleccionado, setDiaSeleccionado] = useState(diasDisponibles[new Date().getDay()]);
  const [usuario, setUsuario] = useState('invitado');
  const [trabajos, setTrabajos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = auth.getUser();
    setUsuario(user ? user.role : 'invitado');
    console.log(user)
  }, []);

  useEffect(() => {
    cargarTrabajos();
  }, [diaSeleccionado, usuario]);

  function cargarTrabajos() {
            console.log(urlPartidos)

    setLoading(true);
   fetchWithToken(urlPartidos)
  .then(res => res.json())
      .then((data: Partido[]) => {
        let partidosFiltrados = data;
        console.log("revisar data")

        console.log(data)
        if (usuario === 'pro') {
          partidosFiltrados = partidosFiltrados.filter(p => [43, 39].includes(p.torneoId));
        } else if (usuario === 'ed') {
          partidosFiltrados = partidosFiltrados.filter(p => ![43, 39].includes(p.torneoId));
        }

        partidosFiltrados = partidosFiltrados.filter(p => p.dia === diaSeleccionado);

        const trabajosPreparados = partidosFiltrados.map(p => ({
          ...p,
          g1: p.g1 ?? null,
          g2: p.g2 ?? null,
          desempate: p.desempate ?? '',
          editando: false,
        }));
console.log("TRABAJOS:", trabajosPreparados);

        setTrabajos(trabajosPreparados);
        setLoading(false);
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load partidos');
        setTrabajos([]);
        setLoading(false);
      });
  }

  function guardarGoles(partido: Partido) {
    if (partido.g1 === partido.g2 && !partido.desempate) {
      Alert.alert('Error', 'There is a draw, select who wins desempate (L or V).');
      return;
    }
    const updated = trabajos.map(t =>
      t.id === partido.id ? { ...partido, editando: false } : t
    );
    setTrabajos(updated);

    const payload = {
      id: partido.id,
      equipo1: partido.equipo1,
      equipo2: partido.equipo2,
      g1: partido.g1 != null ? Number(partido.g1) : null,
      g2: partido.g2 != null ? Number(partido.g2) : null,
      desempate: partido.desempate ?? '',
      liga: partido.liga,
      categoria: partido.categoria,
      dia: partido.dia,
      torneoId: partido.torneoId,
    };

  fetchWithToken(`${urlPartidos}/${partido.id}`, {
  method: "PUT",
  body: JSON.stringify(payload),
})
      .then(() => console.log('Partido updated ✅'))
      .catch(err => console.error('Error saving partido:', err));
  }

  function iniciarEdicion(partido: Partido) {
    setTrabajos(trabajos.map(t => (t.id === partido.id ? { ...t, editando: true } : t)));
  }

  function accion(tipo: 'R' | 'P' | 'G', partido: Partido) {
    if (tipo === 'R') iniciarEdicion(partido);

  if (tipo === 'P') {
  const equipos = [partido.equipo1, partido.equipo2].join(',');

  router.push({
    pathname: "/Planteles",
    params: { 
      team: equipos,          // send both teams
      partidoId: partido.id,  // match id
      torneoId: partido.torneoId
    }
  });


    }

    if (tipo === 'G') {
      // React Navigation to "Goles" screen
      Alert.alert('Navigate', `Go to Goles for match ${partido.id}`);
    }
  }

  function guardarEnServidor() {
    const payload = trabajos.map(p => ({
      id: p.id,
      equipo1: p.equipo1,
      equipo2: p.equipo2,
      g1: p.g1 != null ? Number(p.g1) : null,
      g2: p.g2 != null ? Number(p.g2) : null,
      desempate: p.desempate ?? '',
      liga: p.liga,
      categoria: p.categoria,
      dia: p.dia,
      torneoId: p.torneoId,
    }));

  fetchWithToken(urlPartidos, {
  method: "POST",
  body: JSON.stringify(payload),
})
      .then(() => Alert.alert('Success', 'Data saved on server ✅'))
      .catch(err => console.error('Error saving data:', err));
  }

  function logout() {
    auth.logout();
    Alert.alert('Logout', 'You have been logged out');
    // Navigate to login screen if using React Navigation
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Button title="Logout" onPress={logout} />

      <Text style={{ fontSize: 20, marginVertical: 10 }}>
        Trabajo del día: {diaSeleccionado.charAt(0).toUpperCase() + diaSeleccionado.slice(1)}
      </Text>

      <Picker
        selectedValue={diaSeleccionado}
        onValueChange={setDiaSeleccionado}
        style={{ height: 50, width: 200 }}
      >
        {diasDisponibles.map(d => (
          <Picker.Item key={d} label={d.charAt(0).toUpperCase() + d.slice(1)} value={d} />
        ))}
      </Picker>

      <View style={{ flexDirection: 'row', marginVertical: 10, justifyContent: 'space-between' }}>
        <Button title="Guardar en servidor" onPress={guardarEnServidor} />
        {/* Download JSON not typical in RN, can implement using filesystem modules */}
      </View>

      {loading ? (
        <Text>Loading...</Text>
      ) : trabajos.length === 0 ? (
        <Text>No hay trabajo programado para este día.</Text>
      ) : (
        
        <FlatList
          data={trabajos}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <PartidoItem partido={item} onSave={guardarGoles} onEdit={iniciarEdicion} onNavigate={accion} />
          )}
        />
      )}

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontWeight: 'bold' }}>Descripción de los botones</Text>
        <Text>R → resultados (editar goles del partido)</Text>
        <Text>P → agregar planteles (ver planteles del partido)</Text>
        <Text>G → agregar goles (ver o agregar detalles de goles)</Text>
      </View>
    </View>
  );
}
