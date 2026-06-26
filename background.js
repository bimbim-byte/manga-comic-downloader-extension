console.log("[Background] Service Worker Aktif.");

async function injectedMainWorldExecutor(links, formatType, safeBaseName) {
    console.log(`[Core] Memproses format: ${formatType}`);
    
    const fetchBridge = window.fetchViaGM || (window.CORSViaGM && window.CORSViaGM.fetchViaGM);
    if (typeof fetchBridge !== 'function') {
        alert("Error: Script Tampermonkey tidak aktif!");
        return;
    }

    const b64 = (blob) => new Promise((res, rej) => {
        const r = new FileReader(); r.onloadend = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob);
    });

    const getDim = (str) => new Promise((res) => {
        const i = new Image(); i.onload = () => res({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => res({ w: 800, h: 1200 }); i.src = str;
    });

    // --- PDF ENGINE ---
    if (formatType === "PDF") {
        if (typeof window.jspdf === 'undefined') {
            await new Promise(r => {
                const s = document.createElement('script'); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload = r; document.head.appendChild(s);
            });
        }

        const { jsPDF } = window.jspdf;
        let pdf = null;

        for (let i = 0; i < links.length; i++) {
            try {
                const resp = await fetchBridge(links[i]);
                const blob = await resp.blob();
                const dataStr = await b64(blob);
                const d = await getDim(dataStr);
                const orient = d.w > d.h ? 'l' : 'p';

                if (pdf === null) pdf = new jsPDF({ orientation: orient, unit: 'pt', format: [d.w, d.h] });
                else pdf.addPage([d.w, d.h], orient);
                pdf.addImage(dataStr, 'JPEG', 0, 0, d.w, d.h);
            } catch (e) { console.error(`Gagal halaman ${i + 1}`, e); }
            await new Promise(r => setTimeout(r, 80));
        }
        if (pdf) pdf.save(`${safeBaseName}.pdf`);
    } 
    
    // --- CBZ ENGINE ---
    else if (formatType === "CBZ") {
        if (typeof window.JSZip === 'undefined') {
            await new Promise(r => {
                const s = document.createElement('script'); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"; s.onload = r; document.head.appendChild(s);
            });
        }

        const zip = new window.JSZip();

        for (let i = 0; i < links.length; i++) {
            const url = links[i];
            const idx = String(i + 1).padStart(3, '0');
            let ext = ".jpg";
            const match = url.split('?')[0].match(/\.(jpg|jpeg|png|webp|gif)/i);
            if (match) ext = match[0];

            try {
                const resp = await fetchBridge(url);
                const blob = await resp.blob();
                zip.file(`${idx}${ext}`, blob);
            } catch (e) { console.error(`Gagal halaman ${idx}`, e); }
            await new Promise(r => setTimeout(r, 80));
        }

        const meta = `<?xml version="1.0" encoding="utf-8"?><ComicInfo><Title>${document.title || "Manga"}</Title><PageCount>${links.length}</PageCount></ComicInfo>`;
        zip.file("ComicInfo.xml", meta);

        const out = await zip.generateAsync({ type: "blob" });
        const a = document.createElement('a'); a.href = URL.createObjectURL(out); a.download = `${safeBaseName}.cbz`; a.click();
    }
}

// HUB MESSAGE LISTENER
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "download_image_file") {
        const { url, folderName, index } = message.data;
        let orig = url.split('/').pop().split('?')[0];
        if (!orig || !orig.includes('.')) orig = `page_${String(index).padStart(3, '0')}.jpg`;
        const filename = `${folderName}/${String(index).padStart(3, '0')}_${orig}`;

        chrome.downloads.download({ url: url, filename: filename, conflictAction: "uniquify", saveAs: false }, () => {
            sendResponse({ success: !chrome.runtime.lastError });
        });
        return true; 
    }

    if (message.action === "START_DIRECT_IMAGE_DOWNLOAD") {
        message.dataLinks.forEach(url => chrome.downloads.download({ url: url, conflictAction: "uniquify" }));
        sendResponse({ success: true });
    } 
    else if (message.action === "TRIGGER_MAIN_WORLD_INJECTION") {
        chrome.tabs.query({ active: true, currentWindow: true }, (t) => {
            if (t[0]) {
                chrome.scripting.executeScript({
                    target: { tabId: t[0].id }, world: "MAIN", func: injectedMainWorldExecutor, args: [message.links, message.format, message.safeTitle]
                });
            }
        });
        sendResponse({ success: true });
    }
    else if (message.action === "START_PROCESS") {
        chrome.tabs.query({ active: true, currentWindow: true }, (t) => {
            if (t[0]) {
                chrome.tabs.sendMessage(t[0].id, { action: "EXECUTE_DOWNLOAD", format: message.format }, (res) => sendResponse(res));
            }
        });
        return true;
    }
});