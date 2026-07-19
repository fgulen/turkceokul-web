import { Link } from '@/navigation';

export default function NotFound() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-[2rem] p-8 text-center max-w-xs w-full shadow-xl">
        <div className="text-6xl font-extrabold text-primary mb-2">404</div>
        <h2 className="text-xl font-bold mb-2">Sayfa bulunamadı</h2>
        <p className="text-muted-foreground text-sm mb-7">
          Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.
        </p>
        <Link
          href="/pano"
          className="block w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
        >
          Panele Dön
        </Link>
      </div>
    </div>
  );
}
