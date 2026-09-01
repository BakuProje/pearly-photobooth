import { PhotoboothTemplate, FilterType } from './types';

export const TEMPLATES: PhotoboothTemplate[] = [
  {
    id: 'template-1',
    name: 'Template 1',
    category: 'Y2K Digicam',
    imageSrc: '/images/template/template 1.png',
    requiredPhotos: 4,
    aspectRatio: '1080 / 1350',
    description: 'Cyber Digital Camera (4 Layar Display)',
    slots: [
      { x: 0, y: 11.2, width: 38.0, height: 32.8, label: 'Kamera Kiri Atas' },
      { x: 69.8, y: 20.0, width: 25.8, height: 25.6, label: 'Kamera Kanan Atas' },
      { x: 3.8, y: 64.6, width: 26.2, height: 26.0, label: 'Kamera Kiri Bawah' },
      { x: 43.2, y: 56.4, width: 49.6, height: 31.8, label: 'Kamera Kanan Bawah' },
    ],
  },
  {
    id: 'template-2',
    name: 'Template 2',
    category: 'Twin Strip',
    imageSrc: '/images/template/template 2.png',
    requiredPhotos: 6,
    aspectRatio: '1023 / 1537',
    description: 'Format Twin Strip (Mutiara & Checkered)',
    slots: [
      // Left pearl strip (3 photos)
      { x: 7.6, y: 9.4, width: 34.7, height: 22.7, borderRadius: 8, label: 'Mutiara #1' },
      { x: 7.6, y: 37.4, width: 34.7, height: 22.7, borderRadius: 8, label: 'Mutiara #2' },
      { x: 7.6, y: 65.9, width: 34.7, height: 22.7, borderRadius: 8, label: 'Mutiara #3' },
      // Right beige cherry strip (3 photos)
      { x: 58.4, y: 7.9, width: 33.7, height: 21.2, borderRadius: 4, label: 'Cherry #1' },
      { x: 58.4, y: 38.9, width: 33.7, height: 21.2, borderRadius: 4, label: 'Cherry #2' },
      { x: 58.4, y: 68.4, width: 33.7, height: 21.2, borderRadius: 4, label: 'Cherry #3' },
    ],
  },
  {
    id: 'template-3',
    name: 'Template 3',
    category: 'Newspaper',
    imageSrc: '/images/template/template 3.png',
    requiredPhotos: 4,
    aspectRatio: '1023 / 1537',
    description: 'Koran Vintage (1 Hero + 3 Mini)',
    slots: [
      { x: 18.2, y: 34.0, width: 63.5, height: 28.5, label: 'Hero Utama' },
      { x: 18.2, y: 64.2, width: 19.8, height: 13.5, label: 'Mini Kiri' },
      { x: 40.1, y: 64.2, width: 19.8, height: 13.5, label: 'Mini Tengah' },
      { x: 62.0, y: 64.2, width: 19.8, height: 13.5, label: 'Mini Kanan' },
    ],
  },
  {
    id: 'template-4',
    name: 'Template 4',
    category: 'Newspaper',
    imageSrc: '/images/template/template 4.png',
    requiredPhotos: 6,
    aspectRatio: '1023 / 1537',
    description: 'Koran Aesthetic (Grid 2x3)',
    slots: [
      { x: 4.8, y: 18.2, width: 43.6, height: 20.0, label: '#1' },
      { x: 51.6, y: 18.2, width: 43.6, height: 20.0, label: '#2' },
      { x: 4.8, y: 41.6, width: 43.6, height: 20.0, label: '#3' },
      { x: 51.6, y: 41.6, width: 43.6, height: 20.0, label: '#4' },
      { x: 4.8, y: 64.8, width: 43.6, height: 20.0, label: '#5' },
      { x: 51.6, y: 64.8, width: 43.6, height: 20.0, label: '#6' },
    ],
  },
  {
    id: 'template-5',
    name: 'Template 5',
    category: 'Twin Strip',
    imageSrc: '/images/template/template 5.png',
    requiredPhotos: 6,
    aspectRatio: '1333 / 1999',
    description: 'Tiket Bioskop Retro (Twin Strip 6 Pose)',
    slots: [
      // Left ticket strip (3 photos)
      { x: 4.1, y: 18.7, width: 41.2, height: 21.4, borderRadius: 28, label: 'Tiket Kiri 1' },
      { x: 4.1, y: 40.8, width: 41.2, height: 21.4, borderRadius: 28, label: 'Tiket Kiri 2' },
      { x: 4.1, y: 62.9, width: 41.2, height: 21.4, borderRadius: 28, label: 'Tiket Kiri 3' },
      // Right ticket strip (3 photos)
      { x: 54.6, y: 18.7, width: 41.2, height: 21.4, borderRadius: 28, label: 'Tiket Kanan 1' },
      { x: 54.6, y: 40.8, width: 41.2, height: 21.4, borderRadius: 28, label: 'Tiket Kanan 2' },
      { x: 54.6, y: 62.9, width: 41.2, height: 21.4, borderRadius: 28, label: 'Tiket Kanan 3' },
    ],
  },
  {
    id: 'template-6',
    name: 'Template 6',
    category: 'Y2K Digicam',
    imageSrc: '/images/template/template 6.png',
    requiredPhotos: 1,
    aspectRatio: '1080 / 1350',
    description: 'Kamera Digital Aesthetic (1 Foto Utama)',
    slots: [
      { x: 17.5, y: 36.7, width: 45.9, height: 27.6, rotation: -2.8, borderRadius: 6, label: 'Layar Kamera' },
    ],
  },
  {
    id: 'template-7',
    name: 'Template 7',
    category: 'Newspaper',
    imageSrc: '/images/template/template 7.png',
    requiredPhotos: 3,
    aspectRatio: '1333 / 1999',
    description: 'Koran Rimberio Studio (Potret Kebersamaan)',
    slots: [
      { x: 2.8, y: 34.4, width: 94.4, height: 28.5, label: 'Hero Utama' },
      { x: 38.0, y: 66.2, width: 24.0, height: 12.0, label: 'Foto Tengah' },
      { x: 2.0, y: 80.2, width: 30.6, height: 18.6, label: 'Foto Bawah Kiri' },
    ],
  },
  {
    id: 'template-8',
    name: 'Template 8',
    category: 'Newspaper',
    imageSrc: '/images/template/template 8.png',
    requiredPhotos: 3,
    aspectRatio: '1333 / 1999',
    description: 'Koran Harian Inspirasi (Kisah Dua Hati)',
    slots: [
      { x: 38.3, y: 34.4, width: 58.8, height: 30.6, label: 'Hero Kanan' },
      { x: 3.0, y: 70.1, width: 29.3, height: 18.8, label: 'Bawah Kiri' },
      { x: 68.0, y: 70.1, width: 29.3, height: 18.8, label: 'Bawah Kanan' },
    ],
  },
  {
    id: 'template-9',
    name: 'Template 9',
    category: 'Twin Strip',
    imageSrc: '/images/template/template 9.png',
    requiredPhotos: 6,
    aspectRatio: '1333 / 1999',
    description: 'Spotify Playlist Twin Strip (6 Pose)',
    slots: [
      // Left music strip (3 photos)
      { x: 5.2, y: 11.1, width: 41.3, height: 20.0, borderRadius: 24, label: 'Lagu Kiri 1' },
      { x: 5.2, y: 32.2, width: 41.3, height: 20.0, borderRadius: 24, label: 'Lagu Kiri 2' },
      { x: 5.2, y: 53.3, width: 41.3, height: 20.0, borderRadius: 24, label: 'Lagu Kiri 3' },
      // Right music strip (3 photos)
      { x: 53.6, y: 11.1, width: 41.3, height: 20.0, borderRadius: 24, label: 'Lagu Kanan 1' },
      { x: 53.6, y: 32.2, width: 41.3, height: 20.0, borderRadius: 24, label: 'Lagu Kanan 2' },
      { x: 53.6, y: 53.3, width: 41.3, height: 20.0, borderRadius: 24, label: 'Lagu Kanan 3' },
    ],
  },
  {
    id: 'template-10',
    name: 'Template 10',
    category: 'Twin Strip',
    imageSrc: '/images/template/template 10.png',
    requiredPhotos: 7,
    aspectRatio: '1333 / 1999',
    description: 'Denim & Prangko (4 Browser + 3 Prangko)',
    slots: [
      // Left strip (4 browser window contents)
      { x: 10.1, y: 6.9, width: 35.5, height: 18.2, borderRadius: 6, label: 'Browser 1' },
      { x: 10.0, y: 30.9, width: 35.6, height: 18.0, borderRadius: 6, label: 'Browser 2' },
      { x: 10.2, y: 55.0, width: 35.5, height: 18.0, borderRadius: 6, label: 'Browser 3' },
      { x: 10.2, y: 78.2, width: 35.5, height: 18.1, borderRadius: 6, label: 'Browser 4' },
      // Right strip (3 postage stamps)
      { x: 61.8, y: 5.0, width: 29.4, height: 22.5, borderRadius: 4, label: 'Prangko 1' },
      { x: 61.8, y: 34.4, width: 29.4, height: 22.5, borderRadius: 4, label: 'Prangko 2' },
      { x: 61.8, y: 63.7, width: 29.4, height: 22.5, borderRadius: 4, label: 'Prangko 3' },
    ],
  },
  {
    id: 'template-11',
    name: 'Template 11',
    category: 'Story 9:16',
    imageSrc: '/images/template/template 11.png',
    requiredPhotos: 4,
    aspectRatio: '1080 / 1920',
    description: 'Glass Tile Story (4 Pose Strip Vertikal)',
    slots: [
      { x: 37.8, y: 10.7, width: 24.4, height: 18.5, label: 'Pose #1' },
      { x: 37.8, y: 30.6, width: 24.4, height: 18.5, label: 'Pose #2' },
      { x: 37.8, y: 50.6, width: 24.4, height: 18.5, label: 'Pose #3' },
      { x: 37.8, y: 70.6, width: 24.4, height: 18.5, label: 'Pose #4' },
    ],
  },
  {
    id: 'template-12',
    name: 'Template 12',
    category: 'Minimalist',
    imageSrc: '/images/template/template 12.png',
    requiredPhotos: 1,
    aspectRatio: '1080 / 1350',
    description: 'My Favorite Starry Clipboard (1 Foto Utama)',
    slots: [
      { x: 18.7, y: 23.0, width: 61.5, height: 52.8, borderRadius: 4, label: 'Foto Favorit' },
    ],
  },
];

export const FILTERS: { id: FilterType; name: string; cssFilter: string; desc: string }[] = [
  {
    id: 'normal',
    name: 'Natural',
    cssFilter: 'none',
    desc: 'Warna asli natural'
  },
  {
    id: 'white-glow',
    name: 'Putih Glowing',
    cssFilter: 'brightness(1.18) contrast(1.04) saturate(1.08) hue-rotate(-2deg)',
    desc: 'Wajah tampak putih, cerah & glowing bersinar'
  },
  {
    id: 'snow-white',
    name: 'Snow White',
    cssFilter: 'brightness(1.22) contrast(1.08) saturate(0.96)',
    desc: 'Efek memutihkan kulit wajah secara maksimal & mulus'
  },
  {
    id: 'porcelain',
    name: 'Porcelain Skin',
    cssFilter: 'brightness(1.15) contrast(1.12) saturate(1.12) hue-rotate(-4deg)',
    desc: 'Kulit putih halus seperti porselen & merona'
  },
  {
    id: 'korean-glow',
    name: 'Korean Glow',
    cssFilter: 'brightness(1.08) contrast(0.96) saturate(1.15) hue-rotate(-3deg)',
    desc: 'Kulit glowing & cerah khas Korea'
  },
  {
    id: 'korean-clean',
    name: 'K-Beauty Clean',
    cssFilter: 'brightness(1.12) contrast(1.02) saturate(1.08)',
    desc: 'Filter bersih & tone cerah estetik'
  },
  {
    id: 'korean-film',
    name: 'Korean Film',
    cssFilter: 'brightness(1.06) contrast(1.1) saturate(1.22) sepia(0.12)',
    desc: 'Tone film lembut estetik Seoul'
  },
  {
    id: 'vintage',
    name: 'Vintage 90s',
    cssFilter: 'sepia(0.25) contrast(1.12) brightness(1.05) saturate(1.2)',
    desc: 'Nuansa hangat film analog'
  },
  {
    id: 'mono',
    name: 'Noir Mono',
    cssFilter: 'grayscale(1) contrast(1.25) brightness(0.98)',
    desc: 'Hitam putih klasik kontras'
  },
  {
    id: 'pastel',
    name: 'Soft Pastel',
    cssFilter: 'brightness(1.1) contrast(0.94) saturate(1.2) hue-rotate(-5deg)',
    desc: 'Warna lembut & cerah'
  },
  {
    id: 'sunset',
    name: 'Golden Hour',
    cssFilter: 'sepia(0.2) saturate(1.35) brightness(1.08) hue-rotate(-12deg)',
    desc: 'Cahaya hangat matahari'
  },
  {
    id: 'cyberpunk',
    name: 'Cyber Sky',
    cssFilter: 'hue-rotate(190deg) contrast(1.15) saturate(1.3)',
    desc: 'Aksen biru neon futuristik'
  },
  {
    id: 'sepia',
    name: 'Antique Sepia',
    cssFilter: 'sepia(0.8) contrast(1.08) brightness(0.96)',
    desc: 'Klasik antik vintage'
  },
  {
    id: 'dramatic',
    name: 'Cinematic',
    cssFilter: 'contrast(1.3) saturate(1.15) brightness(0.92)',
    desc: 'Sinematik kontras tegas'
  }
];

export const STICKER_LIBRARY = [
  { category: 'Cute & Anime', items: ['✨', '💖', '⭐', '🎀', '🌸', '🐱', '🐰', '🍓', '🍰', '🍡'] },
  { category: 'Photobooth / Fun', items: ['📸', '🕶️', '👑', '🎉', '🦋', '💫', '💿', '⚡', '🍒', '🫧'] },
  { category: 'Cute Badges', items: ['SNAPBOOTH 📸', 'SMILE 😊', 'BESTIES 👯‍♀️', 'LOVE U ❤️', 'MEMORIES ✨', 'CUTE AF 💖', 'DATE NIGHT 🌙', 'HAPPY DAY ☀️'] }
];
