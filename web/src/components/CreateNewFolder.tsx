import { Input } from "antd";
import { api } from "~/utils/api";
import React, { useState } from "react";

export const CreateNewFolder = () => {
    const [addingFolder, setAddingFolder] = useState<boolean>(false);
    const [folderName, setFolderName] = useState<string>('');
    const folders = api.folders.getAll.useQuery();
  
    const addFolderMutation = api.folders.add.useMutation({
      // onSuccess will run after the mutation is successful
      onSuccess: async () => {
        // Refetch folders after successful add 
        console.log('onSuccess');
        await folders.refetch();
        setAddingFolder(false);
      },
    });
  
    const createNewFolder = async () => {
      console.log('createNewFolder');
  
      try {
        // Call the mutation and wait for the response
        const response = await addFolderMutation.mutateAsync({
          text: folderName,
        });
      } catch (error) {
        console.error('Error creating new folder:', error);
      }
    };
  
    return (
      <>
      <div className="flex justify-center items-center flex-1 text-black p-4"><button onClick={()=>setAddingFolder(true)}>Add new folder</button></div>
      {addingFolder && <div className="flex justify-center items-center flex-1 text-black p-4"><Input placeholder="Folder Name" value={folderName} type="text" onChange={(e)=>{setFolderName(e.target.value)}} onPressEnter={createNewFolder}/></div>}</>
    );
  };