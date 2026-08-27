import { Plugin } from 'obsidian';
import { LiuYaoPluginSettings, DEFAULT_SETTINGS, LiuYaoSettingTab } from './settings';
import { GuaModal } from './ui/GuaModal';

export default class LiuYaoPlugin extends Plugin {
  settings: LiuYaoPluginSettings;

  async onload() {
    await this.loadSettings();

    this.addRibbonIcon('dice', '六爻：起卦与 AI 解卦', () => {
      new GuaModal(this.app, this).open();
    });

    this.addCommand({
      id: 'open-liuyao-modal',
      name: '六爻起卦与 AI 解卦',
      callback: () => {
        new GuaModal(this.app, this).open();
      }
    });

    this.addSettingTab(new LiuYaoSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
