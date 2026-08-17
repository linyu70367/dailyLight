const { createApp } = Vue;

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
      // 桌面版及目前真正生效的篩選條件。
      filters: {
        translation: 'KJV',
        translation2: '',
        date: '',
        period: 'morning',
        style: 'style2',
        fontSize: 'font-size-normal',
        referenceDisplay: 'show',
        theme: 'theme-night'
      },
      // 手機版暫存條件，按下「套用」後才會複製到 filters。
      mobileFilters: {
        translation: 'KJV',
        translation2: '',
        date: '',
        period: 'morning',
        style: 'style2',
        fontSize: 'font-size-normal',
        referenceDisplay: 'hide',
        theme: 'theme-night'
      },
      selectedFont: ''
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
      this.ensureStyleBible();
    }
  },

  async mounted() {
    await this.loadInitialData();
  },

  methods: {
    // 初次載入 Daily Light 與屬靈健保書的三份索引資料。
    async loadInitialData() {
      this.loading = true;
      this.error = '';

      try {
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
      bootstrap.Modal.getOrCreateInstance(document.querySelector('#filterModal')).hide();
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

    // 每日亮光（譯本）與屬靈健保書會預先載入畫面需要的書卷。
    async ensureStyleBible() {
      if (this.filters.style === 'style1') return;

      const translations = [...this.selectedTranslations];
      const requestKey = translations.join('|');
      this.styleLoading = true;
      this.styleError = '';

      try {
        const bookNames = [...new Set(this.activeIndexItems.map(item => item.name))];
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
