/* eslint-disable @typescript-eslint/no-floating-promises */
import React from 'react';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, message, Upload } from 'antd';
import { api } from '~/utils/api';


const FileUpload: React.FC = () => {  
    const props: UploadProps = {
    name: 'file',
    // TODO sent to oloren URL
    action: api.documents.uploadAndProcessFile.mutate,
    headers: {
        authorization: 'authorization-text',
    },
    onChange(info) {
        if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
        }
        if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);

        } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
        }
    },
    };

    return (
    <Upload {...props}>
        <Button icon={<UploadOutlined />}>Click to Upload File</Button>
    </Upload>
    );
}

export default FileUpload;