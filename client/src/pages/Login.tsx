import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import styles from '../assets/styles/Login.module.css';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        message.success('登入成功');
        navigate('/');
      } else {
        message.error('登入失敗，請檢查郵箱和密碼');
      }
    } catch (error) {
      message.error('登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={20} sm={16} md={12} lg={8}>
          <Card
            title="HRM 人力資源管理系統"
            bordered={false}
            className={styles.loginCard}
          >
            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              size="large"
            >
              <Form.Item
                name="email"
                rules={[{ required: true, message: '請輸入郵箱地址' }, { type: 'email', message: '請輸入有效的郵箱' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="郵箱"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '請輸入密碼' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密碼"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                >
                  登入
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
