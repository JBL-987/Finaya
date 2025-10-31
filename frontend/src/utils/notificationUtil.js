/**
 * Notification utility using SweetAlert2
 * Provides standardized alert and notification functions for the entire application
 */

import Swal from 'sweetalert2';

// Success alert
export const showSuccessAlert = (title, text = '', timer = null) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer,
    showConfirmButton: !timer,
    background: 'rgba(17, 24, 39, 0.95)',
    color: '#ffffff',
    confirmButtonColor: '#10b981'
  });
};

// Error alert
export const showErrorAlert = (title, text = '', timer = null) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    timer,
    showConfirmButton: !timer,
    background: 'rgba(17, 24, 39, 0.95)',
    color: '#ffffff',
    confirmButtonColor: '#ef4444'
  });
};

// Warning alert
export const showWarningAlert = (title, text = '', timer = null) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    timer,
    showConfirmButton: !timer,
    background: 'rgba(17, 24, 39, 0.95)',
    color: '#ffffff',
    confirmButtonColor: '#f59e0b'
  });
};

// Info alert
export const showInfoAlert = (title, text = '', timer = null) => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    timer,
    showConfirmButton: !timer,
    background: 'rgba(17, 24, 39, 0.95)',
    color: '#ffffff',
    confirmButtonColor: '#3b82f6'
  });
};

// Question/Confirmation alert
export const showConfirmAlert = (title, text = '', confirmButtonText = 'Yes', cancelButtonText = 'Cancel') => {
  return Swal.fire({
    icon: 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    background: 'rgba(17, 24, 39, 0.95)',
    color: '#ffffff',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280'
  });
};

// Custom alert with any icon
export const showAlert = (options) => {
  const defaults = {
    background: 'rgba(17, 24, 39, 0.95)',
    color: '#ffffff',
    confirmButtonColor: '#3b82f6'
  };
  return Swal.fire({ ...defaults, ...options });
};

// Toast notification (uses the showToast from toastNotification.js)
export { showToast } from './toastNotification.js';

// Loading alert
export const showLoadingAlert = (title = 'Loading...', text = '') => {
  return Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    background: 'rgba(17, 24, 39, 0.95)',
    color: '#ffffff',
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Close any currently open SweetAlert2 modal
export const closeAlert = () => {
  Swal.close();
};
