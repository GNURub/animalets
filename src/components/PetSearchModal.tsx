import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';

interface Pet {
    id: string;
    name: string;
    species: string;
    size: string;
    breed?: string;
    owner_id: string | null;
    weight?: number;
    gender?: string;
}

interface Service {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
}

interface CreatePetData {
    name: string;
    species: 'dog' | 'cat' | 'other';
    size: 'pequeño' | 'mediano' | 'grande';
    breed?: string;
    gender?: 'macho' | 'hembra';
    notes?: string;
    weight?: number;
}

interface PetSearchModalProps {
    isOpen: boolean;
    onSelectPet: (pet: Pet) => void;
    onCreatePet: (pet: CreatePetData) => void;
    services: Service[];
    isLoading?: boolean;
}


// @ts-ignore - Preact compat works fine
const PetSearchModal: FC<PetSearchModalProps> = ({
    isOpen,
    onSelectPet,
    onCreatePet,
    services,
    isLoading = false,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Pet[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creatingPet, setCreatingPet] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [formData, setFormData] = useState<CreatePetData>({
        name: '',
        species: 'dog',
        size: 'mediano',
        breed: '',
        gender: 'macho',
        notes: '',
    });

    // Buscar mascotas con debounce
    const handleSearch = (q: string) => {
        setSearchQuery(q);

        // Limpiar el timeout anterior
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!q.trim()) {
            setSearchResults([]);
            return;
        }

        // Debounce: esperar 300ms sin que el usuario escriba antes de hacer la petición
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await fetch(`/api/pets/search?q=${encodeURIComponent(q)}`);
                if (!response.ok) throw new Error('Error en búsqueda');

                const results = await response.json();
                setSearchResults(results);
            } catch (error) {
                console.error('Error al buscar mascotas:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    // Limpiar timeout al desmontar
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Crear mascota nueva
    const handleCreatePet = async () => {
        if (!formData.name || !formData.species || !formData.size) {
            alert('Nombre, especie y tamaño son requeridos');
            return;
        }

        setCreatingPet(true);
        try {
            const response = await fetch('/api/pets/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Error al crear mascota');
            }

            const newPet = await response.json();
            onCreatePet(formData);

            // Reset del formulario
            setFormData({
                name: '',
                species: 'dog',
                size: 'mediano',
                breed: '',
                gender: 'macho',
                notes: '',
            });
            setShowCreateForm(false);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error:', error);
            alert(`Error al crear mascota: ${error instanceof Error ? error.message : 'Desconocido'}`);
        } finally {
            setCreatingPet(false);
        }
    };

    const speciesEmoji = {
        dog: '🐕',
        cat: '🐈',
        other: '🐾',
    };

    return (
        <div class="space-y-4 border-t pt-4">
            <h3 class="font-semibold text-gray-700">Buscar o Crear Mascota</h3>

            {!showCreateForm ? (
                <>
                    {/* Campo de búsqueda */}
                    <div>
                        <label class="label">Nombre de la Mascota</label>
                        <input
                            ref={searchInputRef}
                            type="text"
                            class="input w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
                            placeholder="Ej: Fluffy, Mimi, Rex..."
                            value={searchQuery}
                            onChange={(e) => handleSearch((e.target as HTMLInputElement).value)}
                            disabled={isSearching || isLoading}
                        />
                    </div>

                    {/* Resultados de búsqueda */}
                    {isSearching && (
                        <div class="text-center text-sm text-gray-500">Buscando...</div>
                    )}

                    {!isSearching && searchQuery && searchResults.length === 0 && (
                        <div class="rounded-lg bg-blue-50 p-3 text-center text-sm text-blue-700">
                            No se encontraron mascotas con ese nombre
                        </div>
                    )}

                    {!isSearching && searchResults.length > 0 && (
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            <label class="text-sm font-medium text-gray-600">Mascotas encontradas:</label>
                            {searchResults.map((pet) => (
                                <button
                                    key={pet.id}
                                    onClick={() => onSelectPet(pet)}
                                    class="w-full rounded-lg border-2 border-gray-200 bg-white p-3 text-left transition-colors hover:border-blue-500 hover:bg-blue-50"
                                    disabled={isLoading}
                                >
                                    <div class="flex items-center gap-2">
                                        <span class="text-xl">
                                            {speciesEmoji[pet.species as keyof typeof speciesEmoji] || '🐾'}
                                        </span>
                                        <div class="flex-1">
                                            <p class="font-medium text-gray-900">{pet.name}</p>
                                            <p class="text-xs text-gray-500">
                                                {pet.breed && `${pet.breed} • `}
                                                {pet.size}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Botón crear nueva */}
                    <button
                        onClick={() => setShowCreateForm(true)}
                        class="btn btn-secondary w-full"
                        disabled={isLoading}
                    >
                        ➕ Crear Nueva Mascota
                    </button>
                </>
            ) : (
                <>
                    {/* Formulario crear mascota */}
                    <div class="space-y-3 rounded-lg bg-gray-50 p-3">
                        <h4 class="font-medium text-gray-700">Datos de la Nueva Mascota</h4>

                        {/* Nombre */}
                        <div>
                            <label class="text-xs font-medium text-gray-600">Nombre *</label>
                            <input
                                type="text"
                                class="input mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                placeholder="Ej: Fluffy"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: (e.target as HTMLInputElement).value })
                                }
                                disabled={creatingPet}
                            />
                        </div>

                        {/* Especie y Tamaño */}
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-xs font-medium text-gray-600">Especie *</label>
                                <select
                                    class="input mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                    value={formData.species}
                                    onChange={(e) =>
                                        setFormData({ ...formData, species: (e.target as HTMLSelectElement).value as any })
                                    }
                                    disabled={creatingPet}
                                >
                                    <option value="dog">🐕 Perro</option>
                                    <option value="cat">🐈 Gato</option>
                                    <option value="other">🐾 Otro</option>
                                </select>
                            </div>

                            <div>
                                <label class="text-xs font-medium text-gray-600">Tamaño *</label>
                                <select
                                    class="input mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                    value={formData.size}
                                    onChange={(e) =>
                                        setFormData({ ...formData, size: (e.target as HTMLSelectElement).value as any })
                                    }
                                    disabled={creatingPet}
                                >
                                    <option value="pequeño">Pequeño</option>
                                    <option value="mediano">Mediano</option>
                                    <option value="grande">Grande</option>
                                </select>
                            </div>
                        </div>

                        {/* Raza y Género */}
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="text-xs font-medium text-gray-600">Raza</label>
                                <input
                                    type="text"
                                    class="input mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                    placeholder="Ej: Poodle"
                                    value={formData.breed || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, breed: (e.target as HTMLInputElement).value })
                                    }
                                    disabled={creatingPet}
                                />
                            </div>

                            <div>
                                <label class="text-xs font-medium text-gray-600">Género</label>
                                <select
                                    class="input mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                    value={formData.gender || ''}
                                    onChange={(e) =>
                                        setFormData({ ...formData, gender: (e.target as HTMLSelectElement).value as any })
                                    }
                                    disabled={creatingPet}
                                >
                                    <option value="">No especificado</option>
                                    <option value="macho">Macho</option>
                                    <option value="hembra">Hembra</option>
                                </select>
                            </div>
                        </div>

                        {/* Notas */}
                        <div>
                            <label class="text-xs font-medium text-gray-600">Notas</label>
                            <textarea
                                class="input mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                                placeholder="Ej: Miedoso, no le gusta el agua..."
                                rows={2}
                                value={formData.notes || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: (e.target as HTMLTextAreaElement).value })
                                }
                                disabled={creatingPet}
                            />
                        </div>

                        {/* Botones */}
                        <div class="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowCreateForm(false)}
                                class="btn btn-secondary flex-1 text-sm"
                                disabled={creatingPet}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreatePet}
                                class="btn btn-primary flex-1 text-sm disabled:opacity-50"
                                disabled={creatingPet || !formData.name}
                            >
                                {creatingPet ? 'Creando...' : 'Crear Mascota'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PetSearchModal;
