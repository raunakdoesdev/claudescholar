/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { LaptopOutlined, SendOutlined, StopOutlined } from "@ant-design/icons";
import { Run, socket } from "@oloren/shared";
import { Documents } from "@prisma/client";
import { Message, useChat } from "ai/react";
import {
  Breadcrumb,
  Button,
  Checkbox,
  Input,
  Layout,
  Menu,
  MenuProps,
  message,
  theme,
} from "antd";
import React, { useState } from "react";
import { CreateNewFolder } from "~/components/CreateNewFolder";
import { DocModal } from "~/components/DocModal";
import FileUpload from "~/components/FileUpload";
import { FolderModal } from "~/components/FolderModal";
import { api } from "~/utils/api";
import styles from "../styles/main.module.css";

const { Header, Content, Sider } = Layout;

interface Param {
  [key: string]: string;
}

export const runtime = "experimental-edge";

// define a json format that we can export into the above xml format
export const FUNCTIONS = {
  draw_molecule: {
    description:
      "Allows user to enter a molecule via a chemical interface. Returns SMILES of compound.",
    execute: (uuid: string, params: {}) => {
      return fetch(
        "https://dispatcher.236409319020.oloren.aws.olorencore.com/api/run/draw_molecule",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uuid,
          }),
        }
      )
        .then((res) => res.json())
        .then((res: { smiles: string }) => `The user entered ${res.smiles}`)
        .catch((err: Error) => String(err.message));
    },
  },
};

function convertToXML(functions: typeof FUNCTIONS) {
  const inside = Object.keys(functions)
    .map((key) => {
      const fn = functions["draw_molecule"];
      return `<function>
      <function-name>${key}</function-name>
      <function-description>${fn.description}</function-description>
      <function-parameters>
        ${Object.keys(fn.execute).map((param) => {
          return `<parameter>
            <parameter-name>${param}</parameter-name>
            <parameter-desc>${param}</parameter-desc>
          </parameter>`;
        })}
      </function-parameters>
    </function>`;
    })
    .join("\n");
  return `<functions>
  ${inside}
  </functions>`;
}

const xml = convertToXML(FUNCTIONS);

const App: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [checkedDocs, setCheckedDocs] = useState<Documents[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [folderVisible, setFolderVisible] = useState(false);

  const handleMenuClick = (document: Documents) => {
    setSelectedDocument(document);
    setModalVisible(true);
  };

  const documents = api.documents.getAll.useQuery();
  const folders = api.folders.getAll.useQuery();

  const { messages, input, handleInputChange, handleSubmit, stop } = useChat({
    api: "/api/chat",
    body: {
      functions: xml,
      additional_data: checkedDocs
        .map((doc) => `title: ${doc.name} \ncontent: ${doc.content}`)
        .join(","),
    },
    onFinish: (res) => {
      parseStream(res, (content) => {
        console.log("Function output: ", content, messages);
        // append({
        //   id: v4(),
        //   content: "Function output: " + content,
        //   role: "assistant",
        // });
      });
    },
  });

  const items1: MenuProps["items"] = ["1", "2", "3"].map((key) => ({
    key,
    label: `nav ${key}`,
  }));

  const handleIconClick = (e: any, folder: any) => {
    e.stopPropagation(); // Prevent modal from opening
    setSelectedFolder(folder);
    setFolderVisible(true);
  };

  const docMenuItems: MenuProps["items"] = folders.data?.map(
    (folder, index) => {
      const key: string = String(index + 1);

      const filteredDocuments: any = documents.data?.filter(
        (document) => document.folderId === folder.id
      );

      return {
        key: `sub${key}`,
        icon: (
          <Button
            type="text"
            icon={<LaptopOutlined />}
            onClick={(e) => handleIconClick(e, folder)}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          />
        ),
        label: folder.title,

        children: filteredDocuments?.map((document: Documents, j: number) => {
          const subKey: number = index * 4 + j + 1;
          return {
            key: subKey,
            label: document.name,
            icon: (
              <Checkbox
                style={{ marginRight: 8 }}
                onClick={(e) => handleCheck(e, document)}
              />
            ),
            checked: selectedDocument === document.id, // Checkmark based on selectedDocument state
            onClick: () => handleMenuClick(document), // Open modal on click
          };
        }),
      };
    }
  );

  const handleCheck = (e: any, document: any) => {
    e.stopPropagation(); // Prevent modal from opening
    console.log("checked");
    setCheckedDocs([...checkedDocs, document]);
  };

  const [uuid, setUuid] = useState("");
  const dispatcherUrl =
    "https://dispatcher.236409319020.oloren.aws.olorencore.com";

  const parseXML = (xml: string) => {
    console.log(xml);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    console.log(xmlDoc);
    // Get function name
    const functionName = xmlDoc.querySelector("function-name")?.textContent;

    // Get parameters
    const parameters: Param = {};
    const paramElements = Array.from(xmlDoc.querySelectorAll("parameter"));

    paramElements.forEach((p: any) => {
      const name = p.querySelector("parameter-name").textContent;
      const value = p.querySelector("parameter-value").textContent;

      parameters[name] = value;
    });

    const result = {
      name: functionName,
      parameters,
    };

    console.log(result);
    return result;
  };

  const parseStream = (message: Message, run?: (x: string) => void) => {
    if (message.role === "user") {
      return message.content;
    }

    const stream = message.content;
    if (stream.indexOf("<") === -1) {
      return stream;
    }

    const functionStart = stream.indexOf("<");
    const functionNameStart = stream.indexOf(
      "<function-name>",
      functionStart - 1
    );
    const functionNameEnd = stream.indexOf(
      "</function-name>",
      functionStart - 1
    );
    if (functionNameEnd === -1) {
      return stream.slice(0, functionStart);
    }
    const functionName = stream.slice(functionNameStart + 15, functionNameEnd);

    const endOfFunction = stream.indexOf("</function-call>");
    console.log("endOfFunction", endOfFunction);
    if (endOfFunction === -1) {
      console.log("HEY", functionStart);
      return stream.slice(0, functionStart) + "running " + functionName;
    }

    const xml = stream.slice(
      functionStart,
      endOfFunction + functionName.length + 3
    );
    console.log("xml", xml);

    if (run) {
      const res = parseXML(xml);
      FUNCTIONS[res.name as "draw_molecule"]
        .execute(uuid, res.parameters)
        .then(run);
    }

    return (
      stream.slice(0, functionStart) +
      " " +
      functionName +
      " " +
      stream.slice(endOfFunction + 16)
    );
  };

  const [loading, setLoading] = useState(false);

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
        <Run.ManagedInterface
          uuid={uuid}
          setUuid={setUuid}
          dispatcherUrl={dispatcherUrl}
        />
        <Sider width={250} style={{ background: colorBgContainer }}>
          <div className="flex flex-1 items-center justify-center p-4 text-white">
            <FileUpload />
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub1"]}
            style={{ height: "fit-content", borderRight: 0 }}
            items={docMenuItems}
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
              folders={folders.data || []}
            />
          ) : folderVisible ? (
            <FolderModal
              folder={selectedFolder}
              onDelete={async () => {
                await folders.refetch();
              }}
              setModalVisible={setFolderVisible}
            />
          ) : (
            <>
              <Content
                style={{
                  padding: 24,
                  margin: 0,
                  minHeight: 280,
                  background: colorBgContainer,
                  overflow: "auto",
                }}
              >
                <Button
                  onClick={() => {
                    const u = socket.manager.connect(dispatcherUrl, () => {
                      message.success("Connected to Backend");
                      setUuid(u);
                    });
                  }}
                >
                  Click to Connect
                </Button>
                {messages.map((message, index) => {
                  return (
                    <div
                      key={index}
                      className={
                        "my-1 flex w-full flex-row " +
                        (message.role === "user"
                          ? "justify-end"
                          : "justify-start")
                      }
                    >
                      <div
                        className={
                          "w-fit max-w-[70%] whitespace-pre-line rounded-md p-2 " +
                          (message.role === "user"
                            ? "bg-blue-200"
                            : "bg-gray-200")
                        }
                      >
                        {index == messages.length - 1 &&
                        message.role === "assistant"
                          ? parseStream(message)
                          : message.content}
                      </div>
                    </div>
                  );
                })}
              </Content>
              <Button
                loading={loading}
                onClick={() => {
                  setLoading(true);
                  fetch(
                    // "https://dispatcher.236409319020.oloren.aws.olorencore.com/api/run/calculate",
                    // "https://dispatcher.236409319020.oloren.aws.olorencore.com/api/run/displaymol",
                    // "https://dispatcher.236409319020.oloren.aws.olorencore.com/api/run/smiles",
                    "https://dispatcher.236409319020.oloren.aws.olorencore.com/api/run/hello",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        uuid,
                        // smiles: "CC(=O)NC1=CC=C(C=C1)",
                        // operation: "Add",
                        // num1: 123,
                        // num2: 234,
                      }),
                    }
                  )
                    .then((res) => {
                      res.json().then((data) => {
                        setLoading(false);
                        console.log(data);
                      });
                    })
                    .catch(() => {
                      setLoading(false);
                    });
                }}
              >
                {uuid}
                Display Molecule
              </Button>
              <Input
                value={input}
                className={styles.input}
                onChange={handleInputChange}
                size="large"
                onPressEnter={handleSubmit as any}
                placeholder="Chat with me"
                addonAfter={
                  loading ? (
                    <SendOutlined
                      className="cursor-pointer text-gray-400 hover:text-black"
                      onClick={handleSubmit as any}
                    />
                  ) : (
                    <StopOutlined
                      className="cursor-pointer text-gray-400 hover:text-black"
                      onClick={stop}
                    />
                  )
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
