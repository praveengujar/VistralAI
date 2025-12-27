import { useCallback } from 'react';
import { TERMINOLOGY_MAPPING, TerminologyKey, getBrandTerm, BRAND_CONTEXT } from '../lib/terminology';

export const useTerminology = () => {
    const t = useCallback((term: TerminologyKey | string) => {
        return getBrandTerm(term);
    }, []);

    const getContext = useCallback((term: string) => {
        return BRAND_CONTEXT[term as keyof typeof BRAND_CONTEXT] || "";
    }, []);

    return {
        t,
        getContext,
        terms: TERMINOLOGY_MAPPING,
    };
};
