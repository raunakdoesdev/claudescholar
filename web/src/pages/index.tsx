/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  LaptopOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { MenuProps } from "antd";
import { Breadcrumb, Input, Layout, Menu, theme } from "antd";
import styles from "../styles/main.module.css";
import { api } from "~/utils/api";
import FileUpload from "~/components/FileUpload";
import { Message, useChat } from "ai/react";
import React, { useState } from "react";
import { CreateNewFolder } from "~/components/CreateNewFolder";
import { DocModal } from "~/components/DocModal";

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
    }
  })

  const newText = "New document text";
  const newName = "New document name";
  const addResult = () => {
    addDocument.mutateAsync({
      text: newText,
      name: newName, // Pass the 'name' property along with 'text'
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
    const key: string = String(index + 1);

    const filteredDocuments = documents.data?.filter(
      (document) => document.folderId === folder.id
    );

    return {
      key: `sub${key}`,
      icon: React.createElement(LaptopOutlined),
      label: folder.title,

      children: filteredDocuments?.map((document: any, j: number) => {
        const subKey: number = index * 4 + j + 1;
        return {
          key: subKey,
          label: document.id,
          checked: selectedDocument === document.id, // Checkmark based on selectedDocument state
          onClick: () => handleMenuClick(document), // Open modal on click
        };
      }),
    };
  });

  const parseXML = (xml: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    console.log(xmlDoc)
    // Get function name
    const functionName = xmlDoc.querySelector("function-name")?.textContent; 

    // Get parameters
    const parameters:any[] = [];
    const paramElements = xmlDoc.getElementsByTagName("parameter");

    for (let param of paramElements) {
      const nameElement = param.querySelector("parameter-name");
      const valueElement = param.querySelector("parameter-value");
      
      const name = nameElement?.textContent;
      const value = valueElement?.textContent;
      
      parameters.push({name, value});
    }

    // useless code to try to run the function   
    // const params = parameters.map(p => p.name).join(', ');
    // // Build function string
    // let functionString = `function ${functionName}(${params}) {\n`;
    
    // functionString += `console.log('${functionName} called with: ' + `;
  
    // parameters.forEach(p => {
    //   functionString += `${p.name}`;
  
    //   if(p !== parameters[parameters.length-1]) {
    //     functionString += `+ ', ' + `;
    //   }
    // });
  
    // functionString += `);\n
    // }`;
  
    // // Remove newlines
    // functionString = functionString.replace(/\n/g, '');
  
    // // Execute 
    // // console.log(functionString)
    // const func = new Function(functionString);
    // console.log(func)
    // func();  
  }

  const parseStream = (message: Message) => {
    if (message.role === 'user') {
      return message.content;
    }

    const stream = message.content;
    if (stream.indexOf('<') === -1) {
      return stream;
    }

    const functionNameStart = stream.indexOf('<');
    const functionNameEnd = stream.indexOf('>', functionNameStart);
    if (functionNameEnd === -1) {
      return stream.slice(0, functionNameStart);
    }
    const functionName = stream.slice(functionNameStart + 1, functionNameEnd);
    const endOfFunction = stream.indexOf('</'+functionName+'>');
    if (endOfFunction === -1) {
      return stream.slice(0, functionNameStart) + 'running ' + functionName;
    }

    const xml = stream.slice(functionNameStart, endOfFunction + functionName.length + 3);
    console.log('xml', xml)
    parseXML(xml);
    return stream.slice(0, functionNameStart) + functionName + stream.slice(endOfFunction + functionName.length + 3);
  }

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
          </Breadcrumb>
          {modalVisible ? (
            <DocModal
              selectedDocument={selectedDocument}
              onDelete={async () => {
                await documents.refetch();
              }}
              setModalVisible={setModalVisible}
            />
          ) : (
            <>
              <Content
                style={{
                  padding: 24,
                  margin: 0,
                  minHeight: 280,
                  background: colorBgContainer,
                  overflow: 'auto',
                }}
              >
                {messages.map((message, index) => {
                  return (
                    <div key={index} className={styles.messageLine}>
                      <div className={styles.message}>{parseStream(message)}</div>
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

export default App;
