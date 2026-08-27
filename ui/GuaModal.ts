import { App, Modal, Notice } from 'obsidian';
import LiuYaoPlugin from '../main';
import { getRiGanZhi, getYueZhi, getXunKong, executePaipan } from '../engine/liuyao';
import { callAiApi } from '../engine/ai';

type TossMethod = 'auto' | 'click' | 'manual';

export class GuaModal extends Modal {
  plugin: LiuYaoPlugin;
  tossMethod: TossMethod = 'auto';
  
  topic: string = '';
  timeStr: string = '';
  yueZhi: string = '';
  riGanZhiText: string = '';

  rawGua: number[] = [7, 7, 7, 7, 7, 7];
  currentYaoIndex: number = 0;

  constructor(app: App, plugin: LiuYaoPlugin) {
    super(app);
    this.plugin = plugin;
    
    const now = new Date();
    this.timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.riGanZhiText = getRiGanZhi(now).text;
    this.yueZhi = getYueZhi(now);
  }

  onOpen() {
    this.renderModal();
  }

  renderModal() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('liuyao-modal-container');

    contentEl.createEl('h2', { text: '☯️ 六爻起卦与 AI 理气解卦' });

    const infoSec = contentEl.createDiv({ cls: 'liuyao-section' });
    
    infoSec.createEl('label', { text: '求占事项：' });
    const topicInput = infoSec.createEl('input', {
      type: 'text',
      placeholder: '如：今年跳槽求财',
      value: this.topic
    });
    topicInput.oninput = (e) => this.topic = (e.target as HTMLInputElement).value;

    const dateRow = infoSec.createDiv({ cls: 'liuyao-row' });
    dateRow.createEl('label', { text: '起卦时间：' });
    const timeInput = dateRow.createEl('input', {
      type: 'text',
      value: this.timeStr
    });
    timeInput.onchange = (e) => {
      this.timeStr = (e.target as HTMLInputElement).value;
      const parsedDate = new Date(this.timeStr.replace(/-/g, "/"));
      if (!isNaN(parsedDate.getTime())) {
        this.riGanZhiText = getRiGanZhi(parsedDate).text;
        this.yueZhi = getYueZhi(parsedDate);
        this.renderModal();
      }
    };

    const ganZhiRow = infoSec.createDiv({ cls: 'liuyao-row' });
    ganZhiRow.createEl('label', { text: '干支旬空：' });
    const yueInput = ganZhiRow.createEl('input', { type: 'text', value: this.yueZhi, cls: 'short-input' });
    yueInput.onchange = (e) => this.yueZhi = (e.target as HTMLInputElement).value;
    ganZhiRow.createEl('span', { text: '月 ' });

    const riInput = ganZhiRow.createEl('input', { type: 'text', value: this.riGanZhiText, cls: 'short-input' });
    riInput.onchange = (e) => this.riGanZhiText = (e.target as HTMLInputElement).value;
    ganZhiRow.createEl('span', { text: '日 （旬空：' + getXunKong(this.riGanZhiText) + '）' });

    const methodSec = contentEl.createDiv({ cls: 'liuyao-section' });
    methodSec.createEl('label', { text: '摇卦方式选择：' });
    
    const radioGroup = methodSec.createDiv({ cls: 'liuyao-radio-group' });
    
    this.createRadioOption(radioGroup, 'auto', '🎲 一键自动摇卦', this.tossMethod === 'auto');
    this.createRadioOption(radioGroup, 'click', '🪙 手动按 6 次摇卦', this.tossMethod === 'click');
    this.createRadioOption(radioGroup, 'manual', '✍️ 直接指定爻象', this.tossMethod === 'manual');

    const interactiveSec = contentEl.createDiv({ cls: 'liuyao-interactive-box' });

    if (this.tossMethod === 'auto') {
      const autoBox = interactiveSec.createDiv({ cls: 'liuyao-auto-box' });
      autoBox.createEl('p', { text: '点击“一键起卦”，系统将自动为您随机摇出六爻。' });
      const btn = autoBox.createEl('button', { text: '🎲 开始一键起卦', cls: 'mod-cta' });
      btn.onclick = () => {
        this.rawGua = Array.from({ length: 6 }, () => (Math.random() < 0.5 ? 2 : 3) + (Math.random() < 0.5 ? 2 : 3) + (Math.random() < 0.5 ? 2 : 3));
        this.submitAndPaipan();
      };

    } else if (this.tossMethod === 'click') {
      const clickBox = interactiveSec.createDiv({ cls: 'liuyao-click-box' });
      const yaoNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
      
      clickBox.createEl('p', { text: `当前进度：第 ${this.currentYaoIndex + 1} / 6 爻 (${yaoNames[this.currentYaoIndex]})` });
      
      const btn = clickBox.createEl('button', {
        text: this.currentYaoIndex < 6 ? `🪙 摇第 ${this.currentYaoIndex + 1} 爻` : '✅ 摇卦完成，开始解卦',
        cls: 'mod-cta'
      });

      btn.onclick = () => {
        if (this.currentYaoIndex < 6) {
          const sum = (Math.random() < 0.5 ? 2 : 3) + (Math.random() < 0.5 ? 2 : 3) + (Math.random() < 0.5 ? 2 : 3);
          this.rawGua[this.currentYaoIndex] = sum;
          this.currentYaoIndex++;
          this.renderModal();
        } else {
          this.submitAndPaipan();
        }
      };

      const preview = clickBox.createDiv({ cls: 'liuyao-yao-preview' });
      for (let i = 5; i >= 0; i--) {
        const symbolMap: Record<number, string> = { 6: "▅▅ ▅▅ ✕", 7: "▅▅▅▅▅▅ ", 8: "▅▅ ▅▅ ", 9: "▅▅▅▅▅▅ 〇" };
        const statusStr = i < this.currentYaoIndex ? symbolMap[this.rawGua[i]] : '未起爻';
        preview.createEl('div', { text: `${yaoNames[i]}: ${statusStr}` });
      }

    } else if (this.tossMethod === 'manual') {
      const manualBox = interactiveSec.createDiv({ cls: 'liuyao-manual-box' });
      const yaoNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

      for (let i = 5; i >= 0; i--) {
        const row = manualBox.createDiv({ cls: 'liuyao-row' });
        row.createEl('span', { text: `${yaoNames[i]}：` });
        const select = row.createEl('select');
        
        const options = [
          { label: '少阳 7 (▅▅▅▅▅▅)', val: 7 },
          { label: '少阴 8 (▅▅ ▅▅)', val: 8 },
          { label: '老阴 6 (▅▅ ▅▅ ✕ 动)', val: 6 },
          { label: '老阳 9 (▅▅▅▅▅▅ 〇 动)', val: 9 }
        ];

        options.forEach(opt => {
          const o = select.createEl('option', { text: opt.label, value: String(opt.val) });
          if (this.rawGua[i] === opt.val) o.selected = true;
        });

        select.onchange = (e) => {
          this.rawGua[i] = parseInt((e.target as HTMLSelectElement).value);
        };
      }

      const submitBtn = manualBox.createEl('button', { text: '📋 生成排盘并解卦', cls: 'mod-cta' });
      submitBtn.onclick = () => this.submitAndPaipan();
    }
  }

  createRadioOption(parent: HTMLElement, val: TossMethod, labelText: string, checked: boolean) {
    const label = parent.createEl('label', { cls: 'liuyao-radio-label' });
    const radio = label.createEl('input', { type: 'radio', value: val });
    radio.checked = checked;
    radio.name = 'tossMethod';
    radio.onchange = () => {
      this.tossMethod = val;
      this.currentYaoIndex = 0;
      this.renderModal();
    };
    label.createSpan({ text: labelText });
  }

  async submitAndPaipan() {
    if (!this.topic.trim()) {
      new Notice('请输入求占事项！');
      return;
    }
    if (!this.plugin.settings.apiKey) {
      new Notice('请先前往插件设置中填入 API Key！');
      return;
    }

    this.close();
    new Notice('正在进行六爻装卦排盘与 AI 理气分析中...');

    const res = executePaipan(
      this.topic,
      this.timeStr,
      this.yueZhi,
      this.riGanZhiText,
      this.rawGua
    );

    const folder = this.plugin.settings.outputFolderPath || '六爻解卦';
    if (!(await this.app.vault.adapter.exists(folder))) {
      await this.app.vault.createFolder(folder);
    }

    const safeTopic = this.topic.replace(/[\\/:*?"<>|]/g, "_");
    const fileName = `${folder}/${safeTopic}-${Date.now()}.md`;
    const newFile = await this.app.vault.create(fileName, res.fullMarkdown);
    await this.app.workspace.getLeaf().openFile(newFile);

    try {
      const aiText = await callAiApi(this.plugin.settings, res.userMessage);
      
      const updatedContent = res.fullMarkdown.replace(
        "> 正在调用 AI 依据古筮三大经典进行综合理气解卦中，请稍候...",
        aiText
      );

      await this.app.vault.modify(newFile, updatedContent);
      new Notice('✨ AI 经典古筮理气解卦完成！');
    } catch (error) {
      new Notice('❌ AI 解卦失败：' + error.message);
      const errorContent = res.fullMarkdown.replace(
        "> 正在调用 AI 依据古筮三大经典进行综合理气解卦中，请稍候...",
        `❌ 解卦失败，错误信息：${error.message}`
      );
      await this.app.vault.modify(newFile, errorContent);
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
