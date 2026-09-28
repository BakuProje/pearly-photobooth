'use client';

import React from 'react';
import {
  Printer,
  Maximize2,
  FileImage,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrintChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrintStandard: () => void;
  onSelectPrint4R: () => void;
  onSelectPrint2R: () => void;
}

export const PrintChooserModal: React.FC<PrintChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectPrintStandard,
  onSelectPrint4R,
  onSelectPrint2R,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99998,
          background: 'rgba(26, 15, 7, 0.84)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            background: 'linear-gradient(135deg, #fdfbf7 0%, #f4ebd9 100%)',
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55), inset 0 0 20px rgba(61, 38, 22, 0.08)',
            border: '3px solid #3d2616',
            width: '100%',
            maxWidth: '520px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: '#1a0f07',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              background: '#2d180a',
              padding: '16px 22px',
              borderBottom: '2px solid #543720',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#fdf7ee',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  background: 'rgba(255, 215, 154, 0.15)',
                  border: '1.5px solid rgba(255, 215, 154, 0.4)',
                  borderRadius: '10px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffd79a',
                }}
              >
                <Printer size={22} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: '#ffd79a',
                    letterSpacing: '0.2px',
                  }}
                >
                  Pilihan Cetak Foto
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#ebd7bc', fontWeight: 500 }}>
                  Silakan pilih format ukuran cetak yang diinginkan
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 215, 154, 0.15)',
                border: '1px solid rgba(255, 215, 154, 0.3)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fdf7ee',
                transition: 'all 0.15s ease',
              }}
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body: 3 Print Format Options */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Option 1: Print Biasa */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onSelectPrintStandard();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '2px solid #3d2616',
                boxShadow: '0 4px 12px rgba(45, 24, 10, 0.08)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#ebd7bc',
                    border: '1.5px solid #3d2616',
                    color: '#3d2616',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Printer size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#1a0f07' }}>
                      Print Biasa (Photostrip)
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: '#e2e8f0',
                        color: '#334155',
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      Format Asli
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#543720', fontWeight: 500, lineHeight: 1.35 }}>
                    Cetak langsung strip foto sesuai ukuran dan rasio desain photobooth asli.
                  </p>
                </div>
              </div>

              <ChevronRight size={20} color="#3d2616" style={{ flexShrink: 0, marginLeft: '8px' }} />
            </motion.button>

            {/* Option 2: Print 4R */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onSelectPrint4R();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '2px solid #3d2616',
                boxShadow: '0 4px 12px rgba(45, 24, 10, 0.08)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#ebd7bc',
                    border: '1.5px solid #3d2616',
                    color: '#3d2616',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Maximize2 size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#1a0f07' }}>
                      Print Ukuran 4R
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: '#dbeafe',
                        color: '#1e40af',
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      4 × 6 Inch (10 × 15 cm)
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#543720', fontWeight: 500, lineHeight: 1.35 }}>
                    Format standar lab foto (Full Bleed, Twin 2-in-1 gunting tengah, atau dengan margin).
                  </p>
                </div>
              </div>

              <ChevronRight size={20} color="#3d2616" style={{ flexShrink: 0, marginLeft: '8px' }} />
            </motion.button>

            {/* Option 3: Print 2R */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onSelectPrint2R();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '2px solid #3d2616',
                boxShadow: '0 4px 12px rgba(45, 24, 10, 0.08)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#ebd7bc',
                    border: '1.5px solid #3d2616',
                    color: '#3d2616',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileImage size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#1a0f07' }}>
                      Print Ukuran 2R
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      2.5 × 3.5 Inch (Dompet)
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#543720', fontWeight: 500, lineHeight: 1.35 }}>
                    Format saku & dompet (Full Bleed, Twin 2-in-1 di kertas 4R, atau Grid 4-in-1).
                  </p>
                </div>
              </div>

              <ChevronRight size={20} color="#3d2616" style={{ flexShrink: 0, marginLeft: '8px' }} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
