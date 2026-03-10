import { outboxDB, type OutboxItem } from "./db";
import { rsgeService } from "./rs-ge";

const RETRY_DELAYS = [30, 120, 480, 1920, 7200]; // in seconds

export const syncQueue = {
    /**
     * Add a request to the outbox for background processing.
     */
    async add(id: string, eventType: OutboxItem['eventType'], payload: any) {
        if (typeof window === "undefined") return;

        // Check if idempotency key (id) already exists and is not 'success'
        const existing = await outboxDB.outbox
            .where('idempotencyKey')
            .equals(id)
            .first();

        if (existing && existing.status === 'success') return;
        if (existing && existing.status === 'processing') return;

        if (existing) {
            // Update existing if it failed/dead
            await outboxDB.outbox.update(existing.id!, {
                status: 'pending',
                nextRetryAt: Date.now(),
            });
        } else {
            await outboxDB.outbox.add({
                eventType,
                payload,
                idempotencyKey: id,
                status: 'pending',
                attemptCount: 0,
                nextRetryAt: Date.now(),
                createdAt: Date.now(),
            });
        }

        this.process();
    },

    /**
     * Process all pending items in the outbox.
     */
    async process() {
        if (typeof window === "undefined") return;

        const now = Date.now();
        const pending = await outboxDB.outbox
            .where('status')
            .equals('pending')
            .filter(item => item.nextRetryAt <= now)
            .toArray();

        if (pending.length === 0) return;

        for (const item of pending) {
            await this.processItem(item);
        }
    },

    async processItem(item: OutboxItem) {
        // Mark as processing
        await outboxDB.outbox.update(item.id!, { status: 'processing' });

        try {
            let result;
            if (item.eventType === 'waybill') {
                result = await rsgeService.sendWaybill(
                    item.payload.sale,
                    item.payload.options,
                    item.payload.items,
                    true // skipQueue
                );
            } else if (item.eventType === 'fiscal_receipt') {
                result = await rsgeService.sendFiscalReceipt(
                    item.payload.sale,
                    item.payload.items,
                    true // skipQueue
                );
            }

            if (result && result.success) {
                await outboxDB.outbox.update(item.id!, {
                    status: 'success',
                    lastError: undefined
                });
            } else {
                await this.handleFailure(item, result?.error || "Unknown error");
            }
        } catch (err: any) {
            await this.handleFailure(item, err.message);
        }
    },

    async handleFailure(item: OutboxItem, error: string) {
        const nextAttempt = item.attemptCount + 1;

        if (nextAttempt >= 10) {
            await outboxDB.outbox.update(item.id!, {
                status: 'dead',
                attemptCount: nextAttempt,
                lastError: error
            });
            console.error(`[Outbox] Item ${item.id} marked as DEAD:`, error);
        } else {
            const delayIndex = Math.min(nextAttempt - 1, RETRY_DELAYS.length - 1);
            const delaySeconds = RETRY_DELAYS[delayIndex];
            const nextRetryAt = Date.now() + (delaySeconds * 1000);

            await outboxDB.outbox.update(item.id!, {
                status: 'pending',
                attemptCount: nextAttempt,
                nextRetryAt: nextRetryAt,
                lastError: error
            });
            console.warn(`[Outbox] Item ${item.id} failed, retry in ${delaySeconds}s. Error:`, error);
        }
    }
};

// Start processing on load
if (typeof window !== "undefined") {
    // Initial delay + interval for background check
    setTimeout(() => syncQueue.process(), 5000);
    setInterval(() => syncQueue.process(), 60000); // Check every minute
}
