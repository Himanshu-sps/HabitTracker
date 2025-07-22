import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/utils/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface StreakChallengeCardProps {
  days: number;
  badge: string;
  description: string;
  isCompleted: boolean;
  isDisabled: boolean;
}

const StreakChallengeCard: React.FC<StreakChallengeCardProps> = ({
  days,
  badge,
  description,
  isCompleted,
  isDisabled,
}) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View
      style={[
        styles.card,
        isCompleted
          ? styles.completedCard
          : isDisabled
          ? styles.disabledCard
          : styles.pendingCard,
      ]}
    >
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text
          style={[
            styles.daysText,
            { color: isCompleted ? colors.white : colors.text },
          ]}
        >
          {days} Day Streak
        </Text>
        <Text
          style={[
            styles.descriptionText,
            {
              color: isCompleted
                ? colors.white
                : isDisabled
                ? colors.subtitle
                : colors.subtitle,
            },
          ]}
        >
          {description}
        </Text>
      </View>
      {isCompleted && (
        <MaterialIcons name="check-circle" size={24} color={colors.white} />
      )}
    </View>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
    },
    completedCard: {
      backgroundColor: colors.primary,
    },
    disabledCard: {
      backgroundColor: colors.disabledSurface,
      opacity: 0.6,
    },
    pendingCard: {
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    badgeContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      width: 50,
      height: 50,
    },
    badgeText: {
      fontSize: 32,
    },
    detailsContainer: {
      flex: 1,
    },
    daysText: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    descriptionText: {
      fontSize: 14,
    },
  });

export default StreakChallengeCard;
