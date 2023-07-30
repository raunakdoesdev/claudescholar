/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { LaptopOutlined, SendOutlined } from "@ant-design/icons";
import { MenuProps, Modal, Checkbox } from "antd";
import { Breadcrumb, Input, Layout, Menu, Spin, theme } from "antd";
import styles from "../styles/main.module.css";
import { api } from "~/utils/api";
import FileUpload from "~/components/FileUpload";
import { useChat } from "ai/react";
import React, { useState } from "react";
import { CheckboxChangeEvent } from "antd/es/checkbox";

const { Header, Content, Sider } = Layout;

export const runtime = "experimental-edge";

const App: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const handleMenuClick = (document: any) => {
    setSelectedDocument(document);
    setModalVisible(true);
  };

  const documents = api.documents.getAll.useQuery();
  const folders = api.folders.getAll.useQuery();

  // these next two function calls create a new document
  const addDocument = api.documents.add.useMutation({
    async onSuccess() {
      // Refetch documents after successful add
      console.log("onSuccess");
      await documents.refetch();
    },
  });

  const newText = "New document text";
  const addResult = () => {
    addDocument.mutateAsync({
      text: newText,
    });
  };

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
  });

  const items1: MenuProps["items"] = ["1", "2", "3"].map((key) => ({
    key,
    label: `nav ${key}`,
  }));

  const items2: MenuProps["items"] = folders.data?.map((folder, index) => {
    const key = String(index + 1);

    const filteredDocuments = documents.data?.filter(
      (document) => document.folderId === folder.id
    );

    return {
      key: `sub${key}`,
      icon: React.createElement(LaptopOutlined),
      label: folder.title,

      children: filteredDocuments?.map((document, j) => {
        const subKey = index * 4 + j + 1;
        return {
          key: subKey,
          label: document.id,
          checked: selectedDocument === document.id, // Checkmark based on selectedDocument state
          onClick: () => handleMenuClick(document), // Open modal on click
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
          <div className="flex flex-1 items-center justify-center p-4 text-white">
            <FileUpload />
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub1"]}
            style={{ height: "fit-content", borderRight: 0 }}
            items={items2}
          />
          <CreateNewFolder />
        </Sider>
        <Layout style={{ padding: "0 24px 24px" }}>
          <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>List</Breadcrumb.Item>
            <Breadcrumb.Item>App</Breadcrumb.Item>
          </Breadcrumb>
          {modalVisible ? (
            <Modal
              title={selectedDocument.id}
              centered
              open={modalVisible}
              footer={null}
              onCancel={() => setModalVisible(false)}
              bodyStyle={{
                height: "50vh",
                width: "50vw",
              }}
            >
              <p>{selectedDocument.content}</p>
            </Modal>
          ) : (
            <>
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
              <Input
                value={input}
                className={styles.input}
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
            </>
          )}
        </Layout>
      </Layout>
    </Layout>
  );
};

const CreateNewFolder = () => {
  const [addingFolder, setAddingFolder] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>("");
  const folders = [] as any[];

  const addFolderMutation = api.folders.add.useMutation({
    // onSuccess will run after the mutation is successful
    onSuccess: async () => {
      // Refetch folders after successful add
      console.log("onSuccess");
      // await folders.refetch();
      setAddingFolder(false);
    },
  });

  const createNewFolder = async () => {
    console.log("createNewFolder");

    try {
      // Call the mutation and wait for the response
      const response = await addFolderMutation.mutateAsync({
        text: folderName,
      });
    } catch (error) {
      console.error("Error creating new folder:", error);
    }
  };

  return (
    <>
      <div className="flex flex-1 items-center justify-center p-4 text-black">
        <button onClick={() => setAddingFolder(true)}>Add new folder</button>
      </div>
      {addingFolder && (
        <div className="flex flex-1 items-center justify-center p-4 text-black">
          <Input
            placeholder="Folder Name"
            value={folderName}
            type="text"
            onChange={(e) => {
              setFolderName(e.target.value);
            }}
            onPressEnter={createNewFolder}
          />
        </div>
      )}
    </>
  );
};

export default App;
