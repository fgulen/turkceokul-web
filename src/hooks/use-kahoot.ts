'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/stores/auth';

// Hub URL: direct to API (Next.js rewrites don't proxy WebSocket upgrades)
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
}

export function useKahoot() {
  const hubRef = useRef<signalR.HubConnection | null>(null);
  const { accessToken } = useAuthStore();

  const [connected, setConnected] = useState(false);
  const [oyuncuSayisi, setOyuncuSayisi] = useState(0);
  const [soruBilgisi, setSoruBilgisi] = useState<SoruBilgisi | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardSatir[]>([]);
  const [oyunBitti, setOyunBitti] = useState(false);
  const [oyunBasladi, setOyunBasladi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [cevapAlindi, setCevapAlindi] = useState(false);
  const [kazanilanPuan, setKazanilanPuan] = useState(0);

  const connect = useCallback(async () => {
    if (hubRef.current) return;
    if (!accessToken) { setHata('Giriş yapılmamış.'); return; }

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(getHubUrl(), {
        accessTokenFactory: () => accessToken,
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    conn.on('OyuncuKatildi', () => setOyuncuSayisi(p => p + 1));

    conn.on('OyunBasladi', (data: { soruId: string; toplamSoru: number }) => {
      setOyunBasladi(true);
      setSoruBilgisi({ soruId: data.soruId, soruNo: 1, toplamSoru: data.toplamSoru });
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
    } catch {
      setHata('Sunucuya bağlanılamadı. Sayfayı yenile.');
    }
  }, [accessToken]);

  const disconnect = useCallback(async () => {
    await hubRef.current?.stop();
    hubRef.current = null;
    setConnected(false);
  }, []);

  const joinGame = useCallback(async (oyunKodu: string) => {
    await hubRef.current?.invoke('JoinGame', oyunKodu);
  }, []);

  const startGame = useCallback(async (oyunKodu: string) => {
    await hubRef.current?.invoke('StartGame', oyunKodu);
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
    startGame,
    nextQuestion,
    submitAnswer,
  };
}
