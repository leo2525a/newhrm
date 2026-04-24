import React from 'react';
import { Table, Button, Space, Card, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Performance {
  id: string;
  employeeName: string;
  period: string;
  score: number;
  rating: string;
  status: string;
}

export default function Performance() {
  const columns: ColumnsType<Performance> = [
    {
      title: '員工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: '評核週期',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: '分數',
      dataIndex: 'score',
      key: 'score',
    },
    {
      title: '評級',
      dataIndex: 'rating',
      key: 'rating',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
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
          placeholder="搜索績效記錄"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />}>
          新增評核
        </Button>
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </Card>
  );
}
