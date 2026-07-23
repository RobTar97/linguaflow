import type { Category, Locale, LocalizedText, Topic } from "../domain/types";

const text = (EN: string, PL: string, JA: string): LocalizedText => ({
  EN,
  PL,
  JA,
});

const vocab = (
  entries: Array<[string, string, string, string]>,
): Topic["vocabulary"] => ({
  EN: entries.map(([word, translation, , part]) => ({
    word,
    translation,
    part,
  })),
  PL: entries.map(([word, translation, , part]) => ({
    word: translation,
    translation: word,
    part,
  })),
  JA: entries.map(([word, , translation, part]) => ({
    word: translation,
    translation: word,
    part,
  })),
});

export const localeNames: Record<Locale, string> = {
  EN: "English",
  PL: "Polski",
  JA: "日本語",
};

export const categoryCopy: Record<Category, LocalizedText> = {
  "Daily Life": text("Daily Life", "Codzienne życie", "日常生活"),
  "Work & Career": text("Work & Career", "Praca i kariera", "仕事・キャリア"),
  "Travel & Culture": text("Travel & Culture", "Podróże i kultura", "旅行・文化"),
  "People & Relationships": text(
    "People & Relationships",
    "Ludzie i relacje",
    "人間関係",
  ),
  Technology: text("Technology", "Technologia", "テクノロジー"),
  "Health & Wellness": text(
    "Health & Wellness",
    "Zdrowie i samopoczucie",
    "健康・ウェルネス",
  ),
  Education: text("Education", "Edukacja", "教育"),
  Environment: text("Environment", "Środowisko", "環境"),
};

const authoredTopics: Topic[] = [
  {
    id: "remote-work",
    level: "B2",
    languages: ["EN", "PL"],
    category: "Work & Career",
    artIndex: 0,
    title: text(
      "Remote Work Around the World",
      "Praca zdalna na świecie",
      "世界のリモートワーク",
    ),
    description: text(
      "Explore how working from anywhere changes daily life.",
      "Porozmawiaj o tym, jak praca z dowolnego miejsca zmienia codzienność.",
      "どこからでも働けることが日常をどう変えるか考えましょう。",
    ),
    mainPrompt: text(
      "How has remote work changed the way we live and connect with others?",
      "Jak praca zdalna zmieniła sposób, w jaki żyjemy i kontaktujemy się z innymi?",
      "リモートワークは私たちの暮らしや人とのつながりをどう変えましたか？",
    ),
    followUps: {
      EN: [
        "What do you like most about working remotely?",
        "What challenges do people face when working from home?",
        "How do you stay productive and focused?",
        "Is remote work better for employees or employers?",
        "What will remote work look like in ten years?",
      ],
      PL: [
        "Co najbardziej lubisz w pracy zdalnej?",
        "Jakie trudności napotykają osoby pracujące z domu?",
        "Jak utrzymujesz koncentrację i produktywność?",
        "Czy praca zdalna jest lepsza dla pracowników czy pracodawców?",
        "Jak będzie wyglądać praca zdalna za dziesięć lat?",
      ],
      JA: [
        "リモートワークの一番好きなところは何ですか？",
        "在宅勤務ではどんな課題がありますか？",
        "集中力と生産性をどう保っていますか？",
        "リモートワークは社員と会社のどちらにより良いですか？",
        "10年後のリモートワークはどうなっていると思いますか？",
      ],
    },
    vocabulary: vocab([
      ["flexibility", "elastyczność", "柔軟性", "noun"],
      ["commute", "dojazd", "通勤", "noun"],
      ["collaboration", "współpraca", "協力", "noun"],
      ["work-life balance", "równowaga praca–życie", "ワークライフバランス", "noun"],
      ["productivity", "produktywność", "生産性", "noun"],
      ["disconnect", "odłączyć się", "仕事から離れる", "verb"],
    ]),
  },
  {
    id: "morning-routines",
    level: "A2",
    languages: ["PL", "JA"],
    category: "Daily Life",
    artIndex: 1,
    title: text("Morning Routines", "Poranne zwyczaje", "朝の習慣"),
    description: text(
      "Share how you start your day and what helps you feel ready.",
      "Opowiedz, jak zaczynasz dzień i co pomaga Ci dobrze wystartować.",
      "一日の始め方と、元気に始めるための習慣を話しましょう。",
    ),
    mainPrompt: text(
      "What does your morning look like before work or school?",
      "Jak wygląda Twój poranek przed pracą lub szkołą?",
      "仕事や学校へ行く前の朝はどのように過ごしますか？",
    ),
    followUps: {
      EN: [
        "What time do you usually wake up?",
        "Do you eat breakfast every day?",
        "What is the first thing you check in the morning?",
        "Do you prefer quiet or music in the morning?",
      ],
      PL: [
        "O której zwykle wstajesz?",
        "Czy codziennie jesz śniadanie?",
        "Co sprawdzasz jako pierwsze rano?",
        "Wolisz rano ciszę czy muzykę?",
      ],
      JA: [
        "普段は何時に起きますか？",
        "毎日朝ごはんを食べますか？",
        "朝、最初に何を確認しますか？",
        "朝は静かな方が好きですか、音楽が好きですか？",
      ],
    },
    vocabulary: vocab([
      ["alarm", "budzik", "目覚まし", "noun"],
      ["breakfast", "śniadanie", "朝ごはん", "noun"],
      ["get ready", "przygotować się", "準備する", "verb"],
      ["habit", "nawyk", "習慣", "noun"],
    ]),
  },
  {
    id: "japanese-festivals",
    level: "B1",
    languages: ["EN", "JA"],
    category: "Travel & Culture",
    artIndex: 2,
    title: text("Japanese Festivals", "Japońskie festiwale", "日本の祭り"),
    description: text(
      "Discover local traditions, seasonal celebrations, and festival food.",
      "Poznaj lokalne tradycje, święta sezonowe i festiwalowe jedzenie.",
      "地域の伝統、季節の行事、屋台の食べ物について話しましょう。",
    ),
    mainPrompt: text(
      "Why are local festivals important to a community?",
      "Dlaczego lokalne festiwale są ważne dla społeczności?",
      "地域のお祭りは、なぜコミュニティにとって大切なのでしょうか？",
    ),
    followUps: {
      EN: [
        "Which festival would you like to visit?",
        "What festival food would you try?",
        "How do people prepare for a matsuri?",
        "Which traditions should be protected?",
      ],
      PL: [
        "Który festiwal chciałbyś odwiedzić?",
        "Jakiego festiwalowego jedzenia chciałbyś spróbować?",
        "Jak ludzie przygotowują się do matsuri?",
        "Które tradycje należy chronić?",
      ],
      JA: [
        "どのお祭りに行ってみたいですか？",
        "どんな屋台料理を食べてみたいですか？",
        "人々は祭りのためにどんな準備をしますか？",
        "どの伝統を守るべきだと思いますか？",
      ],
    },
    vocabulary: vocab([
      ["lantern", "lampion", "提灯", "noun"],
      ["tradition", "tradycja", "伝統", "noun"],
      ["fireworks", "fajerwerki", "花火", "noun"],
      ["food stall", "stoisko z jedzeniem", "屋台", "noun"],
    ]),
  },
  {
    id: "travel-plans",
    level: "A2",
    languages: ["PL", "JA"],
    category: "Travel & Culture",
    artIndex: 3,
    title: text("Travel Plans", "Plany podróży", "旅行の計画"),
    description: text(
      "Plan an imaginary trip and explain what you want to experience.",
      "Zaplanuj wymarzoną podróż i opowiedz, czego chcesz doświadczyć.",
      "行ってみたい旅行を計画し、体験したいことを話しましょう。",
    ),
    mainPrompt: text(
      "If you could travel next month, where would you go and why?",
      "Gdybyś mógł podróżować w przyszłym miesiącu, dokąd byś pojechał i dlaczego?",
      "来月旅行できるなら、どこへ行きたいですか？なぜですか？",
    ),
    followUps: {
      EN: [
        "Who would you travel with?",
        "How long would you stay?",
        "What would you pack first?",
        "Do you prefer a detailed plan or spontaneity?",
      ],
      PL: [
        "Z kim chciałbyś podróżować?",
        "Jak długo chciałbyś zostać?",
        "Co spakowałbyś najpierw?",
        "Wolisz dokładny plan czy spontaniczność?",
      ],
      JA: [
        "誰と旅行したいですか？",
        "どのくらい滞在したいですか？",
        "最初に何を荷造りしますか？",
        "詳しい計画と自由な旅のどちらが好きですか？",
      ],
    },
    vocabulary: vocab([
      ["destination", "cel podróży", "目的地", "noun"],
      ["luggage", "bagaż", "荷物", "noun"],
      ["itinerary", "plan podróży", "旅程", "noun"],
      ["book a room", "zarezerwować pokój", "部屋を予約する", "verb"],
    ]),
  },
  {
    id: "future-of-ai",
    level: "B2",
    languages: ["EN", "PL"],
    category: "Technology",
    artIndex: 4,
    title: text("The Future of AI", "Przyszłość AI", "AIの未来"),
    description: text(
      "Discuss where artificial intelligence already helps—and where it should stop.",
      "Porozmawiaj o tym, gdzie AI pomaga, a gdzie powinna mieć granice.",
      "AIが役立つ場面と、どこに限界を設けるべきか話しましょう。",
    ),
    mainPrompt: text(
      "How should artificial intelligence change our everyday lives?",
      "Jak sztuczna inteligencja powinna zmieniać nasze codzienne życie?",
      "人工知能は私たちの日常生活をどのように変えるべきですか？",
    ),
    followUps: {
      EN: [
        "Which AI tools do you already use?",
        "What work should always stay human?",
        "How can AI support language learning?",
        "What risks worry you most?",
      ],
      PL: [
        "Z jakich narzędzi AI już korzystasz?",
        "Która praca zawsze powinna pozostać ludzka?",
        "Jak AI może wspierać naukę języków?",
        "Jakie zagrożenia martwią Cię najbardziej?",
      ],
      JA: [
        "すでにどんなAIツールを使っていますか？",
        "どんな仕事は人間が続けるべきですか？",
        "AIは語学学習をどう支援できますか？",
        "どんなリスクが一番心配ですか？",
      ],
    },
    vocabulary: vocab([
      ["automation", "automatyzacja", "自動化", "noun"],
      ["privacy", "prywatność", "プライバシー", "noun"],
      ["bias", "uprzedzenie", "偏り", "noun"],
      ["responsible", "odpowiedzialny", "責任ある", "adjective"],
    ]),
  },
  {
    id: "books-that-changed-me",
    level: "B1",
    languages: ["EN", "JA"],
    category: "Education",
    artIndex: 5,
    title: text("Books That Changed Me", "Książki, które mnie zmieniły", "人生を変えた本"),
    description: text(
      "Talk about a story or idea that stayed with you.",
      "Opowiedz o historii lub idei, która została z Tobą na długo.",
      "心に残っている物語や考えについて話しましょう。",
    ),
    mainPrompt: text(
      "Which book has influenced the way you think?",
      "Która książka wpłynęła na Twój sposób myślenia?",
      "あなたの考え方に影響を与えた本は何ですか？",
    ),
    followUps: {
      EN: [
        "When did you first read it?",
        "Which character or idea stayed with you?",
        "Would you recommend it to everyone?",
        "Do books change society?",
      ],
      PL: [
        "Kiedy przeczytałeś ją po raz pierwszy?",
        "Która postać lub idea została z Tobą?",
        "Czy poleciłbyś ją każdemu?",
        "Czy książki zmieniają społeczeństwo?",
      ],
      JA: [
        "初めて読んだのはいつですか？",
        "どの登場人物や考えが心に残りましたか？",
        "誰にでも勧めたいですか？",
        "本は社会を変えると思いますか？",
      ],
    },
    vocabulary: vocab([
      ["author", "autor", "著者", "noun"],
      ["character", "postać", "登場人物", "noun"],
      ["chapter", "rozdział", "章", "noun"],
      ["influence", "wpływać", "影響する", "verb"],
    ]),
  },
  {
    id: "making-friends",
    level: "A1",
    languages: ["EN", "PL"],
    category: "People & Relationships",
    artIndex: 6,
    title: text("Making New Friends", "Poznawanie nowych ludzi", "新しい友達"),
    description: text(
      "Practice simple questions for getting to know someone.",
      "Przećwicz proste pytania, które pomagają kogoś poznać.",
      "初対面の人と仲良くなるための簡単な質問を練習しましょう。",
    ),
    mainPrompt: text(
      "What helps two people become friends?",
      "Co pomaga dwóm osobom zostać przyjaciółmi?",
      "二人が友達になるために大切なことは何ですか？",
    ),
    followUps: {
      EN: [
        "Where do you meet new people?",
        "What do you ask someone first?",
        "What makes a good friend?",
        "Is it easy for you to start a conversation?",
      ],
      PL: [
        "Gdzie poznajesz nowych ludzi?",
        "O co pytasz kogoś na początku?",
        "Jaki jest dobry przyjaciel?",
        "Czy łatwo zaczynasz rozmowę?",
      ],
      JA: [
        "どこで新しい人と出会いますか？",
        "最初に何を聞きますか？",
        "良い友達とはどんな人ですか？",
        "会話を始めるのは簡単ですか？",
      ],
    },
    vocabulary: vocab([
      ["introduce", "przedstawić", "紹介する", "verb"],
      ["hobby", "hobby", "趣味", "noun"],
      ["friendly", "przyjazny", "親しみやすい", "adjective"],
      ["in common", "wspólnego", "共通して", "phrase"],
    ]),
  },
  {
    id: "food-and-culture",
    level: "B1",
    languages: ["EN", "JA"],
    category: "Travel & Culture",
    artIndex: 7,
    title: text("Food and Culture", "Jedzenie i kultura", "食と文化"),
    description: text(
      "Explore how meals carry history, identity, and family traditions.",
      "Porozmawiaj o tym, jak jedzenie łączy historię, tożsamość i rodzinne tradycje.",
      "食事に込められた歴史、アイデンティティ、家族の伝統を考えましょう。",
    ),
    mainPrompt: text(
      "What can a country's food teach us about its culture?",
      "Czego jedzenie danego kraju może nauczyć nas o jego kulturze?",
      "その国の料理から文化について何を学べますか？",
    ),
    followUps: {
      EN: [
        "Which meal represents your home best?",
        "Who taught you to cook?",
        "How does food change when it travels?",
        "Which food tradition should continue?",
      ],
      PL: [
        "Które danie najlepiej reprezentuje Twój dom?",
        "Kto nauczył Cię gotować?",
        "Jak jedzenie zmienia się, gdy trafia do innych krajów?",
        "Którą tradycję kulinarną warto kontynuować?",
      ],
      JA: [
        "あなたの家庭を一番よく表す料理は何ですか？",
        "誰に料理を教わりましたか？",
        "料理は海外に伝わるとどう変わりますか？",
        "どの食文化を残していきたいですか？",
      ],
    },
    vocabulary: vocab([
      ["recipe", "przepis", "レシピ", "noun"],
      ["ingredient", "składnik", "材料", "noun"],
      ["homemade", "domowy", "手作りの", "adjective"],
      ["pass down", "przekazywać", "受け継ぐ", "verb"],
    ]),
  },
  {
    id: "weekend-getaways",
    level: "A2",
    languages: ["PL", "JA"],
    category: "Travel & Culture",
    artIndex: 8,
    title: text("Weekend Getaways", "Weekendowe wyjazdy", "週末の小旅行"),
    description: text(
      "Share ideas for a short break close to home.",
      "Podziel się pomysłami na krótki wyjazd niedaleko domu.",
      "近場で楽しめる短い週末旅行について話しましょう。",
    ),
    mainPrompt: text(
      "What makes a perfect weekend trip?",
      "Co sprawia, że weekendowy wyjazd jest idealny?",
      "理想的な週末旅行に必要なものは何ですか？",
    ),
    followUps: {
      EN: [
        "Do you prefer a city or nature?",
        "How far would you travel?",
        "What do you always bring?",
        "Would you travel alone?",
      ],
      PL: [
        "Wolisz miasto czy naturę?",
        "Jak daleko chciałbyś pojechać?",
        "Co zawsze ze sobą zabierasz?",
        "Czy pojechałbyś sam?",
      ],
      JA: [
        "都会と自然のどちらが好きですか？",
        "どのくらい遠くまで行きたいですか？",
        "いつも何を持って行きますか？",
        "一人で旅行したいですか？",
      ],
    },
    vocabulary: vocab([
      ["getaway", "krótki wyjazd", "小旅行", "noun"],
      ["scenery", "krajobraz", "景色", "noun"],
      ["nearby", "w pobliżu", "近くの", "adjective"],
      ["relax", "odpocząć", "くつろぐ", "verb"],
    ]),
  },
  {
    id: "healthy-habits",
    level: "A2",
    languages: ["EN", "PL"],
    category: "Health & Wellness",
    artIndex: 9,
    title: text("Healthy Everyday Habits", "Zdrowe codzienne nawyki", "毎日の健康習慣"),
    description: text(
      "Compare small routines that help people feel well.",
      "Porównaj drobne nawyki, które pomagają dobrze się czuć.",
      "健康のために続けている小さな習慣を比べましょう。",
    ),
    mainPrompt: text(
      "Which small habit makes the biggest difference to your health?",
      "Który mały nawyk najbardziej wpływa na Twoje zdrowie?",
      "健康に一番大きな変化をもたらす小さな習慣は何ですか？",
    ),
    followUps: {
      EN: [
        "How much sleep do you need?",
        "What healthy food do you enjoy?",
        "How often do you exercise?",
        "What habit would you like to start?",
      ],
      PL: [
        "Ile snu potrzebujesz?",
        "Jakie zdrowe jedzenie lubisz?",
        "Jak często ćwiczysz?",
        "Jaki nawyk chcesz zacząć?",
      ],
      JA: [
        "どのくらい睡眠が必要ですか？",
        "どんな健康的な食べ物が好きですか？",
        "どのくらい運動しますか？",
        "これから始めたい習慣は何ですか？",
      ],
    },
    vocabulary: vocab([
      ["sleep", "sen", "睡眠", "noun"],
      ["exercise", "ćwiczenia", "運動", "noun"],
      ["balanced", "zrównoważony", "バランスの良い", "adjective"],
      ["take a break", "zrobić przerwę", "休憩する", "verb"],
    ]),
  },
  {
    id: "learning-from-mistakes",
    level: "B2",
    languages: ["PL", "JA"],
    category: "Education",
    artIndex: 10,
    title: text("Learning from Mistakes", "Nauka na błędach", "失敗から学ぶ"),
    description: text(
      "Reflect on failure, feedback, and growing through practice.",
      "Zastanów się nad porażką, informacją zwrotną i rozwojem przez praktykę.",
      "失敗やフィードバック、練習を通した成長について考えましょう。",
    ),
    mainPrompt: text(
      "Why can making mistakes be essential for learning?",
      "Dlaczego popełnianie błędów może być niezbędne w nauce?",
      "なぜ間違えることは学習に欠かせないのでしょうか？",
    ),
    followUps: {
      EN: [
        "Which mistake taught you something important?",
        "What makes feedback useful?",
        "Why are some people afraid to be wrong?",
        "How should teachers respond to mistakes?",
      ],
      PL: [
        "Który błąd nauczył Cię czegoś ważnego?",
        "Co sprawia, że informacja zwrotna jest pomocna?",
        "Dlaczego niektórzy boją się pomyłek?",
        "Jak nauczyciele powinni reagować na błędy?",
      ],
      JA: [
        "どんな失敗から大切なことを学びましたか？",
        "役に立つフィードバックとは何ですか？",
        "なぜ間違いを恐れる人がいるのでしょうか？",
        "先生は間違いにどう対応すべきですか？",
      ],
    },
    vocabulary: vocab([
      ["mistake", "błąd", "間違い", "noun"],
      ["feedback", "informacja zwrotna", "フィードバック", "noun"],
      ["improve", "poprawić się", "上達する", "verb"],
      ["confidence", "pewność siebie", "自信", "noun"],
    ]),
  },
  {
    id: "greener-cities",
    level: "C1",
    languages: ["EN", "JA"],
    category: "Environment",
    artIndex: 11,
    title: text("Greener Cities", "Bardziej zielone miasta", "より緑豊かな都市"),
    description: text(
      "Debate how cities can grow while becoming healthier places to live.",
      "Porozmawiaj o tym, jak miasta mogą się rozwijać i stawać zdrowsze.",
      "都市が成長しながら、より健康的な場所になる方法を議論しましょう。",
    ),
    mainPrompt: text(
      "Which changes would make modern cities genuinely sustainable?",
      "Jakie zmiany sprawiłyby, że współczesne miasta stałyby się naprawdę zrównoważone?",
      "現代の都市を本当に持続可能にするには、どんな変化が必要ですか？",
    ),
    followUps: {
      EN: [
        "Should city centers restrict private cars?",
        "Who should pay for green infrastructure?",
        "How can old buildings become efficient?",
        "Can dense cities still feel connected to nature?",
      ],
      PL: [
        "Czy centra miast powinny ograniczać prywatne samochody?",
        "Kto powinien finansować zieloną infrastrukturę?",
        "Jak zwiększyć efektywność starych budynków?",
        "Czy gęste miasta mogą zachować kontakt z naturą?",
      ],
      JA: [
        "都心部では自家用車を制限すべきですか？",
        "環境インフラの費用は誰が負担すべきですか？",
        "古い建物の効率をどう改善できますか？",
        "人口密度の高い都市でも自然とのつながりを保てますか？",
      ],
    },
    vocabulary: vocab([
      ["sustainable", "zrównoważony", "持続可能な", "adjective"],
      ["public transport", "transport publiczny", "公共交通機関", "noun"],
      ["infrastructure", "infrastruktura", "インフラ", "noun"],
      ["renewable", "odnawialny", "再生可能な", "adjective"],
    ]),
  },
];

const supplementalQuestions: Record<string, [string, string, string]> = {
  "morning-routines": [
    "What helps you leave home on time?",
    "Co pomaga Ci wyjść z domu na czas?",
    "時間どおりに家を出るために何をしていますか？",
  ],
  "japanese-festivals": [
    "Have you ever taken part in a local festival?",
    "Czy brałeś kiedyś udział w lokalnym festiwalu?",
    "地域のお祭りに参加したことがありますか？",
  ],
  "travel-plans": [
    "Which local food would you like to try?",
    "Jakiego lokalnego jedzenia chciałbyś spróbować?",
    "どんな地元料理を食べてみたいですか？",
  ],
  "future-of-ai": [
    "Who should be responsible when an AI system makes a mistake?",
    "Kto powinien odpowiadać za błąd popełniony przez system AI?",
    "AIが間違えた場合、誰が責任を負うべきですか？",
  ],
  "books-that-changed-me": [
    "Do you prefer paper books, e-books, or audiobooks?",
    "Wolisz książki papierowe, e-booki czy audiobooki?",
    "紙の本、電子書籍、オーディオブックのどれが好きですか？",
  ],
  "making-friends": [
    "How do you keep in touch with friends?",
    "Jak utrzymujesz kontakt z przyjaciółmi?",
    "友達とどうやって連絡を取り続けますか？",
  ],
  "food-and-culture": [
    "Why is eating together important in some cultures?",
    "Dlaczego w niektórych kulturach wspólne jedzenie jest ważne?",
    "文化によって、一緒に食事をすることが大切なのはなぜですか？",
  ],
  "weekend-getaways": [
    "What would you do if the weather suddenly changed?",
    "Co zrobiłbyś, gdyby pogoda nagle się zmieniła?",
    "天気が急に変わったら、どうしますか？",
  ],
  "healthy-habits": [
    "How do you remember to continue a new habit?",
    "Jak pamiętasz o kontynuowaniu nowego nawyku?",
    "新しい習慣を続けるために、どんな工夫をしますか？",
  ],
  "learning-from-mistakes": [
    "Is it easier to learn from your own mistake or someone else's?",
    "Łatwiej uczyć się na własnym błędzie czy na błędzie innej osoby?",
    "自分の失敗と他の人の失敗では、どちらから学びやすいですか？",
  ],
  "greener-cities": [
    "Which environmental change should cities make first?",
    "Którą zmianę ekologiczną miasta powinny wprowadzić najpierw?",
    "都市が最初に行うべき環境対策は何ですか？",
  ],
};

const supplementalVocabulary: Record<
  string,
  [string, string, string, string]
> = {
  "morning-routines": ["on time", "na czas", "時間どおりに", "phrase"],
  "japanese-festivals": ["parade", "parada", "行列", "noun"],
  "travel-plans": ["accommodation", "nocleg", "宿泊先", "noun"],
  "future-of-ai": ["decision", "decyzja", "判断", "noun"],
  "books-that-changed-me": ["recommend", "polecić", "勧める", "verb"],
  "making-friends": ["keep in touch", "utrzymywać kontakt", "連絡を取り合う", "verb"],
  "food-and-culture": ["local dish", "lokalne danie", "郷土料理", "noun"],
  "weekend-getaways": ["overnight", "z noclegiem", "一泊の", "adjective"],
  "healthy-habits": ["routine", "rutyna", "日課", "noun"],
  "learning-from-mistakes": ["try again", "spróbować ponownie", "やり直す", "verb"],
  "greener-cities": ["green space", "teren zielony", "緑地", "noun"],
};

export const topics: Topic[] = authoredTopics.map((topic) => {
  const question = supplementalQuestions[topic.id];
  const word = supplementalVocabulary[topic.id];
  if (!question && !word) return topic;

  const vocabularyItem = (locale: Locale) => {
    if (!word) return [];
    const [EN, PL, JA, part] = word;
    if (locale === "EN") return [{ word: EN, translation: PL, part }];
    if (locale === "PL") return [{ word: PL, translation: EN, part }];
    return [{ word: JA, translation: EN, part }];
  };

  return {
    ...topic,
    followUps: {
      EN: [...topic.followUps.EN, ...(question ? [question[0]] : [])],
      PL: [...topic.followUps.PL, ...(question ? [question[1]] : [])],
      JA: [...topic.followUps.JA, ...(question ? [question[2]] : [])],
    },
    vocabulary: {
      EN: [...topic.vocabulary.EN, ...vocabularyItem("EN")],
      PL: [...topic.vocabulary.PL, ...vocabularyItem("PL")],
      JA: [...topic.vocabulary.JA, ...vocabularyItem("JA")],
    },
  };
});

export const uiCopy = {
  EN: {
    browse: "Browse topics",
    saved: "Saved",
    heading: "Browse conversation topics",
    subheading: "Pick a topic and start a meaningful conversation.",
    search: "Search topics",
    allCategories: "All categories",
    allPairs: "All language pairs",
    allLevels: "All levels",
    filters: "Filters",
    clear: "Reset",
    topics: "topics",
    mainPrompt: "Main prompt",
    followUps: "Follow-up questions",
    vocabulary: "Useful vocabulary",
    start: "Start conversation",
    save: "Save topic",
    savedLabel: "Saved",
    copy: "Copy question",
    copied: "Question copied",
    noResults: "No topics match these filters",
    noResultsBody: "Try another level, category, or language pair.",
    noSaved: "No saved topics yet",
    noSavedBody: "Save useful topics to find them quickly before a conversation.",
    browseAction: "Browse topics",
    question: "Question",
    next: "Next question",
    finish: "Finish session",
    sessionReady: "Conversation mode",
    sessionHint: "Take your time. Listen, respond, and stay curious.",
    progress: "Conversation progress",
    close: "Close",
  },
  PL: {
    browse: "Przeglądaj tematy",
    saved: "Zapisane",
    heading: "Tematy do rozmowy",
    subheading: "Wybierz temat i rozpocznij wartościową rozmowę.",
    search: "Szukaj tematów",
    allCategories: "Wszystkie kategorie",
    allPairs: "Wszystkie pary językowe",
    allLevels: "Wszystkie poziomy",
    filters: "Filtry",
    clear: "Resetuj",
    topics: "tematów",
    mainPrompt: "Główne pytanie",
    followUps: "Pytania dodatkowe",
    vocabulary: "Przydatne słownictwo",
    start: "Rozpocznij rozmowę",
    save: "Zapisz temat",
    savedLabel: "Zapisano",
    copy: "Kopiuj pytanie",
    copied: "Skopiowano pytanie",
    noResults: "Brak tematów dla tych filtrów",
    noResultsBody: "Spróbuj wybrać inny poziom, kategorię lub parę językową.",
    noSaved: "Nie masz jeszcze zapisanych tematów",
    noSavedBody: "Zapisuj przydatne tematy, aby szybko znaleźć je przed rozmową.",
    browseAction: "Przeglądaj tematy",
    question: "Pytanie",
    next: "Następne pytanie",
    finish: "Zakończ sesję",
    sessionReady: "Tryb rozmowy",
    sessionHint: "Nie spiesz się. Słuchaj, odpowiadaj i zachowaj ciekawość.",
    progress: "Postęp rozmowy",
    close: "Zamknij",
  },
  JA: {
    browse: "トピックを見る",
    saved: "保存済み",
    heading: "会話トピックを探す",
    subheading: "トピックを選んで、意味のある会話を始めましょう。",
    search: "トピックを検索",
    allCategories: "すべてのカテゴリー",
    allPairs: "すべての言語ペア",
    allLevels: "すべてのレベル",
    filters: "フィルター",
    clear: "リセット",
    topics: "件",
    mainPrompt: "メインの質問",
    followUps: "追加の質問",
    vocabulary: "役立つ単語",
    start: "会話を始める",
    save: "トピックを保存",
    savedLabel: "保存済み",
    copy: "質問をコピー",
    copied: "質問をコピーしました",
    noResults: "条件に合うトピックがありません",
    noResultsBody: "レベル、カテゴリー、言語ペアを変えてみてください。",
    noSaved: "保存したトピックはまだありません",
    noSavedBody: "会話の前にすぐ見つけられるよう、役立つトピックを保存しましょう。",
    browseAction: "トピックを見る",
    question: "質問",
    next: "次の質問",
    finish: "セッションを終了",
    sessionReady: "会話モード",
    sessionHint: "焦らず、よく聞き、答え、好奇心を持ちましょう。",
    progress: "会話の進み具合",
    close: "閉じる",
  },
} as const;
