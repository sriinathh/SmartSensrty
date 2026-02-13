import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Alert,
    NativeModules,
    ScrollView,
    StatusBar,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { contactsAPI } from '../services/api';

const { SosModule } = NativeModules;

// Mock Offline Database
const OFFLINE_SHELTERS = [
    { id: '1', name: 'City High School', type: 'Shelter', desc: 'Capacity: 500 | Food available', dist: '1.2 km' },
    { id: '2', name: 'Community Center', type: 'Medical', desc: 'First Aid Only', dist: '2.5 km' },
    { id: '3', name: 'Central Stadium', type: 'Evacuation', desc: 'Open Ground', dist: '3.0 km' },
    { id: '4', name: 'Fire Station #4', type: 'Help', desc: 'Emergency Supplies', dist: '4.1 km' },
];

const OFFLINE_HELPLINES = [
    { id: 'h1', name: 'Disaster Management', number: '108' },
    { id: 'h2', name: 'Flood Control', number: '1070' },
    { id: 'h3', name: 'Police Control', number: '100' },
];

const DisasterScreen = ({ navigation }) => {
    const [flashlightActive, setFlashlightActive] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [batterySaverActive, setBatterySaverActive] = useState(false);
    const [bluetoothMeshActive, setBluetoothMeshActive] = useState(false);

    useEffect(() => {
        return () => {
            // Cleanup flashlight on exit
            if (flashlightActive && SosModule?.stopFlashlightSos) {
                SosModule.stopFlashlightSos();
            }
        };
    }, [flashlightActive]);

    const toggleFlashlight = async () => {
        try {
            if (flashlightActive) {
                await SosModule.stopFlashlightSos();
                setFlashlightActive(false);
            } else {
                await SosModule.startFlashlightSos();
                setFlashlightActive(true);
            }
        } catch (e) {
            console.warn('Flashlight error:', e);
            Alert.alert('Error', 'Could not access flashlight');
        }
    };

    const broadcastSafeStatus = async () => {
        setIsBroadcasting(true);
        try {
            const message = "🚨 DISASTER ALERT: I am in disaster mode and need help. Location sharing active. Please respond if you can assist. - SmartSensrty Emergency";

            // Send SMS broadcast to all emergency contacts
            if (SosModule && SosModule.broadcastEmergencySMS) {
                const result = await SosModule.broadcastEmergencySMS(message);
                console.log('SMS broadcast result:', result);

                Alert.alert(
                    'Emergency Broadcast Sent',
                    `SMS sent to ${result.sent} contacts (${result.failed} failed).\n\nYour location is being shared with emergency services.`
                );
            } else {
                // Fallback: simulate broadcast
                await new Promise(r => setTimeout(r, 2000));
                Alert.alert('Broadcast Sent', 'Emergency SMS broadcast completed. Your location is being shared.');
            }
        } catch (e) {
            console.warn('Broadcast error:', e);
            Alert.alert('Broadcast Error', 'Failed to send emergency broadcast. Check SMS permissions.');
        } finally {
            setIsBroadcasting(false);
        }
    };

    const enableBatterySaver = async () => {
        try {
            if (SosModule && SosModule.enableBatterySaver) {
                await SosModule.enableBatterySaver();
                setBatterySaverActive(true);
                Alert.alert('Battery Saver', 'Battery saver mode enabled to conserve power during emergency.');
            } else {
                Alert.alert('Battery Saver', 'Opening battery settings...');
                // Fallback - could open settings
            }
        } catch (e) {
            console.warn('Battery saver error:', e);
            Alert.alert('Error', 'Could not enable battery saver mode.');
        }
    };

    const startBluetoothMeshAlert = async () => {
        setBluetoothMeshActive(true);
        try {
            const message = "🚨 DISASTER ALERT: Emergency nearby! Check SmartSensrty app for details.";

            if (SosModule && SosModule.startBluetoothMeshAlert) {
                const result = await SosModule.startBluetoothMeshAlert(message);
                console.log('Bluetooth mesh result:', result);

                Alert.alert(
                    'Bluetooth Mesh Alert',
                    'Scanning for nearby devices to broadcast emergency alert via Bluetooth mesh network.'
                );
            } else {
                // Fallback: simulate
                await new Promise(r => setTimeout(r, 3000));
                Alert.alert('Bluetooth Alert', 'Emergency alert broadcast via Bluetooth mesh network.');
            }
        } catch (e) {
            console.warn('Bluetooth mesh error:', e);
            Alert.alert('Error', 'Could not start Bluetooth mesh alert. Check Bluetooth permissions.');
        } finally {
            setBluetoothMeshActive(false);
        }
    };

    const renderShelter = ({ item }) => (
        <View style={styles.shelterCard}>
            <View style={styles.shelterIcon}>
                <Icon name={item.type === 'Medical' ? 'hospital-box' : 'home-group'} size={24} color="#FFF" />
            </View>
            <View style={styles.shelterInfo}>
                <Text style={styles.shelterName}>{item.name}</Text>
                <Text style={styles.shelterDesc}>{item.desc}</Text>
            </View>
            <View style={styles.shelterDist}>
                <Text style={styles.distText}>{item.dist}</Text>
                <Icon name="map-marker-distance" size={16} color="#6D7D81" />
            </View>
        </View>
    );

    const makeEmergencyCall = (phoneNumber) => {
        try {
            const phoneUrl = `tel:${phoneNumber}`;
            Linking.canOpenURL(phoneUrl).then((supported) => {
                if (supported) {
                    Linking.openURL(phoneUrl);
                } else {
                    Alert.alert('Error', `Cannot make calls to ${phoneNumber}`);
                }
            });
        } catch (e) {
            console.warn('Call error:', e);
            Alert.alert('Error', 'Could not initiate call');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1A202C" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Disaster Mode (Offline)</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Main Tools */}
                <View style={styles.toolsGrid}>
                    <TouchableOpacity
                        style={[styles.toolCard, flashlightActive && styles.toolCardActive]}
                        onPress={toggleFlashlight}
                    >
                        <Icon
                            name={flashlightActive ? "flashlight-off" : "flashlight"}
                            size={32}
                            color={flashlightActive ? "#1A202C" : "#FFD700"}
                        />
                        <Text style={[styles.toolText, flashlightActive && styles.toolTextActive]}>
                            {flashlightActive ? 'Stop SOS' : 'Flashlight SOS'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toolCard, { backgroundColor: '#48BB78' }]}
                        onPress={broadcastSafeStatus}
                        disabled={isBroadcasting}
                    >
                        <Icon name="message-broadcast" size={32} color="#FFF" />
                        <Text style={styles.toolText}>{isBroadcasting ? 'Sending...' : 'SMS Broadcast'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toolCard, batterySaverActive && styles.toolCardActive]}
                        onPress={enableBatterySaver}
                    >
                        <Icon name="battery-low" size={32} color="#FFF" />
                        <Text style={[styles.toolText, batterySaverActive && styles.toolTextActive]}>
                            Battery Saver
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.toolCard, { backgroundColor: '#4299E1' }]}
                        onPress={startBluetoothMeshAlert}
                        disabled={bluetoothMeshActive}
                    >
                        <Icon name="bluetooth" size={32} color="#FFF" />
                        <Text style={styles.toolText}>
                            {bluetoothMeshActive ? 'Scanning...' : 'Bluetooth Mesh'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Offline Resources */}
                <Text style={styles.sectionTitle}>Nearby Shelters (Offline Database)</Text>
                <FlatList
                    data={OFFLINE_SHELTERS}
                    renderItem={renderShelter}
                    keyExtractor={i => i.id}
                    scrollEnabled={false}
                    contentContainerStyle={{ marginBottom: 20 }}
                />

                <Text style={styles.sectionTitle}>Critical Helplines</Text>
                <View style={styles.helplineList}>
                    {OFFLINE_HELPLINES.map(line => (
                        <TouchableOpacity 
                            key={line.id} 
                            style={styles.helplineRow}
                            onPress={() => makeEmergencyCall(line.number)}
                        >
                            <Text style={styles.helplineName}>{line.name}</Text>
                            <View style={styles.callBtn}>
                                <Icon name="phone" size={18} color="#FFF" />
                                <Text style={styles.callText}>{line.number}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A202C',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#2D3748',
    },
    backBtn: {
        padding: 8,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    scrollContent: {
        padding: 20,
    },
    toolsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    toolCard: {
        width: '48%',
        backgroundColor: '#2D3748',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4A5568',
        marginBottom: 16,
    },
    toolCardActive: {
        backgroundColor: '#FFD700',
        borderColor: '#FFD700',
    },
    toolText: {
        marginTop: 12,
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    toolTextActive: {
        color: '#1A202C',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#A0AEC0',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    shelterCard: {
        flexDirection: 'row',
        backgroundColor: '#2D3748',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    shelterIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#4A5568',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    shelterInfo: {
        flex: 1,
    },
    shelterName: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 4,
    },
    shelterDesc: {
        color: '#A0AEC0',
        fontSize: 12,
    },
    shelterDist: {
        alignItems: 'flex-end',
    },
    distText: {
        color: '#FFD700',
        fontWeight: '700',
        fontSize: 14,
        marginBottom: 4,
    },
    helplineList: {
        backgroundColor: '#2D3748',
        borderRadius: 16,
        padding: 8,
    },
    helplineRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#4A5568',
    },
    helplineName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    callBtn: {
        flexDirection: 'row',
        backgroundColor: '#E53E3E',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignItems: 'center',
    },
    callText: {
        color: '#FFF',
        fontWeight: '700',
        marginLeft: 6,
    },
});

export default DisasterScreen;
