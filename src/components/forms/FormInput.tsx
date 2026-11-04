import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Colors from '../../constants/colors';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string | null;
  minChars?: number;
  currentLength?: number;
  helperText?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  minChars,
  currentLength,
  helperText,
  style,
  multiline,
  ...rest
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {minChars !== undefined && currentLength !== undefined && (
          <Text
            style={[
              styles.counter,
              currentLength < minChars ? styles.counterUnder : styles.counterValid,
            ]}
          >
            {currentLength}/{minChars} min chars
          </Text>
        )}
      </View>

      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...rest}
      />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  counter: {
    fontSize: 11,
    fontWeight: '600',
  },
  counterUnder: {
    color: Colors.warningOrange,
  },
  counterValid: {
    color: Colors.successGreen,
  },
  input: {
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.primaryText,
  },
  multilineInput: {
    minHeight: 110,
    paddingTop: 12,
  },
  inputError: {
    borderColor: Colors.dangerRed,
    backgroundColor: Colors.dangerRedBg,
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.dangerRed,
    fontWeight: '500',
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.secondaryText,
  },
});
