export interface PaymentCompletedEvent {
  orderId: number;
  paymentId: number;
  userId: number;
  amount: number;
  currency: string;
  transactionId: string;
  paymentReference: string;
  completed_at: Date;
}

export interface PaymentFailedEvent {
  orderId: number;
  paymentId: number;
  userId: number;
  amount: number;
  currency: string;
  transactionId: string;
  paymentReference: string;
  failureReason: string;
  failed_at: Date;
}

export interface PaymentInitiatedEvent {
  orderId: number;
  paymentId: number;
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  initiated_at: Date;
}

export interface PaymentRefundedEvent {
  orderId: number;
  paymentId: number;
  userId: number;
  originalAmount: number;
  refundAmount: number;
  currency: string;
  refundReason: string;
  refunded_at: Date;
}

// Optional: Payment event types enum for better type safety
export enum PaymentEventTypes {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_REFUNDED = 'payment.refunded',
}