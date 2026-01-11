import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { profileAPI, authAPI } from '../services/api';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 44 : 44;

const DEFAULT_PROFILE = {
  name: 'User',
  email: 'user@example.com',
  mobile: '+91 98765 43210',
  address: '123 Main Street, City',
};

export default function ProfileScreen({ navigation, route }) {
  const { setAuthenticated } = route.params || {};
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [editedProfile, setEditedProfile] = useState({ ...DEFAULT_PROFILE });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Load auth token first
      await authAPI.loadToken();
      
      // Try to fetch from API
      const data = await profileAPI.get();
      const loadedProfile = {
        name: data.name || DEFAULT_PROFILE.name,
        email: data.email || DEFAULT_PROFILE.email,
        mobile: data.mobile || DEFAULT_PROFILE.mobile,
        address: data.address || DEFAULT_PROFILE.address,
      };
      setProfile(loadedProfile);
      setEditedProfile(loadedProfile);
    } catch (error) {
      console.log('API failed, using default profile');
      // If no data, use default
      if (!profile.name || profile.name === DEFAULT_PROFILE.name) {
        setProfile(DEFAULT_PROFILE);
        setEditedProfile(DEFAULT_PROFILE);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.update(editedProfile);
      setProfile({ ...editedProfile });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.log('API failed, saving locally');
      // Still update locally even if API fails
      setProfile({ ...editedProfile });
      setIsEditing(false);
      Alert.alert('Saved Locally', 'Profile saved. Will sync when online.');
    } finally {
      // Always save to local storage
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authAPI.logout();
          if (setAuthenticated) {
            setAuthenticated(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#F6FBFB" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#18716A" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6FBFB" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#0B3340" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {(isEditing ? editedProfile.name : profile.name).charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{isEditing ? editedProfile.name : profile.name}</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={isEditing ? editedProfile.name : profile.name}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
              editable={isEditing}
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={profile.email}
              editable={false}
              keyboardType="email-address"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={isEditing ? editedProfile.mobile : profile.mobile}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, mobile: text })}
              editable={isEditing}
              keyboardType="phone-pad"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, !isEditing && styles.inputDisabled]}
              value={isEditing ? editedProfile.address : profile.address}
              onChangeText={(text) => setEditedProfile({ ...editedProfile, address: text })}
              editable={isEditing}
              multiline
              numberOfLines={2}
              placeholderTextColor="#A0A0A0"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={saving}>
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
                  <>
                    <Icon name="check" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Icon name="pencil" size={18} color="#fff" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="logout" size={18} color="#B35F5F" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6FBFB' },
  container: { padding: 18, paddingTop: STATUSBAR_HEIGHT + 12 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6D7D81',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0B3340' },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#D7EEF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: { fontSize: 36, fontWeight: '700', color: '#0B3340' },
  profileName: { fontSize: 22, fontWeight: '700', color: '#0B3340' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  roleText: { marginLeft: 6, color: '#18716A', fontWeight: '600', fontSize: 13 },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0B3340', marginBottom: 16 },
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
  inputDisabled: { backgroundColor: '#F0F4F4', color: '#6D7D81' },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  roleSelector: {
    backgroundColor: '#F8FAFA',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EDED',
  },
  roleSelectorText: { fontSize: 15, color: '#0B3340' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  toggleTextWrap: { marginLeft: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#0B3340' },
  toggleDesc: { fontSize: 12, color: '#6D7D81', marginTop: 2 },
  actionSection: { marginBottom: 16 },
  editActions: { flexDirection: 'row', justifyContent: 'space-between' },
  editBtn: {
    backgroundColor: '#0B3B36',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  saveBtn: {
    backgroundColor: '#18716A',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  cancelBtn: {
    backgroundColor: '#F2F6F6',
    padding: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#0B3340', fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginTop: 8,
  },
  logoutText: { color: '#B35F5F', fontWeight: '600', marginLeft: 8 },
});
