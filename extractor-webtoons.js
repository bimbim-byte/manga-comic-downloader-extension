// Fungsi pengekstrak gambar LINE Webtoon via Jembatan Tampermonkey (MAIN World Mode)
window.getWebImages = async function() {
    console.log("LINE Webtoon: Mengekstrak gambar menggunakan CORS Tampermonkey...");

    const imgElements = Array.from(document.querySelectorAll("#_imageList img, .viewer_lst img"));
    
    if (!imgElements.length) {
        console.error("Gambar LINE Webtoon tidak ditemukan.");
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
        const targetUrl = img.src || img.getAttribute("data-url");

        if (!targetUrl || targetUrl.includes("blank.gif")) continue;

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
                console.log(`[LINE Webtoon][${i + 1}/${imgElements.length}] Berhasil diekstrak.`);
            }
        } catch (err) {
            console.error(`Gagal mengekstrak gambar LINE Webtoon ke-${i + 1}:`, err);
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