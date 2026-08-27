import { App, PluginSettingTab, Setting } from 'obsidian';
import LiuYaoPlugin from './main';

export type AiProvider = 'deepseek' | 'openai' | 'gemini' | 'custom';

export interface LiuYaoPluginSettings {
  provider: AiProvider;
  apiKey: string;
  apiUrl: string;
  modelName: string;
  outputFolderPath: string;
  systemPrompt: string;
}

export const DEFAULT_SETTINGS: LiuYaoPluginSettings = {
  provider: 'deepseek',
  apiKey: '',
  apiUrl: 'https://api.deepseek.com/chat/completions',
  modelName: 'deepseek-chat',
  outputFolderPath: '六爻解卦',
  systemPrompt: `你是一位严格遵循传统六爻古筮理气体系的解卦专家与导师。

你的分析必须严格融汇并贯通以下三部古筮核心经典：
清·野鹤老人 原著《增删卜易》
清·王洪绪/王维德 著《卜筮正宗》
朱辰彬 著《古筮真诠（总论篇、易理篇）》

【理气与断卦核心原则】
1. 理论唯一性：以《增删卜易》动静生克、《卜筮正宗》（十八问、黄金策注解）及《古筮真诠》“三道门（日月, 动变, 空破暗动）”理气逻辑为核心。绝对禁止引入神煞（六神仅作象形参考）、纳音、梅花易数或现代心灵鸡汤。
2. 经典对照与教学导向：凡分析用神衰旺, 日月建生克, 动爻变化（化进化退, 化回头生/克, 化空化破）及世用关系时, 需引述《增删卜易》、《卜筮正宗》或《古筮真诠》的相关经典法则与训诫。

请按以下结构输出报告：
🎯 【用神与世爻定位】（参照《增删卜易》定用神法）
☀️ 【第一道门：日月建生克与基础衰旺】（参照《卜筮正宗》日月作用机理）
🌀 【第二道门：动变组合与力量指向】（参照《增删卜易》动爻变化与生克权）
⏳ 【第三道门：空破, 暗动与应期细节】（参照《古筮真诠》假空真空及应期法则）
💡 【古筮经典综合判定与吉凶总结】`
};

export class LiuYaoSettingTab extends PluginSettingTab {
  plugin: LiuYaoPlugin;

  constructor(app: App, plugin: LiuYaoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: '六爻古筮排盘 & AI 解卦设置' });

    new Setting(containerEl)
      .setName('AI 模型服务平台')
      .setDesc('选择你希望调用的 AI 服务平台')
      .addDropdown(dropdown => dropdown
        .addOption('deepseek', 'DeepSeek')
        .addOption('openai', 'OpenAI (ChatGPT)')
        .addOption('gemini', 'Google Gemini')
        .addOption('custom', '自定义 / OpenAI 兼容中转')
        .setValue(this.plugin.settings.provider)
        .onChange(async (value: AiProvider) => {
          this.plugin.settings.provider = value;
          if (value === 'deepseek') {
            this.plugin.settings.apiUrl = 'https://api.deepseek.com/chat/completions';
            this.plugin.settings.modelName = 'deepseek-chat';
          } else if (value === 'openai') {
            this.plugin.settings.apiUrl = 'https://api.openai.com/v1/chat/completions';
            this.plugin.settings.modelName = 'gpt-4o';
          } else if (value === 'gemini') {
            this.plugin.settings.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
            this.plugin.settings.modelName = 'gemini-1.5-pro';
          }
          await this.plugin.saveSettings();
          this.display();
        }));

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('填入对应平台的 API 密钥')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('API 请求 Endpoint')
      .setDesc('请求地址，通常保持默认即可')
      .addText(text => text
        .setValue(this.plugin.settings.apiUrl)
        .onChange(async (value) => {
          this.plugin.settings.apiUrl = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('模型名称 (Model Name)')
      .setDesc('如：deepseek-chat, gpt-4o, gemini-1.5-pro 等')
      .addText(text => text
        .setValue(this.plugin.settings.modelName)
        .onChange(async (value) => {
          this.plugin.settings.modelName = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('笔记保存目录')
      .setDesc('排盘与解卦笔记存储的文件夹名称')
      .addText(text => text
        .setValue(this.plugin.settings.outputFolderPath)
        .onChange(async (value) => {
          this.plugin.settings.outputFolderPath = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('System Prompt 提示词')
      .setDesc('古筮三系理气解卦系统的 Prompt 模版')
      .addTextArea(text => {
        text.inputEl.rows = 10;
        text.inputEl.style.width = '100%';
        text.setValue(this.plugin.settings.systemPrompt)
          .onChange(async (value) => {
            this.plugin.settings.systemPrompt = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
