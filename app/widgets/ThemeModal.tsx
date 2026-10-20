import { PaletteIcon } from '@/components/PaletteIcon';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const PRIMARY_GREEN = '#58CC02';

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
  themeSelection: 'light' | 'dark' | 'system';
  onThemeSelect: (theme: 'light' | 'dark' | 'system') => void;
  isDarkMode: boolean;
  textColor: string;
  subtitleColor: string;
  inputBgColor: string;
}

export function ThemeModal({
  visible,
  onClose,
  themeSelection,
  onThemeSelect,
  isDarkMode,
  textColor,
  subtitleColor,
  inputBgColor,
}: ThemeModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { backgroundColor: inputBgColor }]}>
          <View style={styles.modalTitleContainer}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Choose Theme</Text>
            <View style={{ marginLeft: 10 }} />
            <PaletteIcon size={28} />
          </View>
          
          {/* Light Theme Option */}
          <TouchableOpacity 
            style={[
              styles.themeOptionButton,
              { borderColor: themeSelection === 'light' ? PRIMARY_GREEN : subtitleColor },
              themeSelection === 'light' && [styles.themeOptionButtonSelected, { backgroundColor: inputBgColor }]
            ]}
            onPress={() => onThemeSelect('light')}
          >
            <View style={[styles.radioButton, { borderColor: themeSelection === 'light' ? PRIMARY_GREEN : subtitleColor }, themeSelection === 'light' && styles.radioButtonSelected]}>
              {themeSelection === 'light' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={[styles.themeOptionText, { color: themeSelection === 'light' ? PRIMARY_GREEN : textColor }, themeSelection === 'light' && styles.themeOptionTextSelected]}>Light Theme</Text>
            <View style={{ marginLeft: 10 }} />
            <Text style={{ fontSize: 20 }}>☀️</Text>
          </TouchableOpacity>

          {/* Dark Theme Option */}
          <TouchableOpacity 
            style={[
              styles.themeOptionButton,
              { borderColor: themeSelection === 'dark' ? PRIMARY_GREEN : subtitleColor },
              themeSelection === 'dark' && [styles.themeOptionButtonSelected, { backgroundColor: inputBgColor }]
            ]}
            onPress={() => onThemeSelect('dark')}
          >
            <View style={[styles.radioButton, { borderColor: themeSelection === 'dark' ? PRIMARY_GREEN : subtitleColor }, themeSelection === 'dark' && styles.radioButtonSelected]}>
              {themeSelection === 'dark' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={[styles.themeOptionText, { color: themeSelection === 'dark' ? PRIMARY_GREEN : textColor }, themeSelection === 'dark' && styles.themeOptionTextSelected]}>Dark Theme</Text>
            <View style={{ marginLeft: 10 }} />
            <Text style={{ fontSize: 20 }}>🌙</Text>
          </TouchableOpacity>

          {/* System Theme Option */}
          <TouchableOpacity 
            style={[
              styles.themeOptionButton,
              { borderColor: themeSelection === 'system' ? PRIMARY_GREEN : subtitleColor },
              themeSelection === 'system' && [styles.themeOptionButtonSelected, { backgroundColor: inputBgColor }]
            ]}
            onPress={() => onThemeSelect('system')}
          >
            <View style={[styles.radioButton, { borderColor: themeSelection === 'system' ? PRIMARY_GREEN : subtitleColor }, themeSelection === 'system' && styles.radioButtonSelected]}>
              {themeSelection === 'system' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={[styles.themeOptionText, { color: themeSelection === 'system' ? PRIMARY_GREEN : textColor }, themeSelection === 'system' && styles.themeOptionTextSelected]}>System Theme</Text>
            <View style={{ marginLeft: 10 }} />
            <Ionicons name="phone-portrait" size={20} color={themeSelection === 'system' ? PRIMARY_GREEN : textColor} />
          </TouchableOpacity>

          {/* Done Button */}
          <TouchableOpacity 
            style={[styles.doneButton, { backgroundColor: PRIMARY_GREEN }]}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default ThemeModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 28,
    minWidth: 320,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  themeOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 2,
    marginBottom: 14,
    backgroundColor: 'transparent',
  },
  themeOptionButtonSelected: {
    borderColor: PRIMARY_GREEN,
    borderWidth: 3,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  radioButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioButtonSelected: {
    borderColor: PRIMARY_GREEN,
  },
  radioButtonInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: PRIMARY_GREEN,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeOptionTextSelected: {
    fontWeight: '800',
    color: PRIMARY_GREEN,
  },
  doneButton: {
    paddingVertical: 16,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
