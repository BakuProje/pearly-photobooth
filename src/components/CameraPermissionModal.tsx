'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraPermissionModalProps {
  onPermissionGranted?: () => void;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  onPermissionGranted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkInitialPermission = async () => {
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (!isMounted) return;

          if (status.state === 'granted') {
            setPermissionStatus('granted');
            setIsOpen(false);
            onPermissionGranted?.();
          } else {
            setPermissionStatus(status.state === 'denied' ? 'denied' : 'idle');
            setIsOpen(true);
          }
          status.onchange = () => {
            if (!isMounted) return;
            if (status.state === 'granted') {
              setPermissionStatus('granted');
              setErrorMessage(null);
              setIsOpen(false);
              onPermissionGranted?.();
            } else if (status.state === 'denied') {
              setPermissionStatus('denied');
            }
          };
        } catch (err) {
          const sessionGranted = sessionStorage.getItem('snapbooth_camera_granted');
          if (!sessionGranted) {
            setIsOpen(true);
          }
        }
      } else {
        const sessionGranted = sessionStorage.getItem('snapbooth_camera_granted');
        if (!sessionGranted) {
          setIsOpen(true);
        }
      }
    };

    checkInitialPermission();

    return () => {
      isMounted = false;
    };
  }, [onPermissionGranted]);

  const handleRequestCamera = useCallback(async () => {
    setIsRequesting(true);
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      stream.getTracks().forEach((track) => track.stop());

      setPermissionStatus('granted');
      sessionStorage.setItem('snapbooth_camera_granted', 'true');
      setIsRequesting(false);
      onPermissionGranted?.();

      setTimeout(() => {
        setIsOpen(false);
      }, 700);
    } catch (err: any) {
      console.warn('Camera request rejected or unavailable:', err);
      setIsRequesting(false);
      setPermissionStatus('denied');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Izin kamera ditolak. Silakan klik ikon gembok/kamera di samping URL browser untuk mengizinkan akses kamera.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('Perangkat kamera tidak terdeteksi pada laptop/perangkat Anda.');
      } else {
        setErrorMessage('Tidak dapat mengakses kamera. Pastikan browser memiliki izin dan kamera tidak sedang dipakai aplikasi lain.');
      }
    }
  }, [onPermissionGranted]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            border: '1px solid #e2e8f0',
            width: '100%',
            maxWidth: '440px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              background: permissionStatus === 'granted' ? '#166534' : '#1e293b',
              padding: '18px 22px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.3s ease',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '12px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                }}
              >
                {permissionStatus === 'granted' ? (
                  <CheckCircle2 size={22} color="#ffffff" strokeWidth={2.5} />
                ) : (
                  <Camera size={22} color="#ffffff" strokeWidth={2.5} />
                )}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '0.3px',
                  }}
                >
                  {permissionStatus === 'granted' ? 'Kamera Aktif!' : 'Aktifkan Kamera'}
                </h3>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>
                  Pearly PhotoBooth 📸
                </span>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {permissionStatus === 'granted' ? (
              <div
                style={{
                  padding: '18px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid #86efac',
                  borderRadius: '16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <CheckCircle2 size={26} strokeWidth={3} />
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: '#166534' }}>
                  Izin Kamera Berhasil Diberikan! 🎉
                </h4>
                <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: '#15803d' }}>
                  Kamu sekarang bisa langsung foto estetik di Pearly PhotoBooth tanpa hambatan.
                </p>
              </div>
            ) : (
              <>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: '#334155',
                    fontWeight: 600,
                    lineHeight: '1.5',
                  }}
                >
                  Pearly PhotoBooth memerlukan <b>izin kamera</b> agar kamu bisa mengambil foto langsung di booth tanpa hambatan.
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    background: '#f8fafc',
                    padding: '14px 16px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', lineHeight: 1.4 }}>
                    • Ambil pose & countdown otomatis live
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', lineHeight: 1.4 }}>
                    • 100% Aman & Privat (Kamera hanya di browser kamu)
                  </div>
                </div>

                {errorMessage && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 700, lineHeight: '1.4' }}>
                      {errorMessage}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              {permissionStatus !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestCamera}
                  disabled={isRequesting}
                  className="btn-pill-dark"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: '#1e293b',
                    color: '#ffffff',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '0.96rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isRequesting ? 'wait' : 'pointer',
                    boxShadow: '0 6px 18px rgba(30, 41, 59, 0.25)',
                    border: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isRequesting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Meminta Izin Browser...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={19} strokeWidth={2.5} />
                      <span>{permissionStatus === 'denied' ? 'Coba Izinkan Kamera Lagi' : 'Izinkan Kamera Sekarang'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

