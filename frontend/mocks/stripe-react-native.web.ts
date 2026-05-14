import React from "react";

export const useStripe = () => ({
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({
    error: { code: "Canceled", message: "Payments not supported on web" },
  }),
});

export const StripeProvider = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);
