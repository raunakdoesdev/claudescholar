import { Modal, message } from "antd";
import { useEffect, useState } from "react";
import { Run } from "@oloren/shared";
import { socket } from "@oloren/shared";
type NodeDb = any;
type Json = any;

type Progress = {
  progressId: string;
  level: number;
  type: "message" | "error" | "success";
  date?: string;
  data?: any;
};

/** Creates interface as a modal */
export function Interface({
  uuid,
  dispatcherUrl,
}: {
  uuid: string;
  dispatcherUrl: string;
}) {
  const [uiQueue, setUiQueue] = useState<{ id: number; inputs: Json[] }[]>([]);
  const [nodesMap, setNodesMap] = useState<{ [key: string]: NodeDb }>({});
  const [activeUi, setActiveUi] = useState<any[]>([]);
  const [progressRaw, setProgressRaw] = useState<any>({});

  useEffect(() => {
    if (uiQueue.length === 0) return;

    let newUiQueue = JSON.parse(JSON.stringify(uiQueue)) as typeof uiQueue;
    uiQueue.forEach(({ id, inputs }) => {
      if (id in nodesMap) {
        newUiQueue = newUiQueue.filter((ui) => ui.id !== id);
        setActiveUi([...activeUi, { id, inputs, node: nodesMap[id] }]);
      }
    });
    if (newUiQueue.length !== uiQueue.length) setUiQueue(newUiQueue);
  }, [uiQueue, nodesMap]);

  console.log("I am interface with uuid: ", uuid);

  socket.useManagedSocket(uuid, {
    ui: ({
      id,
      inputs,
    }: {
      id: number;
      frontend_id: string;
      inputs: Json[];
    }) => {
      console.log("ui", inputs);
      setUiQueue((prev) => [...prev, { id, inputs }]);
    },
    node: (node: NodeDb) => {
      console.log("node", node);
      if (node.status === "finished") {
      }
      if (node.status === "error") {
        message.error("Error running node: " + node.logs);
      } else {
        setNodesMap((prev) => ({
          ...prev,
          [node.id]: node,
        }));
      }
    },
    progress: (progress: Progress) => {
      console.log("GOT PROGRESS: ", progress);
      let newProgressRaw = { ...progressRaw };
      if (!(progress.progressId in progressRaw)) {
        newProgressRaw[progress.progressId] = progress;
        setProgressRaw(newProgressRaw);
      } else {
        let oldProgress = {
          ...progressRaw[progress.progressId],
          data: JSON.parse(
            JSON.stringify(progressRaw[progress.progressId].data)
          ),
        };
        if ("date" in progress) {
          oldProgress.date = progress.date;
        }
        // update oldProgress.data with the individual properties of progress.data
        // check if progress.data is an object
        if (typeof progress.data === "object") {
          for (const [key, value] of Object.entries(progress.data)) {
            oldProgress.data[key] = value;
          }
        }

        newProgressRaw[progress.progressId] = oldProgress;
        setProgressRaw(newProgressRaw);
      }
    },
  });

  return activeUi.length > 0 ? (
    <Modal
      open={true}
      footer={null}
      style={{ transform: "translateZ(0)" }}
      width={window.innerWidth * 0.8}
      className="h-fit"
    >
      <Run.RenderUI
        {...activeUi[0]}
        active={true}
        dispatcherUrl={dispatcherUrl}
        finished={() => {
          setActiveUi(activeUi.slice(1));
        }}
      />
    </Modal>
  ) : null;
}
