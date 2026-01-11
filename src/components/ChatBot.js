import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { chatAPI } from '../services/api';

const INITIAL_MESSAGES = [
  {
    id: '1',
    text: "Hello! I'm your Smart Sentry assistant. How can I help you stay safe today?",
    isBot: true,
    timestamp: new Date(),
  },
];

// Fallback responses for offline mode
const FALLBACK_RESPONSES = {
  help: "If you're in immediate danger, please use the SOS feature by long-pressing any emergency card on the home screen. Stay calm and find a safe location if possible.",
  emergency: "For emergencies: 1) Stay calm 2) Find a safe spot 3) Use the SOS feature 4) Your trusted contacts will be notified automatically.",
  location: "Your location is shared only during active SOS alerts. You can toggle location sharing in your Profile settings.",
  contacts: "You can add trusted contacts from the Trusted Contacts section. They will be notified during emergencies.",
  default: "I'm here to help with safety guidance. You can ask about emergency procedures, location sharing, or trusted contacts.",
};

export default function ChatBot({ userProfile, contacts, emergencyHistory }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const flatListRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the floating button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Load messages from local storage
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // No local storage, use initial messages
      } catch (error) {
        console.log('Failed to load chat messages:', error);
      }
    };
    loadMessages();
  }, []);

  // Save messages to local storage whenever messages change
  useEffect(() => {
    const saveMessages = async () => {
      try {
        // No local storage
      } catch (error) {
        console.log('Failed to save chat messages:', error);
      }
    };
    if (messages.length > 0) {
      saveMessages();
    }
  }, [messages]);

  const getOfflineResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('help') || lowerMsg.includes('danger')) {
      return FALLBACK_RESPONSES.help;
    }
    if (lowerMsg.includes('emergency') || lowerMsg.includes('sos')) {
      return FALLBACK_RESPONSES.emergency;
    }
    if (lowerMsg.includes('location') || lowerMsg.includes('gps')) {
      return FALLBACK_RESPONSES.location;
    }
    if (lowerMsg.includes('contact') || lowerMsg.includes('family')) {
      return FALLBACK_RESPONSES.contacts;
    }
    return FALLBACK_RESPONSES.default;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputText.trim();
    setInputText('');
    setIsTyping(true);

    try {
      // Prepare context for enhanced AI responses
      const context = {
        userProfile,
        contacts,
        emergencyHistory,
        conversationHistory: messages.slice(-4), // Last 4 messages for context
      };

      // Try to call the API with context
      const data = await chatAPI.sendMessage(messageText, context);
      
      setIsOnline(!data.offline);
      
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isBot: true,
        timestamp: new Date(),
        isOnline: !data.offline,
        model: data.model,
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      // Use offline fallback
      setIsOnline(false);
      const botResponse = {
        id: (Date.now() + 1).toString(),
        text: getOfflineResponse(messageText),
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageBubble, item.isBot ? styles.botBubble : styles.userBubble]}>
      {item.isBot && (
        <View style={styles.botIcon}>
          <Icon name="robot" size={16} color="#18716A" />
          {item.isOnline !== undefined && (
            <View style={[styles.statusIndicator, { backgroundColor: item.isOnline ? '#4CAF50' : '#FF9800' }]} />
          )}
        </View>
      )}
      <View style={[styles.messageContent, item.isBot ? styles.botContent : styles.userContent]}>
        <Text style={[styles.messageText, item.isBot ? styles.botText : styles.userText]}>
          {item.text}
        </Text>
        {item.isBot && item.model && (
          <Text style={styles.modelIndicator}>
            {item.isOnline ? `🤖 AI (${item.model})` : '📱 Offline Mode'}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity style={styles.fab} onPress={() => setIsOpen(true)} activeOpacity={0.8}>
          <Icon name="robot-happy" size={26} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatContainer}
          >
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.headerIcon}>
                  <Icon name="robot" size={20} color="#18716A" />
                </View>
                <View>
                  <Text style={styles.chatTitle}>Safety Assistant</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
                    <Text style={styles.chatSubtitle}>{isOnline ? 'AI Powered' : 'Offline Mode'}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                <Icon name="close" size={24} color="#6D7D81" />
              </TouchableOpacity>
            </View>

            {/* Messages List */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {/* Typing Indicator */}
            {isTyping && (
              <View style={styles.typingIndicator}>
                <Icon name="dots-horizontal" size={24} color="#6D7D81" />
                <Text style={styles.typingText}>Assistant is typing...</Text>
              </View>
            )}

            {/* Input Area */}
            <View style={styles.inputArea}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about safety..."
                placeholderTextColor="#A0A0A0"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={!inputText.trim()}
              >
                <Icon name="send" size={20} color={inputText.trim() ? '#fff' : '#A0A0A0'} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 1000,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#18716A',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDED',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatTitle: { fontSize: 16, fontWeight: '700', color: '#0B3340' },
  chatSubtitle: { fontSize: 12, color: '#6D7D81' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: '#22C55E',
  },
  offlineDot: {
    backgroundColor: '#F59E0B',
  },
  closeBtn: { padding: 8 },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  botBubble: {
    justifyContent: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  botIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
  },
  statusIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  messageContent: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  botContent: {
    backgroundColor: '#F4F6F6',
    borderBottomLeftRadius: 4,
  },
  userContent: {
    backgroundColor: '#18716A',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: '#0B3340',
  },
  userText: {
    color: '#fff',
  },
  modelIndicator: {
    fontSize: 10,
    color: '#6D7D81',
    marginTop: 4,
    fontStyle: 'italic',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingText: {
    marginLeft: 8,
    color: '#6D7D81',
    fontSize: 13,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EDED',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F4F6F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#0B3340',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#18716A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendBtnDisabled: {
    backgroundColor: '#E8EDED',
  },
});
