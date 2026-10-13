import { Logger } from '@nestjs/common';

/**
 * HTTP文件工具类
 * 提供从URL获取文件内容的功能
 */
export class HttpFileUtil {
  private static readonly logger = new Logger(HttpFileUtil.name);

  /**
   * 从URL获取文本内容
   * @param url 文件URL
   * @returns 文本内容
   */
  static async fetchTextFromUrl(url: string): Promise<string> {
    try {
      this.logger.log(`开始从URL获取文本内容: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LulabBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      this.logger.log(`成功从URL获取文本内容，长度: ${text.length} 字符`);

      return text;
    } catch (error) {
      this.logger.error(`从URL获取文本内容失败: ${url}`, error as Error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`无法从URL获取文件内容: ${errorMessage}`);
    }
  }

  /**
   * 从URL获取JSON数据
   * @param url JSON文件URL
   * @returns JSON对象
   */
  static async fetchJsonFromUrl<T = unknown>(url: string): Promise<T> {
    try {
      const text = await this.fetchTextFromUrl(url);
      const parsed = JSON.parse(text) as T;
      return parsed;
    } catch (error) {
      this.logger.error(`解析JSON失败: ${url}`, error as Error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`无法解析JSON数据: ${errorMessage}`);
    }
  }

  /**
   * 从URL下载文件到Buffer
   * @param url 文件URL
   * @returns 文件Buffer
   */
  static async downloadFile(url: string): Promise<Buffer> {
    try {
      this.logger.log(`开始下载文件: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LulabBot/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      this.logger.log(`成功下载文件，大小: ${buffer.byteLength} 字节`);

      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error(`下载文件失败: ${url}`, error as Error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`无法下载文件: ${errorMessage}`);
    }
  }

  /**
   * 验证URL是否可访问
   * @param url 要验证的URL
   * @returns 是否可访问
   */
  static async validateUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LulabBot/1.0)',
        },
      });

      return response.ok;
    } catch (error) {
      this.logger.warn(`URL验证失败: ${url}`, error as Error);
      return false;
    }
  }
}
