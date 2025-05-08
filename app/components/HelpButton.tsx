"use client";

import { useState } from "react";
import Image from "next/image";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { usePathname } from "next/navigation";

// Map pathname → what the modal should show
const helpByRoute: Record<string, React.ReactNode> = {
  "/chat": (
    <Image
      src="/help/chat.png"       // put the screenshot in /public/help/
      alt="Introduction to Chat page"
      style={{ width: "77%", height: "auto", display: "block", margin: "0 auto" }}
    />
  ),
  /* add more routes/screens if you need them */
};

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        aria-label="Help"
        onClick={() => setOpen(true)}
        className="iconButton flex items-center justify-center"
      >
        <QuestionCircleOutlined style={{ fontSize: 18 }} />
      </button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        centered
        width={560}
        destroyOnClose
      >
        {helpByRoute[pathname] ?? (
          <p className="text-center">No help content for this page yet.</p>
        )}
      </Modal>
    </>
  );
}