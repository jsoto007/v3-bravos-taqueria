import { decodeVIN } from 'universal-vin-decoder';

export async function decodeVinData(vin) {
    try {
        if (!vin) throw new Error('VIN is required');
        const result = await decodeVIN(vin);
        console.log("decoded VIN:", result);
        return result;
        
    } catch (error) {
        throw error;
    }
}
