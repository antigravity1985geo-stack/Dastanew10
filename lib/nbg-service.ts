/**
 * NBG Currency Service
 * Fetches real-time currency rates from the National Bank of Georgia
 */

export interface NBGRate {
    code: string;
    quantity: number;
    rate: number;
    diff: number;
    date: string;
    validFromDate: string;
}

export const nbgService = {
    /**
     * Fetches current exchange rates from NBG
     * @returns Object with USD and EUR rates to GEL
     */
    async fetchCurrentRates(): Promise<{ USD: number; EUR: number; date: string } | null> {
        try {
            // NBG JSON API endpoint
            const response = await fetch("https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json");

            if (!response.ok) {
                throw new Error("Failed to fetch rates from NBG");
            }

            const data = await response.json();

            if (!data || !data[0] || !data[0].currencies) {
                return null;
            }

            const currencies: NBGRate[] = data[0].currencies;
            const date = data[0].date;

            const usdRate = currencies.find(c => c.code === "USD")?.rate || 0;
            const eurRate = currencies.find(c => c.code === "EUR")?.rate || 0;

            return {
                USD: usdRate,
                EUR: eurRate,
                date: date
            };
        } catch (error) {
            console.error("NBG Service Error:", error);
            return null;
        }
    }
};
