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
          className="neo-card"
          style={{
            background: '#ffffff',
            border: '3px solid var(--neo-black)',
            borderRadius: '24px',
            boxShadow: '8px 8px 0px var(--neo-black)',
            width: '100%',
            maxWidth: '460px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              background: permissionStatus === 'granted' ? 'var(--neo-green)' : 'var(--neo-primary)',
              padding: '16px 20px',
              borderBottom: '3px solid var(--neo-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '2px solid var(--neo-black)',
                  boxShadow: '2px 2px 0px var(--neo-black)',
                  borderRadius: '12px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {permissionStatus === 'granted' ? (
                  <CheckCircle2 size={22} color="var(--neo-black)" strokeWidth={2.5} />
                ) : (
                  <Camera size={22} color="var(--neo-black)" strokeWidth={2.5} />
                )}
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: 'var(--neo-black)',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.3px',
                  }}
                >
                  {permissionStatus === 'granted' ? 'KAMERA AKTIF!' : 'AKTIFKAN KAMERA'}
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.85 }}>
                  Snapbooth Studio 📸
                </span>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {permissionStatus === 'granted' ? (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '2px solid #22c55e',
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
                    border: '2px solid var(--neo-black)',
                    boxShadow: '3px 3px 0px var(--neo-black)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <CheckCircle2 size={28} strokeWidth={3} />
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--neo-black)' }}>
                  Izin Kamera Berhasil Diberikan! 🎉
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#15803d' }}>
                  Kamu sekarang bisa langsung foto estetik di Snapbooth tanpa hambatan.
                </p>
              </div>
            ) : (
              <>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.88rem',
                    color: 'var(--neo-black)',
                    fontWeight: 600,
                    lineHeight: '1.45',
                  }}
                >
                  Snapbooth memerlukan <b>izin kamera</b> agar kamu bisa mengambil foto langsung di booth tanpa error atau terhambat.
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    background: '#f8fafc',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '2px solid var(--neo-black)',
                  }}
                >
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--neo-black)', lineHeight: 1.4 }}>
                    • Ambil pose & countdown otomatis live
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--neo-black)', lineHeight: 1.4 }}>
                    • 100% Aman & Privat (Kamera hanya di browser kamu)
                  </div>
                </div>

                {errorMessage && (
                  <div
                    style={{
                      background: '#fee2e2',
                      border: '2px solid #ef4444',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.78rem', color: '#991b1b', fontWeight: 700, lineHeight: '1.35' }}>
                      {errorMessage}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {permissionStatus !== 'granted' && (
                <button
                  onClick={handleRequestCamera}
                  disabled={isRequesting}
                  className="neo-btn"
                  style={{
                    width: '100%',
                    padding: '13px 16px',
                    background: 'var(--neo-primary)',
                    color: 'var(--neo-black)',
                    border: '2.5px solid var(--neo-black)',
                    borderRadius: '14px',
                    boxShadow: '4px 4px 0px var(--neo-black)',
                    fontWeight: 900,
                    fontSize: '0.96rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isRequesting ? 'wait' : 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2px',
                  }}
                >
                  {isRequesting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Meminta Izin Browser...</span>
                    </>
                  ) : (
                    <>
                      <Camera size={20} strokeWidth={2.5} />
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

