import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium transition-all animate-fade-in ${
              isSuccess
                ? 'bg-white border-[#C5E6CC] text-[#1B5E20]'
                : isError
                ? 'bg-white border-[#F87171] text-[#B3261E]'
                : isWarning
                ? 'bg-white border-[#FBBF24] text-[#A66A00]'
                : 'bg-white border-[#C5E6CC] text-[#17201A]'
            }`}
          >
            {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-5 h-5 text-[#B3261E] shrink-0 mt-0.5" />}
            {isWarning && <AlertTriangle className="w-5 h-5 text-[#A66A00] shrink-0 mt-0.5" />}
            {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />}

            <div className="flex-1 leading-snug">{toast.message}</div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#526158] hover:text-[#17201A] p-0.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
