import { generateAccessToken, paypal } from "../lib/paypal";

// Test to generate access token from paypal
test("generate token from paypal", async () => {
  const token = await generateAccessToken();
  expect(typeof token).toBe("string");
  expect(token.length).toBeGreaterThan(0);
  expect(token).toBeDefined();
});

// Test to create a paypal order
test("create a paypal order", async () => {
  await generateAccessToken();
  const price = 10.0;

  const orderResponse = await paypal.createOrder(price);

  expect(orderResponse).toBeDefined();
  expect(orderResponse).toHaveProperty("id");
  expect(orderResponse).toHaveProperty("status");
  expect(orderResponse.status).toBe("CREATED");
});

// Test to capture payment with mock order
test("simulate capturing a payment from an order", async () => {
  const orderId = "100";

  const mockCapturePayment = jest
    .spyOn(paypal, "capturePayment")
    .mockResolvedValue({ status: "COMPLETED" });

  const captureResponse = await paypal.capturePayment(orderId);
  expect(captureResponse).toHaveProperty("status", "COMPLETED");

  mockCapturePayment.mockRestore();
});
