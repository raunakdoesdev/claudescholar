/* eslint-disable @typescript-eslint/no-floating-promises */
import { LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useCompletion } from "ai/react";
import type { UploadProps } from "antd";
import {
  Typography,
  Alert,
  Button,
  Input,
  Modal,
  Upload,
  message,
  Form,
  Select,
} from "antd";
import React, { useState } from "react";
import { api } from "~/utils/api";

const FileUpload: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [form] = Form.useForm();

  const { complete, completion, isLoading, error } = useCompletion({
    api: "/api/completion",
  });

  const folders = api.folders.getAll.useQuery();
  const context = api.useContext();

  const addDocument = api.documents.add.useMutation({
    onSuccess: () => {
      context.documents.getAll.invalidate();
    },
  });

  //   const addDocument = api.documents.add({});
  const props: UploadProps = {
    name: "file",
    action: "https://dispatcher.236409319020.oloren.aws.olorencore.com/upload",
    headers: {
      authorization: "authorization-text",
    },
    onChange(info) {
      if (info.file.status === "done") {
        setProcessing(true);
        fetch(
          "https://dispatcher.236409319020.oloren.aws.olorencore.com/api/run/pdf2txt",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pdf: info.file.response[0],
            }),
          }
        )
          .then((response) => response.json())
          .then((data: { content: string }) => {
            setProcessing(false);
            setSummarizing(true);
            message.success("Finished Extracting Text Content");
            complete(
              `${data.content} \n\n\n Please summarize the above content. Output only a summary and nothing else.`
            );
          });
      }
    },
  };

  return (
    <>
      <Modal
        open={processing || summarizing}
        footer={null}
        closeIcon={false}
        closable={false}
      >
        <div className="flex flex-col space-y-2">
          {error ? (
            <Alert message={error.message} type="error" />
          ) : summarizing && (isLoading || !completion) ? (
            <Alert
              message={
                <div className="flex flex-row space-x-2">
                  <LoadingOutlined spin />
                  <Typography.Text>Summarizing PDF</Typography.Text>
                </div>
              }
              type="info"
            />
          ) : null}
          {processing ? (
            <Alert
              message={
                <div className="flex flex-row space-x-2">
                  <LoadingOutlined spin />
                  <Typography.Text>Processing PDF</Typography.Text>
                </div>
              }
              type="info"
            />
          ) : null}

          <Form
            form={form}
            onFinish={({ name, folder }: { name: string; folder?: string }) => {
              addDocument.mutate({
                name,
                text: completion,
                folderId: folder ?? undefined,
              });
              setProcessing(false);
              setSummarizing(false);
              form.resetFields();
            }}
          >
            <Form.Item label={"Name"} name="name" required>
              <Input />
            </Form.Item>
            <Form.Item label={"Folder"} name="folder">
              <Select
                options={folders.data?.map((folder) => ({
                  value: folder.id,
                  label: folder.title,
                }))}
              />
            </Form.Item>

            {summarizing ? (
              <Typography.Paragraph>{completion}</Typography.Paragraph>
            ) : null}
            <Button
              className="w-full"
              type="primary"
              htmlType="submit"
              disabled={isLoading || !completion}
            >
              Save Document
            </Button>
          </Form>
        </div>
      </Modal>
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Click to Upload File</Button>
      </Upload>
    </>
  );
};

export default FileUpload;
