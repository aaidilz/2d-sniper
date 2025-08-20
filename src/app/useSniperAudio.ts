import { useCallback, useEffect, useRef, useState } from 'react';

export type SniperState = 'idle' | 'shot' | 'reloading';

interface UseSniperAudioOptions {
  reloadDelayAfterShot?: number; // jeda sebelum suara reload mulai (ms)
  forceReloadDelay?: number; // fallback kalau event 'ended' tidak terpicu
  postReloadIdleDelay?: number; // jeda setelah reload selesai sebelum balik ke idle (ms)
}

interface UseSniperAudioReturn {
  state: SniperState;
  fire: () => void;
  ready: boolean; // apakah audio siap (sudah pernah ada user interaction)
  updateTimings: (t: Partial<UseSniperAudioOptions>) => void; // ubah timing runtime
  timings: Required<UseSniperAudioOptions>; // nilai timing aktif
}

// Hook state machine audio: shot -> (delay) -> reloading -> (optional post delay) -> idle
export function useSniperAudio(initialOptions: UseSniperAudioOptions = {}): UseSniperAudioReturn {
  const defaults: Required<UseSniperAudioOptions> = {
    reloadDelayAfterShot: initialOptions.reloadDelayAfterShot ?? 1000,
    forceReloadDelay: initialOptions.forceReloadDelay ?? 6000,
    postReloadIdleDelay: initialOptions.postReloadIdleDelay ?? 0,
  };

  const [state, setState] = useState<SniperState>('idle');
  const [ready, setReady] = useState(false);
  const [timingsState, setTimingsState] = useState(defaults);

  // Refs agar closure selalu dapat timing terbaru tanpa re-create handler
  const timingsRef = useRef(timingsState);
  useEffect(() => { timingsRef.current = timingsState; }, [timingsState]);

  const shotRef = useRef<HTMLAudioElement | null>(null);
  const reloadRef = useRef<HTMLAudioElement | null>(null);
  const timers = useRef<number[]>([]);

  const setManagedTimeout = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  // Inisialisasi audio sekali
  useEffect(() => {
    shotRef.current = new Audio('/sfx/sniper-shot.mp3');
    reloadRef.current = new Audio('/sfx/reload.mp3');
    // Pastikan tidak loop
    if (shotRef.current) shotRef.current.loop = false;
    if (reloadRef.current) reloadRef.current.loop = false;

    const s = shotRef.current;
    const r = reloadRef.current;

    const handleReloadEnded = () => {
      const { postReloadIdleDelay } = timingsRef.current;
      if (postReloadIdleDelay > 0) {
        setManagedTimeout(() => setState('idle'), postReloadIdleDelay);
      } else {
        setState('idle');
      }
    };
    r?.addEventListener('ended', handleReloadEnded);

    return () => {
      r?.removeEventListener('ended', handleReloadEnded);
      // Clear timers
      timers.current.forEach(id => window.clearTimeout(id));
      timers.current = [];
      s?.pause();
      r?.pause();
    };
  }, [setManagedTimeout]);

  const updateTimings = useCallback((t: Partial<UseSniperAudioOptions>) => {
    setTimingsState(prev => ({ ...prev, ...t }));
  }, []);

  const fire = useCallback(() => {
    if (state !== 'idle') return; // blokir spam
    const shot = shotRef.current;
    const reload = reloadRef.current;
    if (!shot || !reload) return;

    // Unlock audio context di interaksi pertama
    if (!ready) setReady(true);

    const { reloadDelayAfterShot, forceReloadDelay } = timingsRef.current;

    // Mulai siklus
    setState('shot');
    try {
      shot.currentTime = 0;
      shot.play();
    } catch {}

    // Setelah jeda tertentu mulai reload
    setManagedTimeout(() => {
      setState('reloading');
      try {
        reload.currentTime = 0;
        reload.play();
      } catch {}
      // Fallback paksa balik ke idle kalau 'ended' tidak pernah datang
      setManagedTimeout(() => {
        setState(prev => (prev === 'reloading' ? 'idle' : prev));
      }, forceReloadDelay);
    }, reloadDelayAfterShot);
  }, [ready, setManagedTimeout, state]);

  return { state, fire, ready, updateTimings, timings: timingsState };
}
