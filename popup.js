// popup.js
class PopupManager {
  constructor() {
    this.settings = {
      rate: 1,
      pitch: 1,
      volume: 1,
      voice: null,
      highlightEnabled: true,
      autoRead: true
    };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.populateVoices();
    this.updateUI();
  }

  // 从Chrome存储中加载设置
  async loadSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['readAnythingSettings'], (result) => {
        if (result.readAnythingSettings) {
          this.settings = { ...this.settings, ...result.readAnythingSettings };
        }
        resolve();
      });
    });
  }

  // 保存设置到Chrome存储
  async saveSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.set({ readAnythingSettings: this.settings }, () => {
        resolve();
      });
    });
  }

  // 获取所有可用语音
  async getVoices() {
    return new Promise(resolve => {
      let voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        speechSynthesis.addEventListener('voiceschanged', () => {
          resolve(speechSynthesis.getVoices());
        });
      }
    });
  }

  // 填充语音选择下拉框
  async populateVoices() {
    const voices = await this.getVoices();
    const voiceSelect = document.getElementById('voice-select');
    const voiceInfo = document.querySelector('.voice-info');
    
    // 清空现有选项（保留默认选项）
    voiceSelect.innerHTML = '<option value="">使用默认语音</option>';
    
    if (voices.length === 0) {
      voiceInfo.textContent = '没有找到可用语音';
      return;
    }

    // 按语言分组语音
    const voicesByLang = {};
    voices.forEach(voice => {
      const lang = voice.lang.split('-')[0];
      if (!voicesByLang[lang]) {
        voicesByLang[lang] = [];
      }
      voicesByLang[lang].push(voice);
    });

    // 添加语音选项
    Object.keys(voicesByLang).sort().forEach(lang => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = this.getLanguageName(lang);
      
      voicesByLang[lang].forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        option.selected = this.settings.voice === voice.name;
        optgroup.appendChild(option);
      });
      
      voiceSelect.appendChild(optgroup);
    });

    voiceInfo.textContent = `找到 ${voices.length} 个可用语音`;
  }

  // 获取语言名称
  getLanguageName(langCode) {
    const languages = {
      'zh': '中文',
      'en': '英语',
      'ja': '日语',
      'ko': '韩语',
      'fr': '法语',
      'de': '德语',
      'es': '西班牙语',
      'it': '意大利语',
      'ru': '俄语',
      'pt': '葡萄牙语',
      'ar': '阿拉伯语',
      'hi': '印地语'
    };
    return languages[langCode] || langCode;
  }

  // 设置事件监听器
  setupEventListeners() {
    // 滑块事件
    ['rate', 'pitch', 'volume'].forEach(param => {
      const slider = document.getElementById(`${param}-slider`);
      const value = document.getElementById(`${param}-value`);
      
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        value.textContent = val.toFixed(1);
        this.settings[param] = val;
      });
    });

    // 选择框事件
    document.getElementById('voice-select').addEventListener('change', (e) => {
      this.settings.voice = e.target.value;
    });

    // 复选框事件
    document.getElementById('highlight-checkbox').addEventListener('change', (e) => {
      this.settings.highlightEnabled = e.target.checked;
    });

    document.getElementById('autoread-checkbox').addEventListener('change', (e) => {
      this.settings.autoRead = e.target.checked;
    });

    // 按钮事件
    document.getElementById('save-settings').addEventListener('click', async () => {
      await this.saveSettings();
      this.showMessage('设置已保存！');
    });

    document.getElementById('read-selected').addEventListener('click', () => {
      this.sendMessageToContent({ action: 'readSelection' });
    });

    document.getElementById('stop-reading').addEventListener('click', () => {
      this.sendMessageToContent({ action: 'stopReading' });
    });
  }

  // 发送消息到内容脚本
  sendMessageToContent(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
  }

  // 更新UI显示
  updateUI() {
    document.getElementById('rate-slider').value = this.settings.rate;
    document.getElementById('rate-value').textContent = this.settings.rate.toFixed(1);
    
    document.getElementById('pitch-slider').value = this.settings.pitch;
    document.getElementById('pitch-value').textContent = this.settings.pitch.toFixed(1);
    
    document.getElementById('volume-slider').value = this.settings.volume;
    document.getElementById('volume-value').textContent = this.settings.volume.toFixed(1);
    
    document.getElementById('highlight-checkbox').checked = this.settings.highlightEnabled;
    document.getElementById('autoread-checkbox').checked = this.settings.autoRead;
  }

  // 显示消息
  showMessage(text) {
    const message = document.createElement('div');
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #28a745;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 1000;
      animation: fadeInOut 2s ease-in-out;
    `;
    
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 2000);
  }
}

// 初始化弹出窗口
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }
`;
document.head.appendChild(style);