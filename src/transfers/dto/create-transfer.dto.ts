export class CreateTransferDto {
    recipient: string;
    amount: number;
    currency: string;
    reason: string;
    reference: string;
    orderId?: number; // Optional field for linking to an order
}
