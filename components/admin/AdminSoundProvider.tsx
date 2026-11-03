'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { playSfx, isSfxMuted, setSfxMuted, toggleSfxMute, SoundType } from '@/lib/audio/sfx';
import { goeyToast } from 'goey-toast';

interface AdminSoundContextType {
  playSfx: (type: SoundType) => void;
  isMuted: boolean;
  toggleMute: () => boolean;
  setMuted: (muted: boolean) => void;
}

const AdminSoundContext = createContext<AdminSoundContextType>({
  playSfx,
  isMuted: false,
  toggleMute: toggleSfxMute,
  setMuted: setSfxMuted,
});

export const useAdminSound = () => useContext(AdminSoundContext);

export function AdminSoundProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMutedState] = useState<boolean>(false);

  useEffect(() => {
    setMutedState(isSfxMuted());

    const handleMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      setMutedState(customEvent.detail?.muted ?? isSfxMuted());
    };

    window.addEventListener('admin-sfx-mute-changed', handleMuteChange);
    return () => {
      window.removeEventListener('admin-sfx-mute-changed', handleMuteChange);
    };
  }, []);

  const handleToggleMute = useCallback(() => {
    const next = toggleSfxMute();
    setMutedState(next);
    return next;
  }, []);

  const handleSetMuted = useCallback((val: boolean) => {
    setSfxMuted(val);
    setMutedState(val);
  }, []);

  // Hook into goeyToast.success & goeyToast.error to play cheerful audio feedback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Preserve original methods
    const originalSuccess = goeyToast.success;
    const originalError = goeyToast.error;

    // Wrap goeyToast methods with audio triggers
    goeyToast.success = (...args: Parameters<typeof originalSuccess>) => {
      playSfx('success');
      return originalSuccess(...args);
    };

    goeyToast.error = (...args: Parameters<typeof originalError>) => {
      playSfx('error');
      return originalError(...args);
    };

    return () => {
      goeyToast.success = originalSuccess;
      goeyToast.error = originalError;
    };
  }, []);

  // Global delegated click & drop interaction sounds across the admin panel
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>(
        'button, a, input[type="checkbox"], input[type="radio"], select, [role="button"], [role="tab"], [data-sfx]'
      );

      if (!target) return;

      // Explicitly disabled SFX
      const sfxAttr = target.getAttribute('data-sfx');
      if (sfxAttr === 'none') return;

      // Explicit sound requested via attribute
      if (sfxAttr && sfxAttr !== 'true') {
        playSfx(sfxAttr as SoundType);
        return;
      }

      // Checkbox / Radio toggles
      if (target instanceof HTMLInputElement) {
        if (target.type === 'checkbox' || target.type === 'radio') {
          playSfx(target.checked ? 'toggle-on' : 'toggle-off');
          return;
        }
      }

      const text = (target.textContent || '').toLowerCase();
      const title = (target.getAttribute('title') || '').toLowerCase();
      const ariaLabel = (target.getAttribute('aria-label') || '').toLowerCase();
      const combined = `${text} ${title} ${ariaLabel}`;

      // Navigation links in sidebar
      if (target.tagName.toLowerCase() === 'a' && target.closest('nav')) {
        playSfx('nav');
        return;
      }

      // Delete / Trash / Remove
      if (
        combined.includes('hapus') ||
        combined.includes('delete') ||
        combined.includes('trash') ||
        combined.includes('batal') ||
        target.classList.contains('text-red-400') ||
        target.classList.contains('bg-red-500')
      ) {
        playSfx('delete');
        return;
      }

      // Export / Download / Cetak
      if (
        combined.includes('export') ||
        combined.includes('download') ||
        combined.includes('unduh') ||
        combined.includes('cetak') ||
        combined.includes('print')
      ) {
        playSfx('download');
        return;
      }

      // Tabs / Pills
      if (
        target.getAttribute('role') === 'tab' ||
        target.classList.contains('tab') ||
        combined.includes('minggu ini') ||
        combined.includes('minggu')
      ) {
        playSfx('tab');
        return;
      }

      // Default cheerful button/interactive click
      playSfx('click');
    };

    const handleDrop = (e: DragEvent) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        playSfx('drop');
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    document.addEventListener('drop', handleDrop, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('drop', handleDrop, { capture: true });
    };
  }, []);

  return (
    <AdminSoundContext.Provider
      value={{
        playSfx,
        isMuted: muted,
        toggleMute: handleToggleMute,
        setMuted: handleSetMuted,
      }}
    >
      {children}
    </AdminSoundContext.Provider>
  );
}
