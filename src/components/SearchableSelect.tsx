import type { FunctionalComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

interface SearchableSelectProps {
    options: Array<{ label: string; value: string }>;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

const SearchableSelect: FunctionalComponent<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Buscar...',
    className = 'input',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Filtrar opciones cuando cambia el término de búsqueda
    useEffect(() => {
        if (!searchTerm) {
            setFilteredOptions(options);
            setHighlightedIndex(-1);
            return;
        }

        const filtered = options.filter((opt) =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredOptions(filtered);
        setHighlightedIndex(-1);
    }, [searchTerm, options]);

    // Cerrar el select al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    handleSelectOption(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setSearchTerm('');
                break;
        }
    };

    const handleSelectOption = (option: (typeof options)[0]) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
    };

    // Scroll a la opción resaltada
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const highlightedElement = listRef.current.children[
                highlightedIndex
            ] as HTMLElement;
            if (highlightedElement) {
                highlightedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    return (
        <div ref={containerRef} class="relative">
            <div
                class={`${className} cursor-pointer flex items-center justify-between`}
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) {
                        setTimeout(() => inputRef.current?.focus(), 0);
                    }
                }}
            >
                <span class={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <svg
                    class={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                </svg>
            </div>

            {isOpen && (
                <div class="absolute top-full z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                        onKeyDown={handleKeyDown}
                        class="w-full border-b border-gray-200 px-3 py-2 outline-none focus:bg-gray-50"
                    />

                    <ul
                        ref={listRef}
                        class="max-h-64 overflow-y-auto"
                        role="listbox"
                    >
                        {filteredOptions.length === 0 ? (
                            <li class="px-3 py-2 text-gray-500">No hay resultados</li>
                        ) : (
                            filteredOptions.map((option, index) => (
                                <li
                                    key={option.value}
                                    onClick={() => handleSelectOption(option)}
                                    class={`cursor-pointer px-3 py-2 transition-colors ${value === option.value
                                        ? 'bg-blue-100 text-blue-900'
                                        : highlightedIndex === index
                                            ? 'bg-gray-100'
                                            : 'hover:bg-gray-50'
                                        }`}
                                    role="option"
                                    aria-selected={value === option.value}
                                >
                                    {option.label}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
