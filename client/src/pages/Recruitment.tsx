import React from 'react';
import { Table, Button, Space, Card, Input, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Candidate {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  status: string;
}

export default function Recruitment() {
  const getStatusTag = (status: string) => {
    const colors: Record<string, string> = {
      applied: 'blue',
      interviewing: 'orange',
      offered: 'green',
      rejected: 'red',
    };
    const labels: Record<string, string> = {
      applied: '已申請',
      interviewing: '面試中',
      offered: '已錄取',
      rejected: '已拒絕',
    };
    return <Tag color={colors[status]}>{labels[status]}</Tag>;
  };

  const columns: ColumnsType<Candidate> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '應徵職位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '郵箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '電話',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">查看</Button>
          <Button type="link">編輯</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="搜索候選人"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />}>
          新增候選人
        </Button>
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </Card>
  );
}
