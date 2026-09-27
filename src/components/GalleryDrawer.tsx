'use client';

import React, { useState, useEffect } from 'react';
import { GalleryItem } from '@/lib/types';
import { getTemplateById } from '@/lib/templateManager';
import { createAnimatedGif } from '@/lib/gifGenerator';
import {
  X,
  Trash2,
  Download,
  Image as ImageIcon,
  Calendar,
  Eye,
  Sparkles,
  Maximize2,
  Film,
  Layers,
  ArrowUpRight,
  Loader2,
  Check,
  AlertTriangle,
  Smartphone,
  Share2,
  DownloadCloud,
  CheckCircle2,
  PlusSquare,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePwaInstall } from '@/lib/usePwaInstall';
import { IosPwaInstallModal } from '@/components/IosPwaInstallModal';

interface GalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: GalleryItem[];
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  onSelectSession?: (item: GalleryItem) => void;
}

export const GalleryDrawer: React.FC<GalleryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onDeleteItem,
  onClearAll,
  onSelectSession,
}) => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [activeTab, setActiveTab] = useState<'strip' | 'gif' | 'photos'>('strip');
  const [generatedGifUrl, setGeneratedGifUrl] = useState<string | null>(null);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ src: string; title: string } | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; name: string } | 'all' | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [pwaToast, setPwaToast] = useState<string | null>(null);

  const { isInstallable, isInstalled, isIOS, isInAppBrowser, isStandalone, installPwa } = usePwaInstall();

  const handlePwaClick = async () => {
    if (isStandalone || isInstalled) {
      setPwaToast('Aplikasi Pearly Photobooth sudah terpasang!');
      setTimeout(() => setPwaToast(null), 3000);
      return;
    }

    const res = await installPwa();
    if (res.outcome === 'accepted') {
      setPwaToast('Aplikasi berhasil dipasang!');
      setTimeout(() => setPwaToast(null), 3500);
    } else if (res.outcome === 'already_installed') {
      setPwaToast('Aplikasi sudah terpasang!');
      setTimeout(() => setPwaToast(null), 3000);
    } else if (res.outcome === 'ios') {
      setPwaToast('Untuk memasang di iOS: Ketuk Bagikan lalu Tambah ke Layar Utama.');
      setTimeout(() => setPwaToast(null), 4000);
    } else if (res.outcome === 'unavailable') {
      setPwaToast('Gunakan menu browser lalu pilih "Instal Aplikasi" / "Install App".');
      setTimeout(() => setPwaToast(null), 4000);
    }
  };

  // Generate animated GIF when selectedItem changes or tab switches to GIF
  useEffect(() => {
    if (selectedItem && selectedItem.photos && selectedItem.photos.length > 0) {
      setIsGeneratingGif(true);
      setGeneratedGifUrl(null);

      createAnimatedGif(selectedItem.photos, { interval: 0.45, sampleInterval: 2 })
        .then((gif) => {
          setGeneratedGifUrl(gif);
          setIsGeneratingGif(false);
        })
        .catch((err) => {
          console.error('Failed to generate animated GIF in gallery detail:', err);
          setIsGeneratingGif(false);
        });
    }
  }, [selectedItem]);

  const handleDownloadStrip = (item: GalleryItem) => {
    const link = document.createElement('a');
    link.href = item.previewUrl;
    link.download = `snapbooth-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadGif = () => {
    if (!generatedGifUrl) return;
    const link = document.createElement('a');
    link.href = generatedGifUrl;
    link.download = `snapbooth-animated-${Date.now()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSinglePhoto = (photoSrc: string, index: number) => {
    const link = document.createElement('a');
    link.href = photoSrc;
    link.download = `snapbooth-pose-${index + 1}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAllPhotos = (photos: string[]) => {
    photos.forEach((src, idx) => {
      setTimeout(() => {
        handleDownloadSinglePhoto(src, idx);
      }, idx * 220);
    });
  };

  const openDetailModal = (item: GalleryItem) => {
    setSelectedItem(item);
    setActiveTab('strip');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 90,
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="vintage-parchment-bg"
              style={{
                width: '100%',
                maxWidth: 'min(440px, 100vw)',
                height: '100%',
                borderLeft: '3px solid #3d2616',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-8px 0px 24px rgba(45, 25, 12, 0.45)',
              }}
            >
              {/* Header (Vintage Dark Brown Aesthetic) */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '2px solid #543720',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#3d2616',
                  color: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: 'rgba(235, 218, 195, 0.15)',
                      border: '1px solid rgba(235, 218, 195, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fdf7ee',
                    }}
                  >
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <h3
                      className="font-gothic"
                      style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fdf7ee', margin: 0, letterSpacing: '0.5px' }}
                    >
                      Galeri Sesi
                    </h3>
                    <p
                      className="font-vintage-serif"
                      style={{ fontSize: '0.78rem', color: 'rgba(253, 247, 238, 0.75)', fontWeight: 600, margin: 0 }}
                    >
                      {items.length} hasil foto tersimpan
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handlePwaClick}
                    style={{
                      background: isStandalone || isInstalled ? '#f0fdf4' : '#ebd7bc',
                      border: isStandalone || isInstalled ? '1px solid #bbf7d0' : '1.5px solid #543720',
                      color: isStandalone || isInstalled ? '#15803d' : '#2a170a',
                      padding: '6px 12px',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                      transition: 'all 0.15s ease',
                      fontFamily: 'serif',
                    }}
                    title="Download & Pasang Aplikasi Pearly Photobooth (PWA)"
                  >
                    {isStandalone || isInstalled ? (
                      <>
                        <CheckCircle2 size={13} color="#15803d" />
                        <span>Terpasang</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud size={13} color="#2a170a" />
                        <span>PWA</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: '#ffffff',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* PWA Toast Notification */}
              <AnimatePresence>
                {pwaToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      margin: '10px 16px 0',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#3d2616',
                      border: '1px solid #c4a97f',
                      color: '#fdf7ee',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                      fontFamily: 'serif',
                    }}
                  >
                    <Info size={16} color="#e3ccaa" style={{ flexShrink: 0 }} />
                    <span>{pwaToast}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* List of items */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {items.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#543720',
                      gap: '12px',
                      textAlign: 'center',
                      padding: '40px 20px',
                    }}
                  >
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: 'rgba(245, 238, 225, 0.8)',
                        border: '2px dashed #543720',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#543720',
                      }}
                    >
                      <ImageIcon size={28} />
                    </div>
                    <p
                      className="font-gothic"
                      style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1a0f07', margin: 0 }}
                    >
                      Belum Ada Foto Tersimpan
                    </p>
                    <p
                      className="font-vintage-serif"
                      style={{ fontSize: '0.84rem', maxWidth: '240px', fontWeight: 600, color: '#543720', margin: 0 }}
                    >
                      Selesaikan sesi foto dan tekan <strong>"Select"</strong> untuk menyimpan otomatis ke galeri.
                    </p>
                  </div>
                ) : (
                  items.map((item) => {
                    const tmpl = getTemplateById(item.config?.selectedTemplateId || 'template-1');
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (onSelectSession) {
                            onSelectSession(item);
                            onClose();
                          } else {
                            openDetailModal(item);
                          }
                        }}
                        style={{
                          padding: '10px 12px',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center',
                          background: 'rgba(245, 238, 225, 0.92)',
                          borderRadius: '10px',
                          border: '2px solid #3d2616',
                          boxShadow: '0 4px 12px rgba(45, 25, 12, 0.18)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {/* Thumbnail Photostrip */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectSession) {
                              onSelectSession(item);
                              onClose();
                            } else {
                              openDetailModal(item);
                            }
                          }}
                          style={{
                            width: '60px',
                            height: '92px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: '1.5px solid #3d2616',
                            background: '#d5dee6',
                            flexShrink: 0,
                            position: 'relative',
                          }}
                          title="Klik untuk buka sesi ini di Photobooth"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt="Saved strip"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                        </div>

                        {/* Details & Actions */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                          <span
                            className="font-vintage-serif"
                            style={{
                              fontSize: '0.96rem',
                              fontWeight: 800,
                              color: '#1a0f07',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tmpl ? tmpl.name : 'Pearly Booth Photo'}
                          </span>

                          <div
                            className="font-vintage-serif"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#543720', fontWeight: 600 }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Calendar size={11} />
                              {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>•</span>
                            <span>{item.photos ? item.photos.length : 1} Pose</span>
                          </div>

                          {/* Action Buttons Row */}
                          <div style={{ display: 'flex', gap: '5px', marginTop: '3px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectSession) {
                                  onSelectSession(item);
                                  onClose();
                                } else {
                                  openDetailModal(item);
                                }
                              }}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: '#3d2616',
                                color: '#fdf7ee',
                                border: 'none',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                fontFamily: 'serif',
                              }}
                              title="Buka sesi ini di photobooth"
                            >
                              <Eye size={11} />
                              <span>Buka Sesi</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailModal(item);
                              }}
                              style={{
                                padding: '4px 9px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: 'rgba(235, 218, 195, 0.8)',
                                color: '#2a170a',
                                border: '1px solid #543720',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                cursor: 'pointer',
                                fontFamily: 'serif',
                              }}
                              title="Lihat detail lengkap (Photostrip, GIF, Pose)"
                            >
                              <span>Detail</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadStrip(item);
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                background: 'rgba(235, 218, 195, 0.8)',
                                color: '#2a170a',
                                border: '1px solid #543720',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                cursor: 'pointer',
                              }}
                              title="Unduh Photostrip PNG"
                            >
                              <Download size={11} />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmTarget({ id: item.id, name: tmpl ? tmpl.name : 'Sesi Foto' });
                              }}
                              style={{
                                padding: '4px 7px',
                                fontSize: '0.74rem',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                              title="Hapus dari Galeri"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div style={{ padding: '12px 16px', borderTop: '2px solid #543720', background: 'rgba(245, 238, 225, 0.95)' }}>
                  <button
                    onClick={() => setDeleteConfirmTarget('all')}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#dc2626',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontFamily: 'serif',
                    }}
                  >
                    <Trash2 size={14} /> Bersihkan Semua Galeri
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      <AnimatePresence>
        {deleteConfirmTarget && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 300,
              background: 'rgba(26, 15, 7, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setDeleteConfirmTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="vintage-parchment-bg"
              style={{
                maxWidth: '400px',
                width: '100%',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '14px',
                borderRadius: '16px',
                border: '3px solid #3d2616',
                boxShadow: '0 20px 50px rgba(45, 25, 12, 0.45)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  border: '1.5px solid #fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                }}
              >
                <Trash2 size={26} />
              </div>

              <div>
                <h3
                  className="font-gothic"
                  style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a0f07', marginBottom: '6px' }}
                >
                  {deleteConfirmTarget === 'all' ? 'Hapus Semua Galeri?' : 'Hapus Foto Sesi Ini?'}
                </h3>
                <p
                  className="font-vintage-serif"
                  style={{ fontSize: '0.86rem', color: '#543720', fontWeight: 600, lineHeight: 1.4, margin: 0 }}
                >
                  {deleteConfirmTarget === 'all'
                    ? 'Apakah Anda yakin ingin menghapus semua hasil foto dari Galeri Sesi? Data yang dihapus tidak dapat dipulihkan.'
                    : `Apakah Anda yakin ingin menghapus ${deleteConfirmTarget.name} dari galeri sesi?`}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: '4px' }}>
                <button
                  onClick={() => setDeleteConfirmTarget(null)}
                  style={{
                    padding: '9px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    background: 'rgba(235, 218, 195, 0.8)',
                    border: '1.5px solid #543720',
                    color: '#2a170a',
                    cursor: 'pointer',
                    fontFamily: 'serif',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirmTarget === 'all') {
                      onClearAll();
                    } else {
                      onDeleteItem(deleteConfirmTarget.id);
                    }
                    setDeleteConfirmTarget(null);
                  }}
                  style={{
                    padding: '9px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    background: '#dc2626',
                    border: '1.5px solid #991b1b',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontFamily: 'serif',
                  }}
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL DETAIL LENGKAP HASIL GALERI (PHOTOSTRIP, GIF, FOTO POSE) ================= */}
      <AnimatePresence>
        {selectedItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 150,
              background: 'rgba(26, 15, 7, 0.8)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
            }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="vintage-parchment-bg"
              style={{
                width: '100%',
                maxWidth: '620px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                border: '3px solid #3d2616',
                padding: '0',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(45, 25, 12, 0.5)',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '16px 20px',
                  background: '#3d2616',
                  color: '#fdf7ee',
                  borderBottom: '2px solid #543720',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3
                    className="font-gothic"
                    style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fdf7ee', margin: 0, letterSpacing: '0.5px' }}
                  >
                    {getTemplateById(selectedItem.config?.selectedTemplateId)?.name || 'Hasil Sesi'}
                  </h3>
                  <p
                    className="font-vintage-serif"
                    style={{ fontSize: '0.78rem', color: 'rgba(253, 247, 238, 0.75)', fontWeight: 600, margin: '2px 0 0 0' }}
                  >
                    {new Date(selectedItem.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Navigation Tabs: Photostrip | Animasi GIF | Foto Pose */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(235, 218, 195, 0.7)',
                  padding: '8px 12px',
                  borderBottom: '1.5px solid #543720',
                  gap: '8px',
                }}
              >
                <button
                  onClick={() => setActiveTab('strip')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid #543720',
                    background: activeTab === 'strip' ? '#3d2616' : 'rgba(245, 238, 225, 0.85)',
                    color: activeTab === 'strip' ? '#fdf7ee' : '#3d2616',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'serif',
                  }}
                >
                  <Layers size={13} />
                  <span>Photostrip</span>
                </button>

                <button
                  onClick={() => setActiveTab('gif')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid #543720',
                    background: activeTab === 'gif' ? '#3d2616' : 'rgba(245, 238, 225, 0.85)',
                    color: activeTab === 'gif' ? '#fdf7ee' : '#3d2616',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'serif',
                  }}
                >
                  <Film size={13} />
                  <span>Animasi GIF</span>
                </button>

                <button
                  onClick={() => setActiveTab('photos')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid #543720',
                    background: activeTab === 'photos' ? '#3d2616' : 'rgba(245, 238, 225, 0.85)',
                    color: activeTab === 'photos' ? '#fdf7ee' : '#3d2616',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'serif',
                  }}
                >
                  <ImageIcon size={13} />
                  <span>Foto Pose ({selectedItem.photos?.length || 0})</span>
                </button>
              </div>

              {/* Modal Body Content */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '340px',
                }}
              >
                {/* TAB 1: PHOTOSTRIP PREVIEW */}
                {activeTab === 'strip' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
                    <div
                      onClick={() => setZoomedImage({ src: selectedItem.previewUrl, title: 'Photostrip Lengkap' })}
                      style={{
                        position: 'relative',
                        maxHeight: '380px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '2px solid #3d2616',
                        boxShadow: '0 8px 24px rgba(45, 25, 12, 0.25)',
                        background: '#d5dee6',
                        cursor: 'pointer',
                      }}
                      title="Klik untuk memperbesar"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedItem.previewUrl}
                        alt="Full photostrip"
                        style={{
                          maxHeight: '380px',
                          maxWidth: '100%',
                          objectFit: 'contain',
                          display: 'block',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          background: 'rgba(45, 25, 12, 0.88)',
                          color: '#fdf7ee',
                          padding: '3px 9px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontFamily: 'serif',
                        }}
                      >
                        <Maximize2 size={11} /> Zoom
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '360px' }}>
                      <button
                        onClick={() => handleDownloadStrip(selectedItem)}
                        className="btn-vintage-tag"
                        style={{
                          flex: 1,
                          padding: '8px 36px 8px 22px',
                          fontSize: '1.15rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Download size={14} />
                        <span>Unduh Photostrip</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: ANIMATED GIF */}
                {activeTab === 'gif' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
                    {isGeneratingGif ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', minHeight: '260px' }}>
                        <Loader2 className="animate-spin text-amber-950" size={36} />
                        <span className="font-vintage-serif" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3d2616' }}>
                          Membuat Animasi GIF...
                        </span>
                      </div>
                    ) : generatedGifUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
                        <div
                          onClick={() => setZoomedImage({ src: generatedGifUrl, title: 'Animasi GIF' })}
                          style={{
                            position: 'relative',
                            maxHeight: '340px',
                            maxWidth: '420px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            border: '2px solid #3d2616',
                            boxShadow: '0 8px 24px rgba(45, 25, 12, 0.25)',
                            background: '#2a170a',
                            cursor: 'pointer',
                          }}
                          title="Klik untuk memperbesar"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={generatedGifUrl}
                            alt="Animated GIF"
                            style={{
                              width: '100%',
                              maxHeight: '340px',
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '360px' }}>
                          <button
                            onClick={handleDownloadGif}
                            className="btn-vintage-tag"
                            style={{
                              flex: 1,
                              padding: '8px 36px 8px 22px',
                              fontSize: '1.15rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                            }}
                          >
                            <Download size={14} />
                            <span>Unduh GIF</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="font-vintage-serif" style={{ fontSize: '0.85rem', color: '#543720', fontWeight: 700 }}>
                        Gagal memuat animasi GIF untuk sesi ini.
                      </p>
                    )}
                  </div>
                )}

                {/* TAB 3: RAW POSE PHOTOS */}
                {activeTab === 'photos' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="font-vintage-serif" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#543720' }}>
                        Total {selectedItem.photos?.length || 0} Foto Pose
                      </span>
                      {selectedItem.photos && selectedItem.photos.length > 1 && (
                        <button
                          onClick={() => handleDownloadAllPhotos(selectedItem.photos)}
                          style={{
                            padding: '5px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            background: '#3d2616',
                            color: '#fdf7ee',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            fontFamily: 'serif',
                          }}
                        >
                          <Download size={12} /> Unduh Semua
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: selectedItem.photos?.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '12px',
                        width: '100%',
                        justifyItems: 'center',
                      }}
                    >
                      {selectedItem.photos?.map((photoSrc, pIdx) => (
                        <div
                          key={pIdx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1.5px solid #3d2616',
                            background: 'rgba(245, 238, 225, 0.95)',
                            boxShadow: '0 4px 12px rgba(45, 25, 12, 0.15)',
                            width: selectedItem.photos.length === 1 ? '180px' : '100%',
                            maxWidth: '220px',
                          }}
                        >
                          <div
                            onClick={() => setZoomedImage({ src: photoSrc, title: `Foto Pose #${pIdx + 1}` })}
                            style={{
                              width: '100%',
                              aspectRatio: '1 / 1',
                              overflow: 'hidden',
                              background: '#2a170a',
                              cursor: 'pointer',
                            }}
                            title={`Klik untuk lihat jelas Foto #${pIdx + 1}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photoSrc}
                              alt={`Pose ${pIdx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>

                          <button
                            onClick={() => handleDownloadSinglePhoto(photoSrc, pIdx)}
                            style={{
                              padding: '6px 0',
                              borderTop: '1px solid #543720',
                              borderLeft: 'none',
                              borderRight: 'none',
                              borderBottom: 'none',
                              background: '#ebd7bc',
                              color: '#2a170a',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              fontFamily: 'serif',
                            }}
                          >
                            <Download size={11} />
                            <span>Unduh #{pIdx + 1}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer (Buka di Studio Hasil / Tutup) */}
              <div
                style={{
                  padding: '12px 20px',
                  background: 'rgba(245, 238, 225, 0.95)',
                  borderTop: '2px solid #543720',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                {onSelectSession ? (
                  <button
                    onClick={() => {
                      onSelectSession(selectedItem);
                      setSelectedItem(null);
                      onClose();
                    }}
                    className="btn-vintage-tag"
                    style={{
                      padding: '7px 32px 7px 20px',
                      fontSize: '1.05rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ArrowUpRight size={14} />
                    <span>Buka di Photobooth</span>
                  </button>
                ) : <div />}

                <button
                  onClick={() => setSelectedItem(null)}
                  style={{
                    padding: '7px 18px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    background: 'rgba(235, 218, 195, 0.8)',
                    color: '#3d2616',
                    border: '1.5px solid #543720',
                    cursor: 'pointer',
                    fontFamily: 'serif',
                  }}
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= LIGHTBOX ZOOM MODAL ================= */}
      <AnimatePresence>
        {zoomedImage && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(0, 0, 0, 0.92)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setZoomedImage(null)}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', color: '#ffffff' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{zoomedImage.title}</span>
                <button
                  onClick={() => setZoomedImage(null)}
                  style={{
                    background: '#ffffff',
                    border: '2px solid var(--neo-black)',
                    borderRadius: '8px',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--neo-black)',
                    fontWeight: 900,
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomedImage.src}
                alt={zoomedImage.title}
                style={{
                  maxWidth: '90vw',
                  maxHeight: '78vh',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* iOS PWA Installation Guide Modal */}
      <IosPwaInstallModal
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        isInAppBrowser={isInAppBrowser}
      />
    </>
  );
};
