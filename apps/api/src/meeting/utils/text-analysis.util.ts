/**
 * 文本分析工具类
 * 提供通用的文本处理和分析功能
 */
export class TextAnalysisUtil {
  /**
   * 检测文本语言
   * @param text 要检测的文本
   * @returns 语言代码 ('zh', 'en', 'unknown')
   */
  static detectLanguage(text: string): string {
    if (!text || text.trim().length === 0) {
      return 'unknown';
    }

    const chineseRegex = /[\u4e00-\u9fff]/;
    const englishRegex = /[a-zA-Z]/;
    const japaneseRegex = /[\u3040-\u309f\u30a0-\u30ff]/;
    const koreanRegex = /[\uac00-\ud7af]/;

    // 计算各种语言字符的比例
    const chineseMatches = text.match(chineseRegex)?.length || 0;
    const englishMatches = text.match(englishRegex)?.length || 0;
    const japaneseMatches = text.match(japaneseRegex)?.length || 0;
    const koreanMatches = text.match(koreanRegex)?.length || 0;

    const totalChars = text.length;
    const chineseRatio = chineseMatches / totalChars;
    const englishRatio = englishMatches / totalChars;
    const japaneseRatio = japaneseMatches / totalChars;
    const koreanRatio = koreanMatches / totalChars;

    // 根据比例判断主要语言
    if (chineseRatio > 0.3) {
      return 'zh';
    } else if (japaneseRatio > 0.2) {
      return 'ja';
    } else if (koreanRatio > 0.2) {
      return 'ko';
    } else if (englishRatio > 0.5) {
      return 'en';
    }

    return 'unknown';
  }

  /**
   * 统计单词数
   * @param text 要统计的文本
   * @returns 单词数量
   */
  static countWords(text: string): number {
    if (!text || text.trim().length === 0) {
      return 0;
    }

    // 清理文本并分割单词
    const cleanText = text.replace(/[\r\n\t]+/g, ' ').trim();
    const words = cleanText.split(/\s+/).filter((word) => word.length > 0);

    return words.length;
  }

  /**
   * 统计字符数（不包括空白字符）
   * @param text 要统计的文本
   * @returns 字符数量
   */
  static countCharacters(text: string): number {
    if (!text) {
      return 0;
    }

    return text.replace(/\s/g, '').length;
  }

  /**
   * 估算阅读时长（分钟）
   * @param text 要估算的文本
   * @param language 语言类型，影响阅读速度
   * @returns 估算的阅读时长（分钟）
   */
  static estimateReadingDuration(text: string, language?: string): number {
    const wordCount = this.countWords(text);

    if (wordCount === 0) {
      return 0;
    }

    // 不同语言的平均阅读速度（每分钟单词数）
    const readingSpeedMap: Record<string, number> = {
      zh: 200, // 中文
      ja: 180, // 日文
      ko: 190, // 韩文
      en: 250, // 英文
      unknown: 200,
    };

    const detectedLanguage = language || this.detectLanguage(text);
    const readingSpeed =
      readingSpeedMap[detectedLanguage] || readingSpeedMap['unknown'];

    return Math.ceil(wordCount / readingSpeed);
  }

  /**
   * 估算语音时长（分钟）
   * @param text 要估算的文本
   * @param language 语言类型，影响语速
   * @returns 估算的语音时长（分钟）
   */
  static estimateSpeechDuration(text: string, language?: string): number {
    const wordCount = this.countWords(text);

    if (wordCount === 0) {
      return 0;
    }

    // 不同语言的平均语速（每分钟单词数）
    const speechSpeedMap: Record<string, number> = {
      zh: 150, // 中文
      ja: 140, // 日文
      ko: 145, // 韩文
      en: 150, // 英文
      unknown: 150,
    };

    const detectedLanguage = language || this.detectLanguage(text);
    const speechSpeed =
      speechSpeedMap[detectedLanguage] || speechSpeedMap['unknown'];

    return Math.ceil(wordCount / speechSpeed);
  }

  /**
   * 清理文本内容
   * @param text 要清理的文本
   * @returns 清理后的文本
   */
  static cleanText(text: string): string {
    if (!text) {
      return '';
    }

    return text
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/[\r\n\t]+/g, ' ') // 替换换行符和制表符
      .trim(); // 去除首尾空白
  }

  /**
   * 提取关键词
   * @param text 要分析的文本
   * @param maxKeywords 最大关键词数量
   * @returns 关键词数组
   */
  static extractKeywords(text: string, maxKeywords: number = 10): string[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const language = this.detectLanguage(text);

    if (language === 'zh') {
      // 中文关键词提取
      return this.extractChineseKeywords(text, maxKeywords);
    } else {
      // 英文关键词提取
      return this.extractEnglishKeywords(text, maxKeywords);
    }
  }

  /**
   * 提取中文关键词
   */
  private static extractChineseKeywords(
    text: string,
    maxKeywords: number,
  ): string[] {
    // 简单的中文关键词提取（基于词频）
    const words = text.match(/[\u4e00-\u9fff]{2,8}/g) || [];
    const frequency: Record<string, number> = {};

    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * 提取英文关键词
   */
  private static extractEnglishKeywords(
    text: string,
    maxKeywords: number,
  ): string[] {
    // 简单的英文关键词提取
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'this',
      'that',
      'these',
      'those',
    ]);

    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];

    const frequency: Record<string, number> = {};

    words.forEach((word) => {
      if (!stopWords.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  /**
   * 计算文本相似度（简单的余弦相似度）
   * @param text1 文本1
   * @param text2 文本2
   * @returns 相似度分数 (0-1)
   */
  static calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) {
      return 0;
    }

    const words1 = this.extractKeywords(text1, 50);
    const words2 = this.extractKeywords(text2, 50);

    const allWords = [...new Set([...words1, ...words2])];

    const vector1 = allWords.map((word) => (words1.includes(word) ? 1 : 0));
    const vector2 = allWords.map((word) => (words2.includes(word) ? 1 : 0));

    const dotProduct = vector1.reduce(
      (sum, val, i) => sum + val * vector2[i],
      0,
    );
    const magnitude1 = Math.sqrt(
      vector1.reduce((sum, val) => sum + val * val, 0),
    );
    const magnitude2 = Math.sqrt(
      vector2.reduce((sum, val) => sum + val * val, 0),
    );

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }
}
