import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';

/**
// Basic
<Alert message="Your session will expire in 2 minutes." />

// With title and different tone
<Alert
  type="error"
  title="Couldn’t save changes"
  message="Please check your internet connection and try again."
/>

// Custom content + onClose
<Alert
  type="success"
  title="All set!"
  message={<span>Profile updated. <a className="underline" href="/profile">View profile</a></span>}
  onClose={() => console.log('Alert closed')}
/>

// Props:
// placement?: 'local' | 'global' (default 'local'). When 'local', the banner is `sticky top-0` inside the calling component; when 'global', it uses `fixed` at the app top.
 */
export default function Alert({
  message,
  title = 'Attention needed',
  type = 'warning',
  onClose,
  className = '',
  placement = 'local', // 'local' | 'global'
}) {
  const location = useLocation();
  const [open, setOpen] = useState(Boolean(message));
  const [mounted, setMounted] = useState(false);

  // Close when route changes
  useEffect(() => {
    if (mounted) {
      setOpen(false);
    } else {
      setMounted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, location.hash]);

  // Open/close when message changes
  useEffect(() => {
    setOpen(Boolean(message));
  }, [message]);

  const TONES = {
    info:
      'bg-blue-50 text-blue-800 border-blue-200 ' +
      'dark:bg-blue-700/40 dark:text-blue-50 dark:border-blue-600 dark:ring-1 dark:ring-white/10',
    success:
      'bg-green-50 text-green-800 border-green-200 ' +
      'dark:bg-green-700/40 dark:text-green-50 dark:border-green-600 dark:ring-1 dark:ring-white/10',
    warning:
      'bg-yellow-50 text-yellow-800 border-yellow-200 ' +
      'dark:bg-yellow-700/40 dark:text-yellow-50 dark:border-yellow-600 dark:ring-1 dark:ring-white/10',
    error:
      'bg-red-50 text-red-800 border-red-200 ' +
      'dark:bg-red-700/40 dark:text-red-50 dark:border-red-600 dark:ring-1 dark:ring-white/10',
  };

  // Choose an icon (keeping Exclamation for all to avoid extra deps)
  const Icon = ExclamationTriangleIcon;

  const tone = TONES[type] || TONES.warning;

  const handleClose = () => {
    setOpen(false);
    if (onClose) onClose();
  };

  if (!open) return null;
  if (!message) return null;

  return (
    // When placement is 'local', banner is sticky top-0 inside the calling component so it doesn't cover global navbar
    <div
      className={
        `${placement === 'global'
          ? 'fixed inset-x-0 top-0 z-50'
          : 'sticky top-0 z-40 w-full'} flex justify-center px-3 pt-3 ${className}`
      }
      role="region"
      aria-label="Application alerts"
    >
      <div
        role="alert"
        aria-live="assertive"
        className={
          // card styles + enter animation
          `border rounded-md w-full max-w-2xl shadow-sm ${tone} ` +
          `transition-all duration-300 ease-out ` +
          `translate-y-[-12px] opacity-0 animate-[fadeSlideDown_300ms_ease-out_forwards]`
        }
      >
        <div className="flex p-4">
          <div className="shrink-0">
            <Icon aria-hidden="true" className="size-5 text-current" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            {title && (
              <h3 className="text-sm font-medium">{title}</h3>
            )}
            <div className="mt-1 text-sm/5 break-words">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>
          <div className="ml-3 -mr-1">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current/40 hover:opacity-80"
              aria-label="Dismiss alert"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Keyframes for fade/slide-in */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
