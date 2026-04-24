import React from 'react';
import { Table, Card, Input, DatePicker, Space } from 'antd';
import { SearchOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Attendance {
  id: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
}

export default function Attendance() {
  const columns: ColumnsType<Attendance> = [
    {
      title: '員工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '上班打卡',
      dataIndex: 'checkIn',
      key: 'checkIn',
    },
    {
      title: '下班打卡',
      dataIndex: 'checkOut',
      key: 'checkOut',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Input
          placeholder="搜索員工"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <DatePicker.RangePicker />
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </Card>
  );
}
