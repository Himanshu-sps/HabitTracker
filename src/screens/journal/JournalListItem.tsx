import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { JournalType } from '@/type';
import { formatDate } from '@/utils/DateTimeUtils';
import { moodList } from '@/utils/AppConstants';
import { useAppTheme } from '@/utils/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const JournalListItem = ({
  journal,
  onDelete,
}: {
  journal: JournalType;
  onDelete: () => void;
}) => {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.dateText}>
          {formatDate(journal.journalDate, 'MMM DD, YYYY')}
        </Text>

        <TouchableOpacity
          onPress={() => {
            onDelete();
          }}
        >
          <Icon name="delete" size={24} color={colors.habitRed} />
        </TouchableOpacity>
      </View>

      <Text style={styles.entryText}>{journal.journalEntry}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.scoreText}>
          {journal.sentimentLabel}{' '}
          {moodList[journal.sentimentScore - 1]?.moodIcon}
        </Text>
      </View>

      <View style={styles.tipsBox}>
        <Text style={styles.tipsLabel}>AI Tip:</Text>
        <Text style={styles.tipsText}>{journal.aiTips}</Text>
      </View>
    </View>
  );
};

export default JournalListItem;

const getStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      padding: 16,
      marginVertical: 10,
      marginHorizontal: 16,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    dateText: {
      fontSize: 13,
      color: colors.subtitle,
      fontWeight: '500',
    },
    entryText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 10,
      fontWeight: '500',
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    scoreText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
    },
    tipsBox: {
      backgroundColor:
        colors.mode === 'dark' ? colors.cardShadow + '33' : colors.inputBg,
      borderRadius: 10,
      padding: 14,
      marginTop: 6,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    tipsLabel: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    tipsText: {
      fontSize: 13,
      color: colors.text,
    },
  });
