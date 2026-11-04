import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/colors';
import { SecondaryButton } from './SecondaryButton';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryTitle?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message,
  onRetry,
  retryTitle = 'Try Again',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <View style={styles.buttonContainer}>
          <SecondaryButton title={retryTitle} onPress={onRetry} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: Colors.dangerRedBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFA39E',
    marginVertical: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dangerRed,
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: '#781A1C',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 14,
    width: '100%',
  },
});
