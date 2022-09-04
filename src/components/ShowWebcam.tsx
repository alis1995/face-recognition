import { useEffect, useRef, useState } from "react";
import * as faceApi from "face-api.js";

const ShowWebcam = () => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoHeight = 480;
  const videoWidth = 640;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      .getUserMedia({ video: { width: 300 } })
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
    setInterval(async () => {
      if (canvasRef && canvasRef.current && videoRef.current && captureVideo) {
        canvasRef.current = faceApi.createCanvasFromMedia(videoRef.current);
        const displaySize = {
          width: videoWidth,
          height: videoHeight,
        };

        faceApi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceApi
          .detectAllFaces(
            videoRef.current,
            new faceApi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const resizedDetections = faceApi.resizeResults(
          detections,
          displaySize
        );

        canvasRef &&
          canvasRef.current &&
          canvasRef.current
            .getContext("2d")!
            .clearRect(0, 0, videoWidth, videoHeight);
        canvasRef &&
          canvasRef.current &&
          faceApi.draw.drawDetections(canvasRef.current, resizedDetections);
        canvasRef &&
          canvasRef.current &&
          faceApi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        canvasRef &&
          canvasRef.current &&
          faceApi.draw.drawFaceExpressions(
            canvasRef.current,
            resizedDetections
          );

        // if (canvasRef && canvasRef.current) {
        //   canvasRef.current
        //     .getContext("2d")!
        //     .clearRect(0, 0, videoWidth, videoHeight);

        //   faceApi.draw.drawDetections(canvasRef.current, resizedDetections);

        //   faceApi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);

        //   faceApi.draw.drawFaceExpressions(
        //     canvasRef.current,
        //     resizedDetections
        //   );
        // }
      }
    }, 100);
  };

  const closeWebcam = () => {
    if (videoRef && videoRef.current) {
      videoRef.current.pause();
      (videoRef.current.srcObject! as MediaStream).getTracks()[0].stop();
    }
    setCaptureVideo(false);
  };

  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px" }}>
        {captureVideo && modelsLoaded ? (
          <button
            onClick={closeWebcam}
            className="cursor-pointer bg-slate-50 text-neutral-800 text-[25px] rounded-md p-6"
          >
            Close Webcam
          </button>
        ) : (
          <button
            onClick={startVideo}
            className="cursor-pointer bg-slate-50 text-neutral-800 text-[25px] rounded-md p-6"
          >
            Open Webcam
          </button>
        )}
      </div>
      {captureVideo ? (
        modelsLoaded ? (
          <div className="relative flex items-center justify-center p-10 bg-green-400">
            <video
              ref={videoRef}
              height={videoHeight}
              width={videoWidth}
              onPlay={handleVideoOnPlay}
              className="absolute top-0 left-0"
            />
            {captureVideo && (
              <canvas
                ref={canvasRef}
                width={videoWidth}
                height={videoHeight}
                className="absolute top-0 left-0 z-10 border-4 border-red-300"
              />
            )}
          </div>
        ) : (
          <div>loading...</div>
        )
      ) : (
        <></>
      )}
    </div>
  );
};

export default ShowWebcam;
