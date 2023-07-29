/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from "react";
import {
  LaptopOutlined,
  NotificationOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Breadcrumb, Input, Layout, Menu, Spin, theme } from "antd";
import styles from "../styles/main.module.css";
import Image from "next/image";
import send from "../../public/send-icon.png";
import { appRouter } from "~/server/api/root";
import { api } from "~/utils/api";
import { useRouter } from "next/router";

const { Header, Content, Sider } = Layout;

const items1: MenuProps["items"] = ["1", "2", "3"].map((key) => ({
  key,
  label: `nav ${key}`,
}));

const items2: MenuProps["items"] = [
  UserOutlined,
  LaptopOutlined,
  NotificationOutlined,
].map((icon, index) => {
  const key = String(index + 1);

  return {
    key: `sub${key}`,
    icon: React.createElement(icon),
    label: `subnav ${key}`,

    children: new Array(4).fill(null).map((_, j) => {
      const subKey = index * 4 + j + 1;
      return {
        key: subKey,
        label: `option${subKey}`,
      };
    }),
  };
});

const App: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const [text, setText] = React.useState<string>("");
  const [messages, setMessages] = React.useState<string[]>([]);

  const documents = api.documents.getAll.useQuery();
  const createDocument = api.documents.add.useMutation();

  createDocument.mutate({
    text: "",
  });

  const sendText = () => {
    console.log(text);
    setMessages([...messages, text]);
    setText("");
  };

  return (
    <Layout className={styles.layout}>
      <Header style={{ display: "flex", alignItems: "center" }}>
        {documents.data ? (
          <pre className="text-white">{JSON.stringify(documents.data)}</pre>
        ) : (
          <Spin />
        )}
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["2"]}
          items={items1}
        />
      </Header>
      <Layout>
        <Sider width={250} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub1"]}
            style={{ height: "100%", borderRight: 0 }}
            items={items2}
          />
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>List</Breadcrumb.Item>
            <Breadcrumb.Item>App</Breadcrumb.Item>
          </Breadcrumb>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: colorBgContainer,
            }}
          >
            {messages.map((message, index) => {
              return (
                <div key={index} className={styles.messageLine}>
                  <div className={styles.message}>{message}</div>
                </div>
              );
            })}
          </Content>
          <div className={styles.inputContainer}>
            <Input
              value={text}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                console.log(e.target.value);
                setText(e.target.value);
              }}
              onPressEnter={sendText}
              placeholder="Chat with me"
              addonAfter={
                <SendOutlined
                  className="cursor-pointer text-gray-400 hover:text-black"
                  onClick={() => {
                    sendText();
                  }}
                />
              }
            />
            {/* <Image
              src={send}
              alt="send"
              width={50}
              className={styles.send}
              onClick={sendText}
            /> */}
          </div>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
