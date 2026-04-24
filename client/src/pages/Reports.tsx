import React from 'react';
import { Row, Col, Card, Button, Space } from 'antd';
import { BarChartOutlined, DownloadOutlined } from '@ant-design/icons';

export default function Reports() {
  const reportTemplates = [
    {
      name: '員工報告',
      description: '列出所有員工的基本資料',
    },
    {
      name: '請假統計報告',
      description: '按部門統計請假情況',
    },
    {
      name: '考勤統計報告',
      description: '每月考勤遲到早退統計',
    },
    {
      name: '薪資報告',
      description: '每月薪資支出明細',
    },
    {
      name: '招聘統計',
      description: '招聘進度統計分析',
    },
    {
      name: '績效評核報告',
      description: '績效分佈統計',
    },
  ];

  return (
    <div>
      <h1>報表分析</h1>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {reportTemplates.map((report, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Card title={report.name} bordered={false}>
              <p>{report.description}</p>
              <div style={{ marginTop: 16 }}>
                <Button type="primary" icon={<DownloadOutlined />}>
                  生成報告
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
