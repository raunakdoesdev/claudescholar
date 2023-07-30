import { DeleteOutlined } from "@ant-design/icons";
import { Button, Modal, Typography } from "antd";
import { api } from "~/utils/api";

interface ModalProps {
  onDelete: () => void;
  selectedDocument: any;
  setModalVisible: (visible: boolean) => void;
}
export const DocModal = ({
  onDelete,
  selectedDocument,
  setModalVisible,
}: ModalProps) => {
  const { mutateAsync: deleteDocument } = api.documents.delete.useMutation();

  const handleDelete = async () => {
    try {
      await deleteDocument({ id: selectedDocument.id });
      onDelete();
      setModalVisible(false);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  return (
    <Modal
      title={selectedDocument.name}
      centered
      open={true}
      onCancel={() => setModalVisible(false)}
      footer={[
        <Button
          key="back"
          onClick={handleDelete}
          icon={<DeleteOutlined />}
          danger
        >
          Delete
        </Button>,
      ]}
    >
      <Typography.Paragraph>{selectedDocument.content}</Typography.Paragraph>
    </Modal>
  );
};
