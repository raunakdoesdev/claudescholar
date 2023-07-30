import { api } from "~/utils/api";
import { Typography, Button, Modal, Select, Input } from "antd";
import { DeleteOutlined, SendOutlined } from "@ant-design/icons";
import { Folders } from "@prisma/client";
import React from "react";

interface ModalProps {
  onDelete: () => void;
  folder: any;
  setModalVisible: (visible: boolean) => void;
}

export const FolderModal = ({
  onDelete,
  folder,
  setModalVisible,
}: ModalProps) => {
  const { mutateAsync: deleteDocument } = api.folders.delete.useMutation();
  const { mutateAsync: update } = api.folders.update.useMutation();
  const [newFolderName, setNewFolderName] = React.useState<string>("");

  const handleDelete = async () => {
    try {
      await deleteDocument({ id: folder.id });
      onDelete();
      setModalVisible(false);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      await update({
        id: folder.id as string,
        text: newFolderName,
      });
      console.log("trying");
      onDelete();
      setModalVisible(false);
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  return (
    <Modal
      title={folder.name}
      centered
      open={true}
      style={{ width: 500, height: 500 }}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button
          key="back"
          onClick={handleDelete}
          icon={<DeleteOutlined />}
          danger
        >
          Delete Folder
        </Button>,
      ]}
    >
      <Typography.Title level={4}>Rename Folder</Typography.Title>
      <Input
        placeholder="Folder Name"
        defaultValue={folder.title}
        style={{ width: "50%" }}
        onChange={(e) => setNewFolderName(e.target.value)}
        onPressEnter={handleUpdate}
        addonAfter={
          <SendOutlined
            className="cursor-pointer text-gray-400 hover:text-black"
            onClick={handleUpdate}
          />
        }
      />
    </Modal>
  );
};
