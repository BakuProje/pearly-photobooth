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
          background: 'rgba(26, 15, 7, 0.85)',
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
            background: 'linear-gradient(135deg, #fdfbf7 0%, #f4ebd9 100%)',
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(61, 38, 22, 0.08)',
            border: '3px solid #3d2616',
            width: '100%',
            maxWidth: '450px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Vintage Modal Header */}
          <div
            style={{
              background: permissionStatus === 'granted' ? '#1b4332' : '#2d180a',
              padding: '18px 22px',
              borderBottom: '2px solid #543720',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.3s ease',
              color: '#fdf7ee',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  background: 'rgba(255, 215, 154, 0.15)',
                  border: '1.5px solid rgba(255, 215, 154, 0.4)',
                  borderRadius: '12px',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffd79a',
                }}
              >
                {permissionStatus === 'granted' ? (
                  <CheckCircle2 size={24} color="#86efac" strokeWidth={2.5} />
                ) : (
                  <Camera size={24} color="#ffd79a" strokeWidth={2.2} />
                )}
              </div>
              <div>
                <h3
                  className="font-vintage-title"
                  style={{
                    margin: 0,
                    fontSize: '1.45rem',
                    color: '#ffd79a',
                    letterSpacing: '0.8px',
                    lineHeight: 1.1,
                  }}
                >
                  {permissionStatus === 'granted' ? 'Kamera Aktif!' : 'Aktifkan Kamera'}
                </h3>
                <span
                  className="font-vintage-serif"
                  style={{ fontSize: '0.84rem', color: '#ebd7bc', fontWeight: 600 }}
                >
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
                  background: 'rgba(46, 125, 50, 0.12)',
                  border: '1.5px solid #2e7d32',
                  borderRadius: '14px',
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
                    background: '#2e7d32',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <CheckCircle2 size={28} strokeWidth={3} />
                </div>
                <h4
                  className="font-vintage-serif"
                  style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1b4332' }}
                >
                  Izin Kamera Berhasil Diberikan! 🎉
                </h4>
                <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#2d180a', lineHeight: 1.4 }}>
                  Kamu sekarang bisa langsung foto estetik di Pearly PhotoBooth tanpa hambatan.
                </p>
              </div>
            ) : (
              <>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.92rem',
                    color: '#3d2616',
                    fontWeight: 600,
                    lineHeight: '1.5',
                  }}
                >
                  Pearly PhotoBooth memerlukan <b>izin kamera</b> agar kamu bisa mengambil foto langsung di booth dengan tampilan live.
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    background: 'rgba(237, 222, 199, 0.65)',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '1.5px solid #c4a480',
                  }}
                >
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3d2616', lineHeight: 1.4 }}>
                    ✦ Ambil pose & countdown otomatis live
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#3d2616', lineHeight: 1.4 }}>
                    ✦ 100% Aman & Privat (Kamera hanya di browser kamu)
                  </div>
                </div>

                {errorMessage && (
                  <div
                    style={{
                      background: '#fff1f2',
                      border: '1.5px solid #fda4af',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <AlertCircle size={18} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.82rem', color: '#9f1239', fontWeight: 700, lineHeight: '1.4' }}>
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
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    background: '#2d180a',
                    color: '#ffd79a',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '1rem',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: isRequesting ? 'wait' : 'pointer',
                    boxShadow: '0 6px 18px rgba(45, 24, 10, 0.45)',
                    border: '2px solid #ffd79a',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isRequesting ? (
                    <>
                      <RefreshCw size={19} className="animate-spin" />
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

