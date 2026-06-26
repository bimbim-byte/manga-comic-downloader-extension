// Fungsi pengekstrak gambar MangaPlus dengan Fitur Auto-Merge Berurutan Kanan-ke-Kiri
window.getWebImages = async function() {
    const containers = document.querySelectorAll("div.zao-container");
    console.log(`Menemukan ${containers.length} kontainer gambar MangaPlus. Menganalisis posisi gambar...`);
    
    const processedImgs = [];
    
    // Ambil semua elemen gambar zao-image asli yang menggunakan blob
    const originalImgs = Array.from(
        document.querySelectorAll("div.zao-container img.zao-image")
    ).filter(img => img.src && /^blob:/.test(img.src));

    if (!originalImgs.length) {
        console.error("Gambar blob MangaPlus tidak ditemukan!");
        return [];
    }

    // 1. Validasi dan pastikan semua gambar termuat penuh agar dimensinya valid
    for (let i = 0; i < originalImgs.length; i++) {
        const img = originalImgs[i];
        if (!img.complete || img.naturalWidth === 0) {
            await new Promise((resolve) => {
                img.addEventListener("load", resolve, { once: true });
                setTimeout(resolve, 3000); 
            });
        }
    }

    // Helper untuk menyalin gambar ke canvas individu
    const getCanvasFromImg = (img) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return canvas;
    };

    // 2. Analisis layout berdampingan berdasarkan posisi koordinat top (Sumbu Y)
    for (let i = 0; i < originalImgs.length; i++) {
        const currentImg = originalImgs[i];
        
        if (currentImg.naturalWidth === 0 || currentImg.naturalHeight === 0) continue;

        // Ambil data posisi gambar saat ini di layar
        const currentRect = currentImg.getBoundingClientRect();

        // Cek apakah ada gambar berikutnya untuk dibandingkan posisinya
        if ((i + 1) < originalImgs.length) {
            const nextImg = originalImgs[i + 1];
            const nextRect = nextImg.getBoundingClientRect();

            // Jika selisih posisi atas (top) kedua gambar kurang dari 20 pixel, 
            // artinya mereka berada di baris yang sama (berdampingan / double page)
            const isSideBySide = Math.abs(currentRect.top - nextRect.top) < 20;

            if (isSideBySide && nextImg.naturalWidth > 0 && nextImg.naturalHeight > 0) {
                console.log(`[Double Page Spread] Menggabungkan Gambar ${i+1} (Kiri) & Gambar ${i+2} (Kanan) dengan urutan Manga`);
                
                try {
                    // Berdasarkan urutan DOM, currentImg adalah bagian kiri dan nextImg adalah bagian kanan
                    const canvasLeft = getCanvasFromImg(currentImg);
                    const canvasRight = getCanvasFromImg(nextImg);

                    // Buat Canvas Utama untuk Penggabungan
                    const mergedCanvas = document.createElement("canvas");
                    mergedCanvas.width = canvasLeft.width + canvasRight.width;
                    mergedCanvas.height = Math.max(canvasLeft.height, canvasRight.height);

                    const mCtx = mergedCanvas.getContext("2d");
                    
                    // --- PERBAIKAN URUTAN DI SINI ---
                    // Sesuai instruksi: Pemasangan yang lebih awal (current/Left) ditaruh di KANAN, 
                    // dan halaman selanjutnya (next/Right) ditaruh di KIRI.
                    
                    // 1. Tempelkan halaman selanjutnya (nextImg) di sebelah KIRI (posisi X = 0)
                    mCtx.drawImage(canvasRight, 0, 0);
                    
                    // 2. Tempelkan halaman awal (currentImg) di sebelah KANAN (posisi X = lebar gambar kanan)
                    mCtx.drawImage(canvasLeft, canvasRight.width, 0);

                    processedImgs.push({
                        isPreProcessed: true,
                        dataURL: mergedCanvas.toDataURL("image/png"),
                        width: mergedCanvas.width,
                        height: mergedCanvas.height
                    });

                    i++; // Lompat indeks karena pasangan sudah ikut digabung
                    continue;
                } catch (err) {
                    console.error("Gagal menggabungkan halaman, dialihkan ke normal:", err);
                }
            }
        }

        // JALUR STANDAR: Halaman Tunggal biasa
        try {
            const canvas = getCanvasFromImg(currentImg);
            processedImgs.push({
                isPreProcessed: true,
                dataURL: canvas.toDataURL("image/png"),
                width: canvas.width,
                height: canvas.height
            });
        } catch (err) {
            console.error("Gagal memproses halaman tunggal:", err);
        }
    }

    console.log(`Selesai memproses. Total lembar halaman PDF: ${processedImgs.length}`);
    return processedImgs;
};