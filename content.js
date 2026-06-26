(function() {
    if (window.hasMangaDownloaderUniversalActive) return;
    window.hasMangaDownloaderUniversalActive = true;

    console.log("[Engine] Scanner Aktif.");

    let statusDiv = null;
    function showStatusOverlay(text) {
        if (!statusDiv) {
            statusDiv = document.createElement("div");
            statusDiv.style.position = "fixed";
            statusDiv.style.bottom = "20px";
            statusDiv.style.right = "20px";
            statusDiv.style.zIndex = "1000000";
            statusDiv.style.padding = "12px 20px";
            statusDiv.style.backgroundColor = "rgba(26, 26, 26, 0.85)";
            statusDiv.style.backdropFilter = "blur(6px)";
            statusDiv.style.color = "#ffffff";
            statusDiv.style.fontFamily = "sans-serif";
            statusDiv.style.fontSize = "13px";
            statusDiv.style.fontWeight = "bold";
            statusDiv.style.borderRadius = "8px";
            statusDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
            statusDiv.style.border = "1px solid rgba(255,255,255,0.1)";
            statusDiv.style.transition = "all 0.3s";
            document.body.appendChild(statusDiv);
        }
        statusDiv.innerText = text;
    }

    function removeStatusOverlay(isSuccess = true) {
        if (statusDiv) {
            statusDiv.style.backgroundColor = isSuccess ? "rgba(16, 172, 132, 0.9)" : "rgba(255, 71, 87, 0.9)";
            statusDiv.innerText = isSuccess ? "✅ Selesai" : "❌ Gagal";
            setTimeout(() => {
                if (statusDiv) {
                    statusDiv.remove();
                    statusDiv = null;
                }
            }, 2000);
        }
    }
    
    function runUniversalScanner() {
        let score = 0;
        const url = window.location.href.toLowerCase();
        const keywords = ['/chapter', '/read/', '/manga/', '/comic/', '/viewer', 'baca', '/title/', '/series/'];
        if (keywords.some(kw => url.includes(kw)) || /\/\d+(\.\d+)?$/i.test(url)) score += 20;

        const images = document.querySelectorAll('img');
        let validImgs = 0;
        images.forEach(img => { if (img.clientHeight > 400 || img.naturalHeight > 500) validImgs++; });
        if (validImgs >= 5) score += 30;

        let groups = {};
        if (score >= 40 || validImgs >= 3) {
            let targets = Array.from(document.querySelectorAll('img'));
            targets.forEach(img => {
                const src = img.getAttribute('data-src') || img.getAttribute('data-original') || img.currentSrc || img.src || '';
                if (src && !src.includes('data:image')) {
                    let path = []; let current = img;
                    for (let i = 0; i < 3; i++) {
                        if (!current || current.tagName === 'BODY') break;
                        let tag = current.tagName.toLowerCase();
                        let id = current.id ? `#${current.id}` : '';
                        let classes = current.className && typeof current.className === 'string' ? `.${Array.from(current.classList).filter(c => c.trim() !== '').join('.')}` : '';
                        path.unshift(`${tag}${id}${classes}`);
                        current = current.parentElement;
                    }
                    let struct = path.join(' > ');
                    if (!groups[struct]) groups[struct] = { format: struct, _links: new Set() };
                    groups[struct]._links.add(src);
                }
            });
        }

        let list = [];
        Object.values(groups).forEach(g => {
            const allLinks = Array.from(g._links);
            if (allLinks.length > 0) {
                allLinks.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
                list.push({ total: allLinks.length, links: allLinks });
            }
        });

        // FIX: Mengganti 'current' menjadi 'cur' agar merujuk ke elemen iterasi reduce yang benar
        let primary = list.reduce((max, cur) => (cur.total > (max ? max.total : 0)) ? cur : max, null);
        return { title: document.title, target: primary ? primary.links : [] };
    }

    async function processMangaDownload(formatType) {
        showStatusOverlay("⏳ Memindai...");
        const result = runUniversalScanner();
        
        if (result.target.length === 0) {
            removeStatusOverlay(false);
            alert("Gambar tidak ditemukan.");
            return;
        }
        
        const safeName = (result.title || "Manga").replace(/[/\\?%*:|"<>]/g, ' ').replace(/\s+/g, ' ').trim();

        if (formatType === "IMAGE") {
            showStatusOverlay(`🖼️ Mengunduh ${result.target.length} Gambar...`);
            chrome.runtime.sendMessage({ action: "START_DIRECT_IMAGE_DOWNLOAD", dataLinks: result.target }, () => {
                removeStatusOverlay(true);
            });
        } else {
            showStatusOverlay(`📦 Memproses ${formatType}...`);
            chrome.runtime.sendMessage({ action: "TRIGGER_MAIN_WORLD_INJECTION", format: formatType, links: result.target, safeTitle: safeName }, () => {
                setTimeout(() => removeStatusOverlay(true), 1500);
            });
        }
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "EXECUTE_DOWNLOAD") {
            sendResponse({ status: "STARTED" });
            processMangaDownload(request.format);
        }
        return true;
    });
})();