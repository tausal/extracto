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
  const downloadSelectedButton =
    actionsSection.querySelector("#downloadSelected");

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const closeBtn = document.getElementById("closeBtn");
  const downloadCurrent = document.getElementById("downloadCurrent");

  let startTime = 0;
  optionsSection.style.display = "none";

  const frameBlobs = [];
  let currentIndex = 0;

  videoFile?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      videoEl.style.display = "block";
      videoEl.src = URL.createObjectURL(file);
      startTime = 0;
      timestamp.textContent = `0s`;
      framesContainer.innerHTML = "";
      statusEl.textContent = "";
      optionsSection.style.display = "block";
    }
  });

  videoEl.addEventListener("pause", () => {
    startTime = videoEl.currentTime;
    timestamp.textContent = `${startTime.toFixed(2)}s`;
  });

  extractBtn?.addEventListener("click", async () => {
    if (!videoEl.src) {
      alert("Load a video goat wtf");
      return;
    }

    const frameCount = parseInt(frameCountInput.value);
    const interval = parseFloat(frameIntervalInput.value);

    if (frameCount <= 0 || interval <= 0) {
      alert("Are you joking with these input values? Put a proper value.");
      return;
    }

    framesContainer.innerHTML = "";
    actionsSection.style.display = "flex";
    statusEl.textContent = "Extracting...";

    const ctx = canvasEl.getContext("2d");
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;

    const duration = videoEl.duration;

    // for (let t = startTime; t < duration; t += 1 / frameRate) {
    for (let i = 0; i < frameCount; i++) {
      const t = startTime + i * interval;
      if (t > duration) break;

      await new Promise((res) => {
        videoEl.currentTime = t;
        videoEl.onseeked = async () => {
          ctx?.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
          const blob = await new Promise((r) =>
            canvasEl.toBlob(r, "image/png")
          );
          const url = URL.createObjectURL(blob);
          const fileName = `frame_${Math.floor(t * 1000)}ms.png`;
          frameBlobs.push({ fileName, blob, url });
          addFramePreview(fileName, url);
          statusEl.textContent = `Extracted ${i + 1}/${frameCount}`;
          res();
        };
      });
    }

    statusEl.textContent = "Done!";
    downloadSelectedButton.disabled = false;
    downloadZipButton.disabled = false;

    async function zipAndDownload(selectedOnly = false) {
      const zip = new JSZip();
      const selectedFrames = selectedOnly
        ? frameBlobs.filter((_, idx) => {
            const checkbox = document.querySelector(`#frameCheck${idx}`);
            return checkbox && checkbox.checked;
          })
        : frameBlobs;

      if (selectedFrames.length === 0) {
        alert("No frames selected.");
        return;
      }

      for (const { fileName, blob } of selectedFrames) {
        const arr = await blob.arrayBuffer();
        zip.file(fileName, arr);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(zipBlob);
      a.download = selectedOnly ? "selected_frames.zip" : "all_frames.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    }
    downloadSelectedButton.onclick = () => zipAndDownload(true);
    downloadZipButton.onclick = () => zipAndDownload(false);

    function addFramePreview(fileName, url) {
      const frameDiv = document.createElement("div");
      frameDiv.className = "frame";

      const img = document.createElement("img");
      img.src = url;
      img.title = fileName;
      img.addEventListener("click", () =>
        openLightbox(
          frameBlobs,
          frameBlobs.findIndex((element) => element.url == url)
        )
      );

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `frameCheck${framesContainer.children.length}`;

      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "Download";
      downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
      };

      frameDiv.appendChild(img);
      frameDiv.appendChild(checkbox);
      frameDiv.appendChild(downloadBtn);
      framesContainer.appendChild(frameDiv);
    }
  });

  const openLightbox = (frameBlobs, index) => {
    currentIndex = index;
    lightboxImg.src = frameBlobs[currentIndex].url;
    lightbox.style.display = "flex";
  };

  function closeLightbox() {
    lightbox.style.display = "none";
  }

  function showPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      lightboxImg.src = frameBlobs[currentIndex].url;
    }
  }
  function showNext() {
    if (currentIndex < frameBlobs.length - 1) {
      currentIndex++;
      lightboxImg.src = frameBlobs[currentIndex].url;
    }
  }

  prevBtn.addEventListener("click", showPrev);
  nextBtn.addEventListener("click", showNext);
  closeBtn.addEventListener("click", closeLightbox);
  downloadCurrent.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = frameBlobs[currentIndex];
    a.download = `frame_${currentIndex}.png`;
    a.click();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.style.display !== "flex") return;
    if (e.key === "ArrowLeft") showPrev();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "Escape") closeLightbox();
  });
});
