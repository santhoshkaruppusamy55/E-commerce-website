// Toast Notification System
let notificationContainer = null;

// Initialize container on first use
function ensureContainer() {
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    return notificationContainer;
}

// Show notification
export function showNotification(message, type = 'info') {
    const container = ensureContainer();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Icon based on type
    const icons = {
        success: '✓',
        error: '✕',
        info: 'i'
    };

    notification.innerHTML = `
    <div class="notification-icon">${icons[type] || icons.info}</div>
    <div class="notification-content">${message}</div>
    <button class="notification-close" aria-label="Close">×</button>
  `;

    // Add to container
    container.appendChild(notification);

    // Close button handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => removeNotification(notification));

    // Auto-dismiss after 4 seconds
    setTimeout(() => removeNotification(notification), 4000);
}

// Remove notification with animation
function removeNotification(notification) {
    if (!notification || !notification.parentElement) return;

    notification.classList.add('removing');

    // Remove from DOM after animation
    setTimeout(() => {
        if (notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
    }, 300);
}

// Make it available globally for inline scripts
window.showNotification = showNotification;
