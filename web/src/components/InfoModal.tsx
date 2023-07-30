import { Typography, Button, Modal } from "antd";
import { CheckOutlined, QuestionOutlined } from "@ant-design/icons";
import React from "react";
import styles from "../styles/main.module.css";

export const InfoModal = () => {
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);

  return (
    <div className={styles.modalContainer}>
      <div className={styles.modalBtn} onClick={() => setModalVisible(true)}>
        ?
      </div>
      <Modal
        centered
        open={modalVisible}
        style={{ width: 500, height: 500 }}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button
            key="Get Started!"
            onClick={() => setModalVisible(false)}
            icon={<CheckOutlined />}
          >
            Get Started!
          </Button>,
        ]}
      >
        <Typography.Title level={4}>Hey! I'm ClaudeScholar</Typography.Title>
        <Typography.Paragraph>
          ClaudeScholar is your knowledge repositiory and research assistant
          built to help you focus on the science that matters. Upload and search
          any articles via a chat interface to uncover insights across multiple
          research papers. ClaudeScholar is equipped wiht tools to help you
          launch complicated workflows like generating new compounds and
          modeling protein interactions using state of the art research such as
          RFDiffusion.
        </Typography.Paragraph>
        <Typography.Paragraph>
          Try asking ClaudeScholar to search a topic on PubMed, to visualize a
          protein, generate a new molecules that can bind to a given protein
          using RFDiffusion, and instantly find similar molecules!
        </Typography.Paragraph>
        <Typography.Paragraph>
          To get started, click the "Get Started!" button below.
        </Typography.Paragraph>
      </Modal>
    </div>
  );
};
