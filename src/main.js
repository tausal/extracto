// import './style.css'

// requestAnimationFrame sort of function

window.addEventListener("DOMContentLoaded", () => {
    const videoFile = document.querySelector("#videoFile");
    const videoEl = document.getElementById("video");
    const canvasEl = document.querySelector("#canvas");
    const timestamp = document.querySelector("#timestamp");
    const statusEl = document.querySelector("#status");
    const framesContainer = document.getElementById("frames");
    const frameCountInput = document.getElementById("frameCount");
    const frameIntervalInput = document.getElementById("frameInterval");
    const extractBtn = document.querySelector("#extractBtn");
    const optionsSection = document.querySelector(".options");
    const actionsSection = document.querySelector(".actions");
    const downloadZipButton = actionsSection.querySelector("#downloadZip");
    const downloadSelectedButton = actionsSection.querySelector("#downloadSelected");

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const closeBtn = document.getElementById('closeBtn');
    const downloadCurrent = document.getElementById('downloadCurrent');

    let startTime = 0;
    optionsSection.style.display = "none";

    const frameUrls = [];
    let currentIndex = 0;

    videoFile?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            videoEl.src = URL.createObjectURL(file);
            startTime = 0;
            timestamp.textContent = `0s`;
            framesContainer.innerHTML = '';
            statusEl.textContent = '';
            optionsSection.style.display = "block";
        }
    });

    videoEl.addEventListener("pause", () => {
        startTime = videoEl.currentTime;
        timestamp.textContent = `${startTime.toFixed(2)}s`;
    })

    extractBtn?.addEventListener("click", async () => {
        if (!videoEl.src) {
            alert('Load a video goat wtf');
            return;
        }

        const frameCount = parseInt(frameCountInput.value);
        const interval = parseFloat(frameIntervalInput.value);

        if (frameCount <= 0 || interval <= 0) {
            alert('Are you joking with these input values? Put a proper value.');
            return;
        }

        const zip = new JSZip(); 
        actionsSection.style.display = "flex";
        framesContainer.innerHTML = '';
        statusEl.textContent = 'Extracting...';

        const duration = videoEl.duration;

        const ctx = canvasEl.getContext("2d");
        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;

        // for (let t = startTime; t < duration; t += 1 / frameRate) {
        for (let i = 0; i < frameCount; i++) {
            const t = startTime + i * interval;

            if (t > duration) break;

            await new Promise(res => {
                videoEl.currentTime = t;
                videoEl.onseeked = () => {
                    ctx?.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
                    canvasEl.toBlob(blob => {
                        const url = URL.createObjectURL(blob);
                        frameUrls.push(url);
                        const frameDiv = document.createElement("div");
                        frameDiv.className = 'frame';

                        const img = document.createElement("img");
                        img.src = url;
                        img.alt = `Frame at ${t.toFixed(2)}s`;
                        img.addEventListener('click', () => openLightbox(frameUrls.indexOf(url)));

                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = `frameCheck${framesContainer.children.length}`;

                        const downloadButton = document.createElement('button');
                        downloadButton.textContent = `Download ${t.toFixed(2)}s`;
                        downloadButton.addEventListener("click", () => {
                            const a = document.createElement("a")
                            a.href = url;
                            a.download = `frame_${Math.floor(t * 1000)}ms.png`;
                            a.click();
                        });

                        frameDiv.appendChild(img);
                        frameDiv.appendChild(checkbox);
                        frameDiv.appendChild(downloadButton);
                        framesContainer.appendChild(frameDiv);
                        downloadZipButton.textContent = `Download ${frameCount} frames as ZIP`;
                        res();
                    }, 'image/png');
                }
            })
        }
        statusEl.textContent = 'Done!';
    });

    downloadZipButton.addEventListener("click", () => {

    });

    const openLightbox = index => {
        currentIndex = index;
        lightboxImg.src = frameUrls[currentIndex];
        lightbox.style.display = 'flex';
    }
    function closeLightbox() {
        lightbox.style.display = 'none';
    }

    function showPrev() {
        if (currentIndex > 0) {
            currentIndex--;
            lightboxImg.src = frameUrls[currentIndex];
        }
    } function showNext() {
        if (currentIndex < frameUrls.length - 1) {
            currentIndex++;
            lightboxImg.src = frameUrls[currentIndex];
        }
    }

    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);
    closeBtn.addEventListener('click', closeLightbox);
    downloadCurrent.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = frameUrls[currentIndex];
        a.download = `frame_${currentIndex}.png`;
        a.click();
    });

    document.addEventListener('keydown', e => {
        if (lightbox.style.display !== 'flex') return;
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'Escape') closeLightbox();
    });
})

const handleDOMElements = (url, t, parentElement, lightBoxCallback) => {
    const frameDiv = document.createElement("div");
    frameDiv.className = 'frame';

    const img = document.createElement("img");
    img.src = url;
    img.alt = `Frame at ${t.toFixed(2)}s`;
    img.addEventListener('click', () => lightBoxCallback)

    const downloadButton = document.createElement('button');
    downloadButton.addEventListener("click", () => {
        const a = document.createElement("a")
        a.href = url;
        a.download = `frame_${Math.floor(t * 1000)}ms.png`;
        a.click();
    });

    frameDiv.appendChild(img);
    frameDiv.appendChild(downloadButton);
    parentElement.appendChild(frameDiv);
}

