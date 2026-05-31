'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/stores/auth';
import { ensureToken } from '@/lib/api';

const getHubUrl = () =>
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5221') + '/hubs/kahoot';

export interface LeaderboardSatir {
  sira: number;
  userId: number;
  ad: string;
  toplamPuan: number;
}

export interface SoruBilgisi {
  soruId: string;
  soruNo: number;
  toplamSoru: number;
  soru?: string;
  secA?: string;
  secB?: string;
  secC?: string;
  secD?: string;
}

function redirectToHome() {
  if (typeof window !== 'undefined') window.location.replace('/');
}

// SignalR için geçerli token al — api.ts ile paylaşılan refreshPromise kullanır (çakışma yok)
async function getToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) {
    // refreshToken yoksa kullanıcı zaten giriş yapmamış
    useAuthStore.getState().logout();
    redirectToHome();
    return '';
  }
  const token = await ensureToken();
  if (!token) {
    // Yenileme geçici olarak başarısız (ağ sorunu vb.) — logout yapma, bağlantı başarısız olsun
    return '';
  }
  return token;
}

export function useKahoot() {
  const hubRef = useRef<signalR.HubConnection | null>(null);

  const [connected, setConnected] = useState(false);
  const [oyuncuSayisi, setOyuncuSayisi] = useState(0);
  const [soruBilgisi, setSoruBilgisi] = useState<SoruBilgisi | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardSatir[]>([]);
  const [oyunBitti, setOyunBitti] = useState(false);
  const [oyunBasladi, setOyunBasladi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [cevapAlindi, setCevapAlindi] = useState(false);
  const [kazanilanPuan, setKazanilanPuan] = useState(0);

  // [] deps: tüm token işi accessTokenFactory içinde; bağımlılık yok
  const connect = useCallback(async (): Promise<boolean> => {
    if (hubRef.current) return true;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(getHubUrl(), {
        // Reconnect dahil her bağlantıda güncel token kullanılır
        accessTokenFactory: getToken,
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    conn.on('OyuncuKatildi', () => setOyuncuSayisi(p => p + 1));
    conn.on('OyunDurumu', (data: { oyuncuSayisi: number }) => setOyuncuSayisi(data.oyuncuSayisi));

    conn.on('OyunBasladi', (data: { soruId: string; toplamSoru: number; soru?: string; secA?: string; secB?: string; secC?: string; secD?: string }) => {
      setOyunBasladi(true);
      setSoruBilgisi({ soruId: data.soruId, soruNo: 1, toplamSoru: data.toplamSoru, soru: data.soru, secA: data.secA, secB: data.secB, secC: data.secC, secD: data.secD });
      setCevapAlindi(false);
    });

    conn.on('SoruGeldi', (data: SoruBilgisi) => {
      setSoruBilgisi(data);
      setCevapAlindi(false);
    });

    conn.on('Leaderboard', (data: LeaderboardSatir[]) => setLeaderboard(data));

    conn.on('OyunBitti', (data: LeaderboardSatir[]) => {
      setLeaderboard(data);
      setOyunBitti(true);
    });

    conn.on('CevapAlindi', (data: { puan: number }) => {
      setCevapAlindi(true);
      setKazanilanPuan(data.puan);
    });

    conn.on('Hata', (msg: string) => setHata(msg));

    conn.onreconnected(() => setConnected(true));
    conn.onreconnecting(() => setConnected(false));
    conn.onclose(() => setConnected(false));

    try {
      await conn.start();
      setConnected(true);
      hubRef.current = conn;
      return true;
    } catch {
      setHata('Bağlantı kurulamadı. Giriş yaptığınızdan emin olun.');
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    await hubRef.current?.stop();
    hubRef.current = null;
    setConnected(false);
  }, []);

  const joinGame = useCallback(async (oyunKodu: string) => {
    await hubRef.current?.invoke('JoinGame', oyunKodu);
  }, []);

  const joinAsTeacher = useCallback(async (oyunKodu: string) => {
    await hubRef.current?.invoke('JoinAsTeacher', oyunKodu);
  }, []);

  const startGame = useCallback(async (oyunKodu: string) => {
    await hubRef.current?.invoke('StartGame', oyunKodu);
  }, []);

  const endGame = useCallback(async (oyunKodu: string) => {
    await hubRef.current?.invoke('EndGame', oyunKodu);
  }, []);

  const nextQuestion = useCallback(async (oyunKodu: string) => {
    await hubRef.current?.invoke('NextQuestion', oyunKodu);
  }, []);

  const submitAnswer = useCallback(async (oyunKodu: string, cevap: string, sureMs: number) => {
    if (cevapAlindi) return;
    await hubRef.current?.invoke('SubmitAnswer', oyunKodu, cevap, sureMs);
  }, [cevapAlindi]);

  useEffect(() => () => { hubRef.current?.stop(); hubRef.current = null; }, []);

  return {
    connected,
    oyuncuSayisi,
    soruBilgisi,
    leaderboard,
    oyunBitti,
    oyunBasladi,
    hata,
    cevapAlindi,
    kazanilanPuan,
    connect,
    disconnect,
    joinGame,
    joinAsTeacher,
    startGame,
    endGame,
    nextQuestion,
    submitAnswer,
  };
}
