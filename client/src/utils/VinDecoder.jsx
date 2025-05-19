import { decodeVIN } from 'universal-vin-decoder';

export async function decodeVinData(vin) {
    try {
        if (!vin) throw new Error('VIN is required');
        const result = await decodeVIN(vin);
        console.log('Decoded VIN:', result);
        return result;
    } catch (error) {
        console.error('Error decoding VIN:', error);
        throw error;
    }
}