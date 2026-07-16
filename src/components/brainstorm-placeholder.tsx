interface BrainstormPlaceholderProps {
  /** Eksik içerik alanının adı, ör. "GDPR Uyumlu Gizlilik Metni" */
  alan: string;
  /** CLS koruması için sabit min yükseklik (px). Varsayılan 160. */
  minHeight?: number;
}

// Uydurma içerik yasak (bkz. proje kuralları) — bu bileşen, henüz yazılmamış
// hukuki/kurumsal metinlerin yerini tutan görsel bir yer tutucudur. `minHeight`
// runtime'da değişebilen tek sayısal değer olduğu için Tailwind'in statik
// arbitrary-value taramasıyla ifade edilemez; bilinçli olarak inline style
// kullanılıyor, geri kalan tüm görsel stil Tailwind utility sınıflarıyla verildi.
export function BrainstormPlaceholder({ alan, minHeight = 160 }: BrainstormPlaceholderProps) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 text-center"
      style={{ minHeight }}
    >
      <p className="text-sm font-medium text-slate-400">
        [ Brainstorming / Bu İçerik Eklenecek: {alan} ]
      </p>
    </div>
  );
}
