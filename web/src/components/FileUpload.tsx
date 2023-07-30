/* eslint-disable @typescript-eslint/no-floating-promises */
import React from "react";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { Button, message, Upload } from "antd";
import { api } from "~/utils/api";

const FileUpload: React.FC = () => {
  //   const addDocument = api.documents.add({});
  const props: UploadProps = {
    name: "file",
    action: "https://dispatcher.236409319020.oloren.aws.olorencore.com/upload",
    headers: {
      authorization: "authorization-text",
    },
    onChange(info) {
      if (info.file.status === "done") {
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
            // api.documents.add({});
          });
      }
    },
  };

  return (
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>Click to Upload File</Button>
    </Upload>
  );
};

export default FileUpload;
