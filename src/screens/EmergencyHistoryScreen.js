import React from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 44 : 44;

const HISTORY = [
  { id: 'h1', type: 'Medical Emergency', date: '2026-01-05 09:12', status: 'Resolved', icon: 'medical-bag', color: '#4BCFA6' },
  { id: 'h2', type: 'Accident Emergency', date: '2025-12-21 18:44', status: 'Assistance sent', icon: 'car-emergency', color: '#FFA96C' },
  { id: 'h3', type: 'Women Safety', date: '2025-11-12 07:03', status: 'False alarm', icon: 'account-heart', color: '#6C9EFF' },
];

export default function EmergencyHistoryScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: item.color + '20' }]}>
        <Icon name={item.icon} size={22} color={item.color} />
      </View>
      <View style={styles.cardLeft}>
        <Text style={styles.type}>{item.type}</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.status, item.status === 'Resolved' ? styles.resolved : styles.pending]}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6FBFB" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#0B3340" />
          </TouchableOpacity>
          <Text style={styles.title}>Emergency History</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.lead}>A record of recent alerts and their outcomes.</Text>

        <FlatList data={HISTORY} renderItem={renderItem} keyExtractor={i => i.id} style={{ marginTop: 12 }} />


      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6FBFB' },
  container: { flex: 1, padding: 18, paddingTop: STATUSBAR_HEIGHT + 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#0B3340' },
  lead: { color: '#637578', marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 12, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardLeft: { flex: 1 },
  type: { fontWeight: '700', color: '#0B3340' },
  date: { color: '#6D7D81', marginTop: 6, fontSize: 13 },
  cardRight: { alignItems: 'flex-end' },
  status: { fontWeight: '700' },
  resolved: { color: '#18716A' },
  pending: { color: '#B35F5F' },
});
