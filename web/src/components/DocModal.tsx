import { api } from "~/utils/api";
import { Typography, Button, Modal, Select } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { Folders } from "@prisma/client";

interface ModalProps {
  onDelete: () => void;
  selectedDocument: any;
  setModalVisible: (visible: boolean) => void;
  folders: any;
}

export const DocModal = ({
  onDelete,
  selectedDocument,
  setModalVisible,
  folders,
}: ModalProps) => {
  const { mutateAsync: deleteDocument } = api.documents.delete.useMutation();
  const { mutateAsync: update } = api.documents.update.useMutation();

  const handleDelete = async () => {
    try {
      await deleteDocument({ id: selectedDocument.id });
      onDelete();
      setModalVisible(false);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleUpdate = async (value: string) => {
    console.log("value", value);
    try {
      await update({
        id: selectedDocument.id as string,
        folderId: value,
        text: selectedDocument.content as string,
        name: selectedDocument.name as string,
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
      title={selectedDocument.name}
      centered
      open={true}
      onCancel={() => setModalVisible(false)}
      footer={[
        <div style={{ gap: 20, display: "flex", justifyContent: "flex-end" }}>
          <Select
            options={folders.map((folder: Folders) => ({
              value: folder.id,
              label: folder.title,
            }))}
            defaultValue={selectedDocument.folderId}
            onChange={(value) => {
              handleUpdate(value);
            }}
            style={{ width: 100, textAlign: "center" }}
          />
          <Button
            key="back"
            onClick={handleDelete}
            icon={<DeleteOutlined />}
            danger
          >
            Delete
          </Button>
        </div>,
      ]}
    >
      <Typography.Paragraph>{selectedDocument.content}</Typography.Paragraph>
    </Modal>
  );
};
