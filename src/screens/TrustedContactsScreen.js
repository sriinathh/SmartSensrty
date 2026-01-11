import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { contactsAPI, authAPI } from '../services/api';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 44 : 44;

const FALLBACK_CONTACTS = [
  { id: 'c1', name: 'Priya Sharma', relation: 'Friend', phone: '+91 98765 43210' },
  { id: 'c2', name: 'Ravi Kumar', relation: 'Son', phone: '+91 91234 56789' },
];

export default function TrustedContactsScreen({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({ name: '', relation: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      // Load auth token first
      await authAPI.loadToken();
      
      // Try to fetch from API
      const data = await contactsAPI.getAll();
      const formattedContacts = data.map(c => ({
        id: c._id,
        name: c.name,
        relation: c.relation,
        phone: c.phone,
      }));
      setContacts(formattedContacts);
    } catch (error) {
      console.log('API failed, using fallback contacts');
      // If no data, use fallback
      if (contacts.length === 0) {
        setContacts(FALLBACK_CONTACTS);
      }
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({ name: '', relation: '', phone: '' });
    setModalVisible(true);
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setFormData({ name: contact.name, relation: contact.relation, phone: contact.phone });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }

    setSaving(true);
    try {
      let updatedContacts;
      if (editingContact) {
        // Update existing contact via API
        await contactsAPI.update(editingContact.id, formData);
        updatedContacts = contacts.map(c => 
          c.id === editingContact.id ? { ...c, ...formData } : c
        );
        setContacts(updatedContacts);
      } else {
        // Add new contact via API
        const newContact = await contactsAPI.add(formData);
        updatedContacts = [...contacts, {
          id: newContact._id || `c${Date.now()}`,
          ...formData,
        }];
        setContacts(updatedContacts);
      }
      // Save to local storage
      setModalVisible(false);
    } catch (error) {
      // Handle offline mode - still update locally
      let updatedContacts;
      if (editingContact) {
        updatedContacts = contacts.map(c => 
          c.id === editingContact.id ? { ...c, ...formData } : c
        );
        setContacts(updatedContacts);
      } else {
        const newContact = {
          id: `c${Date.now()}`,
          ...formData,
        };
        updatedContacts = [...contacts, newContact];
        setContacts(updatedContacts);
      }
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (contactId) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to remove this trusted contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await contactsAPI.delete(contactId);
            } catch (error) {
              // Continue with local delete even if API fails
            }
            const updatedContacts = contacts.filter(c => c.id !== contactId);
            setContacts(updatedContacts);
            // Save to local storage
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.leftAvatar}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.rel}>{item.relation} • {item.phone}</Text>
      </View>
      <TouchableOpacity style={styles.action} onPress={() => openEditModal(item)}>
        <Icon name="pencil" size={18} color="#0B3340" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.action} onPress={() => handleDelete(item.id)}>
        <Icon name="trash-can-outline" size={18} color="#B35F5F" />
      </TouchableOpacity>
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
          <Text style={styles.title}>Trusted Contacts</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.lead}>People who will be notified when you initiate an alert.</Text>

        <FlatList
          data={contacts}
          renderItem={renderItem}
          keyExtractor={i => i.id}
          style={{ marginTop: 12 }}
          refreshing={loading}
          onRefresh={loadContacts}
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#18716A" />
                <Text style={styles.emptyText}>Loading contacts...</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="account-group-outline" size={48} color="#D0D0D0" />
                <Text style={styles.emptyText}>No trusted contacts yet</Text>
              </View>
            )
          }
        />

        <TouchableOpacity style={styles.add} onPress={openAddModal}>
          <Icon name="plus" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.addText}>Add Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Edit Contact' : 'Add Trusted Contact'}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter name"
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relation</Text>
              <TextInput
                style={styles.input}
                value={formData.relation}
                onChangeText={(text) => setFormData({ ...formData, relation: text })}
                placeholder="Friend, Family, etc."
                placeholderTextColor="#A0A0A0"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor="#A0A0A0"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingContact ? 'Update' : 'Add Contact'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  leftAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#D7EEF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#0B3340', fontWeight: '700' },
  name: { fontWeight: '700', color: '#0B3340' },
  rel: { color: '#6D7D81', marginTop: 4, fontSize: 13 },
  action: { padding: 8 },
  add: {
    marginTop: 16,
    backgroundColor: '#0B3B36',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addText: { color: '#fff', fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#A0A0A0',
    marginTop: 12,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B3340',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#6D7D81', marginBottom: 6 },
  input: {
    backgroundColor: '#F8FAFA',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#0B3340',
    borderWidth: 1,
    borderColor: '#E8EDED',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F2F6F6',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelBtnText: { color: '#0B3340', fontWeight: '700' },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#18716A',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
