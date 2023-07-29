/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  LaptopOutlined,
  NotificationOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Breadcrumb, Input, Layout, Menu, Spin, theme } from "antd";
import styles from "../styles/main.module.css";
import { api } from "~/utils/api";
import FileUpload from "~/components/FileUpload";
import { useChat } from "ai/react";
import React from "react";

const { Header, Content, Sider } = Layout;


export const runtime = "experimental-edge";

const App: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const [text, setText] = React.useState<string>("");

  const documents = api.documents.getAll.useQuery();
  const addDocument = api.documents.add.useMutation({
    async onSuccess() {
      // Refetch documents after successful add 
      console.log('onSuccess')
      await documents.refetch();
    }
  })
  
  const newText = 'New document text'
  // Call mutation 
  const addResult = () => {
    addDocument.mutateAsync({
      text: newText 
    })
  }

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  // createDocument.mutate({
  //   text: "",
  // });

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

      children: documents.data?.map((document, j) => {
        const subKey = index * 4 + j + 1;
        return {
          key: subKey,
          label: document.id,
        };
      }),
    };
  });



  return (
    <Layout className={styles.layout}>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={["2"]}
          items={items1}
        />
      </Header>
      <Layout>
        <Sider width={250} style={{ background: colorBgContainer }}>
        <div className="flex justify-center items-center flex-1 text-white p-4"><FileUpload/></div>
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
                  <div className={styles.message}>{message.content}</div>
                </div>
              );
            })}
          </Content>
          <div className={styles.inputContainer}>
            <Input
              value={input}
              onChange={handleInputChange}
              onPressEnter={handleSubmit as any}
              placeholder="Chat with me"
              addonAfter={
                <SendOutlined
                  className="cursor-pointer text-gray-400 hover:text-black"
                  onClick={handleSubmit as any}
                />
              }
            />
          </div>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;
