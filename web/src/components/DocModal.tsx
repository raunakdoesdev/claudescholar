import { api } from "~/utils/api";
import { Button, Modal } from "antd";

interface ModalProps {
    onDelete: () => void;
    selectedDocument: any;
    setModalVisible: (visible: boolean) => void;
}
export const DocModal = ({onDelete, selectedDocument, setModalVisible}: ModalProps) => {

  const { mutateAsync: deleteDocument } = api.documents.delete.useMutation();

  const handleDelete = async () => {
    try {
      await deleteDocument({ id: selectedDocument.id });
      onDelete();
      setModalVisible(false);
    } catch (error) {
      console.error("Error deleting document:", error);
    };
  };

  return (
    <Modal
      title={selectedDocument.id}
      centered
      visible={true}
      onCancel={() => setModalVisible(false)}
      bodyStyle={{
        height: '50vh',
        width: '50vw',
      }}
        footer={[
          <Button key="back" onClick={handleDelete}>
            Delete
          </Button>,
        ]}
      >
      <p>{selectedDocument.content}</p>
    </Modal>
  )
}