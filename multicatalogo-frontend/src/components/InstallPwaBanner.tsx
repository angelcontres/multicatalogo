// src/components/InstallPwaBanner.tsx
// Componente accesible para sugerir la instalación de la PWA en móviles y escritorio
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    // Si el usuario ya rechazó la instalación en esta sesión, no insistir
    if (sessionStorage.getItem('pwa_prompt_dismissed') === 'true') {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setVisible(false);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      console.log('[PWA] Usuario aceptó instalar MultiCatálogo.');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Aviso de instalación de aplicación"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 backdrop-blur-md transition-all duration-300 animate-slide-up"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white tracking-wide">
            Instalar MultiCatálogo
          </h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            Accede rápidamente desde tu pantalla de inicio y navega el catálogo incluso sin conexión a internet.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleInstall}
              type="button"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Instalar App
            </button>
            <button
              onClick={handleDismiss}
              type="button"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          type="button"
          aria-label="Cerrar aviso"
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </aside>
  );
};
