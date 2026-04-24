import React from 'react';
import { Table, Button, Space, Card, Tag, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Leave {
  id: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function Leave() {
  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red',
    };
    const labelMap: Record<string, string> = {
      pending: '待審核',
      approved: '已批准',
      rejected: '已拒絕',
    };
    return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>;
  };

  const columns: ColumnsType<Leave> = [
    {
      title: '員工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: '假別',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '開始日期',
      dataIndex: 'startDate',
      key: 'startDate',
    },
    {
      title: '結束日期',
      dataIndex: 'endDate',
      key: 'endDate',
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
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <>
              <Button type="primary" size="small">批准</Button>
              <Button danger size="small">拒絕</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="搜索請假記錄"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />}>
          新增請假
        </Button>
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </Card>
  );
}
