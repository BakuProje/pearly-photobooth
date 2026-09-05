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
      { x: 2.65, y: 33.75, width: 94.65, height: 27.9, label: 'Hero Utama' },
      { x: 37.8, y: 65.0, width: 24.3, height: 11.9, label: 'Foto Tengah' },
      { x: 1.9, y: 78.6, width: 30.95, height: 18.9, label: 'Foto Bawah Kiri' },
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
      { x: 38.05, y: 33.55, width: 59.2, height: 29.85, label: 'Hero Kanan' },
      { x: 3.0, y: 68.45, width: 29.35, height: 18.7, label: 'Bawah Kiri' },
      { x: 67.8, y: 68.45, width: 29.4, height: 18.7, label: 'Bawah Kanan' },
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
  {
    id: 'template-13',
    name: 'Template 13',
    category: 'Aesthetic Board',
    imageSrc: '/images/template/template 13.png',
    requiredPhotos: 4,
    aspectRatio: '1080 / 1920',
    description: 'Dark Film Board (4 Pose Aesthetic)',
    slots: [
      { x: 18.5, y: 23.4, width: 33.2, height: 23.9, rotation: 4.4, borderRadius: 4, label: '#1 Kiri Atas' },
      { x: 54.0, y: 26.1, width: 30.0, height: 22.5, rotation: 4.4, borderRadius: 4, label: '#2 Kanan Atas' },
      { x: 17.8, y: 46.9, width: 33.1, height: 24.3, rotation: 4.3, borderRadius: 4, label: '#3 Kiri Bawah' },
      { x: 50.6, y: 48.4, width: 30.4, height: 23.9, rotation: 4.4, borderRadius: 4, label: '#4 Kanan Bawah' },
    ],
  },
  {
    id: 'template-14',
    name: 'Template 14',
    category: 'Y2K Digicam',
    imageSrc: '/images/template/template 14.png',
    requiredPhotos: 1,
    aspectRatio: '1080 / 1920',
    description: 'Y2K Pink Digicam (1 Foto Utama)',
    slots: [
      { x: 32.9, y: 30.9, width: 38.1, height: 26.6, rotation: -6.5, borderRadius: 8, label: 'Layar Kamera' },
    ],
  },
  {
    id: 'template-15',
    name: 'Template 15',
    category: 'Scrapbook',
    imageSrc: '/images/template/template 15.png',
    requiredPhotos: 5,
    aspectRatio: '1080 / 1920',
    description: 'Denim Star Scrapbook (5 Pose Mix)',
    slots: [
      { x: 3.3, y: 13.9, width: 58.0, height: 31.8, borderRadius: 4, label: 'Hero Atas' },
      { x: 16.9, y: 58.2, width: 30.7, height: 26.1, borderRadius: 4, label: 'Foto Bawah' },
      { x: 70.9, y: 47.0, width: 22.6, height: 12.8, borderRadius: 4, label: 'Strip 1' },
      { x: 70.9, y: 62.4, width: 22.6, height: 12.8, borderRadius: 4, label: 'Strip 2' },
      { x: 70.9, y: 77.9, width: 22.6, height: 12.8, borderRadius: 4, label: 'Strip 3' },
    ],
  },
  {
    id: 'template-16',
    name: 'Template 16',
    category: 'Filmstrip',
    imageSrc: '/images/template/template 16.png',
    requiredPhotos: 3,
    aspectRatio: '600 / 1800',
    description: 'Spiral Photobooth Strip (3 Pose Vertikal)',
    slots: [
      { x: 19.0, y: 2.5, width: 73.0, height: 24.3, borderRadius: 4, label: 'Foto #1 (Atas)' },
      { x: 19.0, y: 28.9, width: 73.0, height: 24.3, borderRadius: 4, label: 'Foto #2 (Tengah)' },
      { x: 19.0, y: 55.2, width: 73.0, height: 24.3, borderRadius: 4, label: 'Foto #3 (Bawah)' },
    ],
  },
  {
    id: 'template-17',
    name: 'Template 17',
    category: 'Polaroid',
    imageSrc: '/images/template/template 17.png',
    requiredPhotos: 6,
    aspectRatio: '1333 / 2000',
    description: 'Vintage Polaroid & Strip (6 Pose Scrapbook)',
    slots: [
      { x: 18.2, y: 3.0, width: 30.2, height: 20.0, rotation: 3.8, borderRadius: 2, label: 'Polaroid 1 (Atas Kiri)' },
      { x: 9.0, y: 30.8, width: 33.6, height: 22.0, rotation: -1.2, borderRadius: 2, label: 'Polaroid 2 (Tengah Kiri)' },
      { x: 4.2, y: 64.8, width: 32.6, height: 21.6, rotation: -11.3, borderRadius: 2, label: 'Polaroid 3 (Bawah Kiri)' },
      { x: 55.4, y: 7.6, width: 36.8, height: 27.6, rotation: 8.4, borderRadius: 2, label: 'Strip 1 (Atas Kanan)' },
      { x: 49.2, y: 35.8, width: 36.8, height: 27.6, rotation: 8.4, borderRadius: 2, label: 'Strip 2 (Tengah Kanan)' },
      { x: 42.9, y: 64.0, width: 36.8, height: 27.6, rotation: 8.4, borderRadius: 2, label: 'Strip 3 (Bawah Kanan)' },
    ],
  },
  {
    id: 'template-18',
    name: 'Template 18',
    category: 'Minimalist',
    imageSrc: '/images/template/template 18.png',
    requiredPhotos: 5,
    aspectRatio: '1333 / 2000',
    description: 'Minimalist Clean Strip (5 Pose Asymmetric)',
    slots: [
      { x: 11.4, y: 7.6, width: 27.0, height: 25.8, borderRadius: 4, label: 'Kiri 1' },
      { x: 11.4, y: 37.0, width: 27.0, height: 25.8, borderRadius: 4, label: 'Kiri 2' },
      { x: 11.4, y: 66.4, width: 27.0, height: 25.8, borderRadius: 4, label: 'Kiri 3' },
      { x: 44.4, y: 5.4, width: 43.5, height: 42.0, borderRadius: 4, label: 'Kanan Atas' },
      { x: 44.4, y: 52.4, width: 43.5, height: 42.0, borderRadius: 4, label: 'Kanan Bawah' },
    ],
  },
  {
    id: 'template-19',
    name: 'Template 19',
    category: 'Twin Strip',
    imageSrc: '/images/template/template 19.png',
    requiredPhotos: 6,
    aspectRatio: '1333 / 2000',
    description: 'Orange Sunny Strip (Twin Strip 6 Pose)',
    slots: [
      { x: 6.9, y: 7.8, width: 39.9, height: 23.2, borderRadius: 6, label: 'Kiri 1' },
      { x: 53.1, y: 7.8, width: 39.9, height: 23.2, borderRadius: 6, label: 'Kanan 1' },
      { x: 6.9, y: 34.6, width: 39.9, height: 23.2, borderRadius: 6, label: 'Kiri 2' },
      { x: 53.1, y: 34.6, width: 39.9, height: 23.2, borderRadius: 6, label: 'Kanan 2' },
      { x: 6.9, y: 61.6, width: 39.9, height: 23.2, borderRadius: 6, label: 'Kiri 3' },
      { x: 53.1, y: 61.6, width: 39.9, height: 23.2, borderRadius: 6, label: 'Kanan 3' },
    ],
  },
  {
    id: 'template-20',
    name: 'Template 20',
    category: 'Twin Strip',
    imageSrc: '/images/template/template 20.png',
    requiredPhotos: 8,
    aspectRatio: '1080 / 1920',
    description: 'Lavender Floral Strip (Twin Strip 8 Pose)',
    slots: [
      { x: 18.9, y: 16.0, width: 28.9, height: 16.7, borderRadius: 4, label: 'Kiri 1' },
      { x: 54.4, y: 16.0, width: 28.9, height: 16.9, borderRadius: 4, label: 'Kanan 1' },
      { x: 18.5, y: 33.5, width: 28.9, height: 16.9, borderRadius: 4, label: 'Kiri 2' },
      { x: 54.1, y: 33.8, width: 28.9, height: 16.7, borderRadius: 4, label: 'Kanan 2' },
      { x: 18.1, y: 51.0, width: 28.9, height: 16.9, borderRadius: 4, label: 'Kiri 3' },
      { x: 53.7, y: 51.2, width: 28.5, height: 16.7, borderRadius: 4, label: 'Kanan 3' },
      { x: 17.8, y: 68.5, width: 28.9, height: 16.9, borderRadius: 4, label: 'Kiri 4' },
      { x: 53.3, y: 68.8, width: 28.5, height: 16.7, borderRadius: 4, label: 'Kanan 4' },
    ],
  },
  {
    id: 'template-21',
    name: 'Template 21',
    category: 'Twin Strip',
    imageSrc: '/images/template/template 21.png',
    requiredPhotos: 6,
    aspectRatio: '1333 / 2000',
    description: 'Sweet Pink Ribbon (Twin Strip 6 Pose)',
    slots: [
      { x: 12.0, y: 24.2, width: 31.5, height: 15.4, borderRadius: 6, label: 'Kiri 1' },
      { x: 53.7, y: 23.2, width: 36.0, height: 16.2, borderRadius: 6, label: 'Kanan 1' },
      { x: 10.2, y: 45.2, width: 36.0, height: 16.2, borderRadius: 6, label: 'Kiri 2' },
      { x: 56.4, y: 45.8, width: 31.8, height: 15.4, borderRadius: 6, label: 'Kanan 2' },
      { x: 12.0, y: 68.6, width: 31.5, height: 15.4, borderRadius: 6, label: 'Kiri 3' },
      { x: 53.7, y: 67.6, width: 36.0, height: 16.2, borderRadius: 6, label: 'Kanan 3' },
    ],
  },
  {
    id: 'template-22',
    name: 'Template 22',
    category: 'Minimalist',
    imageSrc: '/images/template/template 22.png',
    requiredPhotos: 1,
    aspectRatio: '1080 / 1920',
    description: 'Spotify Music Player (1 Pose Hero Polaroid)',
    slots: [
      { x: 19.5, y: 14.3, width: 59.8, height: 45.4, rotation: -0.6, borderRadius: 2, label: 'Polaroid Player' },
    ],
  },
  {
    id: 'template-23',
    name: 'Template 23',
    category: 'Vintage Collage',
    imageSrc: '/images/template/template 23.png',
    requiredPhotos: 6,
    aspectRatio: '1080 / 1350',
    description: 'Horizontal Film Roll Strip (6 Pose Cinematic)',
    slots: [
      { x: -1.9, y: 23.6, width: 33.0, height: 21.3, rotation: -7.4, borderRadius: 2, label: '#1 Film Atas Kiri' },
      { x: 30.9, y: 20.1, width: 34.6, height: 21.3, rotation: -7.4, borderRadius: 2, label: '#2 Film Atas Tengah' },
      { x: 65.3, y: 16.5, width: 36.6, height: 21.3, rotation: -7.4, borderRadius: 2, label: '#3 Film Atas Kanan' },
      { x: -1.9, y: 57.9, width: 33.8, height: 21.8, rotation: -7.4, borderRadius: 2, label: '#4 Film Bawah Kiri' },
      { x: 31.8, y: 54.2, width: 37.6, height: 21.8, rotation: -7.4, borderRadius: 2, label: '#5 Film Bawah Tengah' },
      { x: 69.2, y: 50.6, width: 32.8, height: 21.8, rotation: -7.4, borderRadius: 2, label: '#6 Film Bawah Kanan' },
    ],
  },
  {
    id: 'template-24',
    name: 'Template 24',
    category: 'Vintage Collage',
    imageSrc: '/images/template/template 24.png',
    requiredPhotos: 2,
    aspectRatio: '1414 / 2000',
    description: 'Vintage Navy Scrapbook (Polaroid + Prangko)',
    slots: [
      { x: 14.8, y: 28.0, width: 41.0, height: 27.7, rotation: 4.4, borderRadius: 4, label: 'Polaroid Utama' },
      { x: 65.0, y: 29.6, width: 22.6, height: 18.5, borderRadius: 4, label: 'Prangko Stamp' },
    ],
  },
  {
    id: 'template-25',
    name: 'Template 25',
    category: 'Polaroid',
    imageSrc: '/images/template/template 25.png',
    requiredPhotos: 4,
    aspectRatio: '1080 / 1350',
    description: 'Vintage Strip & Big Polaroid (4 Pose)',
    slots: [
      { x: 8.6, y: 19.8, width: 21.2, height: 19.2, rotation: -1.6, borderRadius: 2, label: 'Strip 1 (Atas)' },
      { x: 9.4, y: 40.4, width: 21.2, height: 19.2, rotation: -1.6, borderRadius: 2, label: 'Strip 2 (Tengah)' },
      { x: 10.3, y: 61.0, width: 21.2, height: 19.2, rotation: -1.6, borderRadius: 2, label: 'Strip 3 (Bawah)' },
      { x: 38.0, y: 28.5, width: 45.6, height: 35.0, rotation: 3.0, borderRadius: 2, label: 'Polaroid Kanan' },
    ],
  },
  {
    id: 'template-26',
    name: 'Template 26',
    category: 'Polaroid',
    imageSrc: '/images/template/template 26.png',
    requiredPhotos: 1,
    aspectRatio: '1080 / 1920',
    description: 'Summer Sunset Ocean (1 Pose Polaroid)',
    slots: [
      { x: 23.3, y: 27.2, width: 53.2, height: 38.0, rotation: -1.9, borderRadius: 3, label: 'Sunset Polaroid' },
    ],
  },
  {
    id: 'template-27',
    name: 'Template 27',
    category: 'Polaroid',
    imageSrc: '/images/template/template 27.png',
    requiredPhotos: 1,
    aspectRatio: '1080 / 1920',
    description: 'Black Newspaper Smiley (1 Pose Polaroid)',
    slots: [
      { x: 16.7, y: 30.7, width: 65.0, height: 35.0, rotation: -1.8, borderRadius: 3, label: 'Dark Newspaper Polaroid' },
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
