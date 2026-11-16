import Swal, { SweetAlertOptions } from 'sweetalert2';

/**
 * Mero Kagaz — Unified Toast & Alert Widget powered by SweetAlert2
 * Styled with brand colors, Outfit typography, and smooth animations.
 */

// ─── 1. Reusable Top-Right Toast Mixin ────────────────────────────────────────
const ToastMixin = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
  customClass: {
    popup: 'mk-swal-toast',
    title: 'mk-swal-toast-title',
  },
});

export const toast = {
  success: (message: string, title?: string) => {
    return ToastMixin.fire({
      icon: 'success',
      title: title || message,
      text: title ? message : undefined,
      iconColor: '#18A999',
    });
  },

  error: (message: string, title?: string) => {
    return ToastMixin.fire({
      icon: 'error',
      title: title || message,
      text: title ? message : undefined,
      iconColor: '#E11D48',
    });
  },

  warning: (message: string, title?: string) => {
    return ToastMixin.fire({
      icon: 'warning',
      title: title || message,
      text: title ? message : undefined,
      iconColor: '#F4B942',
    });
  },

  info: (message: string, title?: string) => {
    return ToastMixin.fire({
      icon: 'info',
      title: title || message,
      text: title ? message : undefined,
      iconColor: '#123B5D',
    });
  },
};

// ─── 2. Interactive Dialogs & Confirmation Modals ─────────────────────────────
export const alertModal = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonText: 'ठिक छ / OK',
      confirmButtonColor: '#18A999',
      customClass: {
        popup: 'mk-swal-modal',
      },
    });
  },

  error: (title: string, text?: string) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: 'बन्द गर्नुहोस् / Close',
      confirmButtonColor: '#123B5D',
      customClass: {
        popup: 'mk-swal-modal',
      },
    });
  },

  confirm: async (
    title: string,
    text?: string,
    confirmText = 'पक्का छ / Confirm',
    cancelText = 'रद्द / Cancel',
  ): Promise<boolean> => {
    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#18A999',
      cancelButtonColor: '#64748B',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      customClass: {
        popup: 'mk-swal-modal',
      },
    });

    return result.isConfirmed;
  },
};

export default toast;
