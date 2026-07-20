import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Check, Info } from "lucide-react";
import { Notification } from "../api/notifications";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants/routes";

import { useAuth } from "@/providers/AuthProvider";

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export default function NotificationDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: NotificationDropdownProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    onClose();
    if ((notification as any).link) {
      router.push((notification as any).link);
    } else if (user?.role === "ASTROLOGER" || user?.role === "ADMIN") {
      router.push("/astrologer/dashboard");
    } else {
      router.push(ROUTES.CONSULTATIONS);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-[#1C1A17]/95 backdrop-blur-xl rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] border border-white/[0.06] py-2 z-50 overflow-hidden flex flex-col max-h-[80vh]">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between sticky top-0 bg-[#1C1A17]/95 backdrop-blur-xl z-10">
        <h3 className="text-sm font-semibold text-white">Notifications</h3>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllRead();
            }}
            className="text-xs text-[#C8A04A] hover:text-[#D4AC5A] flex items-center gap-1 transition-colors font-medium"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 p-1">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center flex flex-col items-center justify-center text-white/40">
            <Info className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg transition-all duration-200 border-l-2 font-poppins relative group",
                  notification.isRead
                    ? "border-transparent hover:bg-white/[0.03]"
                    : "border-[#C8A04A] bg-[#071B8D]/10 hover:bg-[#071B8D]/20"
                )}
              >
                {!notification.isRead && (
                  <span className="absolute top-3.5 right-4 w-2 h-2 rounded-full bg-[#C8A04A]" />
                )}
                <div className="pr-4">
                  <p
                    className={cn(
                      "text-sm mb-1 truncate transition-colors",
                      notification.isRead ? "text-white/70" : "text-white font-medium"
                    )}
                  >
                    {notification.title}
                  </p>
                  <p
                    className={cn(
                      "text-xs line-clamp-2 transition-colors",
                      notification.isRead ? "text-white/40" : "text-white/60"
                    )}
                  >
                    {notification.body}
                  </p>
                  <span className="block mt-2 text-[10px] text-[#C8A04A]/60 font-medium">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
