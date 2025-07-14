// content.js  —— 注入到每个页面
(function () {
  // 全局设置对象
  let settings = {
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: null,
    highlightEnabled: true,
    autoRead: true
  };

  // 从存储中加载设置
  function loadSettings() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(['readAnythingSettings'], (result) => {
          if (result.readAnythingSettings) {
            settings = { ...settings, ...result.readAnythingSettings };
          }
          resolve();
        });
      } else {
        // 回退到localStorage
        const saved = localStorage.getItem('readAnythingSettings');
        if (saved) {
          settings = { ...settings, ...JSON.parse(saved) };
        }
        resolve();
      }
    });
  }

  // 保存设置
  function saveSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ readAnythingSettings: settings });
    } else {
      localStorage.setItem('readAnythingSettings', JSON.stringify(settings));
    }
  }

  // 获取所有可用语音
  function getVoices() {
    return new Promise(resolve => {
      let voices = speechSynthesis.getVoices();
      if (voices.length) {
        resolve(voices);
      } else {
        speechSynthesis.addEventListener('voiceschanged', () => {
          resolve(speechSynthesis.getVoices());
        });
      }
    });
  }

  // 高亮显示正在朗读的文本
  function highlightText(range) {
    if (!settings.highlightEnabled) return;
    
    const highlight = document.createElement('span');
    highlight.style.backgroundColor = 'yellow';
    highlight.style.transition = 'background-color 0.3s';
    
    try {
      range.surroundContents(highlight);
      setTimeout(() => {
        if (highlight.parentNode) {
          const parent = highlight.parentNode;
          parent.insertBefore(document.createTextNode(highlight.textContent), highlight);
          parent.removeChild(highlight);
        }
      }, 1000);
    } catch (e) {
      console.warn('无法高亮文本:', e);
    }
  }

  // 创建设置面板
  function createSettingsPanel() {
    const panel = document.createElement('div');
    panel.id = 'read-anything-panel';
    panel.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: white; border: 2px solid #333; border-radius: 10px; 
                  padding: 20px; z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                  font-family: Arial, sans-serif; font-size: 14px; max-width: 400px;">
        <h3 style="margin-top: 0; color: #333;">朗读设置</h3>
        
        <div style="margin: 10px 0;">
          <label>语速: <span id="rate-value">${settings.rate}</span></label><br>
          <input type="range" id="rate-slider" min="0.1" max="10" step="0.1" value="${settings.rate}" style="width: 100%;">
        </div>
        
        <div style="margin: 10px 0;">
          <label>音调: <span id="pitch-value">${settings.pitch}</span></label><br>
          <input type="range" id="pitch-slider" min="0" max="2" step="0.1" value="${settings.pitch}" style="width: 100%;">
        </div>
        
        <div style="margin: 10px 0;">
          <label>音量: <span id="volume-value">${settings.volume}</span></label><br>
          <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="${settings.volume}" style="width: 100%;">
        </div>
        
        <div style="margin: 10px 0;">
          <label>语音选择:</label><br>
          <select id="voice-select" style="width: 100%; padding: 5px;">
            <option value="">使用默认语音</option>
          </select>
        </div>
        
        <div style="margin: 10px 0;">
          <label>
            <input type="checkbox" id="highlight-checkbox" ${settings.highlightEnabled ? 'checked' : ''}>
            朗读时高亮文本
          </label>
        </div>
        
        <div style="margin: 10px 0;">
          <label>
            <input type="checkbox" id="autoread-checkbox" ${settings.autoRead ? 'checked' : ''}>
            自动朗读选中文本
          </label>
        </div>
        
        <div style="margin-top: 20px; text-align: right;">
          <button id="save-settings" style="margin-right: 10px; padding: 8px 16px; 
                                           background: #007bff; color: white; border: none; 
                                           border-radius: 4px; cursor: pointer;">保存</button>
          <button id="cancel-settings" style="padding: 8px 16px; background: #6c757d; 
                                           color: white; border: none; border-radius: 4px; 
                                           cursor: pointer;">取消</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // 填充语音选项
    getVoices().then(voices => {
      const select = document.getElementById('voice-select');
      voices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        option.selected = settings.voice === voice.name;
        select.appendChild(option);
      });
    });
    
    // 事件监听
    document.getElementById('rate-slider').addEventListener('input', (e) => {
      document.getElementById('rate-value').textContent = e.target.value;
    });
    
    document.getElementById('pitch-slider').addEventListener('input', (e) => {
      document.getElementById('pitch-value').textContent = e.target.value;
    });
    
    document.getElementById('volume-slider').addEventListener('input', (e) => {
      document.getElementById('volume-value').textContent = e.target.value;
    });
    
    document.getElementById('save-settings').addEventListener('click', () => {
      settings.rate = parseFloat(document.getElementById('rate-slider').value);
      settings.pitch = parseFloat(document.getElementById('pitch-slider').value);
      settings.volume = parseFloat(document.getElementById('volume-slider').value);
      settings.voice = document.getElementById('voice-select').value;
      settings.highlightEnabled = document.getElementById('highlight-checkbox').checked;
      settings.autoRead = document.getElementById('autoread-checkbox').checked;
      
      saveSettings();
      document.body.removeChild(panel);
    });
    
    document.getElementById('cancel-settings').addEventListener('click', () => {
      document.body.removeChild(panel);
    });
  }

  // 朗读选中文本
  async function readSelection() {
    if (!settings.autoRead) return;
    
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (!text) return;

    // 获取选区范围用于高亮
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    // 停掉上一段（如果还在播）
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    
    // 应用设置
    utter.rate = settings.rate;
    utter.pitch = settings.pitch;
    utter.volume = settings.volume;
    
    // 设置语音
    if (settings.voice) {
      const voices = await getVoices();
      const selectedVoice = voices.find(v => v.name === settings.voice);
      if (selectedVoice) {
        utter.voice = selectedVoice;
      }
    }

    // 高亮文本
    if (range) {
      utter.onstart = () => highlightText(range.cloneRange());
    }

    // 错误处理
    utter.onerror = (event) => {
      console.error('语音合成错误:', event.error);
      if (event.error === 'not-allowed') {
        alert('请允许网站使用语音合成功能');
      }
    };

    window.speechSynthesis.speak(utter);
  }

  // 键盘快捷键处理
  function handleKeyboard(event) {
    if (event.ctrlKey && event.shiftKey) {
      switch (event.key) {
        case 'S':
          event.preventDefault();
          createSettingsPanel();
          break;
        case 'R':
          event.preventDefault();
          readSelection();
          break;
        case 'C':
          event.preventDefault();
          window.speechSynthesis.cancel();
          break;
      }
    }
  }

  // 初始化
  async function init() {
    await loadSettings();
    
    // 监听文本选择
    document.addEventListener('mouseup', () => {
      setTimeout(readSelection, 0);
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboard);
    
    // 双击打开设置面板
    document.addEventListener('dblclick', (e) => {
      if (e.altKey) {
        createSettingsPanel();
      }
    });
    
    // 监听来自popup的消息
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
          case 'readSelection':
            readSelection();
            break;
          case 'stopReading':
            window.speechSynthesis.cancel();
            break;
          case 'getVoices':
            getVoices().then(voices => sendResponse(voices));
            return true;
        }
      });
    }
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露全局方法供控制台使用
  window.ReadAnything = {
    settings: () => createSettingsPanel(),
    read: () => readSelection(),
    stop: () => window.speechSynthesis.cancel(),
    voices: () => getVoices().then(voices => console.log('可用语音:', voices))
  };
})();
