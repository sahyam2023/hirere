import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { faceAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CameraIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const FaceRegister = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1); // 1: capture, 2: preview, 3: success
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setStep(2);
  };

  const retakeImage = () => {
    setCapturedImage(null);
    setStep(1);
  };

  const uploadImage = async () => {
    if (!capturedImage) return;

    setUploading(true);
    try {
      // Convert base64 image to a File object
      const res = await fetch(capturedImage);
      const blob = await res.blob();
      const file = new File([blob], "face.jpeg", { type: "image/jpeg" });

      await faceAPI.registerFace(file);
      await fetchUser(); // Re-fetch user data
      setStep(3);
      toast.success('Face registered successfully');
    } catch (error) {
      console.error('Failed to register face:', error);
      // Error is handled by the axios interceptor
    } finally {
      setUploading(false);
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Face Verification Setup</h1>
            <p className="text-gray-600">
              Register your face for secure exam proctoring. This helps us verify your identity during exams.
            </p>
          </motion.div>

          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/30 backdrop-blur-md border border-white/40 rounded-3xl p-8 shadow-2xl max-w-2xl w-full"
            >
              {/* Step 1: Capture */}
              {step === 1 && (
                <div className="text-center space-y-6">
                  <div className="relative inline-block">
                    <div className="rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        height={480}
                        screenshotFormat="image/jpeg"
                        width={640}
                        videoConstraints={videoConstraints}
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-blue-800 font-medium">
                        📋 Please ensure:
                      </p>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>• Your face is clearly visible</li>
                        <li>• Good lighting conditions</li>
                        <li>• Look directly at the camera</li>
                        <li>• Remove sunglasses or hats</li>
                      </ul>
                    </div>

                    <button
                      onClick={captureImage}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <CameraIcon className="w-5 h-5" />
                      <span>Capture Image</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Preview */}
              {step === 2 && (
                <div className="text-center space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900">Preview & Confirm</h3>
                  
                  <div className="relative inline-block">
                    <img 
                      src={capturedImage} 
                      alt="Captured face" 
                      className="rounded-2xl border-4 border-white shadow-lg max-w-md w-full"
                    />
                  </div>

                  <p className="text-gray-600">
                    Does this image clearly show your face? This will be used for verification during exams.
                  </p>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={retakeImage}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                    >
                      Retake Photo
                    </button>
                    <button
                      onClick={uploadImage}
                      disabled={uploading}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Uploading...' : 'Upload Face'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center space-y-6"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                    <CheckCircleIcon className="w-12 h-12 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Face Registered Successfully!</h3>
                    <p className="text-gray-600">
                      Your face verification is now set up. You can proceed with taking proctored exams.
                    </p>
                  </div>

                  <button
                    onClick={goToDashboard}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Back to Dashboard
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaceRegister;