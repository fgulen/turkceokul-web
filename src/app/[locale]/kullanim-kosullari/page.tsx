// web/src/app/[locale]/kullanim-kosullari/page.tsx
import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing-nav';
import { LandingFooter } from '@/components/landing-footer';
import { PolicyBody, type PolicyData } from '@/components/policy-body';

const BASE = 'https://turkceokulu.com';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const path = `/${locale}/kullanim-kosullari`;

  return isEn ? {
    title: 'Terms of Use — Türkçe Okulu',
    description: 'The terms and conditions governing your use of the Türkçe Okulu platform.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { en: `${BASE}/en/kullanim-kosullari`, tr: `${BASE}/tr/kullanim-kosullari` } },
    openGraph: {
      title: 'Terms of Use — Türkçe Okulu',
      description: 'The terms and conditions governing your use of the Türkçe Okulu platform.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'en_GB',
      alternateLocale: ['tr_TR'],
    },
  } : {
    title: 'Kullanım Koşulları — Türkçe Okulu',
    description: 'Türkçe Okulu platformunu kullanımınızı düzenleyen şart ve koşullar.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { tr: `${BASE}/tr/kullanim-kosullari`, en: `${BASE}/en/kullanim-kosullari` } },
    openGraph: {
      title: 'Kullanım Koşulları — Türkçe Okulu',
      description: 'Türkçe Okulu platformunu kullanımınızı düzenleyen şart ve koşullar.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'tr_TR',
      alternateLocale: ['en_GB'],
    },
  };
}

const P: PolicyData = {
  effective: 'Yürürlük tarihi: 31 Temmuz 2026',
  intro: [
    'Bu Kullanım Koşulları ("Koşullar"), Nevai Yayınları ("Türkçe Okulu", "biz" veya "bizim") tarafından işletilen https://turkceokulu.com adresindeki dil öğretim platformunun ("Site" veya "Hizmet") kullanımını düzenler. Hizmete kaydolarak veya Hizmeti herhangi bir şekilde kullanarak bu Koşulları kabul etmiş olursunuz. Bu Koşulları kabul etmiyorsanız lütfen Hizmeti kullanmayınız.',
    'Kişisel verilerinizin nasıl toplandığı ve işlendiği hakkında bilgi için ayrıca Gizlilik Politikamızı okuyunuz; bu Koşulların ayrılmaz bir parçasıdır.',
  ],
  sections: [
    {
      title: 'Hesap Oluşturma ve Uygunluk',
      list: [
        '**Yaş sınırı** — Hizmet en az 13 yaşında olan kişilere yöneliktir. Bir okul, öğretmen veya kurum daha genç öğrenciler adına sınıf hesabı yönetiyorsa, gerekli ebeveyn/okul onayını almak o kurumun sorumluluğundadır.',
        '**Doğru bilgi** — kayıt sırasında verdiğiniz bilgilerin (ad, e-posta, kurum kodu vb.) doğru ve güncel olduğunu beyan edersiniz.',
        '**Hesap güvenliği** — parolanızın veya öğrenci PIN\'inizin gizliliğinden ve hesabınız altında gerçekleşen tüm etkinlikten siz sorumlusunuz. Hesabınızın izinsiz kullanıldığından şüpheleniyorsanız derhal bize bildirin.',
        '**Kişi başı bir hesap** — hesaplar kişiseldir; başkasına devredilemez veya birden fazla kişi tarafından paylaşılamaz. Sınıf katılım kodları yalnızca o sınıfa kayıtlı öğrenciler için kullanılabilir.',
        '**Kurumsal/öğretmen hesapları** — bir kurum adına hesap açan öğretmen veya yönetici, o kurumu bu Koşullara bağlama yetkisine sahip olduğunu beyan eder.',
      ],
    },
    {
      title: 'Hizmetin Kapsamı',
      paragraphs: [
        'Türkçe Okulu; CEFR uyumlu ders içeriği, alıştırmalar, oyunlaştırma (kalpler, puan, seri, lig, sanal para), çok oyunculu özellikler (Kahoot benzeri sınıf oturumları, düellolar) ve öğretmenler için AI destekli içerik stüdyosu sunar.',
        'Hizmeti geliştirmek amacıyla özellikleri zaman zaman ekleyebilir, değiştirebilir veya kaldırabiliriz. Planlı bakım veya öngörülemeyen kesintiler nedeniyle Hizmetin kesintisiz veya hatasız olacağını garanti etmeyiz.',
      ],
    },
    {
      title: 'Kabul Edilebilir Kullanım',
      paragraphs: ['Hizmeti kullanırken aşağıdakileri yapmamayı kabul edersiniz:'],
      list: [
        'Kahoot oturumlarında, düellolarda veya bireysel alıştırmalarda hile yapmak, otomasyon/bot kullanmak veya puan/lig sonuçlarını manipüle etmek.',
        'Hizmeti tersine mühendislik yapmak, kaynak koduna erişmeye çalışmak veya API\'lerini yetkisiz biçimde kazımak (scraping) ya da otomatikleştirilmiş şekilde sorgulamak.',
        'Yasa dışı, hakaret içeren, ayrımcı, müstehcen veya üçüncü taraf haklarını (telif hakkı dahil) ihlal eden içerik yüklemek veya paylaşmak.',
        'Başka bir kullanıcının kimliğine bürünmek, sınıf katılım kodunu yetkisiz kişilerle paylaşmak veya yetkisiz bir hesap oluşturmak.',
        'Hizmetteki bir güvenlik açığından veya hatadan kişisel çıkar sağlamak amacıyla yararlanmak; bir açık bulursanız bunu istismar etmek yerine bizimle iletişime geçmenizi rica ederiz.',
        'Hizmeti, sunucularımıza makul olmayan bir yük bindirecek şekilde veya diğer kullanıcıların erişimini engelleyecek şekilde kullanmak.',
      ],
      note: 'Bu Koşulların ihlali, önceden bildirimde bulunmaksızın hesabınızın askıya alınmasına veya sona erdirilmesine yol açabilir (bkz. Bölüm 7).',
    },
    {
      title: 'İçerik ve Fikri Mülkiyet Hakları',
      list: [
        '**Bizim içeriğimiz** — ders kitabı müfredatı, metinler ve ilişkili materyaller Nevai Yayınları\'na aittir; platform yazılımı, tasarımı ve markası Türkçe Okulu\'na aittir. Hizmete erişiminiz, bu içeriği yalnızca kişisel öğrenim amacıyla (veya öğretmenseniz sınıfınızla) kullanmanız için sınırlı, devredilemez bir lisans sağlar — yeniden satış, toplu indirme veya kamuya yeniden dağıtım hakkı vermez.',
        '**Sizin içeriğiniz** — öğretmenler tarafından yüklenen veya AI destekli araçlarla oluşturulan etkinlik, çalışma kâğıdı ve dijital yayınların mülkiyeti size aittir. Bu içeriği yükleyerek, bunu ilgili sınıf/kurum bağlamında barındırmamız, görüntülememiz ve dağıtmamız için bize dünya çapında, telifsiz bir lisans vermiş olursunuz.',
        '**AI destekli üretim** — içerik stüdyosunu kullandığınızda üretilen taslaklardan ve bunları yayınlama kararınızdan siz sorumlusunuz; üçüncü taraf haklarını ihlal etmediğinden emin olmanız gerekir (bkz. Gizlilik Politikası Bölüm 5).',
        '**Geri bildirim** — Hizmet hakkında bize gönüllü olarak ilettiğiniz öneri veya geri bildirimleri, size herhangi bir bedel ödemeksizin ürünü geliştirmek için kullanabiliriz.',
      ],
    },
    {
      title: 'Ücretli Hizmetler ve Ödeme',
      list: [
        '**Ücretsiz katman** — Hizmetin temel özelliklerine ücretsiz erişebilirsiniz; ücretsiz katmanın kapsamını zaman zaman değiştirebiliriz.',
        '**Kurumsal lisanslar** — okullar ve kurumlar, kitap serisi ve dijital platform için teklif/sipariş süreciyle lisans satın alabilir. Fiyatlandırma, kapasite ve fatura koşulları ilgili teklif veya sipariş belgesinde belirtilir.',
        '**Ödeme işleme** — kredi kartı numaralarını veya diğer hassas ödeme verilerini kendi sunucularımızda saklamayız; ödemeler üçüncü taraf ödeme sağlayıcıları aracılığıyla işlenir (bkz. Gizlilik Politikası Bölüm 8).',
        '**Kesin satış** — kanunen zorunlu olan durumlar hariç, ücretli lisanslar ve abonelikler kesin satıştır; iade yapılmaz. Bir ödeme anlaşmazlığınız varsa Bölüm 14\'teki iletişim bilgilerinden bize ulaşın.',
        '**Ödenmeme** — zamanında ödenmeyen kurumsal lisanslar için erişimi askıya alma hakkımızı saklı tutarız.',
      ],
    },
    {
      title: 'Sanal Para ve Oyunlaştırma',
      paragraphs: ['Hizmet; kalpler, puan (XP), seri (streak), kombo, lig seviyesi ve sanal para (Lira) gibi oyunlaştırma unsurları içerir.'],
      list: [
        'Sanal para ve oyunlaştırma unsurlarının gerçek dünyada parasal bir değeri yoktur; nakde çevrilemez, başka bir kullanıcıya devredilemez veya Hizmet dışında satılamaz.',
        'Bu unsurlar tamamen kozmetiktir — ödeme yapmak, öğrenme içeriğine erişimde veya ders sonuçlarında bir avantaj sağlamaz ("kazanmak için ödeme yok" ilkesi).',
        'Dengeleme, hata düzeltmesi veya kötüye kullanımı önleme amacıyla bakiyeleri, lig sıralamalarını veya puanları ayarlama veya sıfırlama hakkımızı saklı tutarız.',
      ],
    },
    {
      title: 'Hesap Askıya Alma ve Fesih',
      list: [
        '**Bizim tarafımızdan** — bu Koşulları ihlal etmeniz, hile/kötüye kullanım şüphesi veya kurumsal lisanslarda ödenmeme durumunda hesabınızı askıya alabilir veya sona erdirebiliriz. Mümkün olduğunda önceden bilgilendirme yapmaya çalışırız.',
        '**Sizin tarafınızdan** — hesabınızı istediğiniz zaman Hizmet üzerinden veya Bölüm 14\'teki iletişim bilgileri aracılığıyla silebilirsiniz.',
        '**Fesih sonrası** — hesabınızın kapatılması sonrasında kişisel verileriniz, Gizlilik Politikamızın Veri Saklama ve Depolama bölümünde açıklandığı şekilde silinir veya anonimleştirilir.',
      ],
    },
    {
      title: 'Üçüncü Taraf Hizmetler',
      paragraphs: ['Hizmet; Google OAuth (giriş), Anthropic (AI içerik üretimi), PostHog (analitik), Sentry (hata izleme) ve barındırma/CDN sağlayıcıları gibi üçüncü taraf hizmetlerini kullanır veya bunlara bağlantı verebilir. Bu üçüncü taraf hizmetlerin kendi kullanım koşulları ve gizlilik politikaları geçerlidir; içeriklerinden veya uygulamalarından sorumlu değiliz.'],
    },
    {
      title: 'Garanti Reddi',
      paragraphs: ['Hizmet "olduğu gibi" ve "mevcut olduğu şekilde" sunulur. Yasaların izin verdiği azami ölçüde, Hizmetin kesintisiz, hatasız veya güvenli olacağına, belirli bir öğrenim sonucuna (örneğin belirli bir sınav puanına veya CEFR seviyesine ulaşacağınıza) veya belirli bir amaca uygunluğuna dair açık ya da zımni hiçbir garanti vermeyiz.'],
    },
    {
      title: 'Sorumluluğun Sınırlandırılması',
      paragraphs: [
        'Yasaların izin verdiği azami ölçüde, Türkçe Okulu ve Nevai Yayınları; kâr kaybı, veri kaybı veya iş kesintisi dahil olmak üzere, Hizmetin kullanımından veya kullanılamamasından kaynaklanan hiçbir dolaylı, arızi, özel veya sonuç niteliğindeki zarardan sorumlu tutulamaz.',
        'Yasaların izin verdiği ölçüde, bu Koşullardan doğan toplam sorumluluğumuz, olayın gerçekleştiği tarihten önceki 12 ay içinde bize ödediğiniz toplam tutarla (ücretsiz kullanıcılar için 100 ABD Doları ile) sınırlıdır.',
        'Bu sınırlamalar, tüketici haklarınızı yasaların izin vermediği ölçüde kısıtlamaz; bazı yargı bölgelerinde bu sınırlamaların bir kısmı geçerli olmayabilir.',
      ],
    },
    {
      title: 'Tazminat',
      paragraphs: ['Bu Koşulları ihlal etmenizden, Hizmeti kötüye kullanmanızdan veya yüklediğiniz içerikten kaynaklanan üçüncü taraf talepleri, zararlar ve makul avukatlık ücretleri de dahil olmak üzere masraflara karşı Türkçe Okulu\'nu, Nevai Yayınları\'nı ve çalışanlarını tazmin etmeyi kabul edersiniz.'],
    },
    {
      title: 'Uygulanacak Hukuk ve Uyuşmazlık Çözümü',
      paragraphs: [
        'Bu Koşullar, kanunlar ihtilafı kurallarına bakılmaksızın New Jersey, Amerika Birleşik Devletleri kanunlarına tabidir ve bu kanunlara göre yorumlanır. Bu Koşullardan doğan uyuşmazlıklar için New Jersey eyaletindeki yetkili mahkemelerin münhasır yargı yetkisini kabul edersiniz.',
        'Avrupa Ekonomik Alanı, Birleşik Krallık veya başka bir yargı bölgesinde ikamet eden tüketicilerin, o yargı bölgesinin zorunlu tüketici koruma hükümlerinden doğan hakları bu madde ile sınırlandırılmaz.',
      ],
    },
    {
      title: 'Bu Koşullardaki Değişiklikler',
      paragraphs: ['Bu Kullanım Koşullarını zaman zaman güncelleyebiliriz. Önemli değişiklikler yaptığımızda güncellenmiş metni bu sayfada yayınlarız ve yukarıdaki yürürlük tarihini güncelleriz; gerektiğinde sizi e-posta ile veya Hizmet aracılığıyla bilgilendiririz. Değişikliklerin yürürlüğe girmesinden sonra Hizmeti kullanmaya devam etmeniz, güncellenmiş Koşulları kabul ettiğiniz anlamına gelir.'],
    },
    {
      title: 'Bizimle İletişim',
      paragraphs: ['Bu Kullanım Koşulları hakkında sorularınız varsa lütfen şu adresten bizimle iletişime geçin:'],
      list: [
        'Nevai Yayınları (Türkçe Okulu)',
        '335 Clifton Avenue',
        'Clifton, NJ 07011',
        'Amerika Birleşik Devletleri',
        'E-posta: privacy@turkceokulu.com',
        'Genel iletişim: iletisim@nevai.co',
      ],
    },
  ],
};

const E: PolicyData = {
  effective: 'Effective date: July 31, 2026',
  intro: [
    'These Terms of Use ("Terms") govern your use of the language-learning platform available at https://turkceokulu.com (the "Site" or the "Service"), operated by Nevai Publishing ("Türkçe Okulu", "we", "us", or "our"). By registering for or otherwise using the Service, you agree to these Terms. If you do not agree, please do not use the Service.',
    'Please also read our Privacy Policy, which explains how we collect and process your personal data and forms an integral part of these Terms.',
  ],
  sections: [
    {
      title: 'Account Creation and Eligibility',
      list: [
        '**Age requirement** — the Service is directed to people who are at least 13 years old. Where a school, teacher, or institution manages classroom accounts on behalf of younger learners, it is responsible for obtaining the necessary parental or school consent.',
        '**Accurate information** — you represent that the information you provide when registering (name, e-mail, institution code, etc.) is accurate and current.',
        '**Account security** — you are responsible for keeping your password or student PIN confidential and for all activity under your account. Notify us immediately if you suspect unauthorized use of your account.',
        '**One account per person** — accounts are personal; they may not be transferred or shared by multiple people. Classroom join codes may only be used by students enrolled in that class.',
        '**Institutional/teacher accounts** — a teacher or administrator creating an account on behalf of an institution represents that they are authorized to bind that institution to these Terms.',
      ],
    },
    {
      title: 'Scope of the Service',
      paragraphs: [
        'Türkçe Okulu offers CEFR-aligned lesson content, exercises, gamification (hearts, points, streaks, leagues, virtual currency), multiplayer features (Kahoot-style classroom sessions, duels), and an AI-assisted content studio for teachers.',
        'We may add, change, or remove features from time to time to improve the Service. We do not guarantee the Service will be uninterrupted or error-free, due to planned maintenance or unforeseen outages.',
      ],
    },
    {
      title: 'Acceptable Use',
      paragraphs: ['When using the Service, you agree not to:'],
      list: [
        'Cheat, use automation or bots, or manipulate scores or league standings in Kahoot sessions, duels, or individual exercises.',
        'Reverse-engineer the Service, attempt to access its source code, or scrape or programmatically query its APIs without authorization.',
        'Upload or share content that is unlawful, defamatory, discriminatory, obscene, or that infringes a third party\'s rights, including copyright.',
        'Impersonate another user, share a classroom join code with unauthorized individuals, or create an unauthorized account.',
        'Exploit a security vulnerability or bug in the Service for personal gain; if you discover one, please report it to us rather than exploiting it.',
        'Use the Service in a way that places an unreasonable load on our servers or interferes with other users\' access.',
      ],
      note: 'Violating these Terms may result in suspension or termination of your account without prior notice (see Section 7).',
    },
    {
      title: 'Content and Intellectual Property Rights',
      list: [
        '**Our content** — the textbook curriculum, texts, and related materials belong to Nevai Publishing; the platform software, design, and brand belong to Türkçe Okulu. Your access to the Service grants a limited, non-transferable license to use this content solely for personal learning (or, if you are a teacher, with your class) — it does not grant a right to resell, bulk-download, or redistribute it publicly.',
        '**Your content** — exercises, worksheets, and digital publications uploaded by teachers, or generated with AI-assisted tools, remain your property. By uploading such content, you grant us a worldwide, royalty-free license to host, display, and distribute it within the relevant class/institution context.',
        '**AI-assisted generation** — you are responsible for the drafts produced when you use the content studio and for your decision to publish them; you must ensure they do not infringe third-party rights (see Privacy Policy Section 5).',
        '**Feedback** — any suggestions or feedback you voluntarily send us about the Service may be used by us to improve the product without any obligation to compensate you.',
      ],
    },
    {
      title: 'Paid Services and Payment',
      list: [
        '**Free tier** — you may access core features of the Service free of charge; we may change the scope of the free tier from time to time.',
        '**Institutional licenses** — schools and institutions may purchase licenses for the book series and digital platform through a quote/order process. Pricing, capacity, and billing terms are set out in the applicable quote or order document.',
        '**Payment processing** — we do not store credit-card numbers or other sensitive payment data on our own servers; payments are processed through third-party payment providers (see Privacy Policy Section 8).',
        '**Final sale** — except where required by law, paid licenses and subscriptions are final; no refunds are provided. If you have a billing dispute, contact us using the details in Section 14.',
        '**Non-payment** — we reserve the right to suspend access for institutional licenses that are not paid on time.',
      ],
    },
    {
      title: 'Virtual Currency and Gamification',
      paragraphs: ['The Service includes gamification elements such as hearts, points (XP), streaks, combos, league level, and virtual currency (Lira).'],
      list: [
        'Virtual currency and gamification elements have no real-world monetary value; they cannot be cashed out, transferred to another user, or sold outside the Service.',
        'These elements are purely cosmetic — paying does not provide an advantage in accessing learning content or in lesson outcomes ("no pay-to-win").',
        'We reserve the right to adjust or reset balances, league standings, or points for balancing, bug-fixing, or abuse-prevention purposes.',
      ],
    },
    {
      title: 'Account Suspension and Termination',
      list: [
        '**By us** — we may suspend or terminate your account if you violate these Terms, if we suspect cheating or abuse, or, for institutional licenses, in the event of non-payment. We will try to notify you in advance where feasible.',
        '**By you** — you may delete your account at any time through the Service or by using the contact details in Section 14.',
        '**After termination** — following account closure, your personal data is deleted or anonymized as described in the Data Retention and Storage section of our Privacy Policy.',
      ],
    },
    {
      title: 'Third-Party Services',
      paragraphs: ['The Service uses or may link to third-party services such as Google OAuth (sign-in), Anthropic (AI content generation), PostHog (analytics), Sentry (error monitoring), and hosting/CDN providers. These third-party services are governed by their own terms of use and privacy policies; we are not responsible for their content or practices.'],
    },
    {
      title: 'Disclaimer of Warranties',
      paragraphs: ['The Service is provided "as is" and "as available". To the maximum extent permitted by law, we make no warranties, express or implied, that the Service will be uninterrupted, error-free, or secure, that it will achieve any particular learning outcome (such as a specific exam score or CEFR level), or that it is fit for a particular purpose.'],
    },
    {
      title: 'Limitation of Liability',
      paragraphs: [
        'To the maximum extent permitted by law, Türkçe Okulu and Nevai Publishing shall not be liable for any indirect, incidental, special, or consequential damages, including lost profits, data loss, or business interruption, arising from your use or inability to use the Service.',
        'To the extent permitted by law, our total liability arising out of these Terms is limited to the total amount you paid us in the 12 months preceding the event giving rise to the claim (or 100 USD for users on the free tier).',
        'These limitations do not restrict your consumer rights to the extent not permitted by law; some jurisdictions may not allow certain of these limitations.',
      ],
    },
    {
      title: 'Indemnification',
      paragraphs: ['You agree to indemnify Türkçe Okulu, Nevai Publishing, and their employees against third-party claims, damages, and reasonable legal fees arising from your violation of these Terms, your misuse of the Service, or content you upload.'],
    },
    {
      title: 'Governing Law and Dispute Resolution',
      paragraphs: [
        'These Terms are governed by and construed in accordance with the laws of the State of New Jersey, United States, without regard to its conflict-of-laws principles. You agree to the exclusive jurisdiction of the courts located in New Jersey for any dispute arising from these Terms.',
        'Consumers resident in the European Economic Area, the United Kingdom, or another jurisdiction retain any rights under that jurisdiction\'s mandatory consumer-protection provisions notwithstanding this section.',
      ],
    },
    {
      title: 'Changes to These Terms',
      paragraphs: ['We may update these Terms of Use from time to time. When we make material changes, we will post the updated text on this page and update the effective date above, and where required we will notify you by e-mail or through the Service. Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms.'],
    },
    {
      title: 'Contacting Us',
      paragraphs: ['If you have any questions about these Terms of Use, please contact us at:'],
      list: [
        'Nevai Publishing (Türkçe Okulu)',
        '335 Clifton Avenue',
        'Clifton, NJ 07011',
        'United States',
        'E-mail: privacy@turkceokulu.com',
        'General enquiries: iletisim@nevai.co',
      ],
    },
  ],
};

export default async function KullanimKosullariPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const data = isEn ? E : P;

  return (
    <div className="bg-white text-slate-900">
      <LandingNav locale={locale} alternateHref={isEn ? '/tr/kullanim-kosullari' : '/en/kullanim-kosullari'} />

      <section className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center md:px-10 md:pt-24">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {isEn ? 'Terms of Use' : 'Kullanım Koşulları'}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
          {isEn
            ? 'The terms and conditions governing your use of the Türkçe Okulu platform.'
            : 'Platformumuzu kullanırken geçerli olan şart ve koşulları bu sayfada detaylı olarak açıklıyoruz.'}
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 md:px-10">
        <PolicyBody data={data} />
      </section>

      <LandingFooter locale={locale} />
    </div>
  );
}
