/**
 * AI Assistant Screen
 * Chatbot interface for repair consultation and service booking
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { mediaService, MediaType } from '../../lib/api/media';
import { servicesService } from '../../lib/api/services';
import { 
  analyzeImageWithText,
  analyzeTextOnly,
  generateServiceDescription,
  type AIAnalysisResult 
} from '../../lib/services/aiService';
import { getServiceById } from '../../lib/constants/services';

// CRITICAL: Must match book-service.tsx exactly
interface UploadedMedia {
  mediaID: string;      // ID from backend
  fileURL: string;      // Backend URL for submission
  localUri: string;     // Local URI for display
  isUploading?: boolean; // Upload in progress
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  text?: string;
  imageUri?: string;
  aiAnalysis?: AIAnalysisResult;
  timestamp: Date;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [pendingImages, setPendingImages] = useState<string[]>([]); // Preview images before sending
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AIAnalysisResult | null>(null);

  // Animation values for logo transition
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const headerLogoOpacity = useRef(new Animated.Value(0)).current;

  // Handle start button with animation
  const handleStart = () => {
    // Parallel animations for smooth transition
    Animated.parallel([
      // Scale down logo
      Animated.timing(logoScale, {
        toValue: 0.3,
        duration: 500,
        useNativeDriver: true,
      }),
      // Move logo up
      Animated.timing(logoTranslateY, {
        toValue: -300,
        duration: 500,
        useNativeDriver: true,
      }),
      // Fade out center logo
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Fade out welcome content
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade in header logo
      Animated.timing(headerLogoOpacity, {
        toValue: 1,
        duration: 400,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After animation completes, switch to chat mode
      setHasStarted(true);
      // Initialize with welcome message
      setMessages([{
        id: 'welcome',
        type: 'system',
        text: 'Xin chào! Tôi là trợ lý AI của EzyFix. Hãy chụp ảnh hoặc mô tả vấn đề bạn đang gặp phải, tôi sẽ tư vấn giải pháp và hỗ trợ đặt lịch thợ nếu cần.',
        timestamp: new Date()
      }]);
    });
  };

  /**
   * Handle image upload
   * Just add to preview, don't upload to backend yet
   */
  const handleImageUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Thông báo', 'Cần quyền truy cập thư viện ảnh');
        return;
      }

      // Pick image - NO CROP
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable crop
        quality: 0.8,
        base64: false
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const { uri: localUri } = result.assets[0];

      // Just add to pending preview (not uploaded yet)
      setPendingImages(prev => [...prev, localUri]);
    } catch (error) {
      console.error('Image selection error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  /**
   * Remove pending image
   */
  const removePendingImage = (uri: string) => {
    setPendingImages(prev => prev.filter(img => img !== uri));
  };

  /**
   * Handle send message with AI analysis
   * Upload images if any, then analyze
   */
  const handleSendMessage = async (text?: string, imageUri?: string) => {
    const messageText = text || inputText;
    const imagesToSend = imageUri ? [imageUri] : pendingImages;
    
    if (!messageText.trim() && imagesToSend.length === 0) {
      return;
    }

    try {
      setIsAnalyzing(true);

      // Upload all pending images to backend first
      const uploadedMediaList: UploadedMedia[] = [];
      
      for (const localUri of imagesToSend) {
        const file = {
          uri: localUri,
          type: 'image/jpeg',
          name: `ai_chat_${Date.now()}.jpg`
        };

        const uploadResponse = await mediaService.uploadMedia({
          requestID: '', // Empty - backend links later
          file,
          mediaType: 'ISSUE' as MediaType
        });

        uploadedMediaList.push({
          mediaID: uploadResponse.mediaID,
          fileURL: uploadResponse.fileURL,
          localUri,
          isUploading: false
        });
      }

      // APPEND uploaded media (keep existing ones)
      if (uploadedMediaList.length > 0) {
        setUploadedMedia(prev => [...prev, ...uploadedMediaList]);
      }

      // Add user message with images
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        type: 'user',
        text: messageText,
        imageUri: imagesToSend[0], // Show first image in chat
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setPendingImages([]); // Clear pending images

      // Build conversation history for AI context
      const history = messages
        .filter(m => m.type === 'user' || m.type === 'ai')
        .map(m => ({
          role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: m.text || m.aiAnalysis?.problemSummary || ''
        }));

      // Analyze with AI
      let analysis: AIAnalysisResult;
      
      if (imagesToSend.length > 0) {
        // Use Vision API with first image + text + history
        analysis = await analyzeImageWithText(imagesToSend[0], messageText, history);
      } else {
        // Text-only analysis with history
        analysis = await analyzeTextOnly(messageText, history);
      }

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        text: analysis.problemSummary,
        aiAnalysis: analysis,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentAnalysis(analysis);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('AI analysis error:', error);
      
      // Check for quota exceeded or overloaded error
      if (error?.message?.includes('quota') || 
          error?.message?.includes('429') ||
          error?.message?.includes('503') ||
          error?.message?.includes('overloaded') ||
          error?.message?.includes('UNAVAILABLE')) {
        Alert.alert(
          'Hệ thống đang bận',
          'AI Assistant hiện đang quá tải. Vui lòng thử lại sau vài giây hoặc liên hệ hotline để được hỗ trợ trực tiếp.',
          [
            { text: 'Thử lại sau', style: 'cancel' },
            { 
              text: 'Gọi hotline', 
              onPress: () => {
                // TODO: Add hotline call functionality
                Alert.alert('Hotline', '1900-xxxx');
              }
            }
          ]
        );
      } else if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
        Alert.alert(
          'Lỗi kết nối',
          'Không thể kết nối đến AI. Vui lòng kiểm tra kết nối mạng và thử lại.'
        );
      } else {
        Alert.alert(
          'Lỗi',
          'Không thể phân tích. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
        );
      }
      
      // Remove user message if analysis failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Navigate to booking with AI data
   * CRITICAL: Fetch real service GUID from API
   */
  const handleBookService = async (analysis: AIAnalysisResult) => {
    if (!analysis.detectedServiceId) {
      Alert.alert('Thông báo', 'Không thể xác định dịch vụ phù hợp');
      return;
    }

    const service = getServiceById(analysis.detectedServiceId);
    if (!service) {
      Alert.alert('Thông báo', 'Dịch vụ không tồn tại');
      return;
    }

    try {
      // Fetch real services from API to get GUID
      const apiServices = await servicesService.getAllServices();
      
      // Find matching service by name
      const matchedService = apiServices.find(
        s => s.serviceName?.toLowerCase() === service.serviceName.toLowerCase()
      );

      if (!matchedService) {
        Alert.alert('Lỗi', 'Không tìm thấy dịch vụ trong hệ thống');
        return;
      }

      // Collect all user messages to build comprehensive description
      const userMessages = messages
        .filter(m => m.type === 'user' && m.text)
        .map(m => m.text)
        .join('. ');

      // Prepare booking data with REAL GUID
      const bookingData = {
        customerName: user?.fullName || '',
        phoneNumber: user?.phoneNumber || '',
        serviceId: matchedService.serviceId, // REAL GUID from API
        serviceName: matchedService.serviceName || '',
        servicePrice: matchedService.basePrice?.toString() || service.basePrice || 'Liên hệ',
        serviceDescription: generateServiceDescription(
          userMessages,
          analysis
        ),
        
        // CRITICAL: Pass uploaded media as JSON string (same as book-service)
        uploadedMediaJSON: JSON.stringify(uploadedMedia.map(m => ({
          mediaID: m.mediaID,
          fileURL: m.fileURL,
          localUri: m.localUri
        }))),
        
        fromAI: 'true'
      };

      // Navigate to book-service
      router.push({
        pathname: '/customer/book-service',
        params: bookingData
      });
    } catch (error) {
      console.error('Failed to fetch services:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
    }
  };

  /**
   * Render chat message
   */
  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'system') {
      return (
        <View key={message.id} style={styles.systemMessageContainer}>
          {/* AI Avatar for system message */}
          <View style={styles.systemAiAvatar}>
            <Image 
              source={require('../../assets/logononame.png')} 
              style={styles.systemAiAvatarImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.systemMessage}>
            <Text style={styles.systemText}>{message.text}</Text>
          </View>
        </View>
      );
    }

    if (message.type === 'user') {
      return (
        <View key={message.id} style={styles.userMessageRow}>
          <View style={styles.userMessage}>
            {message.imageUri && (
              <Image source={{ uri: message.imageUri }} style={styles.messageImage} />
            )}
            {message.text && (
              <View style={styles.userBubble}>
                <Text style={styles.userText}>{message.text}</Text>
              </View>
            )}
          </View>
          {/* User Avatar */}
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#3b82f6" />
          </View>
        </View>
      );
    }

    if (message.type === 'ai' && message.aiAnalysis) {
      const analysis = message.aiAnalysis;
      
      return (
        <View key={message.id} style={styles.aiMessageRow}>
          {/* AI Avatar */}
          <View style={styles.aiAvatar}>
            <Image 
              source={require('../../assets/logononame.png')} 
              style={styles.aiAvatarImage}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.aiMessage}>
            <View style={styles.aiBubble}>
            
            {/* If need more info, ONLY show follow-up question */}
            {analysis.needMoreInfo && analysis.followUpQuestions && analysis.followUpQuestions.length > 0 ? (
              <View style={styles.followUpBox}>
                <Text style={styles.singleQuestionText}>{analysis.followUpQuestions[0]}</Text>
              </View>
            ) : (
              <>
              {/* Problem Summary */}
              <Text style={styles.aiTitle}>Phân tích vấn đề:</Text>
              <Text style={styles.aiText}>{analysis.problemSummary}</Text>

              {/* Technical Details */}
              {analysis.technicalDetails && (
                <>
                  <Text style={[styles.aiTitle, { marginTop: 12 }]}>Chi tiết kỹ thuật:</Text>
                  <Text style={styles.aiText}>{analysis.technicalDetails}</Text>
                </>
              )}

              {/* Quick Fixes */}
              {analysis.quickFixes.length > 0 && (
                <>
                  <Text style={[styles.aiTitle, { marginTop: 12 }]}>Giải pháp tự sửa:</Text>
                  {analysis.quickFixes.map((fix, index) => (
                    <Text key={index} style={styles.aiListItem}>
                      {index + 1}. {fix}
                    </Text>
                  ))}
                </>
              )}

              {/* Safety Warnings */}
              {analysis.safetyWarnings.length > 0 && (
                <>
                  <Text style={[styles.aiTitle, { marginTop: 12, color: '#ef4444' }]}>
                    Lưu ý an toàn:
                  </Text>
                  {analysis.safetyWarnings.map((warning, index) => (
                    <Text key={index} style={[styles.aiListItem, { color: '#ef4444' }]}>
                      • {warning}
                    </Text>
                  ))}
                </>
              )}

              {/* Out of Scope Message */}
              {analysis.serviceOutOfScope && analysis.outOfScopeMessage && (
                <View style={styles.outOfScopeBox}>
                  <Ionicons name="information-circle" size={20} color="#f59e0b" />
                  <Text style={styles.outOfScopeText}>{analysis.outOfScopeMessage}</Text>
                </View>
              )}

              {/* Booking Button */}
              {analysis.shouldBook && !analysis.serviceOutOfScope && (
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => handleBookService(analysis)}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    style={styles.bookButtonGradient}
                  >
                    <Text style={styles.bookButtonText}>Đặt lịch thợ ngay</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </LinearGradient>
                </TouchableOpacity>
              )}
              </>
            )}
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Welcome Screen - Show before chat starts */}
      {!hasStarted ? (
        <View style={styles.welcomeContainer}>
          <LinearGradient
            colors={['#609CEF', '#4F8BE8']}
            style={styles.welcomeGradient}
          >
            {/* Animated Logo */}
            <Animated.View style={[
              styles.welcomeLogoContainer,
              {
                transform: [
                  { scale: logoScale },
                  { translateY: logoTranslateY }
                ],
                opacity: logoOpacity
              }
            ]}>
              <Image 
                source={require('../../assets/logononame.png')}
                style={styles.welcomeLogo}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Animated Content */}
            <Animated.View style={{ 
              alignItems: 'center',
              opacity: contentOpacity 
            }}>
              {/* Title */}
              <Text style={styles.welcomeTitle}>Trợ Lý AI EzyFix</Text>
              <Text style={styles.welcomeSubtitle}>
                Tư vấn sửa chữa thông minh
              </Text>

              {/* Features */}
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <Ionicons name="camera" size={32} color="white" />
                  <Text style={styles.featureText}>Chụp ảnh vấn đề</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="sparkles" size={32} color="white" />
                  <Text style={styles.featureText}>AI phân tích</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="build" size={32} color="white" />
                  <Text style={styles.featureText}>Giải pháp nhanh</Text>
                </View>
              </View>

              {/* Start Button */}
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleStart}
                activeOpacity={0.9}
              >
                <Text style={styles.startButtonText}>Bắt đầu</Text>
                <Ionicons name="arrow-forward" size={24} color="#609CEF" />
              </TouchableOpacity>

              {/* Info */}
              <Text style={styles.welcomeInfo}>
                Hỗ trợ 24/7 • Miễn phí tư vấn
              </Text>
            </Animated.View>
          </LinearGradient>
        </View>
      ) : (
        <>
          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map(renderMessage)}
            
            {isAnalyzing && (
              <View style={styles.aiMessageRow}>
                {/* AI Avatar */}
                <View style={styles.aiAvatar}>
                  <Image 
                    source={require('../../assets/logononame.png')} 
                    style={styles.aiAvatarImage}
                    resizeMode="contain"
                  />
                </View>
                
                <View style={styles.aiMessage}>
                  <View style={styles.aiBubble}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={[styles.aiText, { marginTop: 8 }]}>Đang phân tích...</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
          >
        <View style={styles.inputContainer}>
          {/* Pending Image Preview */}
          {pendingImages.length > 0 && (
            <ScrollView horizontal style={styles.imagePreviewContainer}>
              {pendingImages.map((uri, index) => (
                <View key={index} style={styles.imagePreviewWrapper}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removePendingImage(uri)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Input Row */}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={handleImageUpload}
              disabled={isAnalyzing}
            >
              <Ionicons name="camera" size={24} color="#3b82f6" />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder="Mô tả vấn đề của bạn..."
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isAnalyzing}
            />

            <TouchableOpacity
              style={[styles.sendButton, ((!inputText.trim() && pendingImages.length === 0) || isAnalyzing) && styles.sendButtonDisabled]}
              onPress={() => handleSendMessage()}
              disabled={(!inputText.trim() && pendingImages.length === 0) || isAnalyzing}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#609CEF' // Match header color for seamless look
  },
  // Welcome Screen Styles
  welcomeContainer: {
    flex: 1
  },
  welcomeGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24
  },
  welcomeLogoContainer: {
    width: 120,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10
  },
  welcomeLogo: {
    width: 80,
    height: 80
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center'
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 48,
    textAlign: 'center'
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 48
  },
  featureItem: {
    alignItems: 'center',
    gap: 8
  },
  featureText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '600'
  },
  startButton: {
    backgroundColor: 'white',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#609CEF'
  },
  welcomeInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center'
  },
  // Chat Screen Styles
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f9fafb' // Light background for chat area
  },
  messagesContent: {
    padding: 16,
    gap: 12
  },
  // System Message with AI Avatar
  systemMessageContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    maxWidth: '85%',
    gap: 8,
    alignItems: 'center'
  },
  systemAiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6
  },
  systemAiAvatarImage: {
    width: '100%',
    height: '100%'
  },
  systemMessage: {
    flex: 1,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4
  },
  systemText: {
    fontSize: 14,
    color: '#4f46e5',
    lineHeight: 20
  },
  // User Message with Avatar
  userMessageRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    maxWidth: '85%',
    gap: 8,
    alignItems: 'flex-end'
  },
  userMessage: {
    flex: 1,
    gap: 8
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 4
  },
  userText: {
    fontSize: 15,
    color: 'white'
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover'
  },
  // AI Message with Avatar
  aiMessageRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    maxWidth: '85%',
    gap: 8,
    alignItems: 'flex-start'
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  aiAvatarImage: {
    width: 20,
    height: 20
  },
  aiMessage: {
    flex: 1
  },
  aiBubble: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4
  },
  aiText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20
  },
  aiListItem: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginTop: 4
  },
  outOfScopeBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12
  },
  outOfScopeText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18
  },
  bookButton: {
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden'
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white'
  },
  // Follow-up Questions Styles
  followUpBox: {
    marginTop: 0,
    padding: 0,
    backgroundColor: 'transparent'
  },
  followUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  followUpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af'
  },
  followUpWhy: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 18
  },
  // Single Question Style (NEW)
  singleQuestion: {
    padding: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderLeftWidth: 0
  },
  singleQuestionText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
    fontWeight: '500'
  },
  followUpQuestionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8
  },
  followUpQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8
  },
  followUpQuestionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24
  },
  followUpQuestionText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20
  },
  followUpHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8
  },
  imagePreviewContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    maxHeight: 100
  },
  imagePreviewWrapper: {
    marginRight: 8,
    position: 'relative'
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8
  },
  imageButton: {
    padding: 8
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
    color: '#1f2937'
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    opacity: 0.5
  }
});
