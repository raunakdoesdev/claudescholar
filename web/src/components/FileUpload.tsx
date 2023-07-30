/* eslint-disable @typescript-eslint/no-floating-promises */
import { LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { useCompletion } from "ai/react";
import type { UploadProps } from "antd";
import { Typography, Alert, Button, Input, Modal, Upload } from "antd";
import React, { useState } from "react";

const FileUpload: React.FC = () => {
  const [processing, setProcessing] = useState(false);

  const { complete, completion, isLoading, error } = useCompletion({
    api: "/api/completion",
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
            complete(
              `${data.content} \n\n\n Please summarize the above content into 5 sentences.`
            );
          });
      }
    },
  };

  return (
    <>
      <Modal open={processing}>
        {error ? (
          <Alert message={error.message} type="error" />
        ) : (
          <Alert
            message={
              <div className="flex flex-row space-x-2">
                <LoadingOutlined spin />
                <Typography.Text>Processing PDF</Typography.Text>
              </div>
            }
            type="info"
          />
        )}

        <Typography.Paragraph>{completion}</Typography.Paragraph>
        <Button
          className="w-full"
          type="primary"
          onClick={() => {
            setProcessing(false);
          }}
        >
          Continue
        </Button>
      </Modal>
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Click to Upload File</Button>
      </Upload>
    </>
  );
};

export default FileUpload;
