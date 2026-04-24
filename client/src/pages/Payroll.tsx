import { Table, Card, Input, Button } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Payroll {
  id: string;
  employeeName: string;
  month: string;
  basicSalary: number;
  allowance: number;
  deduction: number;
  netSalary: number;
  status: string;
}

export default function Payroll() {
  const columns: ColumnsType<Payroll> = [
    {
      title: '員工姓名',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: '基本薪資',
      dataIndex: 'basicSalary',
      key: 'basicSalary',
      align: 'right',
    },
    {
      title: '津貼',
      dataIndex: 'allowance',
      key: 'allowance',
      align: 'right',
    },
    {
      title: '扣減',
      dataIndex: 'deduction',
      key: 'deduction',
      align: 'right',
    },
    {
      title: '實發薪資',
      dataIndex: 'netSalary',
      key: 'netSalary',
      align: 'right',
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
        <Button type="link" icon={<DownloadOutlined />}>
          下載單據
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          placeholder="搜索員工薪資"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<DownloadOutlined />}>
          匯出報表
        </Button>
      </div>
      <Table columns={columns} dataSource={[]} rowKey="id" />
    </Card>
  );
}
