export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  title: string;
  slug: string;
  category: string;
  date: string;
  readingTime: string;
  excerpt: string;
  intro: string;
  image: string;
  sections: BlogSection[];
  highlightBox: {
    title: string;
    body: string;
  };
  closing?: string;
};

const defaultHighlightBox = {
  title: "Uzman değerlendirmesi neden önemlidir?",
  body: "İşitme ihtiyacı kişiden kişiye değişebilir. Bu nedenle cihaz seçimi, bakım ihtiyacı veya kullanım süreci hakkında en doğru yönlendirme için uzman değerlendirmesi önerilir.",
};

export const blogPosts: BlogPost[] = [
  {
    title: "İşitme Cihazı Seçerken Nelere Dikkat Edilmeli?",
    slug: "isitme-cihazi-secerken-nelere-dikkat-edilmeli",
    category: "Cihaz Seçimi",
    date: "12 Haziran 2026",
    readingTime: "5 dk okuma",
    excerpt:
      "İşitme cihazı seçimi yalnızca model tercihiyle sınırlı değildir. İşitme ihtiyacı, günlük yaşam alışkanlıkları, kullanım konforu ve teknik özellikler birlikte değerlendirilmelidir.",
    intro:
      "İşitme cihazı seçimi, kişinin işitme seviyesini, günlük yaşam beklentilerini ve cihazdan ne beklediğini birlikte ele alan dikkatli bir süreçtir. Doğru tercih, yalnızca cihazın teknik kapasitesine değil, kullanıcının onu günlük hayatında ne kadar rahat kullanabildiğine de bağlıdır.",
    image: "/images/blog-hearing-aid-selection.jpg",
    highlightBox: defaultHighlightBox,
    sections: [
      {
        heading: "İşitme ihtiyacının doğru değerlendirilmesi",
        paragraphs: [
          "Cihaz seçiminin ilk adımı işitme ihtiyacının doğru anlaşılmasıdır. İşitme seviyesinin, günlük iletişim zorluklarının ve beklentilerin birlikte değerlendirilmesi daha uygun bir yönlendirme yapılmasına yardımcı olur.",
          "Bu değerlendirme sırasında kişinin hangi ortamlarda daha fazla zorlandığı, konuşmaları ayırt etme ihtiyacı ve mevcut kullanım alışkanlıkları dikkate alınmalıdır. Böylece cihaz önerisi daha gerçekçi ve uygulanabilir hale gelir.",
        ],
      },
      {
        heading: "Günlük yaşam ve kullanım alışkanlıkları",
        paragraphs: [
          "Ev, iş, sosyal ortamlar ve telefon kullanımı gibi günlük alışkanlıklar cihaz tercihinde önemlidir. Sık toplantıya katılan, kalabalık ortamlarda bulunan veya aktif yaşam süren kişiler için farklı özellikler öne çıkabilir.",
          "Bazı kullanıcılar daha sade ve temel bir kullanım beklerken bazıları bağlantı özellikleri, şarj kolaylığı veya farklı dinleme programlarına ihtiyaç duyabilir. Bu beklentiler açık biçimde konuşulmalıdır.",
        ],
      },
      {
        heading: "Cihaz tipi ve konfor",
        paragraphs: [
          "Kulak arkası, kulak içi veya şarjlı modeller arasındaki seçim yalnızca görünümle değil, kullanım konforu ve işitme ihtiyacıyla birlikte ele alınmalıdır. Uzun süreli kullanımda rahatlık önemli bir kriterdir.",
          "Cihazın kulağa uyumu, takıp çıkarma kolaylığı, bakım ihtiyacı ve günlük kullanımdaki pratikliği seçim sürecini etkileyen önemli başlıklardır.",
        ],
      },
      {
        heading: "Teknik özelliklerin anlaşılır değerlendirilmesi",
        paragraphs: [
          "Bluetooth bağlantısı, şarj edilebilir yapı, gürültü azaltma ve farklı dinleme programları gibi özellikler sade bir dille açıklanmalıdır. Kullanıcı için gerçekten gerekli olan özellikleri anlamak doğru karar vermeyi kolaylaştırır.",
          "Teknik terimlerin anlaşılır hale getirilmesi, kullanıcının cihazdan ne bekleyebileceğini daha doğru kavramasını sağlar. Bu da hem seçim hem de alışma sürecinde güven oluşturur.",
        ],
        bullets: [
          "Şarjlı veya pilli kullanım tercihi",
          "Telefon ve uyumlu cihaz bağlantısı",
          "Farklı ortamlar için dinleme programları",
        ],
      },
      {
        heading: "Satış sonrası destek ve takip",
        paragraphs: [
          "İşitme cihazı seçimi cihaz teslimiyle bitmez. Ayar, kullanım alışkanlığı, bakım ve takip süreci cihazdan alınan verimi doğrudan etkiler.",
          "Kullanıcı geri bildirimleriyle yapılan kontroller, cihazın günlük yaşamda daha konforlu kullanılmasına katkı sağlar. Bu nedenle satış sonrası destek seçim sürecinin ayrılmaz bir parçasıdır.",
        ],
      },
    ],
    closing:
      "Voice Klinik ekibi, işitme cihazı seçim sürecinde ihtiyacınıza uygun seçenekleri anlaşılır şekilde değerlendirmenize yardımcı olur.",
  },
  {
    title: "İşitme Cihazı Bakımı Nasıl Yapılır?",
    slug: "isitme-cihazi-bakimi-nasil-yapilir",
    category: "Bakım ve Temizlik",
    date: "24 Mayıs 2026",
    readingTime: "4 dk okuma",
    excerpt:
      "Düzenli bakım ve doğru temizlik alışkanlıkları, işitme cihazınızın performansını ve kullanım konforunu korumaya yardımcı olur.",
    intro:
      "İşitme cihazları günlük kullanımda kulak kiri, nem, toz ve çevresel etkilere maruz kalabilir. Bu nedenle düzenli bakım, cihaz performansını korumak ve kullanım konforunu artırmak için önemlidir.",
    image: "/images/blog-hearing-aid-care.jpg",
    highlightBox: defaultHighlightBox,
    sections: [
      {
        heading: "Günlük temizlik alışkanlıkları",
        paragraphs: [
          "Cihazın dış yüzeyini kuru ve yumuşak bir bezle düzenli olarak temizlemek, günlük kullanımda biriken kirin performansı etkilemesini azaltabilir.",
          "Temizlik sırasında sert kimyasal ürünler veya ıslak bezler kullanılmamalıdır. Cihaz tipine uygun bakım önerilerini takip etmek daha güvenli bir kullanım sağlar.",
        ],
      },
      {
        heading: "Nemden ve kirden koruma",
        paragraphs: [
          "İşitme cihazları nemden etkilenebilir. Cihazı banyo, yoğun buhar veya ıslak ortamlardan uzak tutmak ve gece uygun koşullarda saklamak önemlidir.",
          "Terleme, yağmur veya yoğun nem gibi durumlar sonrasında cihazın kontrol edilmesi önerilir. Saklama alışkanlıkları cihazın uzun süre stabil çalışmasına katkı sağlar.",
        ],
      },
      {
        heading: "Filtre, kalıp ve aksesuar kontrolü",
        paragraphs: [
          "Filtre, kulak kalıbı ve bağlantı parçaları düzenli kontrol edilmelidir. Tıkanma veya deformasyon fark edildiğinde teknik destek alınması önerilir.",
          "Ses azalması, cızırtı veya cihazın kulağa tam oturmaması gibi belirtiler aksesuar kontrolü ihtiyacını gösterebilir. Bu durumlarda kullanıcı kendi başına zorlayıcı müdahaleler yapmamalıdır.",
        ],
      },
      {
        heading: "Düzenli teknik kontrolün önemi",
        paragraphs: [
          "Düzenli teknik kontrol, cihazın ses performansını ve kullanım konforunu korumaya yardımcı olur. Kontrol aralıkları cihaz tipine ve kullanım yoğunluğuna göre planlanabilir.",
          "Teknik kontroller sırasında cihaz temizliği, bağlantı parçaları, ses performansı ve kullanıcı geri bildirimleri birlikte değerlendirilir.",
        ],
      },
      {
        heading: "Kullanım sırasında dikkat edilmesi gerekenler",
        paragraphs: [
          "Cihazı düşürmemek, yüksek ısıdan korumak ve temizlikte uygun olmayan sıvılar kullanmamak uzun ömürlü kullanım açısından önemlidir.",
          "Cihaz kullanılmadığında güvenli kutusunda saklanmalı, çocukların veya evcil hayvanların ulaşamayacağı bir yerde tutulmalıdır.",
        ],
        bullets: [
          "Cihazı yüksek ısı ve nemden uzak tutun",
          "Temizlik için önerilmeyen sıvıları kullanmayın",
          "Ses azalması veya bağlantı sorunu fark ederseniz teknik destek alın",
        ],
      },
    ],
  },
  {
    title: "Şarjlı İşitme Cihazlarının Avantajları",
    slug: "sarjli-isitme-cihazlarinin-avantajlari",
    category: "Cihaz Kullanımı",
    date: "8 Mayıs 2026",
    readingTime: "4 dk okuma",
    excerpt:
      "Şarjlı işitme cihazları, pil değişimiyle uğraşmadan günlük kullanım kolaylığı sunar ve pratik bir deneyim sağlar.",
    intro:
      "Şarjlı işitme cihazları, pratik kullanım beklentisi olan kullanıcılar için günlük rutini kolaylaştırabilen modern seçenekler arasındadır. Ancak uygunluk, kişinin işitme ihtiyacı ve kullanım alışkanlıklarıyla birlikte değerlendirilmelidir.",
    image: "/images/blog-rechargeable-hearing-aids.jpg",
    highlightBox: defaultHighlightBox,
    sections: [
      {
        heading: "Pil değişimiyle uğraşmadan kullanım",
        paragraphs: [
          "Şarjlı cihazlar, küçük pil değişimleriyle uğraşmak istemeyen kullanıcılar için pratik bir alternatif sunabilir. Bu yapı günlük rutini sadeleştirir.",
          "Özellikle pil değiştirmekte zorlanan veya daha düzenli bir kullanım alışkanlığı isteyen kişiler için şarjlı modeller konforlu bir seçenek olabilir.",
        ],
      },
      {
        heading: "Günlük kullanım kolaylığı",
        paragraphs: [
          "Cihazı gece şarj etmek, ertesi gün kullanıma hazır hale gelmesini sağlar. Düzenli şarj rutini oluşturulduğunda kullanım takibi kolaylaşır.",
          "Gün içinde cihazın şarj durumunu bilmek, özellikle yoğun tempoda daha güvenli bir kullanım hissi sağlayabilir.",
        ],
      },
      {
        heading: "Şarj rutini oluşturmanın önemi",
        paragraphs: [
          "Şarjlı cihazlardan verimli faydalanmak için cihazın düzenli şarj edilmesi ve şarj ünitesinin doğru kullanılması gerekir.",
          "Şarj ünitesinin temiz tutulması, cihazın doğru yerleştirilmesi ve kullanım talimatlarına uyulması günlük performansı destekler.",
        ],
      },
      {
        heading: "Kimler için uygun olabilir?",
        paragraphs: [
          "El becerisi kısıtlı olan, sık pil değiştirmek istemeyen veya daha pratik bir kullanım arayan kişiler için şarjlı modeller değerlendirilebilir.",
          "Bununla birlikte cihazın günlük kullanım süresi, şarj imkanı ve kullanıcının beklentileri birlikte ele alınmalıdır.",
        ],
      },
      {
        heading: "Cihaz seçiminde uzman görüşü",
        paragraphs: [
          "Şarjlı cihazların uygunluğu işitme ihtiyacı, kullanım süresi ve beklentilere göre değerlendirilmelidir. Bu nedenle uzman görüşü almak önemlidir.",
          "Uzman değerlendirmesi, cihaz tipinin kullanıcının yaşam tarzına ve işitme ihtiyacına uygun olup olmadığını anlamaya yardımcı olur.",
        ],
      },
    ],
  },
  {
    title: "Bluetooth Özellikli İşitme Cihazları Ne İşe Yarar?",
    slug: "bluetooth-ozellikli-isitme-cihazlari-ne-ise-yarar",
    category: "Teknoloji",
    date: "28 Nisan 2026",
    readingTime: "4 dk okuma",
    excerpt:
      "Bluetooth özellikli cihazlar, telefon ve uyumlu cihazlarla bağlantı kurarak daha kişisel ve pratik bir dinleme deneyimi sunabilir.",
    intro:
      "Bluetooth özellikli işitme cihazları, telefon ve uyumlu cihazlarla bağlantı kurarak günlük iletişim deneyimini destekleyebilir. Bu özellik, doğru kullanıcı ve doğru cihaz eşleştiğinde pratik avantajlar sunar.",
    image: "/images/blog-bluetooth-hearing-aids.jpg",
    highlightBox: defaultHighlightBox,
    sections: [
      {
        heading: "Telefon ve uyumlu cihazlarla bağlantı",
        paragraphs: [
          "Bluetooth özellikli işitme cihazları, uyumlu telefon ve cihazlarla bağlantı kurarak konuşma ve medya seslerini daha doğrudan takip etmeye yardımcı olabilir.",
          "Bu bağlantı deneyimi cihaz modeli, telefon uyumluluğu ve kullanılan uygulamalara göre değişebilir. Bu nedenle beklentiler satın alma öncesinde netleştirilmelidir.",
        ],
      },
      {
        heading: "Konuşma ve medya deneyimi",
        paragraphs: [
          "Telefon görüşmeleri, video sesleri veya bazı uygulama bildirimleri cihaz üzerinden daha pratik şekilde dinlenebilir. Bu deneyim modele ve uyumluluğa göre değişebilir.",
          "Özellikle telefonla sık görüşen veya dijital içerik tüketen kullanıcılar için bağlantı özellikleri günlük kullanımda fark yaratabilir.",
        ],
      },
      {
        heading: "Günlük kullanımda pratiklik",
        paragraphs: [
          "Bağlantı özellikleri özellikle telefon kullanımında kolaylık sağlayabilir. Bazı modellerde uygulama üzerinden ses ayarı ve program değişimi de yapılabilir.",
          "Bu pratiklik, kullanıcının cihazı daha aktif ve kontrollü kullanmasına yardımcı olabilir. Yine de tüm özelliklerin sade biçimde anlatılması önemlidir.",
        ],
      },
      {
        heading: "Her kullanıcı için uygun olmayabileceği",
        paragraphs: [
          "Bluetooth özelliği her kullanıcı için temel ihtiyaç olmayabilir. Kullanım alışkanlıkları ve teknik beklentiler bu noktada birlikte değerlendirilmelidir.",
          "Bazı kullanıcılar için daha sade, kolay yönetilen bir cihaz daha uygun olabilir. Bu nedenle teknoloji ihtiyacı kişisel beklentilerle birlikte ele alınmalıdır.",
        ],
      },
      {
        heading: "Doğru model seçimi",
        paragraphs: [
          "Bağlantı özelliklerinden verimli faydalanmak için telefon uyumluluğu, kullanım beklentisi ve cihaz tipi doğru analiz edilmelidir.",
          "Uzman yönlendirmesi, bağlantı özelliklerinin günlük yaşamda gerçekten fayda sağlayıp sağlamayacağını anlamayı kolaylaştırır.",
        ],
      },
    ],
  },
  {
    title: "İşitme Kaybı Belirtileri Nelerdir?",
    slug: "isitme-kaybi-belirtileri-nelerdir",
    category: "İşitme Sağlığı",
    date: "18 Nisan 2026",
    readingTime: "4 dk okuma",
    excerpt:
      "Konuşmaları sık tekrar ettirme, kalabalık ortamlarda zorlanma ve televizyon sesini artırma gibi durumlar işitme değerlendirmesi ihtiyacını gösterebilir.",
    intro:
      "İşitme kaybı belirtileri her zaman ani veya belirgin şekilde fark edilmeyebilir. Günlük iletişimde küçük zorluklar, zamanla kişinin sosyal yaşamını ve iletişim konforunu etkileyebilir.",
    image: "/images/blog-hearing-loss-signs.jpg",
    highlightBox: defaultHighlightBox,
    sections: [
      {
        heading: "Konuşmaları tekrar ettirme",
        paragraphs: [
          "Sık sık konuşmaların tekrar edilmesini istemek, özellikle sessiz olmayan ortamlarda işitme güçlüğüne işaret edebilir.",
          "Bu durum her zaman işitme kaybı anlamına gelmez; ancak tekrarlayan bir hale geldiğinde değerlendirme yaptırmak faydalı olabilir.",
        ],
      },
      {
        heading: "Kalabalık ortamlarda zorlanma",
        paragraphs: [
          "Restoran, toplantı veya aile ortamı gibi birden fazla sesin olduğu yerlerde konuşmaları ayırt etmek zorlaşabilir.",
          "Arka plan gürültüsü arttığında konuşmaları takip etmek daha fazla dikkat gerektiriyorsa bu durum işitme değerlendirmesi ihtiyacını gösterebilir.",
        ],
      },
      {
        heading: "Televizyon veya telefon sesini artırma",
        paragraphs: [
          "Televizyon, telefon veya bilgisayar sesini çevrenin rahatsız olacağı kadar yükseltme ihtiyacı fark edilen belirtiler arasında olabilir.",
          "Yakın çevrenin ses yüksekliğiyle ilgili sık uyarıda bulunması, kişinin kendi işitme konforunu yeniden değerlendirmesi için bir işaret olabilir.",
        ],
      },
      {
        heading: "Yakın çevreden gelen uyarılar",
        paragraphs: [
          "Aile üyeleri veya yakın çevre, kişinin bazı sesleri kaçırdığını daha önce fark edebilir. Bu geri bildirimler dikkate alınmalıdır.",
          "Günlük yaşamda kapı zili, telefon sesi veya konuşma ayrıntılarını kaçırma gibi durumlar yakın çevre tarafından daha kolay gözlemlenebilir.",
        ],
      },
      {
        heading: "Değerlendirme için uzman görüşü",
        paragraphs: [
          "Bu belirtiler tek başına tanı anlamına gelmez. İşitme seviyesini anlamak için uzman değerlendirmesi ve yüz yüze danışmanlık önerilir.",
          "Erken değerlendirme, ihtiyaç varsa uygun çözüm yollarının daha bilinçli biçimde planlanmasına yardımcı olabilir.",
        ],
      },
    ],
  },
  {
    title: "İşitme Cihazına Alışma Süreci Nasıl İlerler?",
    slug: "isitme-cihazina-alisma-sureci-nasil-ilerler",
    category: "Cihaz Kullanımı",
    date: "4 Nisan 2026",
    readingTime: "4 dk okuma",
    excerpt:
      "Yeni bir işitme cihazına alışmak zaman alabilir. Düzenli kullanım, doğru ayarlama ve uzman takibi bu süreci kolaylaştırır.",
    intro:
      "İşitme cihazına alışma süreci kişiden kişiye değişebilir. Yeni sesleri yeniden duymaya başlamak, başlangıçta farklı bir deneyim oluşturabilir ve bu süreçte sabırlı olmak önemlidir.",
    image: "/images/blog-adaptation-process.jpg",
    highlightBox: defaultHighlightBox,
    sections: [
      {
        heading: "İlk günlerde farklı ses algısı",
        paragraphs: [
          "Yeni cihaz kullanımında çevresel sesler başlangıçta daha farklı veya yoğun algılanabilir. Bu durum alışma sürecinin doğal bir parçası olabilir.",
          "Kişi uzun süredir duymadığı bazı çevresel sesleri yeniden fark edebilir. Bu seslere alışmak zaman ve düzenli kullanım gerektirir.",
        ],
      },
      {
        heading: "Kademeli kullanım alışkanlığı",
        paragraphs: [
          "Cihazı düzenli ve kontrollü şekilde kullanmak, beynin yeni ses deneyimine uyum sağlamasına yardımcı olur.",
          "İlk günlerde daha sakin ortamlarda başlayıp zamanla farklı sosyal ortamlarda kullanımı artırmak alışma sürecini daha yönetilebilir hale getirebilir.",
        ],
      },
      {
        heading: "Ayarlama ve takip süreci",
        paragraphs: [
          "İlk ayarlar her zaman son ayar olmayabilir. Kullanıcı geri bildirimiyle cihaz ayarlarının takip edilmesi konforu artırabilir.",
          "Hangi seslerin rahatsız ettiği, hangi ortamlarda zorluk yaşandığı ve cihazın gün içinde ne kadar kullanıldığı takip sürecinde önemlidir.",
        ],
      },
      {
        heading: "Sabırlı kullanımın önemi",
        paragraphs: [
          "Alışma süreci kişiden kişiye değişir. Sabırlı olmak ve cihazı yalnızca zor ortamlarda değil, günlük rutinde de kullanmak faydalıdır.",
          "Cihazı düzensiz kullanmak alışma sürecini uzatabilir. Düzenli kullanım, seslere daha doğal şekilde uyum sağlamayı destekler.",
        ],
      },
      {
        heading: "Uzman desteğiyle sürecin kolaylaşması",
        paragraphs: [
          "Kullanım sırasında yaşanan zorluklar uzman desteğiyle değerlendirildiğinde alışma süreci daha anlaşılır ve yönetilebilir hale gelir.",
          "Takip görüşmeleri, cihaz ayarlarının ve kullanım alışkanlıklarının birlikte değerlendirilmesine imkan tanır.",
        ],
      },
    ],
  },
  {
    title: "İşitme Testi Neden Önemlidir?",
    slug: "isitme-testi-neden-onemlidir",
    category: "Sık Sorulan Sorular",
    date: "20 Mart 2026",
    readingTime: "4 dk okuma",
    excerpt:
      "İşitme testi, işitme seviyesini anlamak ve uygun çözüm yolunu belirlemek için ilk adımdır. Online testler ön fikir verebilir; kapsamlı değerlendirme için uzman görüşü gerekir.",
    intro:
      "İşitme testi, işitme seviyesini anlamak ve olası çözüm yollarını değerlendirmek için temel bir adımdır. Kişinin hangi sesleri ne düzeyde duyabildiğini anlamak, sonraki yönlendirmeleri daha sağlıklı hale getirir.",
    image: "/images/blog-hearing-test.jpg",
    highlightBox: defaultHighlightBox,
    sections: [
      {
        heading: "İşitme seviyesini anlamak",
        paragraphs: [
          "İşitme testi, kişinin hangi ses aralıklarında zorlandığını anlamaya yardımcı olur. Bu bilgi değerlendirme sürecinin temelini oluşturur.",
          "Günlük yaşamda fark edilmeyen bazı işitme farklılıkları, test sürecinde daha net görülebilir.",
        ],
      },
      {
        heading: "Uygun çözüm yolunu belirlemek",
        paragraphs: [
          "İşitme seviyesinin anlaşılması, cihaz ihtiyacı veya farklı yönlendirme seçeneklerinin daha doğru değerlendirilmesini sağlar.",
          "Bu süreçte yalnızca test sonucu değil, kişinin yaşam tarzı, beklentileri ve iletişim ihtiyacı da dikkate alınmalıdır.",
        ],
      },
      {
        heading: "Online testlerin sınırlı bilgi vermesi",
        paragraphs: [
          "Online testler genel bir fikir verebilir ancak ortam koşulları, cihaz kalitesi ve kişisel farklılıklar nedeniyle kapsamlı değerlendirme yerine geçmez.",
          "Bu testler farkındalık oluşturabilir; ancak kişisel değerlendirme ve cihaz seçimi için tek başına yeterli kabul edilmemelidir.",
        ],
      },
      {
        heading: "Yüz yüze değerlendirme gerekliliği",
        paragraphs: [
          "Detaylı değerlendirme için uzman eşliğinde yapılan yüz yüze görüşme ve test süreci önerilir.",
          "Yüz yüze görüşme, kişinin şikayetlerinin, beklentilerinin ve günlük yaşam koşullarının daha iyi anlaşılmasını sağlar.",
        ],
      },
      {
        heading: "Cihaz seçimi için temel adım olması",
        paragraphs: [
          "Doğru cihaz seçimi, işitme testinden elde edilen bilgiler ve kişinin günlük yaşam beklentileri birlikte ele alınarak yapılmalıdır.",
          "Bu nedenle test süreci, cihaz seçimine giden yolun başlangıç noktası olarak görülmelidir.",
        ],
      },
    ],
  },
];

export const featuredPost = blogPosts[0];
export const otherBlogPosts = blogPosts.slice(1);

export function getBlogPostBySlug(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
