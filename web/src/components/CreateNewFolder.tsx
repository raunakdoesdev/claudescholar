import { Input } from "antd";
import { api } from "~/utils/api";
import React, { useState } from "react";

export const CreateNewFolder = () => {
  const [addingFolder, setAddingFolder] = useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>("");
  const folders = api.folders.getAll.useQuery();

  const addFolderMutation = api.folders.add.useMutation({
    // onSuccess will run after the mutation is successful
    onSuccess: async () => {
      // Refetch folders after successful add
      console.log("onSuccess");
      await folders.refetch();
      setAddingFolder(false);
    },
  });

  const createNewFolder = async () => {
    console.log("createNewFolder");

    try {
      // Call the mutation and wait for the response
      const response = await addFolderMutation.mutateAsync({
        text: folderName,
      });
    } catch (error) {
      console.error("Error creating new folder:", error);
    }
  };

  return (
    <>
      <div className="flex flex-1 items-center justify-center p-4 text-black">
        <button
          style={{
            backgroundColor: "#007BFF", // Set the background color
            color: "#FFFFFF", // Set the text color
            padding: "10px 20px", // Set padding (top/bottom, left/right)
            border: "none", // Remove the button border
            borderRadius: "4px", // Add border radius for rounded corners
            cursor: "pointer", // Show pointer cursor on hover
          }}
          onClick={() => setAddingFolder(true)}
        >
          Add new folder
        </button>
      </div>
      {addingFolder && (
        <div className="flex flex-1 items-center justify-center p-4 text-black">
          <Input
            placeholder="Folder Name"
            value={folderName}
            type="text"
            onChange={(e) => {
              setFolderName(e.target.value);
            }}
            onPressEnter={createNewFolder}
          />
        </div>
      )}
    </>
  );
};
