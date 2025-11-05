import { signal } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';
import toast from 'react-hot-toast';
import { getBreeds } from '../utils/breedUtils';
import PhotoUploader from './PhotoUploader';
import SearchableSelect from './SearchableSelect';

interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: 'dog';
  breed: string | null;
  size: 'pequeño' | 'mediano' | 'grande';
  gender: 'macho' | 'hembra' | null;
  birth_date: string | null;
  weight: number | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
}

interface PetManagerProps {
  initialPets: Pet[];
  userId: string;
}

const showModal = signal(false);
const editingPet = signal<Pet | null>(null);
const isLoading = signal(false);

const PetManager: FunctionalComponent<PetManagerProps> = ({
  initialPets,
  userId,
}) => {
  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog' as 'dog',
    breed: '',
    size: 'mediano' as 'pequeño' | 'mediano' | 'grande',
    gender: '' as '' | 'macho' | 'hembra',
    birth_date: '',
    weight: '',
    notes: '',
    photo_url: '',
  });

  const breeds = getBreeds();

  const openCreateModal = () => {
    editingPet.value = null;
    setFormData({
      name: '',
      species: 'dog',
      breed: '',
      size: 'mediano',
      gender: '',
      birth_date: '',
      weight: '',
      notes: '',
      photo_url: '',
    });
    showModal.value = true;
  };

  const openEditModal = (pet: Pet) => {
    editingPet.value = pet;
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      size: pet.size,
      gender: pet.gender || '',
      birth_date: pet.birth_date || '',
      weight: pet.weight?.toString() || '',
      notes: pet.notes || '',
      photo_url: pet.photo_url || '',
    });
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
    editingPet.value = null;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    isLoading.value = true;

    try {
      const petData = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed || null,
        size: formData.size,
        gender: formData.gender || null,
        birth_date: formData.birth_date || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        notes: formData.notes || null,
        owner_id: userId,
      };

      const url = editingPet.value
        ? `/api/pets/${editingPet.value.id}`
        : '/api/pets';

      const method = editingPet.value ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const savedPet = await response.json();

      if (editingPet.value) {
        setPets(pets.map((p) => (p.id === savedPet.id ? savedPet : p)));
      } else {
        setPets([...pets, savedPet]);
      }

      closeModal();
    } catch (error) {
      console.error('Error al guardar mascota:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar mascota',
      );
    } finally {
      isLoading.value = false;
    }
  };

  const handleDelete = async (petId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta mascota?')) {
      return;
    }

    try {
      const response = await fetch(`/api/pets/${petId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar mascota');
      }

      setPets(pets.filter((p) => p.id !== petId));
    } catch (error) {
      console.error('Error al eliminar mascota:', error);
      toast.error('Error al eliminar mascota');
    }
  };

  const getAgeString = (birthDate: string | null) => {
    if (!birthDate) return 'Edad desconocida';

    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();

    if (years === 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else if (months < 0) {
      return `${years - 1} ${years - 1 === 1 ? 'año' : 'años'}`;
    } else {
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    }
  };

  const getSpeciesIcon = (species: string) => {
    switch (species) {
      case 'dog':
        return '🐕';
    }
  };

  return (
    <div>
      {/* Botón para agregar mascota */}
      <div class="mb-6">
        <button onClick={openCreateModal} class="btn btn-primary">
          <svg
            class="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Agregar Mascota
        </button>
      </div>

      {/* Lista de mascotas */}
      {pets.length === 0 ? (
        <div class="card py-12 text-center">
          <div class="mb-4 text-6xl">🐾</div>
          <h3 class="mb-2 text-xl font-semibold text-gray-900">
            No tienes mascotas registradas
          </h3>
          <p class="mb-6 text-gray-600">
            Agrega tu primera mascota para comenzar a gestionar sus citas
          </p>
          <button onClick={openCreateModal} class="btn btn-primary">
            Agregar Primera Mascota
          </button>
        </div>
      ) : (
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <div key={pet.id} class="card transition-shadow hover:shadow-lg">
              <div class="mb-4 flex items-start justify-between">
                <div class="flex items-center">
                  <span class="mr-3 text-4xl">
                    {getSpeciesIcon(pet.species)}
                  </span>
                  <div>
                    <h3 class="text-xl font-bold text-gray-900">{pet.name}</h3>
                    <p class="text-sm text-gray-500">
                      {pet.breed || 'Sin raza especificada'}
                    </p>
                  </div>
                </div>
              </div>

              <div class="mb-4 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Tamaño:</span>
                  <span class="font-medium capitalize">{pet.size}</span>
                </div>
                {pet.gender && (
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Género:</span>
                    <span class="font-medium capitalize">{pet.gender}</span>
                  </div>
                )}
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Edad:</span>
                  <span class="font-medium">
                    {getAgeString(pet.birth_date)}
                  </span>
                </div>
                {pet.weight && (
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Peso:</span>
                    <span class="font-medium">{pet.weight} kg</span>
                  </div>
                )}
                {pet.notes && (
                  <div class="mt-3 border-t pt-3">
                    <p class="text-sm text-gray-600">{pet.notes}</p>
                  </div>
                )}
              </div>

              <div class="flex gap-2">
                <button
                  onClick={() => openEditModal(pet)}
                  class="btn btn-secondary flex-1"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(pet.id)}
                  class="btn btn-danger"
                >
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de crear/editar */}
      {showModal.value && (
        <div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div class="w-full max-w-md rounded-lg bg-white p-6">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-2xl font-bold">
                {editingPet.value ? 'Editar Mascota' : 'Nueva Mascota'}
              </h2>
              <button
                onClick={closeModal}
                class="text-gray-400 hover:text-gray-600"
              >
                <svg
                  class="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} class="space-y-4">
              <div>
                <label class="label">Nombre *</label>
                <input
                  type="text"
                  required
                  class="input"
                  value={formData.name}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      name: (e.target as HTMLInputElement).value,
                    })
                  }
                />
              </div>

              <div>
                <label class="label">Especie *</label>
                <select
                  required
                  class="input"
                  value={formData.species}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      species: (e.target as HTMLSelectElement).value as
                        | 'dog',
                    })
                  }
                >
                  <option value="dog">Perro 🐕</option>
                </select>
              </div>

              <div>
                <label class="label">Raza</label>
                <SearchableSelect
                  options={breeds}
                  value={formData.breed}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      breed: value,
                    })
                  }
                  placeholder="Buscar raza..."
                  className="input"
                />
              </div>

              <div>
                <label class="label">Tamaño *</label>
                <select
                  required
                  class="input"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      size: (e.target as HTMLSelectElement).value as
                        | 'pequeño'
                        | 'mediano'
                        | 'grande',
                    })
                  }
                >
                  <option value="pequeño">Pequeño</option>
                  <option value="mediano">Mediano</option>
                  <option value="grande">Grande</option>
                </select>
              </div>

              <div>
                <label class="label">Género</label>
                <select
                  class="input"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gender: (e.target as HTMLSelectElement).value as
                        | ''
                        | 'macho'
                        | 'hembra',
                    })
                  }
                >
                  <option value="">No especificado</option>
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                </select>
              </div>

              <div>
                <label class="label">Fecha de Nacimiento</label>
                <input
                  type="date"
                  class="input"
                  value={formData.birth_date}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      birth_date: (e.target as HTMLInputElement).value,
                    })
                  }
                />
              </div>

              <div>
                <label class="label">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  class="input"
                  value={formData.weight}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      weight: (e.target as HTMLInputElement).value,
                    })
                  }
                />
              </div>

              <div>
                <label class="label">Notas</label>
                <textarea
                  class="input"
                  rows={3}
                  value={formData.notes}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      notes: (e.target as HTMLTextAreaElement).value,
                    })
                  }
                  placeholder="Alergias, comportamiento especial, etc."
                />
              </div>

              <PhotoUploader
                onPhotoUpload={(url) =>
                  setFormData({
                    ...formData,
                    photo_url: url,
                  })
                }
                currentPhoto={formData.photo_url}
                petName={formData.name || 'mascota'}
              />

              <div class="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  class="btn btn-secondary flex-1"
                  disabled={isLoading.value}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn btn-primary flex-1"
                  disabled={isLoading.value}
                >
                  {isLoading.value ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetManager;
