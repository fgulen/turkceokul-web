'use client';

// Statik personel dokümantasyonu — API çağrısı yok, i18n yok (staff paneli TR-only,
// bkz. diğer (staff) sayfaları). SuperAdmin ve Koordinator panellerinden aynı
// component reuse edilir (bkz. KurumsalSatisSayfasi deseni).

function Kart({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{baslik}</h3>
      {children}
    </div>
  );
}

function Adim({ no, baslik, aciklama }: { no: number; baslik: string; aciklama: string }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 size-6 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold flex items-center justify-center mt-0.5">
        {no}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800">{baslik}</p>
        <p className="text-xs text-slate-500 mt-0.5">{aciklama}</p>
      </div>
    </div>
  );
}

const ROLLER: { rol: string; kod: string; aciklama: string }[] = [
  { rol: 'SuperAdmin', kod: 'SuperAdmin', aciklama: 'Sistemin tamamına erişir. Ülke/kurum/kitap/kullanıcı yönetimi, tüm raporlar.' },
  { rol: 'Koordinatör', kod: 'Koordinator', aciklama: 'SuperAdmin\'e en yakın rol — kurumsal satış, ülke açma, temsilci atama, öğretmen davet. Ülke/kurum bazlı kısıtlaması yok.' },
  { rol: 'Ülke Temsilcisi', kod: 'UlkeTemsilcisi', aciklama: 'Kendi ülkesindeki kurumları yönetir, lead\'leri kuruma dönüştürür, kurum yöneticisi davet eder. Aynı zamanda bizzat sınıf açıp öğretmenlik de yapabilir.' },
  { rol: 'Kurum Yöneticisi', kod: 'KurumYoneticisi', aciklama: 'Kendi kurumundaki sınıfları/öğretmenleri yönetir, lisans durumunu görür.' },
  { rol: 'Öğretmen', kod: 'Ogretmen', aciklama: 'Sınıf açar, öğrenci ekler, etkinlik atar. Kurumsuz da çalışabilir (bireysel öğretmen kaydı).' },
  { rol: 'Öğrenci', kod: 'Ogrenci', aciklama: 'Etkinlikleri çözer, XP/kalp/lig sistemiyle ilerler. Sınıfa katılım kodu ile girer.' },
  { rol: 'Editör', kod: 'Editor', aciklama: 'İçerik ekibi — okuma kitapları/kütüphane içeriğini yönetir, satış/organizasyon yetkisi yok.' },
];

export function NasilCalisirSayfasi() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Sistem Nasıl Çalışır</h1>
        <p className="text-sm text-slate-500 mt-1">
          Organizasyon yapısı, roller ve kurumsal satış akışı — müşteriyle konuşurken ya da bir lead işlerken hızlı referans.
        </p>
      </div>

      <Kart baslik="Organizasyon Hiyerarşisi">
        <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-medium">Ülke</span>
          <span className="text-slate-300">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-medium">Kurum</span>
          <span className="text-slate-300">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-medium">Sınıf</span>
          <span className="text-slate-300">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-medium">Öğrenci</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong className="text-slate-700">Ülke tablosu gerçek bir coğrafya listesi değil</strong> — kurumsal satış ve yetki
          amaçlı bir yapı. Sadece staff tarafından açılmış (temsilcisi olan) ülkeler burada yer alır; genel
          &quot;hangi ülkedesin&quot; sorusu için kullanılmaz. Bir Ülke, aynı zamanda o bölgedeki kurumlara erişimi
          sınırlayan bir yetki sınırıdır (Ülke Temsilcisi kendi ülkesi dışındaki kuruma erişemez).
        </p>
      </Kart>

      <Kart baslik="Roller ve Yetkiler">
        <div className="divide-y divide-slate-100">
          {ROLLER.map((r) => (
            <div key={r.kod} className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
              <span className="sm:w-40 shrink-0">
                <span className="text-xs font-semibold text-slate-700">{r.rol}</span>
                <span className="block text-[10px] text-slate-400 font-mono">{r.kod}</span>
              </span>
              <span className="text-xs text-slate-500">{r.aciklama}</span>
            </div>
          ))}
        </div>
      </Kart>

      <Kart baslik="İçerik Hiyerarşisi">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">Ders Kitabı</span>
          <span className="text-slate-300">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">Ünite (CEFR A1–C2)</span>
          <span className="text-slate-300">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">Bölüm</span>
          <span className="text-slate-300">→</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">Etkinlik</span>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Can / Yağmur / Harmoni (Nevai Yayınları) — her biri ayrı bir kitap serisi. Ünite final skoru: %40 etkinlik
          ortalaması + %60 final sınavı.
        </p>
      </Kart>

      <Kart baslik="Kurumsal Satış — Lead Akışı">
        <div className="space-y-4">
          <Adim no={1} baslik="Demo talebi (public, /kurumsal-satis)"
            aciklama="Ziyaretçi kurum adı + serbest metin ülke adı + iletişim bilgisiyle demo/teklif ister. Ülke otomatik, case-insensitive (Türkçe-güvenli) eşleştirilir." />
          <Adim no={2} baslik="Eşleşti mi?"
            aciklama="Eşleşen ülke varsa lead direkt o ülkenin temsilcisinin Bekleyen Talepler kuyruğuna düşer — 3. adıma gerek yok." />
          <Adim no={3} baslik="Eşleşmedi → Ülkesi Eksik (SuperAdmin/Koordinator)"
            aciklama="Kurumsal Satış ekranında turuncu rozetle görünür. İki seçenek: mevcut bir ülkeye bağla, ya da yeni ülke aç + lead'i gönderen kişiyi o ülkenin temsilcisi olarak davet et (otomatik mail, gidemezse link fallback)." />
          <Adim no={4} baslik="Temsilci lead'i kuruma dönüştürür"
            aciklama="Ülke Temsilcisi kendi Bekleyen Talepler'inde lead'i görür, Kurum'a çevirir + deneme lisansı başlatır." />
          <Adim no={5} baslik="Kurum Yöneticisi + Öğretmen davet edilir"
            aciklama="Temsilci davet linki gönderir, davet edilen kişi kendi şifresini belirleyip hesabını oluşturur." />
          <Adim no={6} baslik="Sınıf açılır, öğrenciler katılım koduyla girer"
            aciklama="Öğretmen sınıf açar, katılım kodu paylaşır; öğrenciler /kayit'tan normal kayıt olup kodu girerek sınıfa katılır." />
        </div>
      </Kart>

      <Kart baslik="Gamification (özet)">
        <ul className="text-xs text-slate-500 space-y-1.5 list-disc list-inside">
          <li><strong className="text-slate-700">Kalp:</strong> 5 başlangıç, yanlış cevapta -1, 30 dakikada +1 yenilenir</li>
          <li><strong className="text-slate-700">XP + Combo:</strong> 2x→3x→5x→10x zincir + hız bonusu</li>
          <li><strong className="text-slate-700">Lig:</strong> haftalık, 30 kişilik gruplar, ülke bazlı segmentasyon, 10 seviye (Bronz→Taç)</li>
          <li><strong className="text-slate-700">Sanal para (Lira):</strong> kozmetik, pay-to-win yok</li>
          <li><strong className="text-slate-700">Multiplayer:</strong> Kahoot (öncelikli), 1v1 Düello, Haftalık Şampiyona</li>
        </ul>
      </Kart>
    </div>
  );
}
