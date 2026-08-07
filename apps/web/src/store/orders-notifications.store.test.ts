import { beforeEach, describe, expect, it } from "vitest";

import { useOrdersNotificationsStore } from "./orders-notifications.store";

describe("orders notifications store", () => {
  beforeEach(() => {
    useOrdersNotificationsStore.setState({ unreadCount: 0 });
  });

  it("tracks new Orders globally and clears them when read", () => {
    const store = useOrdersNotificationsStore.getState();

    store.addUnreadOrders(2);
    store.addUnreadOrders(1);
    expect(useOrdersNotificationsStore.getState().unreadCount).toBe(3);

    store.markOrdersRead();
    expect(useOrdersNotificationsStore.getState().unreadCount).toBe(0);
  });
});
