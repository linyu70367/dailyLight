// 從全域 Vue 物件取出 createApp，用來建立這個 Vue 應用程式。
const { createApp } = Vue;

// 判斷目前是否為獨立的 bible.html 頁面。
const isBiblePage = window.location.pathname.endsWith('/bible.html');

const referenceAbbreviations = [
  'Gen.', 'Exo.', 'Lev.', 'Num.', 'Deut.', 'Josh.', 'Judg.', 'Ruth',
  'I Sam.', 'II Sam.', 'I Kgs.', 'II Kgs.', 'I Chr.', 'II Chr.', 'Ezra', 'Neh.', 'Esth.',
  'Job', 'Psa.', 'Prov.', 'Eccl.', 'Song', 'Isa.', 'Jer.', 'Lam.', 'Ezek.', 'Dan.',
  'Hos.', 'Joel', 'Amos', 'Obad.', 'Jon.', 'Mic.', 'Nah.', 'Hab.', 'Zeph.', 'Hag.', 'Zech.', 'Mal.',
  'Matt.', 'Mark', 'Luke', 'John', 'Acts', 'Rom.', 'I Cor.', 'II Cor.', 'Gal.',
  'Eph.', 'Phil.', 'Col.', 'I Thes.', 'II Thes.', 'I Tim.', 'II Tim.', 'Tit.', 'Philem.',
  'Heb.', 'Jas.', 'I Pet.', 'II Pet.', 'I John', 'II John', 'III John', 'Jude', 'Rev.'
];
const referenceAliases = { eze: 'Ezekiel', phi: 'Philippians', ps: 'Psalms' };

// createApp 裡分成 data、computed、watch、mounted、methods 五個主要區域。
createApp({
  // data 放置畫面會使用或修改的資料。
  data() {
    return {
      // 三份主要資料：每日亮光原文、每日亮光索引、屬靈健保書索引。
      dailyEntries: [],
      indexEntries: [],
      bannerEntries: [],
      travelPlan: null,
      travelPlanRequest: null,
      travelError: '',
      styleRequestId: 0,
      translations: [
        { code: 'ChiUn', title: '和合本' },
        { code: 'ChiUnL', title: '文理和合本' },
        { code: 'KJV', title: 'King James Version' },
        { code: 'BSB', title: 'Berean Standard Bible' },
        { code: 'BBE', title: 'Bible in Basic English' }
      ],
      // 書卷快取格式：bibleCache[譯本][書卷名稱]。
      // 已載入的 JSON 會留在這裡，切換章節時就不必再次下載。
      bibleCache: {},
      // loading/error 負責首頁初始資料；styleLoading/styleError 負責經文 JSON。
      loading: true,
      error: '',
      verseLoading: false,
      verseError: '',
      styleLoading: false,
      styleError: '',
      selectedVerse: null,
      selectedVerseKey: '',
      biblePage: isBiblePage,
      // 「聖經」頁目前選取的書卷與章數。
      selectedBibleBookName: '',
      selectedBibleChapter: 1,
      // name 必須和 JSON 檔名相同；zh 是畫面顯示的中文書名。
      bibleBooks: [
        { name: 'Genesis', zh: '創世記', testament: 'old' },
        { name: 'Exodus', zh: '出埃及記', testament: 'old' },
        { name: 'Leviticus', zh: '利未記', testament: 'old' },
        { name: 'Numbers', zh: '民數記', testament: 'old' },
        { name: 'Deuteronomy', zh: '申命記', testament: 'old' },
        { name: 'Joshua', zh: '約書亞記', testament: 'old' },
        { name: 'Judges', zh: '士師記', testament: 'old' },
        { name: 'Ruth', zh: '路得記', testament: 'old' },
        { name: 'I Samuel', zh: '撒母耳記上', testament: 'old' },
        { name: 'II Samuel', zh: '撒母耳記下', testament: 'old' },
        { name: 'I Kings', zh: '列王紀上', testament: 'old' },
        { name: 'II Kings', zh: '列王紀下', testament: 'old' },
        { name: 'I Chronicles', zh: '歷代志上', testament: 'old' },
        { name: 'II Chronicles', zh: '歷代志下', testament: 'old' },
        { name: 'Ezra', zh: '以斯拉記', testament: 'old' },
        { name: 'Nehemiah', zh: '尼希米記', testament: 'old' },
        { name: 'Esther', zh: '以斯帖記', testament: 'old' },
        { name: 'Job', zh: '約伯記', testament: 'old' },
        { name: 'Psalms', zh: '詩篇', testament: 'old' },
        { name: 'Proverbs', zh: '箴言', testament: 'old' },
        { name: 'Ecclesiastes', zh: '傳道書', testament: 'old' },
        { name: 'Song of Solomon', zh: '雅歌', testament: 'old' },
        { name: 'Isaiah', zh: '以賽亞書', testament: 'old' },
        { name: 'Jeremiah', zh: '耶利米書', testament: 'old' },
        { name: 'Lamentations', zh: '耶利米哀歌', testament: 'old' },
        { name: 'Ezekiel', zh: '以西結書', testament: 'old' },
        { name: 'Daniel', zh: '但以理書', testament: 'old' },
        { name: 'Hosea', zh: '何西阿書', testament: 'old' },
        { name: 'Joel', zh: '約珥書', testament: 'old' },
        { name: 'Amos', zh: '阿摩司書', testament: 'old' },
        { name: 'Obadiah', zh: '俄巴底亞書', testament: 'old' },
        { name: 'Jonah', zh: '約拿書', testament: 'old' },
        { name: 'Micah', zh: '彌迦書', testament: 'old' },
        { name: 'Nahum', zh: '那鴻書', testament: 'old' },
        { name: 'Habakkuk', zh: '哈巴谷書', testament: 'old' },
        { name: 'Zephaniah', zh: '西番雅書', testament: 'old' },
        { name: 'Haggai', zh: '哈該書', testament: 'old' },
        { name: 'Zechariah', zh: '撒迦利亞書', testament: 'old' },
        { name: 'Malachi', zh: '瑪拉基書', testament: 'old' },
        { name: 'Matthew', zh: '馬太福音', testament: 'new' },
        { name: 'Mark', zh: '馬可福音', testament: 'new' },
        { name: 'Luke', zh: '路加福音', testament: 'new' },
        { name: 'John', zh: '約翰福音', testament: 'new' },
        { name: 'Acts', zh: '使徒行傳', testament: 'new' },
        { name: 'Romans', zh: '羅馬書', testament: 'new' },
        { name: 'I Corinthians', zh: '哥林多前書', testament: 'new' },
        { name: 'II Corinthians', zh: '哥林多後書', testament: 'new' },
        { name: 'Galatians', zh: '加拉太書', testament: 'new' },
        { name: 'Ephesians', zh: '以弗所書', testament: 'new' },
        { name: 'Philippians', zh: '腓立比書', testament: 'new' },
        { name: 'Colossians', zh: '歌羅西書', testament: 'new' },
        { name: 'I Thessalonians', zh: '帖撒羅尼迦前書', testament: 'new' },
        { name: 'II Thessalonians', zh: '帖撒羅尼迦後書', testament: 'new' },
        { name: 'I Timothy', zh: '提摩太前書', testament: 'new' },
        { name: 'II Timothy', zh: '提摩太後書', testament: 'new' },
        { name: 'Titus', zh: '提多書', testament: 'new' },
        { name: 'Philemon', zh: '腓利門書', testament: 'new' },
        { name: 'Hebrews', zh: '希伯來書', testament: 'new' },
        { name: 'James', zh: '雅各書', testament: 'new' },
        { name: 'I Peter', zh: '彼得前書', testament: 'new' },
        { name: 'II Peter', zh: '彼得後書', testament: 'new' },
        { name: 'I John', zh: '約翰一書', testament: 'new' },
        { name: 'II John', zh: '約翰二書', testament: 'new' },
        { name: 'III John', zh: '約翰三書', testament: 'new' },
        { name: 'Jude', zh: '猶大書', testament: 'new' },
        { name: 'Revelation of John', zh: '啟示錄', testament: 'new' }
      ].map((book, index) => ({ ...book, abbreviation: referenceAbbreviations[index] })),
      // 桌面版及目前真正生效的篩選條件。
      filters: {
        translation: 'ChiUn',
        translation2: '',
        // follow 為上下跟隨；side-by-side 為左右並排。
        translation2Position: 'follow',
        date: '',
        travelDate: '',
        period: 'morning',
        style: isBiblePage ? 'style4' : 'style2',
        fontSize: 'font-size-normal',
        referenceDisplay: 'show',
        theme: 'theme-night'
      },
      // 手機版暫存條件，按下「套用」後才會複製到 filters。
      mobileFilters: {
        translation: 'ChiUn',
        translation2: '',
        // 手機版先暫存在這裡，按下「套用」後才更新正式設定。
        translation2Position: 'follow',
        date: '',
        travelDate: '',
        period: 'morning',
        style: isBiblePage ? 'style4' : 'style2',
        fontSize: 'font-size-normal',
        referenceDisplay: 'show',
        theme: 'theme-night'
      },
      selectedFont: 'zen-old-mincho'
    };
  },

  // computed 是「由其他資料計算出來的結果」，來源改變時 Vue 會自動重算。
  computed: {
    // 由 Daily Light 資料建立日期選單。
    dates() {
      return [...new Set(this.dailyEntries.map(item => item.date))];
    },

    // 依日期與 morning/evening 找出目前的 Daily Light 內容。
    currentEntry() {
      return this.dailyEntries.find(item => (
        item.date === this.filters.date && item.period === this.filters.period
      ));
    },

    currentIndexEntry() {
      return this.indexEntries.find(item => (
        item.date === this.filters.date && item.period === this.filters.period
      ));
    },

    currentIndexItems() {
      return this.currentIndexEntry?.index || [];
    },

    // 屬靈健保書只依日期查找，不分 morning/evening。
    currentBannerIndexEntry() {
      return this.bannerEntries.find(item => item.date === this.filters.date);
    },

    currentBannerIndexItems() {
      return this.currentBannerIndexEntry?.index || [];
    },

    currentTravelReadings() {
      return this.travelPlan?.[this.filters.travelDate] || [];
    },

    activeIndexItems() {
      if (this.filters.style === 'style5') {
        return this.travelSections.flatMap(section => section.items);
      }
      return this.filters.style === 'style3' ? this.currentBannerIndexItems : this.currentIndexItems;
    },

    // 目前要顯示的譯本；譯本二留空時只回傳主要譯本。
    selectedTranslations() {
      return [this.filters.translation, this.filters.translation2].filter(Boolean);
    },

    oldTestamentBooks() {
      return this.bibleBooks.filter(book => book.testament === 'old');
    },

    newTestamentBooks() {
      return this.bibleBooks.filter(book => book.testament === 'new');
    },

    selectedBibleBook() {
      return this.bibleBooks.find(book => book.name === this.selectedBibleBookName);
    },

    bibleChapterNumbers() {
      // 取得譯本一目前選取的書卷資料。
      const book = this.bibleCache[this.filters.translation]?.[this.selectedBibleBookName];
      return book?.chapters.map(chapter => chapter.chapter) || [];
    },

    // 以譯本一的節數為準，把同一節的一至兩個譯本排列在一起。
    bibleChapterVerses() {
      if (!this.selectedBibleBookName) return [];

      // primaryBook 是譯本一目前選取的完整書卷。
      const primaryBook = this.bibleCache[this.filters.translation]?.[this.selectedBibleBookName];

      // primaryChapter 是譯本一目前選取的單一章節。
      const primaryChapter = primaryBook?.chapters.find(chapter => chapter.chapter === this.selectedBibleChapter);
      if (!primaryChapter) return [];

      return primaryChapter.verses.map(verse => ({
        verse: verse.verse,
        translations: this.selectedTranslations.map(translation => ({
          name: translation,
          text: this.findVerseText(this.bibleCache[translation]?.[this.selectedBibleBookName], {
            chapters: this.selectedBibleChapter,
            verse: verse.verse
          }, translation)
        }))
      }));
    },

    // 把 Daily Light 經文替換成目前選擇的一至兩個譯本，並保留原有分組。
    translatedVerses() {
      if (!this.currentEntry || this.selectedTranslations.some(value => !this.bibleCache[value])) return [];

      // mainVerseCount 表示主題經文佔用索引前面的幾節。
      const mainVerseCount = this.getReferenceVerseCount(this.currentEntry.mainVerse);

      // availableVerseCount 是扣除主題經文後，剩下可分配給內文的節數。
      const availableVerseCount = Math.max(0, this.currentIndexItems.length - mainVerseCount);

      // groupCounts 記錄 Daily Light 每一組引用各自包含幾節經文。
      const groupCounts = this.currentEntry.verses.map(group => this.getReferenceVerseCount(group.reference));
      if (groupCounts.length) {
        // countedVerses 是目前各組已計算出的節數總和。
        const countedVerses = groupCounts.reduce((total, count) => total + count, 0);
        groupCounts[groupCounts.length - 1] += availableVerseCount - countedVerses;
      }

      // indexOffset 記錄目前讀到 index 陣列的哪一個位置；它會持續增加，所以使用 let。
      let indexOffset = mainVerseCount;
      return this.currentEntry.verses.map((group, groupIndex) => {
        // verseCount 是這一組引用應取出的節數。
        const verseCount = Math.max(0, groupCounts[groupIndex]);

        // items 是從總索引切出的這一組經文位置資料。
        const items = this.currentIndexItems.slice(indexOffset, indexOffset + verseCount);
        indexOffset += verseCount;

        return {
          reference: group.reference,
          translations: this.selectedTranslations.map(translation => ({
            name: translation,
            text: this.joinVerseTexts(
              items.map(item => this.findVerseText(this.bibleCache[translation][item.name], item, translation)),
              translation
            )
          }))
        };
      });
    },

    translatedMainVerseTexts() {
      if (!this.currentEntry || this.selectedTranslations.some(value => !this.bibleCache[value])) return [];

      // verseCount 是主題經文包含的節數。
      const verseCount = this.getReferenceVerseCount(this.currentEntry.mainVerse);

      // items 只取索引最前面的主題經文資料。
      const items = this.currentIndexItems.slice(0, verseCount);
      return this.selectedTranslations.map(translation => ({
        name: translation,
        text: this.joinVerseTexts(
          items.map(item => this.findVerseText(this.bibleCache[translation][item.name], item, translation)),
          translation
        )
      }));
    },

    // 產生屬靈健保書的詩篇、新約、舊約、箴言四個區段。
    bannerTranslatedSections() {
      // entry 是目前日期對應的屬靈健保書索引。
      const entry = this.currentBannerIndexEntry;
      if (!entry || this.selectedTranslations.some(value => !this.bibleCache[value])) return [];

      return entry.reference.split(';').map(value => value.trim()).filter(Boolean).map(reference => {
        // items 是這個區段引用到的所有經文索引。
        const items = this.getBannerItemsForReference(reference);
        return {
          reference,
          verses: this.translateReadingVerses(items)
        };
      });
    },

    travelSections() {
      // [書卷, 起始章, 起始節, 結束節, 結束章]，null 表示讀整章或沒有跨章。
      return this.currentTravelReadings.map(([name, chapter, firstVerse, lastVerse, lastChapter]) => {
        const book = this.bibleCache[this.filters.translation]?.[name];
        const first = parseInt(firstVerse, 10);
        const last = parseInt(lastVerse, 10);
        const items = (book?.chapters || [])
          .filter(entry => entry.chapter >= chapter && entry.chapter <= (lastChapter ?? chapter))
          .flatMap(entry => entry.verses
            .filter(verse => firstVerse === null || (verse.verse >= first && verse.verse <= last))
            .map(verse => ({ name, chapters: entry.chapter, verse: verse.verse })));
        let range = String(chapter);
        if (lastChapter !== null) range += '-' + lastChapter;
        if (firstVerse !== null) {
          range += ':' + firstVerse;
          if (lastVerse !== firstVerse) range += '-' + lastVerse;
        }
        return {
          reference: this.bibleReference(name, range),
          includesPartialVerse: typeof firstVerse === 'string' || typeof lastVerse === 'string',
          items
        };
      });
    },

    readingPlanSections() {
      if (this.filters.style === 'style3') return this.bannerTranslatedSections;
      return this.travelSections.map(({ reference, includesPartialVerse, items }) => ({
        reference,
        includesPartialVerse,
        verses: this.translateReadingVerses(items)
      }));
    }
  },

  // watch 監聽篩選條件；條件改變時清除舊結果並載入需要的書卷。
  watch: {
    'filters.date'() {
      this.clearVerseDetail();
      this.ensureStyleBible();
    },

    'filters.travelDate'() {
      if (this.filters.style !== 'style5') return;
      this.clearVerseDetail();
      this.ensureStyleBible();
    },

    'filters.period'() {
      this.clearVerseDetail();
      this.ensureStyleBible();
    },

    'filters.translation'() {
      if (this.filters.translation2 === this.filters.translation) this.filters.translation2 = '';
      this.clearVerseDetail();
      this.ensureStyleBible();
    },

    'filters.translation2'() {
      this.clearVerseDetail();
      this.ensureStyleBible();
    },

    'filters.style'() {
      this.clearVerseDetail();
      this.ensureStyleBible();
    }
  },

  // mounted 會在 Vue 畫面掛載完成後自動執行一次。
  async mounted() {
    await this.loadInitialData();
    if (this.biblePage) await this.openInitialBibleReference();
  },

  // methods 放置可由按鈕、watch 或其他函式呼叫的操作。
  methods: {
    // 初次載入 Daily Light 與屬靈健保書的三份索引資料。
    async loadInitialData() {
      this.loading = true;
      this.error = '';

      try {
        // 獨立聖經頁不需要每日亮光與屬靈健保書的索引資料。
        if (this.biblePage) {
          this.prepareMobileFilters();
          return;
        }

        // 三個請求彼此沒有相依性，因此用 Promise.all 同時載入以節省時間。
        const [dailyResponse, indexResponse, bannerResponse] = await Promise.all([
          axios.get('data/daily-light.json'),
          axios.get('data/daily-light-scrollmapper-index.json'),
          axios.get('data/banner-scrollmapper-index.json')
        ]);

        this.dailyEntries = dailyResponse.data;
        this.indexEntries = indexResponse.data;
        this.bannerEntries = bannerResponse.data;
        this.filters.travelDate = this.getLocalDate();
        this.filters.date = this.getInitialDate();
        this.prepareMobileFilters();
      } catch (error) {
        this.error = this.getErrorMessage(error, '無法載入 Daily Light 資料。');
      } finally {
        this.loading = false;
      }
    },

    getLocalDate() {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return now.getFullYear() + '-' + month + '-' + day;
    },

    getInitialDate() {
      const today = this.getLocalDate().slice(5);
      return this.dates.includes(today) ? today : (this.dates[0] || '01-01');
    },

    // 開啟手機版設定時，先複製目前已生效的條件。
    prepareMobileFilters() {
      this.mobileFilters = { ...this.filters };
    },

    // 手機版按下「套用」後，把暫存條件一次更新到正式 filters。
    applyMobileFilters() {
      this.filters = { ...this.mobileFilters };

      // 根據目前頁面決定要關閉首頁或聖經頁的設定視窗。
      const modalSelector = this.biblePage ? '#bibleFilterModal' : '#filterModal';
      bootstrap.Modal.getOrCreateInstance(document.querySelector(modalSelector)).hide();
    },

    // 只載入需要的單一書卷，例如 data/ChiUn/ChiUn_Genesis.json。
    async loadBibleBook(translation, bookName) {
      if (this.bibleCache[translation]?.[bookName]) {
        return this.bibleCache[translation][bookName];
      }

      // fileName 組成實際 JSON 檔名，例如 ChiUn_Genesis.json。
      const fileName = `${translation}_${bookName}.json`;

      // response 是 axios 下載 JSON 後回傳的完整結果。
      const response = await axios.get(`data/${translation}/${encodeURIComponent(fileName)}`);

      // 每個拆分檔只有一卷書，所以取 books 陣列的第一筆。
      const book = response.data.books?.[0];
      if (!book) throw new Error(`${fileName} 沒有書卷資料。`);

      if (!this.bibleCache[translation]) this.bibleCache[translation] = {};
      this.bibleCache[translation][bookName] = book;
      return book;
    },

    async loadTravelPlan() {
      if (this.travelPlan) return;
      if (!this.travelPlanRequest) {
        this.travelPlanRequest = axios.get('data/bible-travel-plan.json')
          .then(response => { this.travelPlan = response.data; })
          .finally(() => { this.travelPlanRequest = null; });
      }
      await this.travelPlanRequest;
    },

    async ensureStyleBible() {
      const requestId = ++this.styleRequestId;
      const { style } = this.filters;
      this.styleLoading = style !== 'style1';
      this.styleError = '';
      this.travelError = '';
      if (style === 'style1') return;

      const translations = [...this.selectedTranslations];
      try {
        if (style === 'style5') {
          try {
            await this.loadTravelPlan();
          } catch (error) {
            if (requestId === this.styleRequestId) {
              this.travelError = this.getErrorMessage(error, '無法載入三年讀經計畫 | 聖經旅行團的進度。');
            }
            return;
          }
          if (requestId !== this.styleRequestId) return;
        }

        let bookNames;
        if (style === 'style4') {
          bookNames = this.selectedBibleBookName ? [this.selectedBibleBookName] : [];
        } else if (style === 'style5') {
          bookNames = this.currentTravelReadings.map(([name]) => name);
        } else {
          bookNames = this.activeIndexItems.map(item => item.name);
        }
        const uniqueBooks = [...new Set(bookNames)];
        await Promise.all(translations.flatMap(translation => (
          uniqueBooks.map(bookName => this.loadBibleBook(translation, bookName))
        )));
      } catch (error) {
        if (requestId === this.styleRequestId) {
          this.styleError = this.getErrorMessage(error, '無法載入 ' + translations.join('、') + ' 經文。');
        }
      } finally {
        if (requestId === this.styleRequestId) this.styleLoading = false;
      }
    },

    bibleReference(bookName, range) {
      const book = this.bibleBooks.find(entry => entry.name === bookName);
      return (book?.abbreviation || bookName) + ' ' + range;
    },

    formatReference(reference) {
      return reference.split(';').map(part => {
        const text = part.trim();
        const match = text.match(/^(.+?)(\s*(?:\d|l(?=:)).*)$/);
        if (!match) return text;
        const label = match[1].trim();
        const key = label.toLowerCase().replaceAll('.', '');
        const book = this.bibleBooks.find(entry => (
          entry.name.toLowerCase() === key ||
          entry.abbreviation.toLowerCase().replaceAll('.', '') === key ||
          entry.name === referenceAliases[key]
        ));
        const range = match[2].trim().replace(/^l:/, '1:');
        return book ? book.zh + ' ' + label + ' ' + range : text;
      }).join('; ');
    },

    translateReadingVerses(items) {
      return items.map(item => ({
        reference: this.bibleReference(item.name, item.chapters + ':' + item.verse),
        translations: this.selectedTranslations.map(translation => ({
          name: translation,
          text: this.findVerseText(this.bibleCache[translation]?.[item.name], item, translation)
        }))
      }));
    },

    // 選擇聖經書卷後載入譯本資料，並預設顯示第一章。
    async selectBibleBook(bookName) {
      this.selectedBibleBookName = bookName;
      this.selectedBibleChapter = 1;
      await this.ensureStyleBible();
      this.$nextTick(() => document.querySelector('#bibleChapters')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      }));
    },

    selectBibleChapter(chapter) {
      this.selectedBibleChapter = chapter;
      this.$nextTick(() => document.querySelector('#bibleChapterContent')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      }));
    },

    // 建立可直接開啟指定書卷章節的網址。
    getBibleChapterUrl(bookName, chapter) {
      // params 將書卷與章數安全轉成網址查詢參數。
      const params = new URLSearchParams({ book: bookName, chapter: String(chapter) });
      return `bible.html?${params.toString()}`;
    },

    // bible.html 從網址讀取 book/chapter，讓「閱讀整章」可直接定位。
    async openInitialBibleReference() {
      // params 讀取網址問號後面的 book 與 chapter。
      const params = new URLSearchParams(window.location.search);

      // bookName 是網址指定的英文書卷名稱。
      const bookName = params.get('book');

      // chapter 是網址指定的章數，Number 會把文字轉成數字。
      const chapter = Number(params.get('chapter'));
      if (!this.bibleBooks.some(book => book.name === bookName)) return;

      await this.selectBibleBook(bookName);
      if (this.bibleChapterNumbers.includes(chapter)) {
        this.selectedBibleChapter = chapter;
      }
      this.$nextTick(() => document.querySelector('#bibleChapterContent')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      }));
    },

    // 計算引用包含的節數，供 Daily Light 維持原本的分組方式。
    getReferenceVerseCount(reference) {
      // versePart 只留下冒號後面的節數部分，例如 "16-18"。
      const versePart = reference.match(/\d+\s*:\s*([\d,\-–~]+)/)?.[1]
        || reference.match(/\s(\d+(?:,\d+)+)\s*$/)?.[1];
      if (!versePart) return 1;

      if (/^\d{4}$/.test(versePart) && Number(versePart) > 176) return 2;

      return versePart.split(',').reduce((count, part) => {
        // bounds 把 "16-18" 轉成 [16, 18]，單節 "16" 則是 [16]。
        const bounds = part.split(/[-–~]/).map(Number);
        return count + (bounds.length === 2 ? bounds[1] - bounds[0] + 1 : 1);
      }, 0);
    },

    findVerseText(book, item, translation = this.filters.translation) {
      // chapter 是書卷內符合指定章數的資料。
      const chapter = book?.chapters.find(value => value.chapter === item.chapters);

      // text 是指定節的經文；找不到時使用空字串避免畫面出錯。
      const text = chapter?.verses.find(value => value.verse === item.verse)?.text || '';
      return translation === 'ChiUn' ? text.replaceAll(' ', '') : text;
    },

    // ChiUn 經文不保留半形空白；其他譯本以空白分隔連續經節。
    joinVerseTexts(texts, translation = this.filters.translation) {
      return texts
        .filter(Boolean)
        .join(translation === 'ChiUn' ? '' : ' ');
    },

    // 將「Genesis 1-2」等文字引用對應回 banner index 項目。
    getBannerItemsForReference(reference) {
      // match 把 "Genesis 1-2" 或 "Psalms 1:1-3" 拆成書卷、章與節。
      const match = reference.match(/^(.+)\s+(\d+)(?::(\d+)-(\d+)|-(\d+))?$/);
      if (!match) return [];

      // 從比對結果取出仍是文字格式的各個欄位。
      const [, bookName, startChapterText, startVerseText, endVerseText, endChapterText] = match;

      // startChapter 是起始章數。
      const startChapter = Number(startChapterText);

      // endChapter 是結束章數；沒有指定時就等於起始章數。
      const endChapter = endChapterText ? Number(endChapterText) : startChapter;

      // startVerse 是起始節數；沒有指定節時使用 null。
      const startVerse = startVerseText ? Number(startVerseText) : null;

      // endVerse 是結束節數；沒有指定節時使用 null。
      const endVerse = endVerseText ? Number(endVerseText) : null;

      return this.currentBannerIndexItems.filter(item => {
        if (item.name !== bookName) return false;
        if (startVerse !== null) {
          return item.chapters === startChapter && item.verse >= startVerse && item.verse <= endVerse;
        }
        return item.chapters >= startChapter && item.chapters <= endChapter;
      });
    },

    // 點選下方經文按鈕時，載入並顯示單節內容。
    async showVerseDetail(item) {
      this.verseLoading = true;
      this.verseError = '';

      try {
        // translations 是這次要載入的譯本清單。
        const translations = [...this.selectedTranslations];

        // verseTranslations 會等待所有譯本完成，再一起交給畫面顯示。
        const verseTranslations = await Promise.all(translations.map(async translation => {
          // book 是目前譯本的指定書卷資料。
          const book = await this.loadBibleBook(translation, item.name);

          // text 是從書卷資料找到的指定單節經文。
          const text = this.findVerseText(book, item, translation);
          if (!text) throw new Error(`${translation}_${item.name}.json 找不到這筆經文。`);
          return { name: translation, text };
        }));

        this.selectedVerseKey = this.getVerseKey(item);
        this.selectedVerse = {
          reference: this.bibleReference(item.name, item.chapters + ':' + item.verse),
          bookName: item.name,
          chapter: item.chapters,
          translations: verseTranslations
        };

        this.$nextTick(() => {
          document.querySelector('#verseDetailSection')?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        });
      } catch (error) {
        this.selectedVerse = null;
        this.selectedVerseKey = '';
        this.verseError = this.getErrorMessage(error, `無法載入 ${this.filters.translation} 經文。`);
      } finally {
        this.verseLoading = false;
      }
    },

    getVerseKey(item) {
      return `${item.name}-${item.chapters}-${item.verse}`;
    },

    isSelectedVerse(item) {
      return this.selectedVerseKey === this.getVerseKey(item);
    },

    clearVerseDetail() {
      this.selectedVerse = null;
      this.selectedVerseKey = '';
      this.verseError = '';
    },

    getErrorMessage(error, fallback) {
      if (error.response) return `${fallback}（HTTP ${error.response.status}）`;
      return error.message || fallback;
    }
  }
}).mount('#app');
