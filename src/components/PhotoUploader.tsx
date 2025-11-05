import { signal } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';

interface PhotoUploaderProps {
    onPhotoUpload: (url: string) => void;
    currentPhoto?: string;
    petName?: string;
}

const photoUploading = signal(false);
const photoPreview = signal<string | null>(null);
const showCameraModal = signal(false);

const PhotoUploader: FunctionalComponent<PhotoUploaderProps> = ({
    onPhotoUpload,
    currentPhoto,
    petName = 'mascota',
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [useLegacyCamera, setUseLegacyCamera] = useState(false);

    const handleFileSelect = async (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        // Validar archivo localmente
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError('Tipo de archivo no permitido. Use JPEG, PNG o WebP');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Archivo muy grande. Máximo 5MB');
            return;
        }

        // Mostrar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            photoPreview.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);

        // Subir archivo
        photoUploading.value = true;
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/pets/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al subir imagen');
            }

            const { url } = await response.json();
            onPhotoUpload(url);
            setError(null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Error al subir imagen'
            );
            photoPreview.value = null;
        } finally {
            photoUploading.value = false;
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const displayPhoto = currentPhoto || photoPreview.value;

    const openCamera = async () => {
        try {
            // Intentar usar getUserMedia para acceso a cámara
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Cámara trasera
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                showCameraModal.value = true;
                setUseLegacyCamera(false);
            }
        } catch (err) {
            // Si falla, usar input de cámara legacy (funciona mejor en algunos móviles)
            setUseLegacyCamera(true);
            cameraInputRef.current?.click();
        }
    };

    const takePicture = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);

                // Convertir canvas a blob
                canvasRef.current.toBlob(async (blob) => {
                    if (blob) {
                        const file = new File([blob], `camera-${Date.now()}.jpeg`, {
                            type: 'image/jpeg',
                        });

                        // Simular evento de archivo
                        const fakeEvent = {
                            target: { files: [file] },
                        } as unknown as Event;

                        await handleFileSelect(fakeEvent);
                        closeCamera();
                    }
                }, 'image/jpeg', 0.9);
            }
        }
    };

    const closeCamera = () => {
        showCameraModal.value = false;

        // Detener stream de video
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleCameraInput = async (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];

        if (file) {
            const fakeEvent = {
                target: { files: [file] },
            } as unknown as Event;

            await handleFileSelect(fakeEvent);
        }
    };

    return (
        <div class="space-y-2">
            <label class="label">Foto de la mascota</label>

            {displayPhoto && (
                <div class="mb-3 flex justify-center">
                    <img
                        src={displayPhoto}
                        alt={petName}
                        class="h-32 w-32 rounded-lg object-cover shadow"
                    />
                </div>
            )}

            <div
                class="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                    const files = e.dataTransfer?.files;
                    if (files?.length) {
                        const fakeEvent = {
                            target: { files },
                        } as unknown as Event;
                        handleFileSelect(fakeEvent);
                    }
                }}
            >
                <svg
                    class="mx-auto mb-2 h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                    />
                </svg>
                <p class="text-sm text-gray-600">
                    {photoUploading.value
                        ? 'Subiendo imagen...'
                        : 'Click o arrastra una imagen aquí'}
                </p>
                <p class="text-xs text-gray-500 mt-1">JPEG, PNG o WebP - Máx 5MB</p>
            </div>

            <div class="flex gap-2">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading.value}
                    class="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Galería
                </button>
                <button
                    type="button"
                    onClick={openCamera}
                    disabled={photoUploading.value}
                    class="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Cámara
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={photoUploading.value}
                class="hidden"
            />

            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraInput}
                disabled={photoUploading.value}
                class="hidden"
            />

            {/* Modal de cámara */}
            {showCameraModal.value && (
                <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
                    <div class="w-full max-w-md rounded-lg bg-white p-6">
                        <h3 class="mb-4 text-lg font-bold">Tomar Foto</h3>

                        <video
                            ref={videoRef}
                            autoplay
                            playsinline
                            class="mb-4 h-64 w-full rounded-lg bg-black object-cover"
                        />

                        <canvas ref={canvasRef} class="hidden" />

                        <div class="flex gap-3">
                            <button
                                type="button"
                                onClick={closeCamera}
                                class="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={takePicture}
                                class="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                            >
                                Capturar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div class="rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}
        </div>
    );
};

export default PhotoUploader;
