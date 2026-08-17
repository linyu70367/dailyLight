const { createApp } = Vue;
// bible.html 使用獨立的聖經閱讀介面；保留舊 query 網址的相容性。
const isBiblePage = window.location.pathname.endsWith('/bible.html')
  || new URLSearchParams(window.location.search).get('mode') === 'bible';

createApp({
  data() {
    return {
      // 三份主要資料：每日亮光原文、每日亮光索引、屬靈健保書索引。
      dailyEntries: [],
      indexEntries: [],
      bannerEntries: [],
      // 書卷快取格式：bibleCache[譯本][書卷名稱]。
      bibleCache: {},
      loading: true,
      error: '',
      verseLoading: false,
      verseError: '',
      styleLoading: false,
      styleError: '',
      selectedVerse: null,
      selectedVerseKey: '',
      biblePage: isBiblePage,
      // 「聖經」模式目前選取的書卷與章數。
      selectedBibleBookName: '',
      selectedBibleChapter: 1,
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
      ],
      // 桌面版及目前真正生效的篩選條件。
      filters: {
        translation: 'ChiUn',
        translation2: '',
        date: '',
        period: 'morning',
        style: isBiblePage ? 'style4' : 'style2',
        fontSize: 'font-size-normal',
        referenceDisplay: 'hide',
        theme: 'theme-night'
      },
      // 手機版暫存條件，按下「套用」後才會複製到 filters。
      mobileFilters: {
        translation: 'ChiUn',
        translation2: '',
        date: '',
        period: 'morning',
        style: isBiblePage ? 'style4' : 'style2',
        fontSize: 'font-size-normal',
        referenceDisplay: 'hide',
        theme: 'theme-night'
      },
      selectedFont: 'zen-old-mincho'
    };
  },

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

    activeIndexItems() {
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
      const book = this.bibleCache[this.filters.translation]?.[this.selectedBibleBookName];
      return book?.chapters.map(chapter => chapter.chapter) || [];
    },

    // 以譯本一的節數為準，把同一節的一至兩個譯本排列在一起。
    bibleChapterVerses() {
      if (!this.selectedBibleBookName) return [];
      const primaryBook = this.bibleCache[this.filters.translation]?.[this.selectedBibleBookName];
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

      const mainVerseCount = this.getReferenceVerseCount(this.currentEntry.mainVerse);
      const availableVerseCount = Math.max(0, this.currentIndexItems.length - mainVerseCount);
      const groupCounts = this.currentEntry.verses.map(group => this.getReferenceVerseCount(group.reference));
      if (groupCounts.length) {
        const countedVerses = groupCounts.reduce((total, count) => total + count, 0);
        groupCounts[groupCounts.length - 1] += availableVerseCount - countedVerses;
      }

      let indexOffset = mainVerseCount;
      return this.currentEntry.verses.map((group, groupIndex) => {
        const verseCount = Math.max(0, groupCounts[groupIndex]);
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

      const verseCount = this.getReferenceVerseCount(this.currentEntry.mainVerse);
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
      const entry = this.currentBannerIndexEntry;
      if (!entry || this.selectedTranslations.some(value => !this.bibleCache[value])) return [];

      return entry.reference.split(';').map(value => value.trim()).filter(Boolean).map(reference => {
        const items = this.getBannerItemsForReference(reference);
        return {
          reference,
          verses: items.map(item => ({
            reference: `${item.name} ${item.chapters}:${item.verse}`,
            translations: this.selectedTranslations.map(translation => ({
              name: translation,
              text: this.findVerseText(this.bibleCache[translation][item.name], item, translation)
            }))
          }))
        };
      });
    }
  },

  // 篩選條件改變時，清除舊經文並載入新模式所需的書卷。
  watch: {
    'filters.date'() {
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

  async mounted() {
    await this.loadInitialData();
    if (this.biblePage) await this.openInitialBibleReference();
  },

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

        const [dailyResponse, indexResponse, bannerResponse] = await Promise.all([
          axios.get('data/daily-light.json'),
          axios.get('data/daily-light-scrollmapper-index.json'),
          axios.get('data/banner-scrollmapper-index.json')
        ]);

        this.dailyEntries = dailyResponse.data;
        this.indexEntries = indexResponse.data;
        this.bannerEntries = bannerResponse.data;
        this.filters.date = this.getInitialDate();
        this.prepareMobileFilters();
      } catch (error) {
        this.error = this.getErrorMessage(error, '無法載入 Daily Light 資料。');
      } finally {
        this.loading = false;
      }
    },

    getInitialDate() {
      const now = new Date();
      const today = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return this.dates.includes(today) ? today : (this.dates[0] || '01-01');
    },

    // 開啟手機版設定時，先複製目前已生效的條件。
    prepareMobileFilters() {
      this.mobileFilters = { ...this.filters };
    },

    // 手機版按下「套用」後，把暫存條件一次更新到正式 filters。
    applyMobileFilters() {
      this.filters = { ...this.mobileFilters };
      const modalSelector = this.biblePage ? '#bibleFilterModal' : '#filterModal';
      bootstrap.Modal.getOrCreateInstance(document.querySelector(modalSelector)).hide();
    },

    // 只載入需要的單一書卷，例如 data/ChiUn/ChiUn_Genesis.json。
    async loadBibleBook(translation, bookName) {
      if (this.bibleCache[translation]?.[bookName]) {
        return this.bibleCache[translation][bookName];
      }

      const fileName = `${translation}_${bookName}.json`;
      const response = await axios.get(`data/${translation}/${encodeURIComponent(fileName)}`);
      const book = response.data.books?.[0];
      if (!book) throw new Error(`${fileName} 沒有書卷資料。`);

      if (!this.bibleCache[translation]) this.bibleCache[translation] = {};
      this.bibleCache[translation][bookName] = book;
      return book;
    },

    // 每日亮光、屬靈健保書及整本聖經模式會載入畫面需要的書卷。
    async ensureStyleBible() {
      if (this.filters.style === 'style1') return;

      const translations = [...this.selectedTranslations];
      const requestKey = translations.join('|');
      this.styleLoading = true;
      this.styleError = '';

      try {
        const bookNames = this.filters.style === 'style4'
          ? (this.selectedBibleBookName ? [this.selectedBibleBookName] : [])
          : [...new Set(this.activeIndexItems.map(item => item.name))];
        await Promise.all(translations.flatMap(translation => (
          bookNames.map(bookName => this.loadBibleBook(translation, bookName))
        )));
      } catch (error) {
        if (requestKey === this.selectedTranslations.join('|')) {
          this.styleError = this.getErrorMessage(error, `無法載入 ${translations.join('、')} 經文。`);
        }
      } finally {
        if (requestKey === this.selectedTranslations.join('|')) this.styleLoading = false;
      }
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
      const params = new URLSearchParams({ book: bookName, chapter: String(chapter) });
      return `bible.html?${params.toString()}`;
    },

    // bible.html 從網址讀取 book/chapter，讓「閱讀整章」可直接定位。
    async openInitialBibleReference() {
      const params = new URLSearchParams(window.location.search);
      const bookName = params.get('book');
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
      const versePart = reference.match(/\d+\s*:\s*([\d,\-–~]+)/)?.[1]
        || reference.match(/\s(\d+(?:,\d+)+)\s*$/)?.[1];
      if (!versePart) return 1;

      if (/^\d{4}$/.test(versePart) && Number(versePart) > 176) return 2;

      return versePart.split(',').reduce((count, part) => {
        const bounds = part.split(/[-–~]/).map(Number);
        return count + (bounds.length === 2 ? bounds[1] - bounds[0] + 1 : 1);
      }, 0);
    },

    findVerseText(book, item, translation = this.filters.translation) {
      const chapter = book?.chapters.find(value => value.chapter === item.chapters);
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
      const match = reference.match(/^(.+)\s+(\d+)(?::(\d+)-(\d+)|-(\d+))?$/);
      if (!match) return [];

      const [, bookName, startChapterText, startVerseText, endVerseText, endChapterText] = match;
      const startChapter = Number(startChapterText);
      const endChapter = endChapterText ? Number(endChapterText) : startChapter;
      const startVerse = startVerseText ? Number(startVerseText) : null;
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
        const translations = [...this.selectedTranslations];
        const verseTranslations = await Promise.all(translations.map(async translation => {
          const book = await this.loadBibleBook(translation, item.name);
          const text = this.findVerseText(book, item, translation);
          if (!text) throw new Error(`${translation}_${item.name}.json 找不到這筆經文。`);
          return { name: translation, text };
        }));

        this.selectedVerseKey = this.getVerseKey(item);
        this.selectedVerse = {
          reference: `${item.name} ${item.chapters}:${item.verse}`,
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
