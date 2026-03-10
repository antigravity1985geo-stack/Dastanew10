import Dexie, { type Table } from 'dexie';

export interface OutboxItem {
    id?: number;
    eventType: 'fiscal_receipt' | 'waybill' | 'invoice';
    payload: any;
    idempotencyKey: string;
    status: 'pending' | 'processing' | 'success' | 'failed' | 'dead';
    attemptCount: number;
    nextRetryAt: number; // UTC timestamp
    lastError?: string;
    createdAt: number; // UTC timestamp
}

export class DASTAOutboxDB extends Dexie {
    outbox!: Table<OutboxItem>;

    constructor() {
        super('DASTA_Outbox');
        this.version(1).stores({
            outbox: '++id, status, nextRetryAt, eventType, idempotencyKey'
        });
    }
}

export const outboxDB = new DASTAOutboxDB();
