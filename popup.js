window.addEventListener('DOMContentLoaded', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.startsWith('http')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        document.getElementById('status-text').innerText = "Akses Ditolak";
        document.getElementById('status-text').style.color = "#ff7675";
      } else {
        document.getElementById('status-text').innerText = "Ready!";
        document.getElementById('status-text').style.color = "#10ac84";
      }
    });
  }
});

document.querySelectorAll('.btn-option').forEach(button => {
  button.addEventListener('click', async (e) => {
    const selectedFormat = e.currentTarget.getAttribute('data-format');
    
    chrome.runtime.sendMessage({ 
      action: "START_PROCESS", 
      format: selectedFormat 
    }, () => {
      // Langsung tutup popup agar layar web utama kelihatan
      window.close();
    });
  });
});