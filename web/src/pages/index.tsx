import {
  CheckCircleTwoTone,
  ExperimentOutlined,
  FireOutlined,
  LaptopOutlined,
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Run } from "@oloren/shared";
import { Documents } from "@prisma/client";
import { Message, useChat } from "ai/react";
import {
  Button,
  Checkbox,
  Input,
  Layout,
  Menu,
  MenuProps,
  Spin,
  Tooltip,
  Typography,
  theme,
} from "antd";
import React, { useState } from "react";
import { CreateNewFolder } from "~/components/CreateNewFolder";
import { DocModal } from "~/components/DocModal";
import FileUpload from "~/components/FileUpload";
import { FolderModal } from "~/components/FolderModal";
import { InfoModal } from "~/components/InfoModal";
import { api } from "~/utils/api";
import styles from "../styles/main.module.css";
import { signIn, useSession } from "next-auth/react";
import AuthShowcase from "~/components/AuthShowcase";

const { Header, Content, Sider } = Layout;

interface Param {
  [key: string]: string;
}

export const runtime = "experimental-edge";

// define a json format that we can export into the above xml format
const FUNCTIONS: { [key: string]: any } = {
  generate_molecule_variants: {
    icon: <ReloadOutlined />,
    description:
      "Generates variants of the given molecule using the CrEM algorithm and returns a list of promising mutated molecules.",
    params: {
      smiles: "The SMILES of the molecule to generate variants of",
    },
    execute: (uuid: string, params: { smiles: string }) => {
      return fetch(
        "https://dispatcher.236409319020.oloren.aws.olorencore.com/api/run/crem",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uuid,
            smiles: params.smiles,
          }),
        }
      )
        .then((res) => res.json())
        .then((res: { generated: string[] }) => {
          console.log("Returned: ", res);
          return `The generated mols are ${res.generated.join(", ")}`;
        })
        .catch((err: Error) => String(err.message));
    },
  },
  draw_protein: {
    icon: <FireOutlined />,
    description: "Draws the protein for the given PDB ID",
    params: {
      pdb_id:
        "The PDB ID of the protein to draw. This is usually a short alphanumeric string like 1CRN or 1BRS",
    },
    execute: (uuid: string, params: { pdb_id: string }) => {
      return fetch(
        "https://dispatcher.236409319020.oloren.aws.olorencore.com/api/run/molstar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uuid,
            pdbid: params.pdb_id,
          }),
        }
      )
        .then((res) => res.json())
        .then((res) => `Finished display protein`)
        .catch((err: Error) => String(err.message));
    },
  },
  draw_molecule: {
    icon: <ExperimentOutlined />,
    description:
      "Allows user to enter a molecule via a chemical interface. Returns SMILES of compound.",
    params: {},
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
  pubmed_search: {
    icon: <SearchOutlined />,
    // https://dispatcher.236409319020.oloren.aws.olorencore.com/api/run/nihsearch
    description:
      "Searches pubmed for papers related to the user query. Takes in a 'query' parameter.",
    params: {
      query:
        "The query to search for. This can be a phrase like 'colon cancer'",
    },
    execute: (uuid: string, params: { query: string }) => {
      return fetch(
        "https://dispatcher.236409319020.oloren.aws.olorencore.com/api/run/pubmed",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uuid,
            query: Object.values(params)[0],
          }),
        }
      )
        .then((res) => res.json())
        .then((res: { result: string }) => {
          if (res.result) return `Pubmed retrieved abstracts: ${res.result}`;
          else {
            console.log(res);
            return `Error finding results`;
          }
        })
        .catch((err: Error) => String(err.message));
    },
  },
};

function convertToXML(functions: typeof FUNCTIONS) {
  const inside = Object.keys(functions)
    .map((key) => {
      const fn = functions[key];
      return `<function>
      <function-name>${key}</function-name>
      <function-description>${fn.description}</function-description>
      <function-parameters>
        ${Object.keys(fn.params).map((param) => {
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

const App: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [checkedDocs, setCheckedDocs] = useState<Documents[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [folderVisible, setFolderVisible] = useState(false);
  const { data: sessionData } = useSession();

  const handleMenuClick = (document: Documents) => {
    setSelectedDocument(document);
    setModalVisible(true);
  };

  const documents = api.documents.getAll.useQuery();
  const folders = api.folders.getAll.useQuery();

  const [functionOutput, setFunctionOutput] = useState<string>("");

  const [enabledFunctions, setEnabledFunctions] = useState(
    Object.keys(FUNCTIONS)
  );

  const xml = React.useMemo(() => {
    const funcs: { [key: string]: any } = {};
    enabledFunctions.forEach((key) => {
      funcs[key] = FUNCTIONS[key];
    });
    return convertToXML(funcs);
  }, [enabledFunctions]);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    stop,
    append,
  } = useChat({
    api: "/api/chat",
    body: {
      functions: xml,
      additional_data: checkedDocs
        .map((doc) => `title: ${doc.name} \ncontent: ${doc.content}`)
        .join(","),
    },
    onFinish: (res) => {
      parseStream(res, (content) => {
        setFunctionOutput(content);
      });
    },
  });

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

  const [calls, setCalls] = useState<{ [key: string]: string }>({});

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
    if (endOfFunction === -1) {
      return stream.slice(0, functionStart) + " " + functionName;
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
        .then((out: string) => {
          setCalls({ ...calls, [message.id]: out });
          run(out);
        });
    }

    return (
      <Typography.Text>
        {stream.slice(0, functionStart)}{" "}
        <div className="flex flex-row items-center space-x-4">
          {message.id in calls ? (
            <Tooltip title={calls[message.id]}>
              <CheckCircleTwoTone twoToneColor={"#22C55E"} />
            </Tooltip>
          ) : (
            <Spin />
          )}
          <Typography.Text></Typography.Text>
          {functionName}
        </div>{" "}
        {stream.slice(endOfFunction + 16)}
      </Typography.Text>
    );
  };

  const [loading, setLoading] = useState(false);

  function submissionHandler(e: any) {
    if (functionOutput) {
      setFunctionOutput("");
      const result = `function output: ${functionOutput}\n${input}`;
      append({
        role: "user",
        content: result,
      });
      setInput("");
    } else {
      handleSubmit(e);
    }
  }

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className="pl-4 font-semibold text-white">ClaudeScholar</div>
        <AuthShowcase />
      </Header>
      <Layout>
        <Sider
          width={250}
          style={{
            background: colorBgContainer,
            height: "100vh",
            overflowY: "auto",
          }}
        >
          <div className="mt-4 flex flex-1 items-center justify-center p-4 text-white">
            {sessionData ? (
              <FileUpload />
            ) : (
              <Button type="primary" onClick={() => signIn("google")}>
                Sign In To Save Documents
              </Button>
            )}
          </div>
          <Menu
            mode="inline"
            defaultSelectedKeys={["1"]}
            defaultOpenKeys={["sub1"]}
            style={{ height: "fit-content", borderRight: 0 }}
            items={docMenuItems}
          />
          {sessionData && <CreateNewFolder />}
          <h3 className="text-center">Tools</h3>
          <Menu
            mode="inline"
            style={{ height: "fit-content", borderRight: 0 }}
            items={Object.keys(FUNCTIONS).map((key) => ({
              key,
              label: key,
              icon: (
                <div className="flex flex-row items-center space-x-2">
                  <Checkbox
                    checked={enabledFunctions.includes(key)}
                    onChange={() => {
                      if (enabledFunctions.includes(key)) {
                        setEnabledFunctions(
                          enabledFunctions.filter((f) => f !== key)
                        );
                      } else {
                        setEnabledFunctions([...enabledFunctions, key]);
                      }
                    }}
                  />{" "}
                  {FUNCTIONS[key].icon}
                </div>
              ),
            }))}
          />
        </Sider>
        <Layout style={{ padding: "24px 24px 24px" }}>
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
              <Run.ManagedInterface
                uuid={uuid}
                setUuid={setUuid}
                dispatcherUrl={dispatcherUrl}
              />
              <Content
                className={uuid ? "" : "hidden"}
                style={{
                  padding: 24,
                  margin: 0,
                  minHeight: 280,
                  background: colorBgContainer,
                  overflow: "auto",
                }}
              >
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
                        {message.role === "assistant"
                          ? parseStream(message)
                          : message.content.startsWith("function output: ")
                          ? message.content.split("\n").slice(1).join("\n")
                          : message.content}
                      </div>
                    </div>
                  );
                })}
              </Content>

              <Input
                className={uuid ? "" : "hidden"}
                value={input}
                onChange={handleInputChange}
                size="large"
                onPressEnter={submissionHandler}
                placeholder="Chat with BioClaude ..."
                addonAfter={
                  !loading ? (
                    <SendOutlined
                      className="cursor-pointer text-gray-400 hover:text-black"
                      onClick={submissionHandler}
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
      <InfoModal />
    </Layout>
  );
};

export default App;

