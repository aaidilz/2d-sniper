
// Konfigurasi untuk efek recoil dan shake
export const RECOIL_POWER = 50; // default: 30 (semakin besar semakin tinggi hentakan)
export const RECOIL_SIDE = 30;  // default: 20 (acak ke samping)
export const RECOIL_UP_VARIANCE = 100; // variasi acak ke atas

export const SHAKE_X = 2;      // amplitudo shake X
export const SHAKE_Y = 1.5;    // amplitudo shake Y
export const SHAKE_SPEED = 0.025; // kecepatan shake (semakin besar semakin cepat)

// Screen shake config
export const SCREEN_SHAKE_POWER = 20; // kekuatan shake
export const SCREEN_SHAKE_DECAY = 1; // decay per frame (0.88 = cepat hilang, 0.95 = lebih lama)

// Screen shake khusus saat reload/cocking
export const SCREEN_SHAKE_POWER_RELOAD = 8; // kekuatan shake reload
export const SCREEN_SHAKE_DECAY_RELOAD = 0.93; // decay reload
export const RELOAD_ROTATE = 5; // derajat rotasi maksimal saat reload
export const RELOAD_ZOOM = 1.12; // zoom maksimal saat reload