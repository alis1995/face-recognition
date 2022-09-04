import React, { useEffect, useRef, useState } from "react";
import * as faceApi from "face-api.js";

const ShowWebcam = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoHeight = 240;
  const videoWidth = 320;

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "../models";
      Promise.all([
        faceApi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceApi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceApi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceApi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]).then(() => {
        setModelsLoaded(true);
      });
    };
    loadModels();
  }, [modelsLoaded]);

  const startVideo = () => {
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        let video: any = videoRef.current; //fix this!! do not use any
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error("error:", err);
      });
  };

  const handleVideoOnPlay = () => {
    if (videoRef.current) {
      const canvas = faceApi.createCanvas(videoRef.current);
      const displaySize = {
        width: videoWidth,
        height: videoHeight,
      };

      canvas.classList.add("abs");
      canvas.style.zIndex = "1";

      document.getElementById("container")?.append(canvas);

      setInterval(async () => {
        faceApi.matchDimensions(canvas, displaySize);
        const detections = await faceApi
          .detectAllFaces(
            videoRef.current!,
            new faceApi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const resizedDetections = faceApi.resizeResults(
          detections,
          displaySize
        );

        canvas.getContext("2d")!.clearRect(0, 0, videoWidth, videoHeight);

        faceApi.draw.drawDetections(canvas, resizedDetections);

        faceApi.draw.drawFaceLandmarks(canvas, resizedDetections);

        faceApi.draw.drawFaceExpressions(canvas, resizedDetections);
      }, 100);
    }
  };

  const closeWebcam = () => {
    if (videoRef && videoRef.current) {
      videoRef.current.pause();
      (videoRef.current.srcObject! as MediaStream).getTracks()[0].stop();
    }
    document.getElementById("container")?.lastChild?.remove();
    setCaptureVideo(false);
  };

  return (
    <div className="absolute w-[50vw] h-[50vh] rounded-lg top-[calc(50%-25vh)] left-[calc(50%-25vw)] bg-white">
      {captureVideo ? (
        modelsLoaded ? (
          <div className="vd-container" id="container">
            <video
              ref={videoRef}
              height={videoHeight}
              width={videoWidth}
              onPlay={handleVideoOnPlay}
              className="abs"
            />
          </div>
        ) : (
          <div>loading...</div>
        )
      ) : (
        <div className="vd-container"></div>
      )}
      <div className="bt-container">
        {captureVideo && modelsLoaded ? (
          <button onClick={closeWebcam} className="bottom">
            Close Webcam
          </button>
        ) : (
          <button onClick={startVideo} className="bottom">
            Open Webcam
          </button>
        )}
      </div>
    </div>
  );
};

export default ShowWebcam;
