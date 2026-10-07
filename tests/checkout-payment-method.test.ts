import assert from 'node:assert/strict';
import { checkoutSchema } from '../src/lib/validation';
const order = { name: 'Cliente Prueba', email: 'cliente@example.com', phone: '976614443', deliveryMethod: 'retiro', items: JSON.stringify([{ productId: 1, quantity: 1 }]) };
assert.equal(checkoutSchema.safeParse({ ...order, paymentMethod: 'mercadopago' }).success, true);
for (const paymentMethod of ['webpay', 'otro', '']) {
 const result = checkoutSchema.safeParse({ ...order, paymentMethod });
 assert.equal(result.success, false);
 if (!result.success) assert.ok(result.error.issues.some(issue => issue.path[0] === 'paymentMethod'));
}
console.log('Checkout acepta solo Mercado Pago.');
