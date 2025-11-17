import React, { useState, useCallback, useRef, useEffect } from 'react';
import { performVirtualTryOn, generateGarmentRecommendations, getGarmentDetails, getStyleComparison } from '../services/geminiService';
import Spinner from './common/Spinner';
import { User, UploadCloud, Wand2, AlertTriangle, Sparkles, RefreshCw, CheckCircle, Camera, X } from 'lucide-react';
import FloatingChatBubble from './chat/FloatingChatBubble';
import { getFriendlyErrorMessage, FriendlyError } from './common/errorHandler';
import type { RecommendationItem } from '../types';

type TryOnStep = 'UPLOAD_PERSON' | 'SET_PREFERENCES' | 'GENERATING_GARMENTS' | 'CHOOSE_GARMENT' | 'PERFORMING_TRYON' | 'SHOW_RESULT';

interface ImageState {
    preview: string;
    base64: string;
    width: number;
    height: number;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const PrimaryButton = ({ children, onClick, type = 'button', disabled = false }: { children: React.ReactNode, onClick?: () => void, type?: 'button' | 'submit', disabled?: boolean }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center justify-center px-8 py-3 bg-amber-500 text-gray-900 font-bold rounded-lg hover:bg-amber-400 focus:ring-4 focus:outline-none focus:ring-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
    >
        <div className="flex items-center justify-center gap-2">
            {children}
        </div>
    </button>
);

const TryOnComparisonView = ({ originalImage, resultImage }: { originalImage: string; resultImage: string | null }) => (
    <div className="grid grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
        <div className="text-center">
            <h4 className="text-lg font-semibold mb-2 text-gray-400">Before</h4>
            <div className="relative w-full bg-black/30 p-2 border border-white/10 rounded-lg">
                <img src={originalImage} alt="Original photo" className="w-full h-auto rounded-md" />
            </div>
        </div>
        <div className="text-center">
            <h4 className="text-lg font-semibold mb-2 text-gray-400">After</h4>
            <div className="relative w-full bg-black/30 p-2 border border-white/10 rounded-lg">
                {resultImage && <img src={`data:image/png;base64,${resultImage}`} alt="Virtual try-on result" className="w-full h-auto rounded-md" />}
            </div>
        </div>
    </div>
);

const VirtualTryOn: React.FC = () => {
    const [step, setStep] = useState<TryOnStep>('UPLOAD_PERSON');
    const [personImage, setPersonImage] = useState<ImageState | null>(null);
    const [capturedImage, setCapturedImage] = useState<ImageState | null>(null);
    const [preferences, setPreferences] = useState({ style: 'Casual', colors: 'Neutral Tones', occasion: 'Weekend Outing' });
    const [recommendedGarments, setRecommendedGarments] = useState<string[]>([]);
    const [recommendedGarmentDetails, setRecommendedGarmentDetails] = useState<RecommendationItem[]>([]);
    const [selectedGarment, setSelectedGarment] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [styleComparisonText, setStyleComparisonText] = useState<string | null>(null);
    const [error, setError] = useState<FriendlyError | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let stream: MediaStream | null = null;
        if (isCameraOpen) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
                .then(s => {
                    stream = s;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.error("Error accessing camera:", err);
                    setError({ title: 'Camera Access Denied', message: 'Could not access the camera. Please ensure you have granted permission in your browser settings and try again.' });
                    setIsCameraOpen(false);
                });
        }
    
        return () => { // Cleanup function
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isCameraOpen]);

    const handlePersonImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            const base64 = await fileToBase64(file);
            
            const img = new Image();
            img.onload = () => {
                setPersonImage({ 
                    preview: previewUrl, 
                    base64, 
                    width: img.width, 
                    height: img.height 
                });
            };
            img.src = previewUrl;
            
            setError(null);
        }
    }, []);

    const handleCapture = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // Flip the image horizontally for a mirror effect, which is more intuitive for selfies
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            const dataUrl = canvas.toDataURL('image/jpeg');
            const base64 = dataUrl.split(',')[1];
            setCapturedImage({ 
                preview: dataUrl, 
                base64,
                width: canvas.width,
                height: canvas.height
            });
        }
    }, [videoRef, canvasRef]);
    
    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleConfirmCapture = () => {
        if (capturedImage) {
            setPersonImage(capturedImage);
            setIsCameraOpen(false);
            setCapturedImage(null);
            setError(null);
        }
    };
    
    const handleCancelCamera = () => {
        setIsCameraOpen(false);
        setCapturedImage(null);
    };

    const handlePreferencesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPreferences(prev => ({ ...prev, [name]: value }));
    };

    const playSuccessSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) {
            console.warn("Web Audio API is not supported in this browser.");
            return;
        }

        // Resume context on user interaction, which is a common requirement for audio to play.
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5 - a clear, pleasant note

        // Create a short "ping" sound with a decay
        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0.5, now); // A good volume
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        oscillator.start(now);
        oscillator.stop(now + 0.4);
    };

    const playBopSound = () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) {
            console.warn("Web Audio API is not supported in this browser.");
            return;
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220.00, audioContext.currentTime); // A3 - a lower, "bop" sound

        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0.6, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);
    };

    const handleGetRecommendations = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep('GENERATING_GARMENTS');
        setError(null);
        try {
            let aspectRatio = '1:1'; // Default aspect ratio
            if (personImage && personImage.width && personImage.height) {
                const { width, height } = personImage;
                const ratio = width / height;
    
                const supportedRatios: { [key: string]: number } = {
                    '1:1': 1,
                    '4:3': 4 / 3,
                    '3:4': 3 / 4,
                    '16:9': 16 / 9,
                    '9:16': 9 / 16,
                };
    
                let closestRatioKey = '1:1';
                let minDiff = Infinity;
    
                for (const key in supportedRatios) {
                    const diff = Math.abs(ratio - supportedRatios[key]);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestRatioKey = key;
                    }
                }
                aspectRatio = closestRatioKey;
            }

            const [garments, details] = await Promise.all([
                generateGarmentRecommendations(preferences, aspectRatio),
                getGarmentDetails(preferences)
            ]);
            setRecommendedGarments(garments);
            setRecommendedGarmentDetails(details);
            playSuccessSound();
            setStep('CHOOSE_GARMENT');
        } catch (e) {
            setError(getFriendlyErrorMessage(e));
            setStep('SET_PREFERENCES');
        }
    };

    const handlePerformTryOn = async () => {
        if (!personImage || !selectedGarment) {
            setError({ title: 'Missing Selection', message: 'Please select a person image and a garment before trying it on.' });
            return;
        }
        setStep('PERFORMING_TRYON');
        setError(null);
        setResultImage(null);
        setStyleComparisonText(null);

        try {
            // First, perform the try-on to get the new image
            const tryOnResult = await performVirtualTryOn({
                personImage: personImage.base64,
                garmentImage: selectedGarment,
                width: personImage.width,
                height: personImage.height
            });
            setResultImage(tryOnResult); // Set it so the loading message can change

            // Second, get the comparison text using the new image
            const comparisonText = await getStyleComparison(personImage.base64, tryOnResult);
            setStyleComparisonText(comparisonText);
            
            playBopSound();

            // Finally, move to the results page
            setStep('SHOW_RESULT');
        } catch (e) {
            setError(getFriendlyErrorMessage(e));
            setStep('CHOOSE_GARMENT');
        }
    };

    const handleStartOver = () => {
        setStep('UPLOAD_PERSON');
        setPersonImage(null);
        setRecommendedGarments([]);
        setRecommendedGarmentDetails([]);
        setSelectedGarment(null);
        setResultImage(null);
        setStyleComparisonText(null);
        setError(null);
        setIsCameraOpen(false);
        setCapturedImage(null);
    };

    const renderContent = () => {
        switch (step) {
            case 'UPLOAD_PERSON':
                if (isCameraOpen) {
                    return (
                        <div className="fade-in w-full max-w-lg mx-auto text-center">
                            <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden border border-white/10 mb-4">
                                {capturedImage ? (
                                    <img src={capturedImage.preview} alt="Captured photo" className="w-full h-full object-cover" />
                                ) : (
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                                )}
                            </div>
                            <div className="flex justify-center gap-4">
                                {capturedImage ? (
                                    <>
                                        <PrimaryButton onClick={handleConfirmCapture}>
                                            <CheckCircle size={18} /> Use Photo
                                        </PrimaryButton>
                                        <button onClick={handleRetake} className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                                            <RefreshCw className="w-4 h-4" /> Retake
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <PrimaryButton onClick={handleCapture}>
                                            <Camera size={18} /> Capture Photo
                                        </PrimaryButton>
                                        <button onClick={handleCancelCamera} className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                                            <X className="w-4 h-4" /> Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                    );
                }

                 if (!personImage) {
                    return (
                        <div className="text-center p-8 bg-black/20 rounded-lg border-2 border-dashed border-white/20">
                            <User size={48} className="mx-auto mb-4 text-gray-500" />
                            <h3 className="text-xl font-semibold text-amber-400">Step 1: Provide Your Photo</h3>
                            <p className="mt-2 max-w-md mx-auto text-gray-400">Upload a clear, full-body photo or use your camera to take a new one.</p>
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <label htmlFor="person-upload" className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-bold rounded-lg gap-2 hover:bg-white/20 transition-colors">
                                    <UploadCloud size={18} />
                                    <span>Upload Image</span>
                                </label>
                                <button onClick={() => setIsCameraOpen(true)} className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-bold rounded-lg gap-2 hover:bg-white/20 transition-colors">
                                    <Camera size={18} />
                                    <span>Use Camera</span>
                                </button>
                            </div>
                            <input id="person-upload" type="file" className="hidden" accept="image/*" onChange={handlePersonImageUpload} />
                        </div>
                    );
                } else {
                    return (
                        <div className="fade-in text-center p-8 bg-black/20 rounded-lg border border-white/10">
                            <h3 className="text-xl font-semibold mb-4 text-amber-400">Your Photo Preview</h3>
                            <img src={personImage.preview} alt="Your photo preview" className="rounded-lg object-contain h-64 w-auto mx-auto border border-white/10 p-2 bg-black/20 mb-6" />
                            <div className="flex justify-center items-center gap-4">
                                <label htmlFor="person-upload-change" className="px-6 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                    <RefreshCw className="w-4 h-4" /> Change Photo
                                </label>
                                <input id="person-upload-change" type="file" className="hidden" accept="image/*" onChange={handlePersonImageUpload} />
                                <PrimaryButton onClick={() => setStep('SET_PREFERENCES')}>
                                    <CheckCircle className="w-5 h-5" /> Confirm & Continue
                                </PrimaryButton>
                            </div>
                        </div>
                    );
                }
            
            case 'SET_PREFERENCES':
                return (
                    <div className="fade-in w-full">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-full md:w-1/3 flex-shrink-0">
                                <img src={personImage!.preview} alt="Your photo" className="rounded-lg object-contain h-80 w-full border border-white/10 p-2 bg-black/20" />
                            </div>
                            <form onSubmit={handleGetRecommendations} className="w-full md:w-2/3 p-6 bg-black/20 rounded-lg space-y-4 border border-white/10">
                                <h3 className="text-xl font-semibold text-center text-amber-400">Step 2: Define Your Style</h3>
                                {['style', 'colors', 'occasion'].map((pref) => (
                                     <div key={pref}>
                                        <label htmlFor={pref} className="block text-sm font-medium text-gray-300 mb-1 capitalize">{pref}</label>
                                        <select name={pref} id={pref} value={preferences[pref as keyof typeof preferences]} onChange={handlePreferencesChange} className="w-full bg-gray-800 border-gray-700 rounded-md text-white p-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                                            { pref === 'style' && <><option>Casual</option><option>Formal</option><option>Streetwear</option><option>Bohemian</option><option>Minimalist</option><option>Athleisure</option><option>Vintage</option><option>Preppy</option><option>Grunge</option><option>Artsy</option></> }
                                            { pref === 'colors' && <><option>Neutral Tones</option><option>Pastels</option><option>Earthy Tones</option><option>Bright & Bold</option><option>Jewel Tones</option><option>Monochromatic</option><option>Cool Tones</option><option>Warm Tones</option><option>Muted Tones</option></> }
                                            { pref === 'occasion' && <><option>Weekend Outing</option><option>Office / Work</option><option>Formal Event</option><option>Date Night</option><option>Workout / Gym</option><option>Beach Vacation</option><option>Casual Hangout</option><option>Music Festival</option><option>Wedding Guest</option><option>Travel</option></> }
                                        </select>
                                    </div>
                                ))}
                                <div className="text-center pt-2">
                                    <PrimaryButton type="submit">
                                        <Sparkles className="w-5 h-5" /> Get Recommendations
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                );

            case 'GENERATING_GARMENTS':
                return (
                    <div className="fade-in text-center w-full max-w-3xl mx-auto">
                        <h3 className="text-xl font-semibold text-amber-400">Generating Your Recommendations...</h3>
                        <p className="mt-2 mb-6 text-gray-400">Our AI stylist is curating a selection of shirts just for you.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, index) => (
                                <div key={index} className="relative aspect-[3/4] bg-gray-800/50 animate-pulse rounded-lg flex items-center justify-center p-4 border border-white/10">
                                   <div className="flex flex-col items-center justify-center gap-4 text-amber-400/50">
                                       <Sparkles className="w-10 h-10" />
                                       <p className="text-sm font-medium">Curating...</p>
                                   </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'PERFORMING_TRYON': {
                const aspectRatio = personImage ? personImage.height / personImage.width * 100 : 133.33; // Default to a 3:4 aspect ratio
                return (
                    <div className="fade-in text-center w-full">
                        <h3 className="text-xl font-semibold mt-4 text-amber-400">
                            {resultImage ? 'Analyzing Your New Look...' : 'Creating Your Virtual Try-On...'}
                        </h3>
                        <p className="mt-2 mb-6 text-gray-400">This is where the magic happens! Please wait a moment.</p>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-4xl mx-auto">
                            <div className="text-center">
                                <h4 className="text-lg font-semibold mb-2 text-gray-400">Before</h4>
                                <div className="relative w-full bg-black/30 p-2 border border-white/10 rounded-lg">
                                    <img src={personImage!.preview} alt="Original photo" className="w-full h-auto rounded-md" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h4 className="text-lg font-semibold mb-2 text-gray-400">After</h4>
                                <div className="relative w-full bg-black/30 p-2 border border-white/10 rounded-lg">
                                    <div className="relative w-full overflow-hidden rounded-md" style={{ paddingTop: `${aspectRatio}%` }}>
                                        <div className="absolute inset-0 bg-gray-800/50 animate-pulse flex flex-col items-center justify-center gap-2 text-amber-400/50 border border-white/10 rounded-md">
                                            <Wand2 className="w-8 h-8" />
                                            <p className="text-sm font-medium">Applying Style...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            case 'CHOOSE_GARMENT':
                return (
                    <div className="fade-in text-center">
                        <h3 className="text-xl font-semibold mb-4 text-amber-400">Step 3: Choose Your Favorite Shirt</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {recommendedGarments.map((garment, index) => {
                                const detail = recommendedGarmentDetails[index];
                                return (
                                <div key={index} className="relative group">
                                <button onClick={() => setSelectedGarment(garment)} className={`p-2 rounded-lg border-2 w-full transition-all duration-300 ${selectedGarment === garment ? 'border-amber-500' : 'border-white/10 hover:border-white/30'}`}>
                                    <img src={`data:image/png;base64,${garment}`} alt={`Recommended Garment ${index + 1}`} className="w-full h-auto object-contain rounded-md bg-white"/>
                                </button>
                                {selectedGarment === garment && (
                                    <div className="absolute top-2 right-2 bg-amber-500 text-gray-900 rounded-full p-1">
                                        <CheckCircle size={16} />
                                    </div>
                                )}
                                {detail && (
                                    <div className="absolute bottom-full mb-2 w-max max-w-full p-2 bg-black/70 backdrop-blur-sm border border-white/10 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-left z-10 left-1/2 -translate-x-1/2">
                                        <p className="font-bold whitespace-nowrap">{detail.itemName}</p>
                                        <p className="text-gray-300 whitespace-nowrap">{detail.styleCategory}</p>
                                    </div>
                                )}
                                </div>
                            )})}
                        </div>
                        {selectedGarment && (
                             <div className="mt-8">
                                <PrimaryButton onClick={handlePerformTryOn}>
                                    <Wand2 className="w-6 h-6" /> Try It On
                                </PrimaryButton>
                             </div>
                        )}
                    </div>
                );

            case 'SHOW_RESULT':
                return (
                    <div className="fade-in text-center w-full">
                        <h3 className="text-2xl font-bold mb-2 text-amber-400">Here's Your OOTD!</h3>
                        {styleComparisonText && (
                            <p className="text-xl text-white mb-6 max-w-2xl mx-auto font-medium p-4 bg-black/20 rounded-lg border border-white/10">"{styleComparisonText}"</p>
                        )}
                        <TryOnComparisonView originalImage={personImage!.preview} resultImage={resultImage} />
                    </div>
                );
        }
    };
    
    return (
        <div className="max-w-5xl mx-auto">
            {error && (
                <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-left flex items-start gap-3">
                    <div className="flex-shrink-0 pt-1">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white">{error.title}</h4>
                        <p className="text-sm">{error.message}</p>
                    </div>
                </div>
            )}
            
            <div className="min-h-[400px] flex items-center justify-center">
                {renderContent()}
            </div>
            
            {step !== 'UPLOAD_PERSON' && (
                 <div className="text-center mt-8">
                    <button onClick={handleStartOver} className="px-6 py-2 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 mx-auto">
                        <RefreshCw className="w-4 h-4" /> Start Over
                    </button>
                </div>
            )}
            <FloatingChatBubble />
        </div>
    );
};

export default VirtualTryOn;