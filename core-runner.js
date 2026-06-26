(async () => {
    async function safeGetWebImages() {
        if (window.location.host.includes("mangaplus")) {
            if (typeof window.getWebImages !== 'function') throw new Error("Extractor MangaPlus tidak siap.");
            return await window.getWebImages();
        }
        
        return new Promise((resolve, reject) => {
            const onResponse = (e) => {
                document.removeEventListener("ResponseImagesToIsolated", onResponse);
                if (e.detail && e.detail.error) reject(new Error(e.detail.error));
                else resolve(e.detail);
            };
            document.addEventListener("ResponseImagesToIsolated", onResponse);
            document.dispatchEvent(new CustomEvent("RequestImagesFromIsolated"));
            
            setTimeout(() => {
                document.removeEventListener("ResponseImagesToIsolated", onResponse);
                reject(new Error("Gagal memuat gambar (Timeout)."));
            }, 12000);
        });
    }

    // ANTARMUKA MENU UTAMA (UI) - KEMBALI KE STRUKTUR AWAL
    const container = document.createElement("div");
    container.style.position = "fixed"; container.style.bottom = "20px"; container.style.right = "20px";
    container.style.zIndex = "99999"; container.style.display = "flex";
    container.style.flexDirection = "column"; container.style.alignItems = "flex-end"; container.style.gap = "10px";
    container.style.fontFamily = "Arial, sans-serif";
    document.body.appendChild(container);

    const menuPanel = document.createElement("div");
    menuPanel.style.display = "none"; menuPanel.style.flexDirection = "column";
    menuPanel.style.backgroundColor = "#ffffff"; menuPanel.style.borderRadius = "12px";
    menuPanel.style.boxShadow = "0px 8px 24px rgba(0,0,0,0.2)"; menuPanel.style.padding = "8px";
    menuPanel.style.gap = "4px"; menuPanel.style.width = "260px";
    container.appendChild(menuPanel);

    const createMenuBtn = (text, onClick) => {
        const mBtn = document.createElement("button");
        mBtn.innerText = text;
        mBtn.style.padding = "10px 14px"; mBtn.style.textAlign = "left"; mBtn.style.backgroundColor = "transparent";
        mBtn.style.border = "none"; mBtn.style.borderRadius = "6px"; mBtn.style.cursor = "pointer";
        mBtn.style.fontSize = "13px"; mBtn.style.fontWeight = "600"; mBtn.style.color = "#2f3542";
        mBtn.style.transition = "background 0.2s";
        mBtn.addEventListener("mouseover", () => mBtn.style.backgroundColor = "#f1f2f6");
        mBtn.addEventListener("mouseout", () => mBtn.style.backgroundColor = "transparent");
        mBtn.addEventListener("click", () => { menuPanel.style.display = "none"; onClick(); });
        return mBtn;
    };

    const mainBtn = document.createElement("button");
    mainBtn.innerText = "📥 Download Options";
    mainBtn.style.padding = "12px 24px"; mainBtn.style.backgroundColor = "#ff4757"; 
    mainBtn.style.color = "white"; mainBtn.style.border = "none"; mainBtn.style.borderRadius = "50px";
    mainBtn.style.cursor = "pointer"; mainBtn.style.fontWeight = "bold"; mainBtn.style.boxShadow = "0px 4px 12px rgba(0,0,0,0.3)";
    mainBtn.addEventListener("click", () => {
        menuPanel.style.display = menuPanel.style.display === "none" ? "flex" : "none";
    });
    container.appendChild(mainBtn);

    const overlay = document.createElement("div");
    overlay.style.position = "fixed"; overlay.style.top = "0"; overlay.style.left = "0";
    overlay.style.width = "100vw"; overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; overlay.style.backdropFilter = "blur(3px)";
    overlay.style.zIndex = "100000"; overlay.style.display = "none";
    overlay.style.justifyContent = "center"; overlay.style.alignItems = "center";
    document.body.appendChild(overlay);

    const modalBox = document.createElement("div");
    modalBox.style.padding = "30px 50px"; modalBox.style.borderRadius = "15px";
    modalBox.style.backgroundColor = "#ffffff"; modalBox.style.boxShadow = "0px 10px 30px rgba(0,0,0,0.5)";
    modalBox.style.textAlign = "center"; modalBox.style.display = "flex";
    modalBox.style.flexDirection = "column"; modalBox.style.alignItems = "center"; modalBox.style.gap = "15px";
    overlay.appendChild(modalBox);

    const mainStatus = document.createElement("div"); mainStatus.style.fontSize = "22px"; mainStatus.style.fontWeight = "bold"; modalBox.appendChild(mainStatus);
    const subStatus = document.createElement("div"); subStatus.style.fontSize = "14px"; subStatus.style.color = "#57606f"; modalBox.appendChild(subStatus);

    function updateUI(state, title = "", message = "") {
        if (state === "loading") {
            mainBtn.disabled = true; overlay.style.display = "flex";
            mainStatus.innerText = title; mainStatus.style.color = "#ffa502"; subStatus.innerText = message;
        } else if (state === "success") {
            mainStatus.innerText = "✅ Berhasil!"; mainStatus.style.color = "#2ed573"; subStatus.innerText = message;
            setTimeout(resetUI, 2000);
        } else if (state === "error") {
            modalBox.style.backgroundColor = "#ffeaa7"; mainStatus.innerText = "❌ Gagal";
            mainStatus.style.color = "#ff4757"; subStatus.innerText = message;
            setTimeout(resetUI, 4000);
        }
    }

    function resetUI() { mainBtn.disabled = false; overlay.style.display = "none"; modalBox.style.backgroundColor = "#ffffff"; }

    const safeTitle = (document.title || "Manga").replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 100);

    // --- LOGIKA ACTIONS DENGAN PENYEDERHANAAN KATA ---

    // OPSI 1
    menuPanel.appendChild(createMenuBtn("🖼️ 1. Unduh Gambar Langsung (.jpg)", async () => {
        updateUI("loading", "⏳ Analisis Gambar", "Membaca element struktur halaman...");
        try {
            let urls = [];
            if (window.location.host.includes("mangaplus")) {
                const extracted = await safeGetWebImages();
                urls = extracted.map(i => i.dataURL); 
            } else {
                const selectors = [".wt_viewer img", ".viewer_img img", "#comic_view_area img", "#_imageList img", ".viewer_lst img"];
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(img => {
                        const src = img.src || img.getAttribute("data-src") || img.getAttribute("data-url");
                        if (src && !src.includes("blank.gif")) urls.push(src);
                    });
                });
                urls = Array.from(new Set(urls));
            }
            if (!urls.length) throw new Error("Gambar tidak ditemukan.");

            for (let i = 0; i < urls.length; i++) {
                subStatus.innerText = `Mengunduh halaman ${i + 1} / ${urls.length}...`;
                await new Promise((resolve) => {
                    chrome.runtime.sendMessage({
                        action: "download_image_file",
                        data: { url: urls[i], folderName: safeTitle, index: i + 1 }
                    }, resolve);
                });
                await new Promise(r => setTimeout(r, 120));
            }
            updateUI("success", "", "Semua gambar masuk antrean unduhan Chrome.");
        } catch (e) { updateUI("error", "", e.message); }
    }));

    // OPSI 2
    menuPanel.appendChild(createMenuBtn("📄 2. Jadikan File PDF (.pdf)", async () => {
        updateUI("loading", "⏳ Memproses PDF", "Mengekstrak data gambar...");
        try {
            const { jsPDF } = window.jspdf;
            const imgs = await safeGetWebImages();
            if (!imgs || !imgs.length) throw new Error("Gambar tidak ditemukan.");

            let pdf;
            for (let i = 0; i < imgs.length; i++) {
                subStatus.innerText = `Menyusun halaman ${i + 1} / ${imgs.length}...`;
                const item = imgs[i];
                let imgData = item.dataURL, w = item.width, h = item.height;

                if (!item.isPreProcessed) {
                    if (!item.complete) await new Promise((r) => item.addEventListener("load", r, { once: true }));
                    w = item.naturalWidth || item.width; h = item.naturalHeight || item.height;
                    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
                    canvas.getContext("2d").drawImage(item, 0, 0, w, h);
                    imgData = canvas.toDataURL("image/jpeg", 0.92);
                }

                const conf = { orientation: w >= h ? "landscape" : "portrait", format: [w, h] };
                if (!pdf) pdf = new jsPDF({ ...conf, unit: "pt", compress: true });
                else pdf.addPage([w, h], conf.orientation);
                pdf.addImage(imgData, "JPEG", 0, 0, w, h);
            }
            subStatus.innerText = "Menyimpan berkas PDF...";
            pdf.save(`${safeTitle}.pdf`);
            updateUI("success", "", "File PDF berhasil diunduh.");
        } catch (e) { updateUI("error", "", e.message); }
    }));

    // OPSI 3
    menuPanel.appendChild(createMenuBtn("📚 3. Jadikan File CBZ (.cbz)", async () => {
        updateUI("loading", "⏳ Memproses CBZ", "Mengumpulkan halaman komik...");
        try {
            const imgs = await safeGetWebImages();
            if (!imgs || !imgs.length) throw new Error("Gambar tidak ditemukan.");
            const zip = new window.JSZip();

            for (let i = 0; i < imgs.length; i++) {
                subStatus.innerText = `Mengemas halaman ${i + 1} / ${imgs.length}...`;
                const item = imgs[i];
                let base64Data = item.dataURL;

                if (!item.isPreProcessed) {
                    const canvas = document.createElement("canvas");
                    canvas.width = item.naturalWidth || item.width; canvas.height = item.naturalHeight || item.height;
                    canvas.getContext("2d").drawImage(item, 0, 0);
                    base64Data = canvas.toDataURL("image/jpeg", 0.92);
                }
                const rawBase64 = base64Data.split(',')[1];
                const ext = base64Data.includes("image/png") ? "png" : "jpg";
                zip.file(`${String(i + 1).padStart(3, '0')}.${ext}`, rawBase64, { base64: true });
            }

            subStatus.innerText = "Menulis metadata ComicInfo.xml...";
            const xmlMetadata = `<?xml version='1.0' encoding='utf-8'?><ComicInfo><Title>${safeTitle}</Title><PageCount>${imgs.length}</PageCount></ComicInfo>`;
            zip.file("ComicInfo.xml", xmlMetadata);

            subStatus.innerText = "Mengompilasi paket arsip CBZ...";
            const cbzBlob = await zip.generateAsync({ type: "blob", mimeType: "application/x-cbz", compression: "STORE" });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(cbzBlob); link.download = `${safeTitle}.cbz`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            updateUI("success", "", "File CBZ berhasil diunduh.");
        } catch (e) { updateUI("error", "", e.message); }
    }));
})();