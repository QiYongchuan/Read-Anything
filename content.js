// content.js  —— 注入到每个页面
(function () {
  /**
   * 把选中文本朗读出来
   */
  function readSelection() {
    const text = window.getSelection().toString().trim();
    if (!text) return;

    // 停掉上一段（如果还在播）
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);

    // 自动跟随浏览器 UI 语言，可手动指定：
    // utter.lang = 'zh-CN';
    utter.rate = 1;      // 语速 0.1～10
    utter.pitch = 1;     // 音高 0～2
    utter.volume = 1;    // 音量 0～1

    window.speechSynthesis.speak(utter);
  }

  // 拖完鼠标（mouseup）就朗读
  document.addEventListener('mouseup', () => {
    // 给浏览器一点点时间更新 selection
    setTimeout(readSelection, 0);
  });
})();
