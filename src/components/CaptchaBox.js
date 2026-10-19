import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Visual CAPTCHA Component for Anti-Bot and Brute-Force Defense
 * Compatible with Web, iOS, and Android
 */
export default function CaptchaBox({
    captcha,
    answer,
    onChangeAnswer,
    onRefresh,
    loading = false,
    theme = {}
}) {
    const isWeb = Platform.OS === 'web';
    const isDark = theme.isDarkMode || false;

    const containerBg = isDark ? '#1E293B' : '#F1F5F9';
    const borderColor = isDark ? '#334155' : '#CBD5E1';
    const textColor = isDark ? '#F8FAFC' : '#0F172A';
    const subtextColor = isDark ? '#94A3B8' : '#64748B';
    const inputBg = isDark ? '#0F172A' : '#FFFFFF';

    return (
        <View style={[styles.container, { backgroundColor: containerBg, borderColor }]}>
            {/* Header Badge */}
            <View style={styles.headerRow}>
                <View style={styles.badge}>
                    <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                    <Text style={styles.badgeText}>Security Verification (Anti-Bot Shield)</Text>
                </View>
                <TouchableOpacity 
                    onPress={onRefresh} 
                    disabled={loading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.refreshButton}
                    accessibilityLabel="Refresh security captcha"
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#6366F1" />
                    ) : (
                        <View style={styles.refreshIconWrapper}>
                            <Ionicons name="reload" size={15} color="#6366F1" />
                            <Text style={styles.refreshLabel}>Refresh</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={[styles.promptText, { color: subtextColor }]}>
                {captcha?.prompt || 'Enter the code or solve the challenge below:'}
            </Text>

            {/* Visual CAPTCHA Challenge Display */}
            <View style={[styles.captchaDisplayWrapper, { backgroundColor: '#FFFFFF', borderColor }]}>
                {loading ? (
                    <View style={styles.loadingPlaceholder}>
                        <ActivityIndicator size="small" color="#059669" />
                        <Text style={styles.loadingText}>Generating challenge...</Text>
                    </View>
                ) : isWeb && captcha?.svg ? (
                    // Web: Native SVG inline rendering
                    <div 
                        dangerouslySetInnerHTML={{ __html: captcha.svg }} 
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 54 }}
                    />
                ) : captcha?.captchaDataUrl ? (
                    // React Native Native Image support for data URI
                    <Image 
                        source={{ uri: captcha.captchaDataUrl }} 
                        style={styles.captchaImage}
                        resizeMode="contain"
                    />
                ) : (
                    // Fallback
                    <View style={styles.fallbackBox}>
                        <Text style={styles.fallbackText}>{captcha?.displayText || '4 8 2 9'}</Text>
                    </View>
                )}
            </View>

            {/* Answer Input Field */}
            <View style={styles.inputRow}>
                <TextInput
                    style={[
                        styles.input, 
                        { 
                            backgroundColor: inputBg, 
                            borderColor: borderColor,
                            color: textColor 
                        }
                    ]}
                    value={answer}
                    onChangeText={onChangeAnswer}
                    placeholder="Enter security answer here..."
                    placeholderTextColor={subtextColor}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={10}
                    returnKeyType="done"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        marginVertical: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
        letterSpacing: 0.2,
    },
    refreshButton: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 6,
    },
    refreshIconWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    refreshLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6366F1',
    },
    promptText: {
        fontSize: 12,
        marginBottom: 8,
    },
    captchaDisplayWrapper: {
        width: '100%',
        height: 60,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: 10,
    },
    captchaImage: {
        width: '100%',
        height: 54,
    },
    loadingPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 12,
        color: '#64748B',
    },
    fallbackBox: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    fallbackText: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 6,
        color: '#059669',
    },
    inputRow: {
        width: '100%',
    },
    input: {
        width: '100%',
        height: 44,
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        fontWeight: '600',
    },
});
