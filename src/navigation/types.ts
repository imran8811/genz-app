import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Menu: { category?: string } | undefined;
  Cart: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  Checkout: undefined;
  OrderConfirmation: { orderNumber: string };
  OrderDetail: { id: number };
  Login: { redirectToCheckout?: boolean } | undefined;
  Register: { redirectToCheckout?: boolean } | undefined;
  ForgotPassword: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
