import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Space,
  type MenuProps,
} from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  SearchOutlined,
  TrophyOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '儀表板',
    },
    {
      key: '/employees',
      icon: <UserOutlined />,
      label: '員工管理',
    },
    {
      key: '/leave',
      icon: <CalendarOutlined />,
      label: '請假管理',
    },
    {
      key: '/attendance',
      icon: <ClockCircleOutlined />,
      label: '考勤記錄',
    },
    {
      key: '/payroll',
      icon: <DollarOutlined />,
      label: '薪資管理',
    },
    {
      key: '/recruitment',
      icon: <UserAddOutlined />,
      label: '招聘管理',
    },
    {
      key: '/performance',
      icon: <TrophyOutlined />,
      label: '績效管理',
    },
    {
      key: '/documents',
      icon: <FileTextOutlined />,
      label: '文檔管理',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '報表分析',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'HRM' : 'HRM 系統'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div></div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user?.name}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
