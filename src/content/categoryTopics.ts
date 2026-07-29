import type {
  Category,
  Level,
  Locale,
  LocalizedText,
  Topic,
} from "../domain/types";

type Triple = [EN: string, PL: string, JA: string];

interface TopicSeed {
  id: string;
  level: Level;
  languages: Topic["languages"];
  category: Category;
  artIndex: number;
  title: Triple;
  description: Triple;
  mainPrompt: Triple;
  followUps: Record<Locale, string[]>;
  vocabulary: Array<
    [EN: string, PL: string, JA: string, partOfSpeech: string]
  >;
}

const localized = ([EN, PL, JA]: Triple): LocalizedText => ({ EN, PL, JA });

const createTopic = (seed: TopicSeed): Topic => ({
  id: seed.id,
  level: seed.level,
  languages: seed.languages,
  category: seed.category,
  artIndex: seed.artIndex,
  atlas: 3,
  title: localized(seed.title),
  description: localized(seed.description),
  mainPrompt: localized(seed.mainPrompt),
  followUps: seed.followUps,
  vocabulary: {
    EN: seed.vocabulary.map(([word, translation, , part]) => ({
      word,
      translation,
      part,
    })),
    PL: seed.vocabulary.map(([word, translation, , part]) => ({
      word: translation,
      translation: word,
      part,
    })),
    JA: seed.vocabulary.map(([word, , translation, part]) => ({
      word: translation,
      translation: word,
      part,
    })),
  },
});

const topicSeeds: TopicSeed[] = [
  {
    id: "home-cooking-stories",
    level: "A2",
    languages: ["EN", "PL"],
    category: "Food & Cooking",
    artIndex: 0,
    title: ["Home Cooking Stories", "Historie z domowej kuchni", "家庭料理の思い出"],
    description: [
      "Share a recipe, memory, or small tradition from your kitchen.",
      "Opowiedz o przepisie, wspomnieniu lub zwyczaju z Twojej kuchni.",
      "家庭のレシピや料理の思い出、小さな習慣について話しましょう。",
    ],
    mainPrompt: [
      "Which home-cooked meal makes you feel comfortable, and why?",
      "Które domowe danie daje Ci poczucie komfortu i dlaczego?",
      "どんな家庭料理を食べるとほっとしますか？それはなぜですか？",
    ],
    followUps: {
      EN: [
        "Who taught you to make it?",
        "Which ingredients are essential?",
        "When do people usually eat this dish?",
        "Have you changed the original recipe?",
        "Which dish would you like to learn next?",
      ],
      PL: [
        "Kto nauczył Cię je przygotowywać?",
        "Które składniki są najważniejsze?",
        "Kiedy zwykle je się to danie?",
        "Czy zmieniłeś oryginalny przepis?",
        "Którego dania chcesz nauczyć się w następnej kolejności?",
      ],
      JA: [
        "誰から作り方を教わりましたか？",
        "欠かせない材料は何ですか？",
        "その料理はいつ食べることが多いですか？",
        "元のレシピを変えたことがありますか？",
        "次はどんな料理を習いたいですか？",
      ],
    },
    vocabulary: [
      ["recipe", "przepis", "レシピ", "noun"],
      ["ingredient", "składnik", "材料", "noun"],
      ["homemade", "domowej roboty", "手作りの", "adjective"],
      ["seasoning", "przyprawa", "味付け", "noun"],
      ["pass down", "przekazywać", "受け継ぐ", "verb"],
    ],
  },
  {
    id: "street-food-adventures",
    level: "B1",
    languages: ["EN", "JA"],
    category: "Food & Cooking",
    artIndex: 1,
    title: ["Street Food Adventures", "Przygody z ulicznym jedzeniem", "屋台グルメの冒険"],
    description: [
      "Explore what street food reveals about a place and its people.",
      "Odkryj, co uliczne jedzenie mówi o miejscu i jego mieszkańcach.",
      "屋台料理から、その土地や人々について考えてみましょう。",
    ],
    mainPrompt: [
      "What makes street food memorable when you visit a new place?",
      "Co sprawia, że uliczne jedzenie zapada w pamięć podczas podróży?",
      "新しい場所を訪れた時、屋台料理が思い出に残るのはなぜですか？",
    ],
    followUps: {
      EN: [
        "Which street food would you recommend?",
        "How do you choose a safe and tasty stall?",
        "Should traditional recipes change for visitors?",
        "What can a market teach us about local life?",
        "Would you join a street-food tour?",
      ],
      PL: [
        "Które uliczne jedzenie poleciłbyś innym?",
        "Jak wybierasz bezpieczne i smaczne stoisko?",
        "Czy tradycyjne przepisy powinny zmieniać się dla turystów?",
        "Czego targ może nauczyć nas o lokalnym życiu?",
        "Czy wziąłbyś udział w wycieczce kulinarnej?",
      ],
      JA: [
        "おすすめしたい屋台料理は何ですか？",
        "安全でおいしい店をどう選びますか？",
        "観光客向けに伝統的なレシピを変えるべきですか？",
        "市場から地域の暮らしについて何を学べますか？",
        "屋台グルメツアーに参加してみたいですか？",
      ],
    },
    vocabulary: [
      ["food stall", "stoisko z jedzeniem", "屋台", "noun"],
      ["local specialty", "lokalny specjał", "名物料理", "noun"],
      ["crowded", "zatłoczony", "混雑した", "adjective"],
      ["hygiene", "higiena", "衛生", "noun"],
      ["recommend", "polecać", "おすすめする", "verb"],
    ],
  },
  {
    id: "reducing-food-waste",
    level: "B2",
    languages: ["PL", "JA"],
    category: "Food & Cooking",
    artIndex: 2,
    title: ["Reducing Food Waste", "Ograniczanie marnowania żywności", "食品ロスを減らす"],
    description: [
      "Compare practical ways to value ingredients and waste less food.",
      "Porównaj praktyczne sposoby lepszego wykorzystywania żywności.",
      "食材を大切にし、食品ロスを減らす方法を比べましょう。",
    ],
    mainPrompt: [
      "Which changes would reduce the most food waste in everyday life?",
      "Jakie zmiany najbardziej ograniczyłyby marnowanie żywności?",
      "日常生活で食品ロスを最も減らせる変化は何だと思いますか？",
    ],
    followUps: {
      EN: [
        "Why do households throw food away?",
        "How can people plan meals more effectively?",
        "Should shops discount food near its use-by date?",
        "What meals can be made from leftovers?",
        "Who is responsible for reducing food waste?",
      ],
      PL: [
        "Dlaczego gospodarstwa domowe wyrzucają jedzenie?",
        "Jak można skuteczniej planować posiłki?",
        "Czy sklepy powinny przeceniać żywność przed terminem ważności?",
        "Jakie dania można przygotować z resztek?",
        "Kto odpowiada za ograniczanie marnowania żywności?",
      ],
      JA: [
        "家庭で食べ物を捨ててしまうのはなぜですか？",
        "どうすれば食事をより上手に計画できますか？",
        "店は期限が近い食品を値引きすべきですか？",
        "残り物からどんな料理を作れますか？",
        "食品ロスを減らす責任は誰にありますか？",
      ],
    },
    vocabulary: [
      ["leftovers", "resztki", "残り物", "noun"],
      ["use-by date", "termin przydatności", "消費期限", "noun"],
      ["meal plan", "plan posiłków", "献立", "noun"],
      ["portion", "porcja", "一人分", "noun"],
      ["avoid waste", "unikać marnowania", "無駄を避ける", "verb"],
    ],
  },
  {
    id: "favorite-music-moments",
    level: "A2",
    languages: ["EN", "PL"],
    category: "Arts & Media",
    artIndex: 3,
    title: ["Favorite Music Moments", "Ulubione muzyczne chwile", "心に残る音楽"],
    description: [
      "Talk about songs connected to people, places, and memories.",
      "Porozmawiaj o muzyce związanej z ludźmi, miejscami i wspomnieniami.",
      "人や場所、思い出と結びついた音楽について話しましょう。",
    ],
    mainPrompt: [
      "Which song brings back a strong memory for you?",
      "Która piosenka przywołuje u Ciebie silne wspomnienie?",
      "強い思い出がよみがえる曲は何ですか？",
    ],
    followUps: {
      EN: [
        "When did you first hear it?",
        "Do you listen to music while working or studying?",
        "Which instrument do you enjoy hearing?",
        "How do you discover new music?",
        "Would you rather attend a concert or listen at home?",
      ],
      PL: [
        "Kiedy usłyszałeś ją po raz pierwszy?",
        "Czy słuchasz muzyki podczas pracy lub nauki?",
        "Którego instrumentu lubisz słuchać?",
        "Jak odkrywasz nową muzykę?",
        "Wolisz koncert czy słuchanie muzyki w domu?",
      ],
      JA: [
        "その曲を初めて聴いたのはいつですか？",
        "仕事や勉強をしながら音楽を聴きますか？",
        "どんな楽器の音が好きですか？",
        "新しい音楽をどうやって見つけますか？",
        "コンサートと家で聴くのと、どちらが好きですか？",
      ],
    },
    vocabulary: [
      ["melody", "melodia", "メロディー", "noun"],
      ["lyrics", "tekst piosenki", "歌詞", "noun"],
      ["concert", "koncert", "コンサート", "noun"],
      ["playlist", "playlista", "プレイリスト", "noun"],
      ["remind", "przypominać", "思い出させる", "verb"],
    ],
  },
  {
    id: "films-across-cultures",
    level: "B1",
    languages: ["EN", "JA"],
    category: "Arts & Media",
    artIndex: 4,
    title: ["Films Across Cultures", "Filmy z różnych kultur", "文化を越える映画"],
    description: [
      "Discuss how films open windows into lives different from our own.",
      "Porozmawiaj o tym, jak filmy pokazują życie innych ludzi.",
      "映画が異なる暮らしや文化をどう見せてくれるか話しましょう。",
    ],
    mainPrompt: [
      "What can a film teach us about another culture?",
      "Czego film może nauczyć nas o innej kulturze?",
      "映画から他の文化について何を学べますか？",
    ],
    followUps: {
      EN: [
        "Do you prefer subtitles or dubbing?",
        "Which setting made a film feel authentic?",
        "Can films reinforce stereotypes?",
        "Which local film would you show a visitor?",
        "How does humor change across cultures?",
      ],
      PL: [
        "Wolisz napisy czy dubbing?",
        "Która sceneria sprawiła, że film wydawał się autentyczny?",
        "Czy filmy mogą utrwalać stereotypy?",
        "Który lokalny film pokazałbyś gościowi?",
        "Jak humor zmienia się między kulturami?",
      ],
      JA: [
        "字幕と吹き替えのどちらが好きですか？",
        "どんな舞台設定が映画を本物らしくしましたか？",
        "映画が固定観念を強めることはありますか？",
        "外国から来た人にどの地元映画を見せたいですか？",
        "文化によってユーモアはどう変わりますか？",
      ],
    },
    vocabulary: [
      ["subtitle", "napisy", "字幕", "noun"],
      ["dubbing", "dubbing", "吹き替え", "noun"],
      ["setting", "sceneria", "舞台設定", "noun"],
      ["stereotype", "stereotyp", "固定観念", "noun"],
      ["portray", "przedstawiać", "描く", "verb"],
    ],
  },
  {
    id: "art-in-public-life",
    level: "C1",
    languages: ["PL", "JA"],
    category: "Arts & Media",
    artIndex: 5,
    title: ["Art in Public Life", "Sztuka w przestrzeni publicznej", "公共空間のアート"],
    description: [
      "Debate who public art is for and how it changes shared spaces.",
      "Zastanów się, dla kogo jest sztuka publiczna i jak zmienia wspólną przestrzeń.",
      "公共アートは誰のためにあり、共有空間をどう変えるか議論しましょう。",
    ],
    mainPrompt: [
      "Who should decide what art appears in a public space?",
      "Kto powinien decydować, jaka sztuka pojawia się w przestrzeni publicznej?",
      "公共空間にどんなアートを置くか、誰が決めるべきですか？",
    ],
    followUps: {
      EN: [
        "Should public art always be permanent?",
        "How can a mural change a neighborhood?",
        "What makes public art controversial?",
        "Should artists involve local residents?",
        "How should public art be funded?",
      ],
      PL: [
        "Czy sztuka publiczna zawsze powinna być trwała?",
        "Jak mural może zmienić dzielnicę?",
        "Co sprawia, że sztuka publiczna budzi kontrowersje?",
        "Czy artyści powinni angażować mieszkańców?",
        "Jak należy finansować sztukę publiczną?",
      ],
      JA: [
        "公共アートは常設であるべきですか？",
        "壁画は地域をどう変えられますか？",
        "公共アートが議論を呼ぶのはなぜですか？",
        "アーティストは地域住民と協力すべきですか？",
        "公共アートの費用をどう負担すべきですか？",
      ],
    },
    vocabulary: [
      ["mural", "mural", "壁画", "noun"],
      ["commission", "zamówienie artystyczne", "制作依頼", "noun"],
      ["controversial", "kontrowersyjny", "議論を呼ぶ", "adjective"],
      ["public funding", "finansowanie publiczne", "公的資金", "noun"],
      ["involve residents", "angażować mieszkańców", "住民を巻き込む", "verb"],
    ],
  },
  {
    id: "animals-near-us",
    level: "A1",
    languages: ["EN", "PL"],
    category: "Science & Nature",
    artIndex: 6,
    title: ["Animals Near Us", "Zwierzęta wokół nas", "身近な動物"],
    description: [
      "Notice the birds, insects, and animals that share our neighborhoods.",
      "Zauważ ptaki, owady i zwierzęta żyjące w naszej okolicy.",
      "近所で暮らす鳥や虫、動物に目を向けましょう。",
    ],
    mainPrompt: [
      "Which animals do you often see near your home?",
      "Jakie zwierzęta często widujesz blisko domu?",
      "家の近くでよく見る動物は何ですか？",
    ],
    followUps: {
      EN: [
        "Where do you usually see them?",
        "Which animal is your favorite?",
        "Are there many birds in your area?",
        "What do animals need in a city?",
        "Which animal would you like to learn about?",
      ],
      PL: [
        "Gdzie zwykle je widzisz?",
        "Które zwierzę lubisz najbardziej?",
        "Czy w Twojej okolicy jest dużo ptaków?",
        "Czego potrzebują zwierzęta w mieście?",
        "O którym zwierzęciu chcesz dowiedzieć się więcej?",
      ],
      JA: [
        "どこでよく見かけますか？",
        "一番好きな動物は何ですか？",
        "近所には鳥がたくさんいますか？",
        "街の動物には何が必要ですか？",
        "どの動物についてもっと知りたいですか？",
      ],
    },
    vocabulary: [
      ["bird", "ptak", "鳥", "noun"],
      ["insect", "owad", "虫", "noun"],
      ["nest", "gniazdo", "巣", "noun"],
      ["wild", "dziki", "野生の", "adjective"],
      ["observe", "obserwować", "観察する", "verb"],
    ],
  },
  {
    id: "space-exploration",
    level: "B2",
    languages: ["EN", "JA"],
    category: "Science & Nature",
    artIndex: 7,
    title: ["Space Exploration", "Odkrywanie kosmosu", "宇宙探査"],
    description: [
      "Consider what humanity gains from exploring beyond Earth.",
      "Zastanów się, co ludzkość zyskuje dzięki badaniu kosmosu.",
      "地球の外を探査することで人類が得るものを考えましょう。",
    ],
    mainPrompt: [
      "Why should societies invest in space exploration?",
      "Dlaczego społeczeństwa powinny inwestować w badania kosmosu?",
      "社会はなぜ宇宙探査に投資すべきなのでしょうか？",
    ],
    followUps: {
      EN: [
        "Which space mission inspires you most?",
        "Should humans try to live on another planet?",
        "What risks should astronauts accept?",
        "How does space research help life on Earth?",
        "Who should own resources found in space?",
      ],
      PL: [
        "Która misja kosmiczna inspiruje Cię najbardziej?",
        "Czy ludzie powinni próbować żyć na innej planecie?",
        "Jakie ryzyko powinni akceptować astronauci?",
        "Jak badania kosmosu pomagają życiu na Ziemi?",
        "Kto powinien posiadać zasoby znalezione w kosmosie?",
      ],
      JA: [
        "最も心を動かされた宇宙ミッションは何ですか？",
        "人間は他の惑星に住もうとすべきですか？",
        "宇宙飛行士はどんな危険を受け入れるべきですか？",
        "宇宙研究は地球の暮らしにどう役立ちますか？",
        "宇宙で見つかった資源は誰のものですか？",
      ],
    },
    vocabulary: [
      ["mission", "misja", "ミッション", "noun"],
      ["astronaut", "astronauta", "宇宙飛行士", "noun"],
      ["orbit", "orbita", "軌道", "noun"],
      ["resource", "zasób", "資源", "noun"],
      ["launch", "wystrzelić", "打ち上げる", "verb"],
    ],
  },
  {
    id: "citizen-science",
    level: "B1",
    languages: ["PL", "JA"],
    category: "Science & Nature",
    artIndex: 8,
    title: ["Citizen Science", "Nauka obywatelska", "市民科学"],
    description: [
      "Explore how ordinary people can help collect useful scientific data.",
      "Poznaj sposoby, w jakie każdy może pomagać w zbieraniu danych naukowych.",
      "市民が科学データの収集に参加する方法を考えましょう。",
    ],
    mainPrompt: [
      "How can local people contribute to scientific research?",
      "Jak mieszkańcy mogą przyczyniać się do badań naukowych?",
      "地域の人々は科学研究にどう貢献できますか？",
    ],
    followUps: {
      EN: [
        "What could people observe in their area?",
        "How can researchers check volunteer data?",
        "Would you join a wildlife survey?",
        "What makes a science project easy to join?",
        "Can citizen science influence local decisions?",
      ],
      PL: [
        "Co ludzie mogliby obserwować w swojej okolicy?",
        "Jak naukowcy mogą sprawdzać dane wolontariuszy?",
        "Czy wziąłbyś udział w badaniu dzikiej przyrody?",
        "Co ułatwia udział w projekcie naukowym?",
        "Czy nauka obywatelska może wpływać na lokalne decyzje?",
      ],
      JA: [
        "地域で何を観察できるでしょうか？",
        "研究者はボランティアのデータをどう確認できますか？",
        "野生生物の調査に参加してみたいですか？",
        "参加しやすい科学プロジェクトには何が必要ですか？",
        "市民科学は地域の決定に影響を与えられますか？",
      ],
    },
    vocabulary: [
      ["survey", "badanie", "調査", "noun"],
      ["data", "dane", "データ", "noun"],
      ["volunteer", "wolontariusz", "ボランティア", "noun"],
      ["reliable", "wiarygodny", "信頼できる", "adjective"],
      ["collect evidence", "zbierać dowody", "証拠を集める", "verb"],
    ],
  },
  {
    id: "neighborhood-rules",
    level: "A2",
    languages: ["EN", "PL"],
    category: "Society & Ideas",
    artIndex: 9,
    title: ["Good Neighbor Rules", "Zasady dobrego sąsiedztwa", "よい近所づきあい"],
    description: [
      "Discuss simple agreements that help neighbors live well together.",
      "Porozmawiaj o zasadach, które pomagają sąsiadom dobrze żyć razem.",
      "近所の人が気持ちよく暮らすためのルールを話しましょう。",
    ],
    mainPrompt: [
      "What makes someone a good neighbor?",
      "Co sprawia, że ktoś jest dobrym sąsiadem?",
      "よい隣人とは、どんな人ですか？",
    ],
    followUps: {
      EN: [
        "How should neighbors handle noise?",
        "Do neighbors help each other where you live?",
        "Which shared spaces need rules?",
        "How can a new neighbor introduce themselves?",
        "What small action builds trust?",
      ],
      PL: [
        "Jak sąsiedzi powinni radzić sobie z hałasem?",
        "Czy sąsiedzi pomagają sobie w Twojej okolicy?",
        "Które wspólne miejsca potrzebują zasad?",
        "Jak nowy sąsiad może się przedstawić?",
        "Jaki mały gest buduje zaufanie?",
      ],
      JA: [
        "近所の騒音問題をどう解決すべきですか？",
        "あなたの地域では近所同士で助け合いますか？",
        "どんな共有スペースにルールが必要ですか？",
        "新しく来た人はどう自己紹介すればよいですか？",
        "信頼を築く小さな行動は何ですか？",
      ],
    },
    vocabulary: [
      ["neighbor", "sąsiad", "近所の人", "noun"],
      ["shared space", "wspólna przestrzeń", "共有スペース", "noun"],
      ["noise", "hałas", "騒音", "noun"],
      ["considerate", "taktowny", "思いやりのある", "adjective"],
      ["build trust", "budować zaufanie", "信頼を築く", "verb"],
    ],
  },
  {
    id: "news-and-trust",
    level: "C1",
    languages: ["EN", "JA"],
    category: "Society & Ideas",
    artIndex: 10,
    title: ["News and Trust", "Wiadomości i zaufanie", "ニュースと信頼"],
    description: [
      "Examine how people decide which information deserves their trust.",
      "Zbadaj, jak ludzie oceniają, którym informacjom można ufać.",
      "どの情報を信頼するか、人がどう判断するのか考えましょう。",
    ],
    mainPrompt: [
      "What makes a news source worthy of public trust?",
      "Co sprawia, że źródło wiadomości zasługuje na zaufanie?",
      "信頼できるニュース情報源には何が必要ですか？",
    ],
    followUps: {
      EN: [
        "How do algorithms shape what people see?",
        "Who should correct false information?",
        "Can complete neutrality exist in journalism?",
        "How should people verify a surprising claim?",
        "Does faster news make society better informed?",
      ],
      PL: [
        "Jak algorytmy wpływają na to, co widzą ludzie?",
        "Kto powinien prostować fałszywe informacje?",
        "Czy w dziennikarstwie istnieje pełna neutralność?",
        "Jak sprawdzić zaskakujące twierdzenie?",
        "Czy szybsze wiadomości lepiej informują społeczeństwo?",
      ],
      JA: [
        "アルゴリズムは見る情報にどう影響しますか？",
        "誤った情報は誰が訂正すべきですか？",
        "報道に完全な中立性はあり得ますか？",
        "驚くような主張をどう確認すべきですか？",
        "ニュースが速くなると社会はよりよく情報を得られますか？",
      ],
    },
    vocabulary: [
      ["source", "źródło", "情報源", "noun"],
      ["bias", "stronniczość", "偏り", "noun"],
      ["verification", "weryfikacja", "検証", "noun"],
      ["misleading", "mylący", "誤解を招く", "adjective"],
      ["correct a claim", "prostować twierdzenie", "主張を訂正する", "verb"],
    ],
  },
  {
    id: "volunteering-together",
    level: "B1",
    languages: ["PL", "JA"],
    category: "Society & Ideas",
    artIndex: 11,
    title: ["Volunteering Together", "Wspólny wolontariat", "一緒にボランティア"],
    description: [
      "Share how volunteering can connect people and strengthen a community.",
      "Porozmawiaj o tym, jak wolontariat łączy ludzi i wzmacnia społeczność.",
      "ボランティアが人をつなぎ、地域を強くする方法を話しましょう。",
    ],
    mainPrompt: [
      "Which volunteer project would make the biggest difference locally?",
      "Który projekt wolontariacki najbardziej pomógłby lokalnej społeczności?",
      "地域で最も役立つボランティア活動は何だと思いますか？",
    ],
    followUps: {
      EN: [
        "What skills could you contribute?",
        "Why do people decide to volunteer?",
        "How can organizers welcome first-time volunteers?",
        "Should schools encourage community service?",
        "How can a short project create lasting change?",
      ],
      PL: [
        "Jakie umiejętności mógłbyś zaoferować?",
        "Dlaczego ludzie decydują się na wolontariat?",
        "Jak organizatorzy mogą przyjąć nowych wolontariuszy?",
        "Czy szkoły powinny zachęcać do pracy społecznej?",
        "Jak krótki projekt może stworzyć trwałą zmianę?",
      ],
      JA: [
        "どんな技能を生かせますか？",
        "人はなぜボランティアをしようと思うのでしょうか？",
        "初めての参加者をどう迎えればよいですか？",
        "学校は地域活動への参加を勧めるべきですか？",
        "短い活動が長く続く変化を生むにはどうすればよいですか？",
      ],
    },
    vocabulary: [
      ["volunteer", "wolontariusz", "ボランティア", "noun"],
      ["community service", "praca społeczna", "地域奉仕", "noun"],
      ["organizer", "organizator", "主催者", "noun"],
      ["lasting", "trwały", "長く続く", "adjective"],
      ["contribute", "wnieść wkład", "貢献する", "verb"],
    ],
  },
];

export const categoryTopics = topicSeeds.map(createTopic);
