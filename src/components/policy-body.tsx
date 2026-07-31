// web/src/components/policy-body.tsx
// Gizlilik Politikası ve Kullanım Koşulları gibi uzun, bölümlü hukuki metin
// sayfalarının ortak render mantığı — iki sayfa da aynı veri şeklini kullanır.
import { Fragment } from 'react';

export type PolicyList = string[];
export type PolicySub = { title: string; list?: PolicyList; paragraphs?: PolicyList };
export type PolicySection = { title: string; paragraphs?: PolicyList; paragraphs2?: PolicyList; list?: PolicyList; subs?: PolicySub[]; note?: string };
export type PolicyData = { effective: string; intro: PolicyList; sections: PolicySection[] };

// **bold** işaretlerini <strong> olarak render eder (markdown bağımlılığı yok).
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) => (
        i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-800">{p}</strong> : <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}

export function PolicyBody({ data }: { data: PolicyData }) {
  return (
    <>
      <p className="text-sm font-medium text-slate-500">{data.effective}</p>

      {data.intro.map((p, i) => (
        <p key={`intro-${i}`} className="mt-6 text-[15px] leading-relaxed text-slate-600">
          <Rich text={p} />
        </p>
      ))}

      {data.sections.map((s, i) => (
        <section key={i} className="mt-12">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{i + 1}. {s.title}</h2>

          {s.paragraphs?.map((p, j) => (
            <p key={`p-${j}`} className="mt-3 text-[15px] leading-relaxed text-slate-600">
              <Rich text={p} />
            </p>
          ))}

          {s.list && (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-slate-600 marker:text-slate-400">
              {s.list.map((li, j) => (
                <li key={`li-${j}`}><Rich text={li} /></li>
              ))}
            </ul>
          )}

          {s.subs?.map((sub, k) => (
            <div key={`sub-${k}`} className="mt-5">
              <h3 className="text-[15px] font-bold text-slate-800">{sub.title}</h3>
              {sub.paragraphs?.map((p, j) => (
                <p key={`sp-${j}`} className="mt-2 text-[15px] leading-relaxed text-slate-600">
                  <Rich text={p} />
                </p>
              ))}
              {sub.list && (
                <ul className="mt-2 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-slate-600 marker:text-slate-400">
                  {sub.list.map((li, j) => (
                    <li key={`sli-${j}`}><Rich text={li} /></li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {s.paragraphs2?.map((p, j) => (
            <p key={`p2-${j}`} className="mt-3 text-[15px] leading-relaxed text-slate-600">
              <Rich text={p} />
            </p>
          ))}

          {s.note && (
            <p className="mt-3 text-[14px] italic leading-relaxed text-slate-500">
              <Rich text={s.note} />
            </p>
          )}
        </section>
      ))}
    </>
  );
}
