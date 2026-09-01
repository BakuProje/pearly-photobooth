'use client';

import React, { useState, useEffect } from 'react';
import { GalleryItem } from '@/lib/types';
import { TEMPLATES } from '@/lib/constants';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Generate animated GIF when selectedItem changes or tab switches to GIF
  useEffect(() => {
    if (selectedItem && selectedItem.photos && selectedItem.photos.length > 0) {
      setIsGeneratingGif(true);
      setGeneratedGifUrl(null);

      createAnimatedGif(selectedItem.photos, { interval: 0.45, gifWidth: 600, gifHeight: 450 })
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
              style={{
                width: '100%',
                maxWidth: 'min(440px, 100vw)',
                height: '100%',
                background: '#ffffff',
                borderLeft: '3px solid var(--neo-black)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-8px 0px 0px var(--neo-black)',
              }}
            >
              {/* Header (Brand Blue) */}
              <div
                style={{
                  padding: '18px 20px',
                  borderBottom: '2.5px solid var(--neo-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--neo-primary)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'var(--neo-white)',
                      border: '2px solid var(--neo-black)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--neo-black)',
                      boxShadow: '2px 2px 0px var(--neo-black)',
                    }}
                  >
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--neo-black)' }}>Galeri Sesi</h3>
                    <p style={{ fontSize: '0.76rem', color: 'var(--neo-black)', fontWeight: 700 }}>
                      {items.length} hasil foto tersimpan
                    </p>
                  </div>
                </div>

                <button onClick={onClose} className="neo-btn-icon" style={{ width: '36px', height: '36px' }}>
                  <X size={18} />
                </button>
              </div>

              {/* List of items */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--text-muted)',
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
                        background: '#f1f5f9',
                        border: '2px dashed var(--neo-black)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <ImageIcon size={28} />
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--neo-black)' }}>Belum Ada Foto Tersimpan</p>
                    <p style={{ fontSize: '0.82rem', maxWidth: '240px', fontWeight: 600 }}>
                      Selesaikan sesi foto dan tekan <strong>"Lihat Hasil"</strong> untuk menyimpan otomatis ke galeri.
                    </p>
                  </div>
                ) : (
                  items.map((item) => {
                    const tmpl = TEMPLATES.find((t) => t.id === item.config.selectedTemplateId);
                    return (
                      <div
                        key={item.id}
                        className="neo-card"
                        style={{
                          padding: '12px',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center',
                          background: '#ffffff',
                          boxShadow: '3px 3px 0px var(--neo-black)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {/* Thumbnail Photostrip (Clickable to open details) */}
                        <div
                          onClick={() => openDetailModal(item)}
                          style={{
                            width: '68px',
                            height: '104px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1.5px solid var(--neo-black)',
                            background: '#f8fafc',
                            flexShrink: 0,
                            position: 'relative',
                          }}
                          title="Klik untuk lihat detail lengkap"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt="Saved strip"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              background: '#ffffff',
                              display: 'block',
                            }}
                          />
                        </div>

                        {/* Details & Actions */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
                          <span
                            onClick={() => openDetailModal(item)}
                            style={{
                              fontSize: '0.92rem',
                              fontWeight: 900,
                              color: 'var(--neo-black)',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tmpl ? tmpl.name : 'Snapbooth Photo'}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Calendar size={11} />
                              {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>•</span>
                            <span>{item.photos ? item.photos.length : 1} Pose</span>
                          </div>

                          {/* Action Buttons Row */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => openDetailModal(item)}
                              className="neo-btn neo-btn-primary"
                              style={{ padding: '5px 10px', fontSize: '0.76rem', background: 'var(--neo-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Lihat Hasil (Photostrip, GIF & Pose)"
                            >
                              <Eye size={12} />
                              <span>Lihat</span>
                            </button>

                            <button
                              onClick={() => handleDownloadStrip(item)}
                              className="neo-btn neo-btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Unduh Photostrip PNG"
                            >
                              <Download size={12} />
                              <span>Unduh</span>
                            </button>

                            <button
                              onClick={() => setDeleteConfirmTarget({ id: item.id, name: tmpl ? tmpl.name : 'Sesi Foto' })}
                              className="neo-btn neo-btn-secondary"
                              style={{ padding: '5px 8px', fontSize: '0.76rem', color: '#ef4444' }}
                              title="Hapus dari Galeri"
                            >
                              <Trash2 size={12} />
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
                <div style={{ padding: '14px 18px', borderTop: '2.5px solid var(--neo-black)', background: '#ffffff' }}>
                  <button
                    onClick={() => setDeleteConfirmTarget('all')}
                    className="neo-btn neo-btn-secondary"
                    style={{ width: '100%', padding: '9px', fontSize: '0.82rem', color: '#ef4444' }}
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
              background: 'rgba(15, 23, 42, 0.75)',
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
              className="neo-card"
              style={{
                maxWidth: '380px',
                width: '100%',
                padding: '22px',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '14px',
                borderRadius: '16px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#fee2e2',
                  border: '2px solid var(--neo-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  boxShadow: '2px 2px 0px var(--neo-black)',
                }}
              >
                <Trash2 size={26} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--neo-black)', marginBottom: '6px' }}>
                  {deleteConfirmTarget === 'all' ? 'Hapus Semua Galeri?' : 'Hapus Foto Sesi Ini?'}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.4 }}>
                  {deleteConfirmTarget === 'all'
                    ? 'Apakah Anda yakin ingin menghapus semua hasil foto dari Galeri Sesi? Data yang dihapus tidak dapat dipulihkan.'
                    : `Apakah Anda yakin ingin menghapus ${deleteConfirmTarget.name} dari galeri sesi?`}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: '4px' }}>
                <button
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="neo-btn neo-btn-secondary"
                  style={{ padding: '9px', fontSize: '0.86rem', justifyContent: 'center' }}
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
                  className="neo-btn neo-btn-primary"
                  style={{ padding: '9px', fontSize: '0.86rem', background: '#ef4444', color: '#ffffff', justifyContent: 'center' }}
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
              background: 'rgba(15, 23, 42, 0.85)',
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
              className="neo-card"
              style={{
                width: '100%',
                maxWidth: '620px',
                maxHeight: '92vh',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                padding: '0',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '14px 18px',
                  background: 'var(--neo-primary)',
                  borderBottom: '2.5px solid var(--neo-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                    {TEMPLATES.find((t) => t.id === selectedItem.config.selectedTemplateId)?.name || 'Hasil Sesi'}
                  </h3>
                  <p style={{ fontSize: '0.74rem', color: 'var(--neo-black)', fontWeight: 700 }}>
                    {new Date(selectedItem.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="neo-btn-icon"
                  style={{ width: '32px', height: '32px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Navigation Tabs: Photostrip | Animasi GIF | Foto Pose */}
              <div
                style={{
                  display: 'flex',
                  background: '#f1f5f9',
                  padding: '6px',
                  borderBottom: '2px solid var(--neo-black)',
                  gap: '6px',
                }}
              >
                <button
                  onClick={() => setActiveTab('strip')}
                  className={`neo-btn ${activeTab === 'strip' ? 'neo-btn-primary' : 'neo-btn-secondary'}`}
                  style={{ flex: 1, padding: '7px 4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Layers size={13} />
                  <span>Photostrip</span>
                </button>

                <button
                  onClick={() => setActiveTab('gif')}
                  className={`neo-btn ${activeTab === 'gif' ? 'neo-btn-primary' : 'neo-btn-secondary'}`}
                  style={{ flex: 1, padding: '7px 4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Film size={13} />
                  <span>Animasi GIF</span>
                </button>

                <button
                  onClick={() => setActiveTab('photos')}
                  className={`neo-btn ${activeTab === 'photos' ? 'neo-btn-primary' : 'neo-btn-secondary'}`}
                  style={{ flex: 1, padding: '7px 4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
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
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '340px',
                  background: '#fafafa',
                }}
              >
                {/* TAB 1: PHOTOSTRIP PREVIEW */}
                {activeTab === 'strip' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <div
                      onClick={() => setZoomedImage({ src: selectedItem.previewUrl, title: 'Photostrip Lengkap' })}
                      style={{
                        position: 'relative',
                        maxHeight: '380px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: '2px solid var(--neo-black)',
                        boxShadow: '4px 4px 0px var(--neo-black)',
                        background: '#ffffff',
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
                          background: 'rgba(15, 23, 42, 0.85)',
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Maximize2 size={11} /> Zoom
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '360px' }}>
                      <button
                        onClick={() => handleDownloadStrip(selectedItem)}
                        className="neo-btn neo-btn-primary"
                        style={{ flex: 1, padding: '10px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Download size={15} />
                        <span>Unduh Photostrip</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: ANIMATED GIF */}
                {activeTab === 'gif' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                    {isGeneratingGif ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', minHeight: '260px' }}>
                        <Loader2 className="animate-spin" size={36} color="#0284c7" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--neo-black)' }}>
                          Membuat Animasi GIF...
                        </span>
                      </div>
                    ) : generatedGifUrl ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <div
                          onClick={() => setZoomedImage({ src: generatedGifUrl, title: 'Animasi GIF' })}
                          style={{
                            position: 'relative',
                            maxHeight: '340px',
                            maxWidth: '420px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            border: '2px solid var(--neo-black)',
                            boxShadow: '4px 4px 0px var(--neo-black)',
                            background: '#000000',
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
                            className="neo-btn neo-btn-primary"
                            style={{ flex: 1, padding: '10px', fontSize: '0.88rem', background: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <Download size={15} />
                            <span>Unduh Animasi GIF</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        Gagal memuat animasi GIF untuk sesi ini.
                      </p>
                    )}
                  </div>
                )}

                {/* TAB 3: RAW POSE PHOTOS */}
                {activeTab === 'photos' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                        Total {selectedItem.photos?.length || 0} Foto Pose
                      </span>
                      {selectedItem.photos && selectedItem.photos.length > 1 && (
                        <button
                          onClick={() => handleDownloadAllPhotos(selectedItem.photos)}
                          className="neo-btn neo-btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Download size={12} /> Unduh Semua
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: selectedItem.photos?.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '10px',
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
                            border: '2px solid var(--neo-black)',
                            background: '#ffffff',
                            boxShadow: '2.5px 2.5px 0px var(--neo-black)',
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
                              background: '#000000',
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
                            className="neo-btn neo-btn-secondary"
                            style={{
                              padding: '5px 0',
                              borderTop: '1.5px solid var(--neo-black)',
                              borderLeft: 'none',
                              borderRight: 'none',
                              borderBottom: 'none',
                              borderRadius: 0,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
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
                  padding: '12px 18px',
                  background: '#ffffff',
                  borderTop: '2px solid var(--neo-black)',
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
                    }}
                    className="neo-btn neo-btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowUpRight size={14} />
                    <span>Buka di Layar Hasil</span>
                  </button>
                ) : <div />}

                <button
                  onClick={() => setSelectedItem(null)}
                  className="neo-btn neo-btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
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
    </>
  );
};
