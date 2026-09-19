'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  PlusSquare,
  Check,
  Smartphone,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface IosPwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInAppBrowser?: boolean;
}

export const IosPwaInstallModal: React.FC<IosPwaInstallModalProps> = ({
  isOpen,
  onClose,
  isInAppBrowser = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '430px',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
              border: '1.5px solid rgba(226, 232, 240, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Header with Apple/iOS Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                  }}
                >
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 900,
                      color: '#0f172a',
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    Pasang di iPhone / iPad
                  </h3>
                  <p
                    style={{
                      fontSize: '0.76rem',
                      color: '#64748b',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Panduan Apple iOS Web App (PWA)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'background 0.15s ease',
                }}
                title="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* In-App Browser Notice if applicable */}
            {isInAppBrowser && (
              <div
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <ExternalLink size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.76rem', color: '#92400e', lineHeight: 1.4, margin: 0, fontWeight: 600 }}>
                  Kamu sedang membuka lewat aplikasi lain. Ketuk ikon <strong>titik 3 (...)</strong> lalu pilih <strong>&quot;Buka di Safari&quot;</strong> terlebih dahulu.
                </p>
              </div>
            )}

            {/* Step-by-Step Interactive Guide */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Step 1 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#0284c7',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 3px 8px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <Share2 size={18} />
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.4, color: '#1e293b' }}>
                  <strong>1. Ketuk tombol Bagikan (Share)</strong>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.74rem' }}>
                    Ikon kotak bertanda panah ke atas di bar bawah Safari.
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#ec4899',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 3px 8px rgba(236, 72, 153, 0.3)',
                  }}
                >
                  <PlusSquare size={18} />
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.4, color: '#1e293b' }}>
                  <strong>2. Pilih &quot;Tambah ke Layar Utama&quot;</strong>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.74rem' }}>
                    Gulir ke bawah menu share lalu ketuk <em>&quot;Add to Home Screen&quot;</em>.
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#10b981',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 3px 8px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Check size={18} strokeWidth={3} />
                </div>
                <div style={{ fontSize: '0.82rem', lineHeight: 1.4, color: '#1e293b' }}>
                  <strong>3. Ketuk &quot;Tambah&quot; (Add) di kanan atas</strong>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.74rem' }}>
                    Ikon Pearly Booth langsung terpasang di Home Screen iPhone kamu!
                  </span>
                </div>
              </div>
            </div>

            {/* Apple PWA Features Pills */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                paddingTop: '2px',
              }}
            >
              <div
                style={{
                  background: '#f1f5f9',
                  borderRadius: '10px',
                  padding: '8px 6px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Zap size={14} color="#0284c7" />
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155' }}>Layar Penuh</span>
              </div>
              <div
                style={{
                  background: '#f1f5f9',
                  borderRadius: '10px',
                  padding: '8px 6px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={14} color="#ec4899" />
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155' }}>Tanpa App Store</span>
              </div>
              <div
                style={{
                  background: '#f1f5f9',
                  borderRadius: '10px',
                  padding: '8px 6px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ShieldCheck size={14} color="#10b981" />
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#334155' }}>Aman & Ringan</span>
              </div>
            </div>

            {/* Close / Action Button */}
            <button
              type="button"
              onClick={onClose}
              className="btn-pill-dark"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.92rem',
                borderRadius: '999px',
                marginTop: '4px',
                cursor: 'pointer',
              }}
            >
              Saya Mengerti
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
