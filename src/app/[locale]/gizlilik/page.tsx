// web/src/app/[locale]/gizlilik/page.tsx
import type { Metadata } from 'next';
import { Fragment } from 'react';
import { LandingNav } from '@/components/landing-nav';
import { LandingFooter } from '@/components/landing-footer';

const BASE = 'https://turkceokulu.com';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const path = `/${locale}/gizlilik`;

  return isEn ? {
    title: 'Privacy Policy — Türkçe Okulu',
    description: 'How Türkçe Okulu collects, uses and protects your personal data, including GDPR rights.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { en: `${BASE}/en/gizlilik`, tr: `${BASE}/tr/gizlilik` } },
    openGraph: {
      title: 'Privacy Policy — Türkçe Okulu',
      description: 'How Türkçe Okulu collects, uses and protects your personal data.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'en_GB',
      alternateLocale: ['tr_TR'],
    },
  } : {
    title: 'Gizlilik Politikası — Türkçe Okulu',
    description: 'Türkçe Okulu kişisel verilerinizi nasıl topluyor, kullanıyor ve koruyor — GDPR hakları dahil.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { tr: `${BASE}/tr/gizlilik`, en: `${BASE}/en/gizlilik` } },
    openGraph: {
      title: 'Gizlilik Politikası — Türkçe Okulu',
      description: 'Türkçe Okulu kişisel verilerinizi nasıl topluyor, kullanıyor ve koruyor.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'tr_TR',
      alternateLocale: ['en_GB'],
    },
  };
}

type PolicyList = string[];
type PolicySub = { title: string; list?: PolicyList; paragraphs?: PolicyList };
type PolicySection = { title: string; paragraphs?: PolicyList; paragraphs2?: PolicyList; list?: PolicyList; subs?: PolicySub[]; note?: string };
type PolicyData = { effective: string; intro: PolicyList; sections: PolicySection[] };

// **bold** işaretlerini <strong> olarak render eder (markdown bağımlılığı yok).
function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) => (
        i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-800">{p}</strong> : <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}

const P: PolicyData = {
  effective: 'Yürürlük tarihi: 31 Temmuz 2026',
  intro: [
    'Nevai Yayınları ("Türkçe Okulu", "biz" veya "bizim") https://turkceokulu.com adresindeki Türkçe Okulu dil öğretim platformunu ("Site" veya "Hizmet") işletmektedir. Bu Gizlilik Politikası; hangi bilgileri topladığımızı, neden topladığımızı, bu bilgileri nasıl kullandığımızı ve koruduğumuzu ve kişisel verileriniz üzerindeki haklarınızı açıklamaktadır. Site ziyaretçilerinin tümü ve kayıtlı kullanıcılar ile ilgili durumlarda mobil uygulama için de geçerlidir.',
    'Hizmeti kullanarak bu Gizlilik Politikasında açıklanan uygulamaları kabul etmiş olursunuz. Bu politikanın herhangi bir bölümünü kabul etmiyorsanız lütfen Hizmeti kullanmayınız.',
  ],
  sections: [
    {
      title: 'Topladığımız Bilgiler',
      subs: [
        {
          title: '1.1 Doğrudan sağladığınız bilgiler',
          list: [
            '**Hesap bilgileri** — kayıt sırasında adınızı, soyadınızı ve e-posta adresinizi, ayrıca bir parolayı toplarız (parola yalnızca tuzlanmış kriptografik özet olarak saklanır, asla düz metin olarak değil).',
            '**Profil ve öğrenme tercihleri** — kayıt yoluna bağlı olarak şunları da sağlayabilirsiniz: ülkeniz, anadiliniz, beyan ettiğiniz Türkçe seviyeniz (başlangıç / orta / ileri), yaş grubunuz ve kurumsal/öğretmen hesapları için kurum adınız ve kurum kodunuz.',
            '**Google ile giriş** — Google OAuth ile kayıt olur veya giriş yaparsanız, Google hesap adınızı, e-posta adresinizi ve yalnızca kimlik doğrulama amacıyla kullanılan benzersiz bir Google tanımlayıcısını alırız.',
            '**Öğretmen ve sınıf verileri** — öğretmenler sınıflar oluşturabilir, öğrenci davet edebilir, etkinlik, çalışma kâğıdı ve dijital yayın yükleyebilir veya yazabilir ve Bölüm 5\'te açıklanan içerik stüdyosunu (AI destekli üretim dahil) kullanabilir.',
            '**İletişim** — destek ekibimizle iletişime geçerseniz, mesajınızın içeriğini ve yanıt verebilmemiz için iletişim bilgilerinizi toplarız.',
          ],
        },
        {
          title: '1.2 Otomatik olarak toplanan bilgiler',
          list: [
            '**Kullanım ve öğrenme verileri** — Hizmeti çalıştırmak için etkinlik geçmişinizi kaydederiz: tamamlanan alıştırmalar, test sonuçları, ünite/bölüm ilerlemesi, seri (streak) sayıları, puanlar (XP), kalpler, kombo sayıları, lig seviyesi ve sanal para (Lira) bakiyeleri.',
            '**Cihaz ve teknik veriler** — tarayıcı türü, cihaz türü, işletim sistemi, dil, IP adresi, IP adresinden türetilen yaklaşık konum ve ziyaret edilen sayfalar gibi verileri, Hizmeti güvenli tutmak ve kullanımı anlamak için toplayabiliriz.',
            '**Oturum verileri** — kimlik doğrulama belirteçleri (JWT yenileme belirteçleri) ve son giriş ile son etkinlik tarihi gibi güvenlikle ilgili zaman damgaları.',
          ],
        },
        {
          title: '1.3 Toplamadığımız bilgiler',
          list: [
            'Kredi kartı numaralarını, ödeme ayrıntılarını veya diğer hassas finansal verileri sunucularımızda **toplamaz veya saklamayız**. Gelecekteki ödeme işlemleri tamamen ödeme sağlayıcılarımız tarafından yürütülecektir.',
            'Bölüm 10\'da açıklandığı üzere, 13 yaşın altındaki hiç kimseden bilinçli olarak bilgi toplamayız.',
          ],
        },
      ],
    },
    {
      title: 'Bilgilerinizi Nasıl Kullanıyoruz',
      paragraphs: ['Topladığımız bilgileri şu amaçlarla kullanırız:'],
      list: [
        '**Hizmeti sağlamak ve işletmek** — hesabınızı oluşturmak ve doğrulamak, dersleri ve alıştırmaları sunmak, ilerlemenizi takip etmek, skorları ve lig sıralamalarını hesaplamak ve Kahoot oturumları ve düellolar gibi çok oyunculu özellikleri yönetmek.',
        '**Deneyiminizi kişiselleştirmek** — içeriği, açıklamaları ve önerileri seviyenize, anadilinize ve hedeflerinize göre uyarlamak.',
        '**Platformumuzu geliştirmek** — hataları düzeltmek, içerik kalitesini artırmak ve yeni özellikler geliştirmek için birleşik kullanım kalıplarını analiz etmek.',
        '**Destek ve iletişim** — sorularınızı yanıtlamak, hizmetle ilgili bildirimler, parola sıfırlama işlemleri ve (yalnızca onayınızla veya kanunların izin verdiği durumlarda) Hizmet hakkında periyodik e-postalar göndermek. Her e-postada bulunan bağlantıyı kullanarak istediğiniz zaman abonelikten çıkabilirsiniz.',
        '**Güvenlik ve dolandırıcılık önleme** — kötüye kullanımı tespit etmek, Kullanım Koşullarımızı uygulamak ve kullanıcılarımızın ve Hizmetin haklarını ve güvenliğini korumak.',
      ],
      note: 'Kişisel verileri yalnızca yukarıda açıklanan amaçlar için işleriz ve bunlarla bağdaşmayan amaçlar için kullanmayız.',
    },
    {
      title: 'İşlemenin Yasal Dayanakları (GDPR)',
      paragraphs: ['AB/Birleşik Krallık Genel Veri Koruma Yönetmeliği\'nin uygulandığı durumlarda, kişisel verileri şu yasal dayanaklara göre işleriz:'],
      list: [
        '**Sözleşmenin ifası** — kayıt olup Hizmeti kullandığınızda talep ettiğiniz hesabı, dersleri ve özellikleri sağlamak.',
        '**Meşru menfaatler** — Hizmeti güvence altına almak, dolandırıcılığı önlemek ve ürünü geliştirmek için birleşik kullanımı anlamak.',
        '**Onay** — analitik çerezleri, isteğe bağlı pazarlama e-postaları ve onay gereken durumlarda AI destekli içerik araçlarımıza gönderdiğiniz verilerin işlenmesi için.',
        '**Yasal yükümlülük** — yasalara uymak için bilgileri saklamamız veya açıklamamız gereken durumlar için.',
      ],
      note: 'Onayınızı, geri çekilmeden önce gerçekleştirilen işlemenin yasallığını etkilemeden istediğiniz zaman geri çekebilirsiniz.',
    },
    {
      title: 'Bilgi Paylaşımı',
      paragraphs: ['Kişisel bilgilerinizi **satmıyor, kiralamıyor veya takas etmiyoruz**. Bilgileri yalnızca şu sınırlı durumlarda paylaşırız:'],
      list: [
        '**Hizmet sağlayıcılar** — Hizmeti işletmemize yardımcı olan güvenilir üçüncü taraflar (barındırma, e-posta teslimi, analitik, hata izleme, içerik dağıtımı, tanıtıldığında ödeme işleme). Bu taraflar sözleşmeyle bilgilerinizi gizli tutmak ve bunları yalnızca bizim adımıza hizmet sağlamak için kullanmakla yükümlüdür.',
        '**AI içerik üretimi** — öğretmen içerik stüdyosunu kullandığınızda, gönderdiğiniz komutlar ve içerik, taslak üretmek için AI sağlayıcısına iletilebilir. Bkz. Bölüm 5.',
        '**Yasal ve güvenlik** — kanunların gerektirdiği durumlarda, politikalarımızı ve Kullanım Koşullarımızı uygulamak veya kendi haklarımızı, mülkiyetimizi veya güvenliğimizi ya da başkalarının haklarını, mülkiyetini veya güvenliğini korumak için bilgi açıklayabiliriz.',
        '**Sınıf bağlamları** — bir öğretmen veya kurum altında sınıfa katılan öğrencilerin temel profili ve ilerlemesi, öğrenmenin yönetilebilmesi ve değerlendirilebilmesi için o öğretmene veya kuruma görünür olabilir.',
        '**İş devirleri** — birleşme, satın alma veya varlık satışı durumunda, kullanıcı bilgileri bu Gizlilik Politikasına tabi olarak işlemin bir parçası olarak devredilebilir.',
      ],
      note: 'Birleşik, kişisel olarak tanımlanamayan bilgiler (örneğin toplam öğrenci sayıları veya anonimleştirilmiş performans istatistikleri) araştırma ve pazarlama için kısıtlama olmaksızın kullanılabilir veya paylaşılabilir.',
    },
    {
      title: 'AI Destekli İçerik Araçları',
      paragraphs: [
        'Öğretmen içerik stüdyosu; testlerin, çalışma kâğıtlarının ve alıştırmaların AI destekli üretimini sunmaktadır. Bu araçları kullandığınızda gönderdiğiniz metin (örneğin bir konu, kaynak metin veya düzenleme isteği), istenen içeriği üretmek amacıyla yalnızca üçüncü taraf bir AI sağlayıcısına (Anthropic) gönderilir. Sağlayıcımıza, gönderimlerinizi modellerini eğitmek için kullanmaması ve operasyonel olarak gerekenin ötesinde saklamaması talimatını veriyoruz. Öğrencileriniz hakkında, açıkça gönderdiğiniz içeriğin ötesinde kişisel veri toplamak için AI üretim özelliklerini kullanmayız.',
        'Bu araçlar aracılığıyla yayınlamayı seçtiğiniz içerikten sorumlu değiliz; oluşturduğunuz ve yayınladığınız her içeriğin geçerli yasalara ve üçüncü taraf haklarına uygun olmasını sağlamak sizin sorumluluğunuzdadır.',
      ],
    },
    {
      title: 'Çerezler ve Benzer Teknolojiler',
      paragraphs: ['Hizmeti çalışır hâle getirmek ve deneyiminizi iyileştirmek için çerezler ve yerel tarayıcı depolaması kullanırız. Çerezler, tarayıcınız tarafından cihazınıza aktarılan küçük metin dosyalarıdır.'],
      list: [
        '**Zorunlu çerezler ve depolama** — kimlik doğrulama, oturum güvenliği ve temel işlevsellik için gereklidir (örneğin giriş durumunuzu ve onay tercihlerinizi hatırlamak). Bunlar, Hizmeti bozmadan devre dışı bırakılamaz.',
        '**Tercih depolaması** — Site\'nin sonraki ziyaretlerinizde hatırlaması için hafif tercihleri yerel olarak saklarız (örneğin seçtiğiniz seviye veya kapatılan banner\'lar).',
        '**Analitik** — Site\'yi nasıl kullandığınızı (ziyaret edilen sayfalar, sitede geçirilen süre, kullanılan özellikler) toplu olarak anlamak için PostHog kullanırız. Kanunların gerektirdiği durumlarda, analitik çerezleri yalnızca kabul ettikten sonra yüklenir.',
      ],
      note: 'Site\'yi ilk ziyaretinizde, bir çerez onayı banner\'ı isteğe bağlı analitik çerezlerini kabul edip etmediğinizi sorar. Bunları reddederek temel işlevselliğe erişiminizi kaybetmezsiniz. Çerezleri tarayıcı ayarlarınızdan istediğiniz zaman kontrol edebilir veya silebilirsiniz; zorunlu çerezleri devre dışı bırakmanın Hizmetin düzgün çalışmasını engelleyebileceğini unutmayın.',
    },
    {
      title: 'Analitik, Hata İzleme ve Reklamcılık',
      list: [
        '**Analitik** — ürün analitiği için PostHog kullanırız. IP adresleri yalnızca kaba konum belirleme için kullanılır ve satılmaz.',
        '**Hata izleme** — teknik hataları tespit etmek ve teşhis etmek için Sentry kullanırız. Sentry; hata mesajları, yığın izleri ve cihaz/tarayıcı bilgileri gibi teknik veriler alır; parolanızı veya ödeme verilerinizi almaz.',
        '**Reklamcılık** — şu anda Site\'de üçüncü taraf davranışsal reklam sunmuyoruz. Gelecekte yeniden pazarlama veya görüntülü reklamcılık başlatırsak, bu politikayı güncelleyeceğiz ve uygun vazgeçme mekanizmaları sağlayacağız.',
      ],
    },
    {
      title: 'Veri Güvenliği',
      paragraphs: ['Bilgilerinizi korumak için makul ve uygun teknik ve organizasyonel önlemler alırız; bunlar şunları içerir:'],
      list: [
        '**İletimde şifreleme** — tüm trafik HTTPS (TLS/SSL) üzerinden sunulur.',
        '**Karma parolalar** — parolalar tuzlanmış kriptografik özetler olarak saklanır; 4 haneli öğrenci PIN\'leri BCrypt özetleri olarak saklanır ve sıfırlanabilir.',
        '**Erişim kontrolleri** — üretim veritabanı erişimi yalnızca yetkili personelle sınırlıdır ve kimlik doğrulama, dönen yenileme belirteçlerine sahip kısa ömürlü JWT erişim belirteçleri kullanır.',
        '**Güvenli altyapı** — Hizmet güvenilir bulut altyapısı üzerinde (Vercel ve Railway) çalışır; medya Cloudflare R2 CDN\'sinden sunulur ve Cloudflare\'in uç ağı tarafından korunur.',
      ],
      note: 'Hiçbir aktarım veya depolama yöntemi %100 güvenli değildir. Kişisel bilgilerinizi korumak için çabalarken mutlak güvenliğini garanti edemeyiz. Hesabınızın ele geçirildiğini düşünüyorsanız derhal bizimle iletişime geçin.',
    },
    {
      title: 'Veri Saklama ve Depolama',
      list: [
        '**Saklama** — hesap verilerinizi, hesabınızın aktif olduğu süre boyunca veya Hizmeti sağlamak, yasal yükümlülüklere uymak, anlaşmazlıkları çözmek ve sözleşmelerimizi uygulamak için gerektiği sürece saklarız. Öğrenme geçmişi ve oyunlaştırma verileri, ilerlemenizin korunması için hesabınız var olduğu sürece saklanır.',
        '**Barındırma ve aktarımlar** — kişisel verileriniz, barındırma sağlayıcılarımızın işlettiği sunucularda saklanır. Türkçe Okulu dünyanın dört bir yanındaki öğrencilere hizmet verir; verileriniz, kendi ülkeniz dışındaki ve Avrupa Ekonomik Alanı ile Birleşik Krallık dışındakiler dahil ülkelere aktarılabilir ve bu ülkelerde işlenebilir. Bu tür aktarımların gerçekleştiği durumlarda, verilerinizi korumak için uygun güvencelere (AB Standart Sözleşme Maddeleri gibi) dayanırız.',
        '**Silme** — hesabınızın silinmesini talep ettiğinizde (bkz. Bölüm 11), kanunlara göre belirli kayıtları saklamak zorunda olduğumuz durumlar hariç, kişisel verilerinizi makul bir süre içinde siler veya anonimleştiririz.',
      ],
    },
    {
      title: 'Çocukların Gizliliği (COPPA)',
      paragraphs: ['Hizmet, en az 13 yaşında olan kişilere yöneliktir. Uygun ebeveyn veya okul onayı olmadan 13 yaşın altındaki çocuklardan bilinçli olarak kişisel bilgi toplamayız. Bir okul, öğretmen veya kurum, daha genç öğrenciler adına sınıf hesaplarını yönetiyorsa gerekli onayı almakla yükümlüdür. Bu tür bir onay olmadan 13 yaşın altındaki bir çocuktan kişisel bilgi topladığımızı öğrenirsek, bu bilgiyi derhâl sileriz. 13 yaşın altındaki bir çocuğun bize kişisel bilgi verdiğini düşünüyorsanız lütfen bizimle iletişime geçin.'],
    },
    {
      title: 'Haklarınız',
      paragraphs: ['Geçerli yasalara tabi olarak şu haklara sahipsiniz:'],
      list: [
        '**Erişim** — hakkınızda tuttuğumuz kişisel verilerin bir kopyasını talep etme.',
        '**Düzeltme** — hatalı veya eksik verileri düzeltmemizi isteme.',
        '**Silme** — kişisel verilerinizin silinmesini talep etme ("unutulma hakkı").',
        '**Kısıtlama** — belirli durumlarda işlemeyi kısıtlamamızı isteme.',
        '**Taşınabilirlik** — bize sağladığınız kişisel verileri yapılandırılmış, makine tarafından okunabilir bir biçimde alma.',
        '**İtiraz** — meşru menfaatlere dayanan işlemeye veya pazarlama iletişimleri almaya itiraz etme.',
        '**Onayı geri çekme** — işlemenin onaya dayandığı durumlarda istediğiniz zaman.',
        '**Şikâyette bulunma** — verilerinizi yasalara uygun işlemediğimize inanıyorsanız yerel veri koruma yetkilisine (Birleşik Krallık\'ta Bilgi Komiserliği Ofisi).',
      ],
      paragraphs2: [
        '**Kaliforniya sakinleri** — Kaliforniya Tüketici Gizliliği Yasası (CCPA/CPRA) kapsamında, hangi kişisel bilgileri topladığımızı bilme, silinmesini talep etme ve kişisel bilgilerin herhangi bir "satışından" veya "paylaşımından" vazgeçme hakkına da sahipsiniz. Kişisel bilgileri satmıyoruz ve haklarınızı kullandığınız için size karşı ayrımcılık yapmayacağız.',
        'Bu haklardan herhangi birini kullanmak için Bölüm 13\'teki bilgileri kullanarak bizimle iletişime geçin. Talepleri yerine getirmeden önce kimliğinizi doğrulayacağız ve kanunların gerektirdiği süre içinde (genellikle 30 gün) yanıt vereceğiz. Ayrıca istediğiniz zaman Hizmet içinden hesabınızı ve verilerini silebilirsiniz.',
      ],
    },
    {
      title: 'Bu Gizlilik Politikasındaki Değişiklikler',
      paragraphs: ['Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler yaptığımızda güncellenmiş politikayı bu sayfada yayınlarız ve yukarıdaki yürürlük tarihini güncelleriz; gerektiğinde sizi e-posta ile veya Hizmet aracılığıyla bilgilendiririz. Değişikliklerin yürürlüğe girmesinden sonra Hizmeti kullanmaya devam etmeniz, güncellenmiş politikayı kabul ettiğiniz anlamına gelir.'],
    },
    {
      title: 'Bizimle İletişim',
      paragraphs: ['Bu Gizlilik Politikası veya kişisel verileriniz hakkında sorularınız, endişeleriniz veya talepleriniz varsa lütfen şu adresten bizimle iletişime geçin:'],
      list: [
        'Nevai Yayınları (Türkçe Okulu)',
        '335 Clifton Avenue',
        'Clifton, NJ 07011',
        'Amerika Birleşik Devletleri',
        'E-posta: privacy@turkceokulu.com',
      ],
    },
  ],
};

const E: PolicyData = {
  effective: 'Effective date: July 31, 2026',
  intro: [
    'Nevai Publishing ("Türkçe Okulu", "we", "us", or "our") operates the Türkçe Okulu language-learning platform available at https://turkceokulu.com (the "Site" or the "Service"). This Privacy Policy explains what information we collect, why we collect it, how we use and protect it, and the rights you have over your personal data. It applies to all visitors and registered users of the Site and, where relevant, the mobile application.',
    'By using the Service, you agree to the practices described in this Privacy Policy. If you do not agree with any part of this policy, please do not use the Service.',
  ],
  sections: [
    {
      title: 'Information We Collect',
      subs: [
        {
          title: '1.1 Information you provide directly',
          list: [
            '**Account information** — when you register, we collect your name, surname, and e-mail address, and a password (stored only as a salted cryptographic hash, never in plain text).',
            '**Profile and learning preferences** — depending on the registration path, you may also provide: your country, native language, self-reported Turkish level (beginner / intermediate / advanced), age group, and, for corporate/teacher accounts, your institution name and institution code.',
            '**Google sign-in** — if you register or log in with Google OAuth, we receive your Google account name, e-mail address, and a unique Google identifier used only for authentication.',
            '**Teacher and classroom data** — teachers may create classes, invite students, upload or author exercises, worksheets, and digital publications, and use the content studio (including AI-assisted generation) described in Section 5.',
            '**Communications** — if you contact our support team, we collect the content of your message and your contact details so we can respond.',
          ],
        },
        {
          title: '1.2 Information collected automatically',
          list: [
            '**Usage and learning data** — to operate the Service we record your activity history: exercises completed, quiz results, unit/lesson progress, streak counts, points (XP), hearts, combo counts, league level, and virtual-currency (Lira) balances.',
            '**Device and technical data** — we may collect browser type, device type, operating system, language, IP address, approximate location derived from the IP address, and pages visited, in order to keep the Service secure and to understand usage.',
            '**Session data** — authentication tokens (JWT refresh tokens) and security-relevant timestamps such as last login and last active date.',
          ],
        },
        {
          title: '1.3 Information we do not collect',
          list: [
            'We do **not** collect or store credit-card numbers, payment details, or other sensitive financial data on our servers. Any future payment processing will be handled entirely by our payment providers.',
            'We do not intentionally collect information from anyone under 13 years of age, as described in Section 10.',
          ],
        },
      ],
    },
    {
      title: 'How We Use Your Information',
      paragraphs: ['We use the information we collect to:'],
      list: [
        '**Provide and operate the Service** — create and authenticate your account, deliver lessons and exercises, track your progress, calculate scores and league standings, and manage multiplayer features such as Kahoot sessions and duels.',
        '**Personalize your experience** — adapt content, explanations, and recommendations to your level, native language, and goals.',
        '**Improve our platform** — analyze aggregate usage patterns to fix bugs, improve content quality, and develop new features.',
        '**Support and communicate** — respond to your questions, send service-related notices, password resets, and (only with your consent or where permitted by law) periodic e-mails about the Service. You can unsubscribe at any time using the link included in every e-mail.',
        '**Security and fraud prevention** — detect misuse, enforce our Terms of Use, and protect the rights and safety of our users and the Service.',
      ],
      note: 'We process personal data only for the purposes described above and do not use it for purposes that are incompatible with them.',
    },
    {
      title: 'Legal Bases for Processing (GDPR)',
      paragraphs: ['Where the EU/UK General Data Protection Regulation applies, we process personal data on the following legal bases:'],
      list: [
        '**Performance of a contract** — to provide the account, lessons, and features you request when you register and use the Service.',
        '**Legitimate interests** — to secure the Service, prevent fraud, and understand aggregate usage in order to improve the product.',
        '**Consent** — for analytics cookies, optional marketing e-mails, and the processing of any data you submit to our AI-assisted content tools, where consent is required.',
        '**Legal obligation** — where we must retain or disclose information to comply with the law.',
      ],
      note: 'You may withdraw consent at any time without affecting the lawfulness of processing that took place before withdrawal.',
    },
    {
      title: 'Sharing of Information',
      paragraphs: ['We do **not** sell, rent, or trade your personal information. We share information only in the following limited circumstances:'],
      list: [
        '**Service providers** — trusted third parties that help us operate the Service (hosting, e-mail delivery, analytics, error monitoring, content delivery, payment processing when introduced). These parties are contractually bound to keep your information confidential and to use it only to provide services on our behalf.',
        '**AI content generation** — when you use our teacher content studio, the prompts and content you submit may be transmitted to the AI provider to generate drafts. See Section 5.',
        '**Legal and safety** — we may disclose information when required by law, to enforce our policies and Terms of Use, or to protect our rights, property, or safety, or the rights, property, or safety of others.',
        '**Classroom contexts** — students joining a class under a teacher or institution may have their basic profile and progress visible to that teacher or institution so that learning can be managed and assessed.',
        '**Business transfers** — in the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction, subject to this Privacy Policy.',
      ],
      note: 'Aggregated, non-personally-identifiable information (for example, total learner counts or anonymized performance statistics) may be used or shared for research and marketing without restriction.',
    },
    {
      title: 'AI-Assisted Content Tools',
      paragraphs: [
        'The teacher content studio offers AI-assisted generation of quizzes, worksheets, and exercises. When you use these tools, the text you submit (for example, a topic, source passage, or editing request) is sent to a third-party AI provider (Anthropic) solely to produce the requested content. We instruct our provider not to use your submissions to train its models and not to retain them beyond what is operationally required. We do not use AI generation features to collect personal data about your students beyond the content you explicitly submit.',
        'We are not responsible for the content you choose to publish through these tools; you are responsible for ensuring that any content you create and publish complies with applicable law and the rights of third parties.',
      ],
    },
    {
      title: 'Cookies and Similar Technologies',
      paragraphs: ['We use cookies and local browser storage to make the Service work and to improve your experience. Cookies are small text files stored on your device by your browser.'],
      list: [
        '**Essential cookies and storage** — required for authentication, session security, and core functionality (for example, remembering your login state and your consent choices). These cannot be disabled without impairing the Service.',
        '**Preference storage** — we store lightweight preferences locally (for example, your selected level or dismissed banners) so the Site remembers them on future visits.',
        '**Analytics** — we use PostHog to understand how visitors use the Site (pages visited, time on site, features used) in aggregate. Where required, analytics cookies are only loaded after you accept them.',
      ],
      note: 'When you first visit the Site, a cookie-consent banner asks whether you accept optional analytics cookies. You may decline them without losing access to core functionality. You can also control or delete cookies through your browser settings at any time; note that disabling essential cookies may prevent the Service from working correctly.',
    },
    {
      title: 'Analytics, Error Monitoring, and Advertising',
      list: [
        '**Analytics** — we use PostHog for product analytics. IP addresses are used only for coarse geo-identification and are not sold.',
        '**Error monitoring** — we use Sentry to detect and diagnose technical errors. Sentry receives technical data such as error messages, stack traces, and device/browser information; it does not receive your password or payment data.',
        '**Advertising** — we do not currently serve third-party behavioral advertising on the Site. If we introduce remarketing or display advertising in the future, we will update this policy and provide appropriate opt-out mechanisms.',
      ],
    },
    {
      title: 'Data Security',
      paragraphs: ['We take reasonable and appropriate technical and organizational measures to protect your information, including:'],
      list: [
        '**Encryption in transit** — all traffic is served over HTTPS (TLS/SSL).',
        '**Hashed credentials** — passwords are stored as salted cryptographic hashes; 4-digit student PINs are stored as BCrypt hashes and can be reset.',
        '**Access controls** — production database access is limited to authorized personnel, and authentication uses short-lived JWT access tokens with rotating refresh tokens.',
        '**Secure infrastructure** — the Service runs on trusted cloud infrastructure (Vercel and Railway), with media served from a Cloudflare R2 CDN and protected by Cloudflare\'s edge network.',
      ],
      note: 'No method of transmission or storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security. If you believe your account has been compromised, contact us immediately.',
    },
    {
      title: 'Data Retention and Storage',
      list: [
        '**Retention** — we keep your account data for as long as your account is active or as needed to provide the Service, comply with legal obligations, resolve disputes, and enforce our agreements. Learning history and gamification data are retained while your account exists so that your progress is preserved.',
        '**Hosting and transfers** — your personal data is stored on servers operated by our hosting providers. Türkçe Okulu serves learners worldwide, and your data may be transferred to and processed in countries other than your own, including outside the European Economic Area and the United Kingdom. Where such transfers occur, we rely on appropriate safeguards (such as the EU Standard Contractual Clauses) to protect your data.',
        '**Deletion** — when you request deletion of your account (see Section 11), we delete or anonymize your personal data within a reasonable period, except where we are required to retain certain records by law.',
      ],
    },
    {
      title: "Children's Privacy (COPPA)",
      paragraphs: ['The Service is directed to people who are at least 13 years old. We do not knowingly collect personal information from children under 13 without appropriate parental or school consent. Where a school, teacher, or institution manages classroom accounts on behalf of younger learners, it is responsible for obtaining the necessary consent. If we learn that we have collected personal information from a child under 13 without such consent, we will delete that information promptly. If you believe a child under 13 has provided us personal information, please contact us.'],
    },
    {
      title: 'Your Rights',
      paragraphs: ['Subject to applicable law, you have the right to:'],
      list: [
        '**Access** — request a copy of the personal data we hold about you.',
        '**Rectification** — ask us to correct inaccurate or incomplete data.',
        '**Erasure** — request deletion of your personal data ("right to be forgotten").',
        '**Restriction** — ask us to restrict processing in certain circumstances.',
        '**Portability** — receive the personal data you provided to us in a structured, machine-readable format.',
        '**Object** — object to processing based on legitimate interests, or to receiving marketing communications.',
        '**Withdraw consent** — at any time, where processing is based on consent.',
        '**Lodge a complaint** — with your local data-protection authority (in the UK, the Information Commissioner\'s Office) if you believe we have not handled your data lawfully.',
      ],
      paragraphs2: [
        '**California residents** — under the California Consumer Privacy Act (CCPA/CPRA) you also have the right to know what personal information we collect, request deletion, and opt out of any "sale" or "sharing" of personal information. We do not sell personal information, and we will not discriminate against you for exercising your rights.',
        'To exercise any of these rights, contact us using the details in Section 13. We will verify your identity before fulfilling requests and will respond within the timeframe required by law (typically 30 days). You can also delete your account and its data from within the Service at any time.',
      ],
    },
    {
      title: 'Changes to This Privacy Policy',
      paragraphs: ['We may update this Privacy Policy from time to time. When we make material changes, we will post the updated policy on this page and update the effective date above, and where required we will notify you by e-mail or through the Service. Your continued use of the Service after changes take effect constitutes acceptance of the updated policy.'],
    },
    {
      title: 'Contacting Us',
      paragraphs: ['If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:'],
      list: [
        'Nevai Publishing (Türkçe Okulu)',
        '335 Clifton Avenue',
        'Clifton, NJ 07011',
        'United States',
        'E-mail: privacy@turkceokulu.com',
      ],
    },
  ],
};

function PolicyBody({ data }: { data: PolicyData }) {
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

          {'paragraphs2' in s && s.paragraphs2?.map((p, j) => (
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

export default async function GizlilikPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const data = isEn ? E : P;

  return (
    <div className="bg-white text-slate-900">
      <LandingNav locale={locale} alternateHref={isEn ? '/tr/gizlilik' : '/en/gizlilik'} />

      <section className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center md:px-10 md:pt-24">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          {isEn ? 'Privacy Policy' : 'Gizlilik Politikası'}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
          {isEn
            ? 'How your data is collected, used and protected, and the rights you have over it.'
            : 'Verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu, ayrıca verileriniz üzerindeki haklarınızı bu sayfada detaylı olarak açıklıyoruz.'}
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 md:px-10">
        <PolicyBody data={data} />
      </section>

      <LandingFooter locale={locale} />
    </div>
  );
}
