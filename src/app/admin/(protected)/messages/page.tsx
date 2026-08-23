"use client";

import type { InferResponseType } from "hono/client";
import { useEffect, useState } from "react";
import { Pager } from "@/components/admin/pager";
import { AdminTopbar } from "@/components/admin/topbar";
import { ADMIN_MESSAGES_PAGE_SIZE } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { client } from "@/lib/rpc";

type Message = InferResponseType<
  typeof client.api.contact.admin.all.$get,
  200
>[number];

export default function MessagesAdminPage() {
  const [items, setItems] = useState<Message[]>([]);
  const [listPage, setListPage] = useState(1);

  async function load() {
    const res = await client.api.contact.admin.all.$get();
    if (res.ok) setItems(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!window.confirm("このメッセージを削除しますか？")) return;
    const res = await client.api.contact[":id"].$delete({ param: { id } });
    if (res.ok) setItems((prev) => prev.filter((m) => m.id !== id));
  }

  const listPageCount = Math.max(
    1,
    Math.ceil(items.length / ADMIN_MESSAGES_PAGE_SIZE),
  );
  const currentListPage = Math.min(listPage, listPageCount);
  const pagedItems = items.slice(
    (currentListPage - 1) * ADMIN_MESSAGES_PAGE_SIZE,
    currentListPage * ADMIN_MESSAGES_PAGE_SIZE,
  );

  return (
    <main className="admin__main">
      <AdminTopbar title="メッセージ" />

      <div className="admin-list-toolbar">
        <Pager
          page={currentListPage}
          pageCount={listPageCount}
          onChange={setListPage}
        />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>受信日時</th>
            <th>Name</th>
            <th>Comment</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {pagedItems.map((message) => (
            <tr key={message.id}>
              <td style={{ whiteSpace: "nowrap" }}>
                {formatDateTime(message.createdAt)}
              </td>
              <td>{message.name}</td>
              <td style={{ whiteSpace: "pre-line" }}>{message.comment}</td>
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => remove(message.id)}
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {pagedItems.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                メッセージはありません。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
