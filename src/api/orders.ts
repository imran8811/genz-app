import { api } from './client';
import { ApiOrder, CartLine, DeliveryDetails, PaymentMethod } from '@/types';

export const ordersApi = {
  /** Place an order. Backend re-prices server-side from the trusted menu copy. */
  checkout: (input: {
    lines: CartLine[];
    delivery: DeliveryDetails;
    paymentMethod: PaymentMethod;
  }) => {
    const items = input.lines
      .filter((l) => l.kind === 'item')
      .map((l) => ({ item_slug: l.itemSlug, size: l.size ?? null, quantity: l.quantity }));
    const deals = input.lines
      .filter((l) => l.kind === 'deal')
      .map((l) => ({ deal_slug: l.dealSlug, quantity: l.quantity, selections: l.selections ?? [] }));

    return api
      .post<{ message: string; order: ApiOrder }>(
        '/checkout',
        { items, deals, delivery: input.delivery, payment_method: input.paymentMethod },
        true,
      )
      .then((r) => r.order);
  },

  list: (signal?: AbortSignal) =>
    api.get<{ data: ApiOrder[] }>('/orders', true, signal).then((r) => r.data),

  get: (id: number, signal?: AbortSignal) =>
    api.get<{ data: ApiOrder }>(`/orders/${id}`, true, signal).then((r) => r.data),

  track: (orderNumber: string, signal?: AbortSignal) =>
    api.get<{ data: ApiOrder }>(`/orders/track/${orderNumber}`, true, signal).then((r) => r.data),
};
