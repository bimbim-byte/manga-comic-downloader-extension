// Fungsi pengekstrak gambar Naver Webtoon via Jembatan Tampermonkey (MAIN World Mode)
window.getWebImages = async function() {
    console.log("Naver Webtoon: Mengekstrak gambar menggunakan CORS Tampermonkey...");

    const imgElements = Array.from(document.querySelectorAll(".wt_viewer img, .viewer_img img, #comic_view_area img"));
    
    if (!imgElements.length) {
        console.error("Gambar Naver Webtoon tidak ditemukan.");
        return [];
    }

    const fetchBypass = window.fetchViaGM || (window.CORSViaGM && window.CORSViaGM.fetchViaGM);
    if (!fetchBypass) {
        alert("⚠️ [CORS Error] Userscript Tampermonkey 'CORS Via GM' tidak terdeteksi aktif di halaman ini!");
        return [];
    }

    const processedImgs = [];

    const blobToDataURL = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    for (let i = 0; i < imgElements.length; i++) {
        const img = imgElements[i];
        const targetUrl = img.src || img.getAttribute("data-src");

        if (!targetUrl) continue;

        try {
            const response = await fetchBypass(targetUrl);
            const blobData = await response.blob();
            const dataURL = await blobToDataURL(blobData);

            const tempImg = new Image();
            tempImg.src = dataURL;
            await new Promise((resolve) => {
                tempImg.onload = resolve;
                setTimeout(resolve, 3000);
            });

            if (tempImg.naturalWidth > 0) {
                processedImgs.push({
                    isPreProcessed: true,
                    dataURL: dataURL,
                    width: tempImg.naturalWidth,
                    height: tempImg.naturalHeight
                });
                console.log(`[Naver][${i + 1}/${imgElements.length}] Berhasil diekstrak.`);
            }
        } catch (err) {
            console.error(`Gagal mengekstrak gambar Naver ke-${i + 1}:`, err);
        }
    }

    return processedImgs;
};

// Jembatan komunikasi dari MAIN World ke ISOLATED World
document.addEventListener("RequestImagesFromIsolated", async () => {
    try {
        const imgs = await window.getWebImages();
        document.dispatchEvent(new CustomEvent("ResponseImagesToIsolated", { detail: imgs }));
    } catch (err) {
        document.dispatchEvent(new CustomEvent("ResponseImagesToIsolated", { detail: { error: err.message } }));
    }
});