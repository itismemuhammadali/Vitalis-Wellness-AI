import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface DeadlineDatePickerProps {
  isVisible: boolean;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  date: Date;
}

const PRIMARY_GREEN = '#58CC02';
const ACCENT_BLUE = '#1F9FFF';
const ACCENT_GOLD = '#FFD700';
const ACCENT_PURPLE = '#A78BFA';

export default function DeadlineDatePicker({
  isVisible,
  onConfirm,
  onCancel,
  date,
}: DeadlineDatePickerProps) {
  const { isDarkMode } = useTheme();
  const [selectedDate, setSelectedDate] = useState(date);
  const [calendarMonth, setCalendarMonth] = useState(new Date(date));
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [yearPickerPage, setYearPickerPage] = useState(0);

  const bgColor = isDarkMode ? '#1A1F2E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDarkMode ? '#B0B0B0' : '#757575';
  const inputBg = isDarkMode ? '#0F1419' : '#F5F1E8';
  const borderColor = isDarkMode ? '#2A3142' : '#E0E0E0';
  const overlayBg = isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)';

  if (!isVisible) return null;

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <View style={[styles.calendarContent, { backgroundColor: bgColor, borderColor: borderColor }]}>
          <View style={[styles.calendarHeader, { backgroundColor: ACCENT_BLUE, borderBottomColor: ACCENT_BLUE }]}>
            <View style={styles.headerContent}>
              <Text style={[styles.calendarTitle, { color: '#FFFFFF' }]}>Select Deadline</Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeIconContainer}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Month/Year Selection */}
          <View style={styles.monthYearNav}>
            <TouchableOpacity
              style={[styles.monthYearButton, { borderColor: ACCENT_GOLD, backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}
              onPress={() => {
                setShowMonthPicker(!showMonthPicker);
                setShowYearPicker(false);
              }}
            >
              <Text style={[styles.monthYearButtonText, { color: ACCENT_GOLD }]}>
                {calendarMonth.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.monthYearButton, { borderColor: ACCENT_PURPLE, backgroundColor: 'rgba(167, 139, 250, 0.1)' }]}
              onPress={() => {
                setShowYearPicker(!showYearPicker);
                setShowMonthPicker(false);
                setYearPickerPage(0);
              }}
            >
              <Text style={[styles.monthYearButtonText, { color: ACCENT_PURPLE }]}>
                {calendarMonth.getFullYear()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Year Picker */}
          {showYearPicker && (
            <View style={[styles.pickerContainer, { backgroundColor: inputBg, borderColor: borderColor }]}>
              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }).map((_, i) => {
                  const currentYear = new Date().getFullYear();
                  const year = currentYear + i - yearPickerPage * 12;
                  const isSelectable = year >= currentYear && year <= currentYear + 50;
                  return (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.monthItem,
                        year === calendarMonth.getFullYear() && { backgroundColor: PRIMARY_GREEN },
                        !isSelectable && { opacity: 0.4 }
                      ]}
                      onPress={() => {
                        if (isSelectable) {
                          setCalendarMonth(new Date(year, calendarMonth.getMonth()));
                        }
                      }}
                      disabled={!isSelectable}
                    >
                      <Text style={[styles.monthItemText, { color: year === calendarMonth.getFullYear() ? '#fff' : textColor }]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.yearPickerNav}>
                <TouchableOpacity
                  onPress={() => {
                    if (yearPickerPage > 0) {
                      setYearPickerPage(yearPickerPage - 1);
                    }
                  }}
                  disabled={yearPickerPage === 0}
                >
                  <MaterialCommunityIcons 
                    name="chevron-left" 
                    size={20} 
                    color={yearPickerPage === 0 ? subtitleColor : PRIMARY_GREEN} 
                  />
                </TouchableOpacity>
                <Text style={[styles.yearRangeText, { color: textColor }]}>
                  {new Date().getFullYear() + yearPickerPage * 12} - {new Date().getFullYear() + 11 + yearPickerPage * 12}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const currentYear = new Date().getFullYear();
                    const maxYear = currentYear + 11 + yearPickerPage * 12;
                    if (maxYear < currentYear + 50) {
                      setYearPickerPage(yearPickerPage + 1);
                    }
                  }}
                  disabled={(new Date().getFullYear() + 11 + yearPickerPage * 12) >= new Date().getFullYear() + 50}
                >
                  <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={20} 
                    color={(new Date().getFullYear() + 11 + yearPickerPage * 12) >= new Date().getFullYear() + 50 ? subtitleColor : PRIMARY_GREEN} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Month Picker */}
          {showMonthPicker && (
            <View style={[styles.pickerContainer, { backgroundColor: inputBg, borderColor: borderColor }]}>
              <View style={styles.monthGrid}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                  <TouchableOpacity
                    key={month}
                    style={[styles.monthItem, idx === calendarMonth.getMonth() && { backgroundColor: PRIMARY_GREEN }]}
                    onPress={() => {
                      setCalendarMonth(new Date(calendarMonth.getFullYear(), idx));
                      setShowMonthPicker(false);
                    }}
                  >
                    <Text style={[styles.monthItemText, { color: idx === calendarMonth.getMonth() ? '#fff' : textColor }]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Calendar Grid */}
          {!showYearPicker && !showMonthPicker && (
            <>
              <View style={styles.dayHeaders}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <Text key={index} style={[styles.dayHeader, { color: subtitleColor }]}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {Array.from({ length: 42 }).map((_, index) => {
                  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
                  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
                  const dayNumber = index - firstDay + 1;
                  const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
                  const date = isCurrentMonth ? new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNumber) : null;
                  const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString();
                  
                  // Allow future dates only (today and onwards)
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isFuture = date && date >= today;
                  const isSelectable = isCurrentMonth && isFuture;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDay,
                        isSelected && { backgroundColor: PRIMARY_GREEN },
                        !isSelectable && isCurrentMonth && { opacity: 0.4 },
                      ]}
                      onPress={() => {
                        if (isSelectable) {
                          setSelectedDate(date);
                        }
                      }}
                      disabled={!isSelectable}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          { color: isCurrentMonth ? textColor : 'transparent' },
                          isSelected && { color: '#fff', fontWeight: 'bold' },
                        ]}
                      >
                        {isCurrentMonth ? dayNumber : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.calendarConfirmButton,
              {
                backgroundColor: PRIMARY_GREEN,
                shadowColor: PRIMARY_GREEN,
              },
              Platform.OS === 'ios' && {
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              },
              Platform.OS === 'android' && {
                elevation: 6,
              }
            ]}
            onPress={handleConfirm}
          >
            <Text style={styles.calendarConfirmButtonText}>✓ Done</Text>
          </TouchableOpacity>
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
  calendarContent: {
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  closeIconContainer: {
    padding: 8,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  monthYearNav: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthYearButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  monthYearButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pickerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthItem: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(88, 204, 2, 0.1)',
  },
  monthItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  yearPickerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  yearRangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 2.5,
    rowGap: 25,
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: '13.5%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
    height: 30,
  },
  calendarConfirmButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  calendarConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
