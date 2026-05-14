import { Link } from '@/navigation';
import { Flame, Heart, Zap, Trophy, ArrowRight, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Flame,
    title: "Günlük Streak",
    desc: "Her gün çalış, streakini koru. Bir günü kaçırırsan sayaç sıfırlanır.",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-500",
  },
  {
    icon: Heart,
    title: "Kalp Sistemi",
    desc: "5 hakkın var. Her yanlış cevap bir kalp götürür, 30 dakikada bir yenilenir.",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    icon: Zap,
    title: "XP ve Combo",
    desc: "Doğru cevaplar XP kazandırır. Ardışık doğrular combo çarpanı verir.",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Trophy,
    title: "Haftalık Lig",
    desc: "30 kişilik gruplarda yarış. Zirveye çık, bir üst lige yüksel.",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
];

const steps = [
  {
    n: "01",
    title: "Seviyeni seç",
    desc: "A1'den C2'ye CEFR seviyene uygun kitabı bul.",
  },
  {
    n: "02",
    title: "Etkinlikleri tamamla",
    desc: "Quiz, eşleştirme, boşluk doldurma ve daha fazlası.",
  },
  {
    n: "03",
    title: "Lig'de yüksel",
    desc: "Haftalık tablodan zirveye çık, bir üst lige terfi et.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/giris" className={cn(buttonVariants({ variant: "ghost" }))}>
              Giriş Yap
            </Link>
            <Link href="/kayit" className={cn(buttonVariants())}>
              Ücretsiz Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-[88vh] flex items-center">
        <div className="max-w-[1200px] mx-auto px-4 py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Star className="size-3.5" />
            A1&rsquo;den C2&rsquo;ye &mdash; Nevlisan yayınları
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Türkçe öğren,
            <br />
            <span className="text-primary">dünyayla konuş.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
            Gerçek ders kitapları, oyun mekaniği ve canlı lig rekabeti.
            Streak, combo ve günlük görevlerle ilerlemeyi bırakamazsın.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/kayit" className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Ücretsiz Başla
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/giris"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Zaten hesabım var
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-muted border-y border-border py-14">
        <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { val: "53.000+", label: "Kayıtlı öğrenci" },
            { val: "30+", label: "Ders kitabı" },
            { val: "A1–C2", label: "CEFR seviyeleri" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold text-foreground">{s.val}</div>
              <div className="text-muted-foreground mt-1 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Neden TürkçeOkulu?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Öğrenmeyi alışkanlığa dönüştüren mekanikler.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                <div
                  className={cn(
                    "size-12 rounded-xl flex items-center justify-center mb-4",
                    f.iconBg
                  )}
                >
                  <f.icon className={cn("size-6", f.iconColor)} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted border-y border-border py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Nasıl çalışır?</h2>
            <p className="text-muted-foreground">
              Üç adımda Türkçe öğrenmeye başla.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className="text-6xl font-bold text-primary/15 mb-4 leading-none">
                  {s.n}
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Bugün başla.</h2>
          <p className="text-primary-foreground/70 mb-10 text-lg">
            Ücretsiz kayıt ol, ilk dersini hemen aç.
          </p>
          <Link
            href="/kayit"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-white text-primary hover:bg-white/90"
            )}
          >
            Ücretsiz Kayıt Ol
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <span>&copy; 2026 TürkçeOkulu. Tüm hakları saklıdır.</span>
        </div>
      </footer>
    </div>
  );
}
