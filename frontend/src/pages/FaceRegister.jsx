import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { faceAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CameraIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Define the steps for capturing images to guide the user
const captureSteps = [
  { prompt: "Look directly at the camera", instruction: "Center your face in the frame." },
  { prompt: "Turn your head slightly to the left", instruction: "Keep your eyes on the camera." },
  { prompt: "Turn your head slightly to the right", instruction: "This helps capture all angles." },
];

const FaceRegister = () => {
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0); // Index for captureSteps array
  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const webcamRef = useRef(null);
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  // Captures a single image and advances to the next step
  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      setCapturedImages([...capturedImages, imageSrc]);
      if (currentStep < captureSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Resets the entire process
  const startOver = () => {
    setCapturedImages([]);
    setCurrentStep(0);
    setIsSuccess(false);
  };

  // Uploads the array of captured images to the backend
  const uploadImages = async () => {
    if (capturedImages.length !== captureSteps.length) return;

    setUploading(true);
    try {
      // 'capturedImages' is already an array of base64 strings, which is what the backend expects.
      await faceAPI.registerFace(capturedImages);
      await fetchUser(); // Re-fetch user data to update registration status
      setIsSuccess(true);
      toast.success('Face registered successfully!');
    } catch (error) {
      console.error('Failed to register face:', error);
      // Error is handled by the axios interceptor, but we reset the UI
      startOver();
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

  const isCaptureComplete = capturedImages.length === captureSteps.length;

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
              To ensure accuracy, we need to capture your face from a few different angles.
            </p>
          </motion.div>

          <div className="flex justify-center">
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/30 backdrop-blur-md border border-white/40 rounded-3xl p-8 shadow-2xl max-w-2xl w-full"
            >
              {isSuccess ? (
                // --- SUCCESS SCREEN ---
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                    <CheckCircleIcon className="w-12 h-12 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h3>
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
              ) : (
                // --- CAPTURE & PREVIEW SCREEN ---
                <div className="text-center space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {isCaptureComplete ? "Confirm Your Images" : `Step ${currentStep + 1}: ${captureSteps[currentStep].prompt}`}
                  </h3>

                  {/* Camera or Preview Grid */}
                  <div className="relative inline-block w-full">
                    {isCaptureComplete ? (
                      <div className="grid grid-cols-3 gap-4">
                        {capturedImages.map((img, index) => (
                          <img key={index} src={img} alt={`Capture ${index + 1}`} className="rounded-lg shadow-md border-2 border-white" />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl overflow-hidden border-4 border-white shadow-lg max-w-lg mx-auto">
                        <Webcam
                          ref={webcamRef}
                          audio={false}
                          height={480}
                          width={640}
                          screenshotFormat="image/jpeg"
                          videoConstraints={videoConstraints}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Instructions & Actions */}
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      {isCaptureComplete ? "Does this set of images clearly show your face?" : captureSteps[currentStep].instruction}
                    </p>

                    {isCaptureComplete ? (
                      // --- CONFIRMATION BUTTONS ---
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={startOver}
                          disabled={uploading}
                          className="inline-flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                        >
                          <ArrowPathIcon className="w-5 h-5" />
                          <span>Start Over</span>
                        </button>
                        <button
                          onClick={uploadImages}
                          disabled={uploading}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? 'Uploading...' : 'Confirm and Upload'}
                        </button>
                      </div>
                    ) : (
                      // --- CAPTURE BUTTON ---
                      <button
                        onClick={captureImage}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105"
                      >
                        <CameraIcon className="w-5 h-5" />
                        <span>{`Capture Image ${currentStep + 1} of ${captureSteps.length}`}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FaceRegister;