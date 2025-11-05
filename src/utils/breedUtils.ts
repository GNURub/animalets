import razas from './razas.json';

export interface BreedOption {
    label: string;
    value: string;
}

/**
 * Obtiene las razas ya formateadas
 * @returns Array de opciones para el select con formato {label, value}
 */
export function getBreeds(): BreedOption[] {
    return razas as BreedOption[];
}
