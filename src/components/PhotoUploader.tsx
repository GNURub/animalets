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

const PhotoUploader: FunctionalComponent<PhotoUploaderProps> = ({
    onPhotoUpload,
    currentPhoto,
    petName = 'mascota',
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

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

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={photoUploading.value}
                class="hidden"
            />

            {error && (
                <div class="rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}
        </div>
    );
};

export default PhotoUploader;
