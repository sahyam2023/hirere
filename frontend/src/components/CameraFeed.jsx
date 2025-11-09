import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon } from '@heroicons/react/24/outline';

const CameraFeed = forwardRef(({ width = 200, height = 150, onCapture, className = "" }, ref) => {
  const webcamRef = useRef(null);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (onCapture) {
        onCapture(imageSrc);
      }
      return imageSrc;
    }
  }, [onCapture]);

  useImperativeHandle(ref, () => ({
    getScreenshot: () => {
      return webcamRef.current ? webcamRef.current.getScreenshot() : null;
    }
  }));

  const videoConstraints = {
    width: width,
    height: height,
    facingMode: "user"
  };

  return (
    <div className={`relative ${className}`}>
      <div className="rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-900">
        <Webcam
          ref={webcamRef}
          audio={false}
          width={width}
          height={height}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="absolute top-2 right-2">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      </div>
      
      {onCapture && (
        <button
          onClick={captureImage}
          className="absolute bottom-2 right-2 p-1 bg-white/80 hover:bg-white rounded-lg transition-colors duration-200"
          title="Capture Image"
        >
          <CameraIcon className="w-4 h-4 text-gray-700" />
        </button>
      )}
    </div>
  );
});

export default CameraFeed;