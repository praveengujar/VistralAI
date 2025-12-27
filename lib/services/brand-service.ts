import {
    createBrandIdentity,
    createMarketPosition,
    createCompetitorProfile,
    createProductDetail,
    getBrandIdentityByBrandId,
    getMarketPositionByBrandId,
    updateBrandIdentity,
    updateMarketPosition,
    updateBrandProfile,
    logDbStats,
} from '@/lib/db';
import { Brand360Data } from '@/types';

/**
 * Save extracted Brand 360 data to the database
 */
export async function saveExtractedData(brandId: string, extractedData: Partial<Brand360Data>) {
    console.log(`[BrandService] Saving extracted data for brand ${brandId}`);

    // Save or update brand identity
    if (extractedData.identity) {
        const existingIdentity = await getBrandIdentityByBrandId(brandId);
        if (existingIdentity) {
            await updateBrandIdentity(existingIdentity.id, extractedData.identity);
        } else {
            await createBrandIdentity({
                ...extractedData.identity,
                brandId,
            });
        }
    }

    // Save or update market position
    if (extractedData.marketPosition) {
        const existingPosition = await getMarketPositionByBrandId(brandId);
        if (existingPosition) {
            await updateMarketPosition(existingPosition.id, extractedData.marketPosition);
        } else {
            await createMarketPosition({
                ...extractedData.marketPosition,
                targetAudiences: extractedData.marketPosition.targetAudiences || [],
                brandId,
            });
        }
    }

    // Save competitors (Always append for now, or maybe replace? Logic was just create in the original)
    if (extractedData.competitors) {
        for (const competitor of extractedData.competitors) {
            await createCompetitorProfile({
                ...competitor,
                brandId,
            });
        }
    }

    // Save products
    if (extractedData.products) {
        for (const product of extractedData.products) {
            await createProductDetail({
                ...product,
                brandId,
            });
        }
    }

    console.log(`[BrandService] Data saved successfully`);
    logDbStats();
}

/**
 * Update crawling status for a brand profile
 */
export async function updateCrawlingStatus(brandId: string, status: 'idle' | 'processing' | 'completed' | 'failed') {
    await updateBrandProfile(brandId, { crawlingStatus: status });
}
