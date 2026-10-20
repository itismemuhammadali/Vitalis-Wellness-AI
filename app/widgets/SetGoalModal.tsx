import { useTheme } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DeadlineDatePicker from './DeadlineDatePicker';

type GoalCategory = 'health' | 'growth' | 'career' | 'social' | 'other' | null;

interface SetGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    title: string;
    description: string;
    category: GoalCategory;
    targetDate: string;
  }) => void;
}

const CATEGORIES = [
  { id: 'health', label: 'Health & Wellness', icon: '💚', color: '#58CC02' },
  { id: 'growth', label: 'Personal Growth', icon: '☀️', color: '#FFD700' },
  { id: 'career', label: 'Career', icon: '💼', color: '#B0B0B0' },
  { id: 'social', label: 'Social', icon: '👥', color: '#1CB0F6' },
  { id: 'other', label: 'Other', icon: '⭕', color: '#FF4B4B' },
];

export default function SetGoalModal({ visible, onClose, onSubmit }: SetGoalModalProps) {
  const { isDarkMode } = useTheme();
  const isDark = isDarkMode;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory>('health');
  const [targetDate, setTargetDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());

  const bgColor = isDark ? '#1A1F2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1F1F1F';
  const subtitleColor = isDark ? '#B0B0B0' : '#757575';
  const inputBg = isDark ? '#0F1419' : '#F5F1E8';
  const borderColor = isDark ? '#2A3142' : '#E0E0E0';
  const overlayBg = isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)';

  // Gamification colors
  const colorPalette = {
    red: '#FF6B6B',
    blue: '#1F9FFF',
    orange: '#FFB84D',
    purple: '#A78BFA',
    teal: '#00D9A3',
    darkOrange: '#FF8C00',
    green: '#58CC02',
  };

  const isFormValid = title.trim() && description.trim() && selectedCategory && targetDate;

  const handleDateConfirm = (date: Date) => {
    setSelectedDateObj(date);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    setTargetDate(`${month}/${day}/${year}`);
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleSubmit = () => {
    if (!isFormValid) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit?.({
      title,
      description,
      category: selectedCategory,
      targetDate,
    });
    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedCategory('health');
    setTargetDate('');
    setShowDatePicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
        <View style={[styles.modalContainer, { backgroundColor: bgColor }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colorPalette.blue }]}>
            <Text style={[styles.title, { color: '#FFFFFF' }]}>Set New Goal</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButtonContainer}>
              <Text style={[styles.closeButton, { color: '#FFFFFF' }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Goal Title */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>Goal Title</Text>
              <View style={[styles.inputWrapper, { borderLeftColor: colorPalette.blue }]}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      color: textColor,
                      borderColor: borderColor,
                    },
                  ]}
                  placeholder="e.g., Run 5K in 30 minutes"
                  placeholderTextColor={subtitleColor}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>Description</Text>
              <View style={[styles.inputWrapper, { borderLeftColor: colorPalette.orange }]}>
                <TextInput
                  style={[
                    styles.descriptionInput,
                    {
                      backgroundColor: inputBg,
                      color: textColor,
                      borderColor: borderColor,
                    },
                  ]}
                  placeholder="Why is this goal important to you?"
                  placeholderTextColor={subtitleColor}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>Category</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor:
                          selectedCategory === category.id ? category.color : inputBg,
                        borderColor: selectedCategory === category.id ? category.color : borderColor,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setSelectedCategory(category.id as GoalCategory)}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        {
                          color:
                            selectedCategory === category.id ? '#FFFFFF' : textColor,
                        },
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Target Date */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>Target Date</Text>
              <TouchableOpacity
                style={[
                  styles.dateInputContainer,
                  {
                    backgroundColor: inputBg,
                    borderColor: borderColor,
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.dateText, { color: targetDate ? textColor : subtitleColor }]}>
                  {targetDate || 'MM/DD/YYYY'}
                </Text>
                <Ionicons name="calendar-outline" size={24} color={targetDate ? textColor : subtitleColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: 'transparent',
                  borderColor: colorPalette.red,
                  borderWidth: 2,
                },
              ]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, { color: colorPalette.red }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isFormValid ? colorPalette.green : 'rgba(88, 204, 2, 0.5)',
                  opacity: isFormValid ? 1 : 0.6,
                },
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Date Picker */}
      <DeadlineDatePicker
        isVisible={showDatePicker}
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        date={selectedDateObj}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    borderRadius: 20,
    width: '100%',
    maxHeight: '95%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButtonContainer: {
    padding: 8,
  },
  closeButton: {
    fontSize: 28,
    fontWeight: '300',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: '70%',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    borderLeftWidth: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  dateInputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    flex: 1,
    fontSize: 14,
  },
  calendarIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
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
