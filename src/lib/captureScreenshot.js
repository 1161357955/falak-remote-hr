export function captureScreenshot() {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((r) => setTimeout(r, 300));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      stream.getTracks().forEach((t) => t.stop());
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("فشل التقاط لقطة الشاشة"));
          return;
        }
        resolve(new File([blob], `screenshot-${Date.now()}.png`, { type: "image/png" }));
      }, "image/png");
    } catch (err) {
      reject(err);
    }
  });
}