import React, { createContext, useContext, useState } from 'react';
import Notification, { NotificationProps } from '../components/ui/Notification';
import { generateId } from '../utils/helpers';

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationProps, 'id' | 'onDismiss'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const showNotification = (notification: Omit<NotificationProps, 'id' | 'onDismiss'>) => {
    const id = generateId();
    setNotifications(prev => [...prev, { ...notification, id, onDismiss: dismissNotification }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-4 right-4 space-y-4 z-50">
        {notifications.map(notification => (
          <Notification key={notification.id} {...notification} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};