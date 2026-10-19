import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkServerHealth } from '../services/healthService';

/**
 * Server Health & Connectivity Status Component
 * Informs the user when the backend is active, reconnecting, or degraded.
 */
export default function ServerHealthBanner({ theme = {}, showOnlyWhenOffline = true }) {
    const [health, setHealth] = useState({ active: true, status: 'checking' });
    const [checking, setChecking] = useState(false);

    const isDark = theme.isDarkMode || false;

    const performCheck = async () => {
        setChecking(true);
        const result = await checkServerHealth();
        setHealth(result);
        setChecking(false);
    };

    useEffect(() => {
        performCheck();
        // Check health every 45 seconds
        const interval = setInterval(performCheck, 45000);
        return () => clearInterval(interval);
    }, []);

    // If configured to only show when server is offline/degraded
    if (showOnlyWhenOffline && health.active && health.status === 'healthy') {
        return null;
    }

    const isDegraded = health.active && health.status === 'degraded';
    const isOffline = !health.active;

    let bg = isDark ? '#064E3B' : '#ECFDF5';
    let border = isDark ? '#059669' : '#A7F3D0';
    let text = isDark ? '#A7F3D0' : '#065F46';
    let iconName = 'checkmark-circle';
    let iconColor = '#10B981';
    let title = 'Server Active & Secure';
    let subtitle = `Latency: ${health.latencyMs || 0}ms • Firewall & Injection Guard Active`;

    if (isDegraded) {
        bg = isDark ? '#78350F' : '#FFFBEB';
        border = isDark ? '#D97706' : '#FDE68A';
        text = isDark ? '#FDE68A' : '#92400E';
        iconName = 'warning-outline';
        iconColor = '#F59E0B';
        title = 'Server Reconnecting';
        subtitle = 'Database warming up. Responses may take a few extra moments.';
    } else if (isOffline) {
        bg = isDark ? '#7F1D1D' : '#FEF2F2';
        border = isDark ? '#DC2626' : '#FECACA';
        text = isDark ? '#FECACA' : '#991B1B';
        iconName = 'cloud-offline-outline';
        iconColor = '#EF4444';
        title = 'Server Unreachable';
        subtitle = 'Cannot connect to backend server. Please verify your connection.';
    }

    return (
        <View style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
            <View style={styles.contentRow}>
                <Ionicons name={iconName} size={20} color={iconColor} style={styles.icon} />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: text }]}>{title}</Text>
                    <Text style={[styles.subtitle, { color: text }]}>{subtitle}</Text>
                </View>
                {isOffline && (
                    <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={performCheck}
                        disabled={checking}
                    >
                        {checking ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <View style={styles.retryContent}>
                                <Ionicons name="refresh" size={13} color="#EF4444" />
                                <Text style={styles.retryText}>Retry</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 12,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 12.5,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 11,
        marginTop: 2,
        opacity: 0.85,
    },
    retryButton: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        marginLeft: 8,
    },
    retryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    retryText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#EF4444',
    },
});
