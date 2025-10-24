import { signal } from '@preact/signals';
import type { FunctionalComponent } from 'preact';
import { useState } from 'preact/hooks';

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

interface ServiceManagerProps {
  initialServices: Service[];
}

const showModal = signal(false);
const editingService = signal<Service | null>(null);
const isLoading = signal(false);

const ServiceManager: FunctionalComponent<ServiceManagerProps> = ({
  initialServices,
}) => {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: '60',
    price: '',
    is_active: true,
  });

  const openCreateModal = () => {
    editingService.value = null;
    setFormData({
      name: '',
      description: '',
      duration_minutes: '60',
      price: '',
      is_active: true,
    });
    showModal.value = true;
  };

  const openEditModal = (service: Service) => {
    editingService.value = service;
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes.toString(),
      price: service.price.toString(),
      is_active: service.is_active,
    });
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
    editingService.value = null;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    isLoading.value = true;

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        duration_minutes: parseInt(formData.duration_minutes),
        price: parseFloat(formData.price),
        is_active: formData.is_active,
      };

      const url = editingService.value
        ? `/api/services/${editingService.value.id}`
        : '/api/services';

      const method = editingService.value ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const savedService = await response.json();

      if (editingService.value) {
        setServices(
          services.map((s) => (s.id === savedService.id ? savedService : s)),
        );
      } else {
        setServices([...services, savedService]);
      }

      closeModal();
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      alert(
        error instanceof Error ? error.message : 'Error al guardar servicio',
      );
    } finally {
      isLoading.value = false;
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar servicio');
      }

      setServices(services.filter((s) => s.id !== serviceId));
    } catch (error) {
      console.error('Error al eliminar servicio:', error);
      alert('Error al eliminar servicio. Puede que tenga citas asociadas.');
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...service,
          is_active: !service.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar servicio');
      }

      const updatedService = await response.json();
      setServices(
        services.map((s) => (s.id === updatedService.id ? updatedService : s)),
      );
    } catch (error) {
      console.error('Error al actualizar servicio:', error);
      alert('Error al actualizar servicio');
    }
  };

  return (
    <div>
      {/* Botón para agregar servicio */}
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
          Nuevo Servicio
        </button>
      </div>

      {/* Lista de servicios */}
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            class={`card ${!service.is_active ? 'opacity-60' : ''}`}
          >
            <div class="mb-4 flex items-start justify-between">
              <div class="flex-1">
                <h3 class="mb-1 text-xl font-bold text-gray-900">
                  {service.name}
                </h3>
                {service.description && (
                  <p class="text-sm text-gray-600">{service.description}</p>
                )}
              </div>
              <div class="ml-2">
                <label class="flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={service.is_active}
                    onChange={() => toggleActive(service)}
                    class="form-checkbox h-5 w-5 text-green-600"
                  />
                </label>
              </div>
            </div>

            <div class="mb-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Duración:</span>
                <span class="font-medium">{service.duration_minutes} min</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Precio:</span>
                <span class="text-lg font-bold text-green-600">
                  €{service.price.toFixed(2)}
                </span>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                onClick={() => openEditModal(service)}
                class="btn btn-secondary flex-1"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(service.id)}
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

      {/* Modal de crear/editar */}
      {showModal.value && (
        <div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div class="w-full max-w-md rounded-lg bg-white p-6">
            <div class="mb-6 flex items-center justify-between">
              <h2 class="text-2xl font-bold">
                {editingService.value ? 'Editar Servicio' : 'Nuevo Servicio'}
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
                <label class="label">Nombre del Servicio *</label>
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
                <label class="label">Descripción</label>
                <textarea
                  class="input"
                  rows={3}
                  value={formData.description}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      description: (e.target as HTMLTextAreaElement).value,
                    })
                  }
                />
              </div>

              <div>
                <label class="label">Duración (minutos) *</label>
                <input
                  type="number"
                  required
                  min="15"
                  step="15"
                  class="input"
                  value={formData.duration_minutes}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      duration_minutes: (e.target as HTMLInputElement).value,
                    })
                  }
                />
              </div>

              <div>
                <label class="label">Precio (€) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  class="input"
                  value={formData.price}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      price: (e.target as HTMLInputElement).value,
                    })
                  }
                />
              </div>

              <div class="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_active: (e.target as HTMLInputElement).checked,
                    })
                  }
                  class="form-checkbox mr-2 h-5 w-5 text-green-600"
                />
                <label for="is_active" class="text-sm text-gray-700">
                  Servicio activo (visible para clientes)
                </label>
              </div>

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

export default ServiceManager;
