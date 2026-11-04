import Colors from '../constants/colors';

/**
 * Format GPS coordinates to 5 decimal places with Cardinal markers
 */
export function formatCoordinates(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
    return 'No GPS data';
  }
  const latCard = lat >= 0 ? 'N' : 'S';
  const lngCard = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latCard}, ${Math.abs(lng).toFixed(5)}° ${lngCard}`;
}

/**
 * Format distance in meters or kilometers
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters == null || isNaN(meters)) return '—';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format badge colors for Work Order & Asset status
 */
export function getStatusBadgeColors(status: string): { bg: string; text: string; border: string } {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'operational':
    case 'success':
    case 'synced':
      return {
        bg: Colors.successGreenBg,
        text: Colors.successGreen,
        border: '#B7EB8F',
      };
    case 'in_progress':
    case 'uploading':
      return {
        bg: Colors.lightBlue,
        text: Colors.primaryBlue,
        border: '#ADC6FF',
      };
    case 'pending':
    case 'warning':
      return {
        bg: Colors.warningOrangeBg,
        text: Colors.warningOrange,
        border: '#FFE58F',
      };
    case 'cancelled':
    case 'fault':
    case 'failed':
    case 'retired':
      return {
        bg: Colors.dangerRedBg,
        text: Colors.dangerRed,
        border: '#FFA39E',
      };
    default:
      return {
        bg: '#F5F5F5',
        text: Colors.secondaryText,
        border: Colors.borderGrey,
      };
  }
}

/**
 * Format badge colors for Priority levels
 */
export function getPriorityBadgeColors(priority: string): { bg: string; text: string } {
  switch (priority.toLowerCase()) {
    case 'critical':
      return { bg: '#FF4D4F', text: '#FFFFFF' };
    case 'high':
      return { bg: '#FA8C16', text: '#FFFFFF' };
    case 'medium':
      return { bg: '#1890FF', text: '#FFFFFF' };
    case 'low':
    default:
      return { bg: '#52C41A', text: '#FFFFFF' };
  }
}
