import { useNotification } from "../hooks/useNotification";

const TYPE_STYLES = {
  success: "bg-green-50 border-green-400 text-green-800",
  error: "bg-red-50 border-red-400 text-red-800",
  info: "bg-blue-50 border-blue-400 text-blue-800",
  warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
};

export default function NotificationToast() {
  const { notifications, dismiss } = useNotification();

  if (!notifications.length) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map(({ id, message, type }) => (
        <div
          key={id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md text-sm
            ${TYPE_STYLES[type] || TYPE_STYLES.info}`}
        >
          <span className="flex-1">{message}</span>
          <button
            onClick={() => dismiss(id)}
            className="text-current opacity-60 hover:opacity-100 text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
