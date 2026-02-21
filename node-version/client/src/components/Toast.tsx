import { toaster, Message } from 'rsuite';

type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Helper function to show toast notifications using RSuite's toaster
 * Replaces the old custom Toast component
 */
export function showToast(message: string, type: ToastType = 'success', duration: number = 4000) {
  toaster.push(
    <Message showIcon type={type} closable>
      {message}
    </Message>,
    { placement: 'topEnd', duration }
  );
}

// Legacy component for backwards compatibility (deprecated)
// TODO: Remove after full migration to showToast()
interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', duration = 4000 }: ToastProps) {
  showToast(message, type, duration);
  return null;
}
