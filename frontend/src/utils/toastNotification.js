/**
 * Toast notification utility
 * Creates non-intrusive notifications that don't block user interaction
 */

// Create and show a toast notification
export const showToast = (message, type = 'info', duration = 3000) => {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    toastContainer.style.display = 'flex';
    toastContainer.style.flexDirection = 'column';
    toastContainer.style.gap = '10px';
    document.body.appendChild(toastContainer);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.style.minWidth = '300px';
  toast.style.maxWidth = '400px';
  toast.style.padding = '12px 16px';
  toast.style.borderRadius = '6px';
  toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.justifyContent = 'space-between';
  toast.style.animation = 'slideIn 0.3s ease-out forwards';
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';

  // Set background and icon based on type
  let iconSvg = '';
  switch (type) {
    case 'success':
      toast.style.backgroundColor = 'rgba(16, 185, 129, 0.95)';
      toast.style.color = 'white';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
      break;
    case 'error':
      toast.style.backgroundColor = 'rgba(239, 68, 68, 0.95)';
      toast.style.color = 'white';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
      break;
    case 'warning':
      toast.style.backgroundColor = 'rgba(245, 158, 11, 0.95)';
      toast.style.color = 'white';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
      break;
    case 'info':
    default:
      toast.style.backgroundColor = 'rgba(59, 130, 246, 0.95)';
      toast.style.color = 'white';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  // Create content container
  const contentContainer = document.createElement('div');
  contentContainer.style.display = 'flex';
  contentContainer.style.alignItems = 'center';
  contentContainer.style.gap = '12px';

  // Create icon element
  const icon = document.createElement('div');
  icon.innerHTML = iconSvg;
  
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.style.fontWeight = '500';
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  closeButton.style.background = 'transparent';
  closeButton.style.border = 'none';
  closeButton.style.color = 'inherit';
  closeButton.style.cursor = 'pointer';
  closeButton.style.marginLeft = '8px';
  closeButton.style.padding = '0';
  closeButton.style.opacity = '0.7';
  closeButton.style.transition = 'opacity 0.2s';
  closeButton.addEventListener('mouseover', () => {
    closeButton.style.opacity = '1';
  });
  closeButton.addEventListener('mouseout', () => {
    closeButton.style.opacity = '0.7';
  });
  
  // Add elements to toast
  contentContainer.appendChild(icon);
  contentContainer.appendChild(messageElement);
  toast.appendChild(contentContainer);
  toast.appendChild(closeButton);
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes slideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
  `;
  document.head.appendChild(style);
  
  // Function to remove toast
  const removeToast = () => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => {
      if (toast.parentNode === toastContainer) {
        toastContainer.removeChild(toast);
      }
      // Remove container if empty
      if (toastContainer.children.length === 0) {
        document.body.removeChild(toastContainer);
      }
    }, 300);
  };
  
  // Add event listeners
  closeButton.addEventListener('click', removeToast);
  
  // Auto-remove after duration
  setTimeout(removeToast, duration);
  
  // Add toast to container
  toastContainer.appendChild(toast);
};