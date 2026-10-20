import { useTheme } from '@/context/ThemeContext';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CustomDatePickerProps {
  isVisible: boolean;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  date: Date;
}

export default function CustomDatePicker({
  isVisible,
  onConfirm,
  onCancel,
  date,
}: CustomDatePickerProps) {
  const { isDarkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState(date);

  const bgColor = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDarkMode ? '#B0B0B0' : '#757575';
  const overlayBg = isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)';
  const selectedBg = '#58CC02';
  const itemBg = isDarkMode ? '#0F1419' : '#F5F1E8';

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();
  const currentDay = selectedDate.getDate();

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);
  const days = Array.from({ length: daysInMonth(currentYear, currentMonth) }, (_, i) => i + 1);

  const handleMonthChange = (month: number) => {
    const newDate = new Date(currentYear, month, currentDay);
    setSelectedDate(newDate);
  };

  const handleYearChange = (year: number) => {
    const newDate = new Date(year, currentMonth, currentDay);
    setSelectedDate(newDate);
  };

  const handleDayChange = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Select Date</Text>
          </View>

          <View style={styles.pickerContainer}>
            {/* Month Picker */}
            <View style={styles.pickerColumn}>
              <Text style={[styles.columnLabel, { color: subtitleColor }]}>Month</Text>
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor: currentMonth === index ? selectedBg : itemBg,
                      },
                    ]}
                    onPress={() => handleMonthChange(index)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        {
                          color: currentMonth === index ? '#FFFFFF' : textColor,
                        },
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Day Picker */}
            <View style={styles.pickerColumn}>
              <Text style={[styles.columnLabel, { color: subtitleColor }]}>Day</Text>
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor: currentDay === day ? selectedBg : itemBg,
                      },
                    ]}
                    onPress={() => handleDayChange(day)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        {
                          color: currentDay === day ? '#FFFFFF' : textColor,
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Year Picker */}
            <View style={styles.pickerColumn}>
              <Text style={[styles.columnLabel, { color: subtitleColor }]}>Year</Text>
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
              >
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor: currentYear === year ? selectedBg : itemBg,
                      },
                    ]}
                    onPress={() => handleYearChange(year)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        {
                          color: currentYear === year ? '#FFFFFF' : textColor,
                        },
                      ]}
                    >
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: 'transparent',
                  borderColor: '#58CC02',
                  borderWidth: 2,
                },
              ]}
              onPress={onCancel}
            >
              <Text style={[styles.buttonText, { color: '#58CC02' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#58CC02' }]}
              onPress={handleConfirm}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 250,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
