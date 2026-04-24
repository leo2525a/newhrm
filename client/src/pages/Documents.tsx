
import { Table, Button, Space, Card, Input } from 'antd';
import { PlusOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Document {
  id: string;
  title: string;
  employeeName: string;
  type: string;
  uploadDate: string;
  size: number;
}

export default function Documents() {
  const columns: ColumnsType<Document> = [
    {
      title: '標題',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '員工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: '類型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '上傳日期',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size) => `${(size / 1024 / 1024).toFixed(2)} MB`,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link" icon={<DownloadOutlined />}>下載</Button>
          <Button type="link" danger>刪除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="搜索文檔"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />}>
          上傳文檔
        </Button>
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </Card>
  );
}
