/**
 * Toast notification utility using SweetAlert2
 * Creates non-intrusive notifications that don't block user interaction
 */

import Swal from 'sweetalert2';

// Create and show a toast notification
export const showToast = (message, type = 'info', duration = 3000) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: duration,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });

  Toast.fire({
    icon: type,
    title: message,
    background: 'rgba(17, 24, 39, 0.95)', // gray-900 with transparency
    color: '#ffffff',
    customClass: {
      popup: 'text-white',
      timerProgressBar: 'bg-blue-500'
    }
  });
};
