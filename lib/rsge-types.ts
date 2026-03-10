/**
 * RS.GE Integration — Shared TypeScript Types (Server + Client)
 * ეს ფაილი შეიცავს RS.GE SOAP სერვისების მკაცრ ინტერფეისებს.
 */

// ─────────────────────────────────────────────────────────────
// Error Codes
// ─────────────────────────────────────────────────────────────

export enum RsgeErrorCode {
    SESSION_EXPIRED = "SESSION_EXPIRED",
    AUTH_FAILED = "AUTH_FAILED",
    NOT_FOUND = "NOT_FOUND",
    NETWORK_ERROR = "NETWORK_ERROR",
    UNKNOWN = "UNKNOWN",
    INVALID_TIN = "INVALID_TIN",
    WAYBILL_LOCKED = "WAYBILL_LOCKED",
    PERMISSION_DENIED = "PERMISSION_DENIED",
}

export interface RsgeApiError {
    code: RsgeErrorCode;
    message: string;
    raw?: string;
}

// ─────────────────────────────────────────────────────────────
// Base Response
// ─────────────────────────────────────────────────────────────

export interface RsgeBaseResponse {
    success: boolean;
    error?: string;
    errorCode?: RsgeErrorCode;
}

// ─────────────────────────────────────────────────────────────
// Waybill (ზედნადები)
// ─────────────────────────────────────────────────────────────

export type WaybillStatus = "0" | "1" | "2" | "3" | "4";
// 0=სამუშაო, 1=გაგზავნილი, 2=დადასტურებული, 3=უარყოფილი, 4=დახურული

export type WaybillType = 1 | 2 | 3;
// 1=შიდა, 2=გარე (Import/Export), 3=გადაადგილება

export interface RsgeWaybill {
    /** RS.GE-ს შიდა ID */
    id: string;
    /** ზედნადების ნომერი */
    w_id: string;
    waybillNumber?: string;
    status: WaybillStatus;
    type?: string;
    buyerTin?: string;
    buyerName?: string;
    sellerTin?: string;
    sellerName?: string;
    createDate?: string;
    beginDate?: string;
    deliveryDate?: string;
    fullAmount?: string;
}

export interface RsgeGoodsItem {
    id: string;
    name: string;
    unit: string;
    unitName?: string;
    quantity: string;
    price: string;
    amount?: string;
    barcode?: string;
}

export interface RsgeWaybillDetails extends RsgeWaybill {
    goods: RsgeGoodsItem[];
}

export interface RsgeWaybillListResponse extends RsgeBaseResponse {
    waybills: RsgeWaybill[];
}

export interface RsgeWaybillDetailsResponse extends RsgeBaseResponse {
    goods?: RsgeGoodsItem[];
}

export interface RsgeSendWaybillResponse extends RsgeBaseResponse {
    waybillId?: string;
}

// ─────────────────────────────────────────────────────────────
// Invoice (ანგარიშ-ფაქტურა)
// ─────────────────────────────────────────────────────────────

export interface RsgeInvoiceItem {
    name: string;
    quantity: number;
    price: number;
    vatRate?: number; // Default: 18%
}

export interface RsgeInvoice {
    id: string;
    waybillId?: string;
    status: string;
    invoiceDate?: string;
    buyerTin?: string;
    buyerName?: string;
    totalAmount?: number;
}

export interface RsgeInvoiceResponse extends RsgeBaseResponse {
    invoiceId?: string;
}

// ─────────────────────────────────────────────────────────────
// Organization (ორგანიზაცია)
// ─────────────────────────────────────────────────────────────

export interface RsgeOrganization {
    tin: string;
    name: string;
    address?: string;
    isVatPayer?: boolean;
    isActive?: boolean;
}

export interface RsgeOrganizationResponse extends RsgeBaseResponse {
    organization?: RsgeOrganization;
}

// ─────────────────────────────────────────────────────────────
// Session (suid)
// ─────────────────────────────────────────────────────────────

export interface RsgeSessionState {
    suid: string;
    username: string;
    createdAt: number; // Unix timestamp
    expiresAt: number; // Unix timestamp
}

export interface RsgeLoginResponse extends RsgeBaseResponse {
    /** suid — მხოლოდ სერვერის მხარეს ხელმისაწვდომია */
    sessionActive?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Waybill Send Options
// ─────────────────────────────────────────────────────────────

export interface RsgeSendOptions {
    buyerTin?: string;
    buyerName?: string;
    deliveryAddress?: string;
    carNumber?: string;
    waybillType?: WaybillType;
    sendInvoice?: boolean;
    idempotencyKey?: string;
}

export interface RsgeWaybillItemInput {
    productName: string;
    quantity: number;
    unit: string;
    price: number;
    barcode?: string;
}

// ─────────────────────────────────────────────────────────────
// Fiscal Receipt (ფისკალური ჩეკი)
// ─────────────────────────────────────────────────────────────

export interface RsgeFiscalReceiptResponse extends RsgeBaseResponse {
    receiptNumber?: string;
}

// ─────────────────────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────────────────────

export interface RsgeWaybillFilters {
    status?: WaybillStatus | "";
    from?: string;
    to?: string;
    buyerTin?: string;
}
