import { createContext, useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";

export const NotificationContext = createContext(null);

let nextId = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = ++nextId;
      setNotifications((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({ notifications, notify, dismiss }),
    [notifications, notify, dismiss]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
