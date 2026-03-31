import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layout, Menu, Table, Button, Modal, Form, Input, InputNumber,
  Card, Statistic, Row, Col, message, Space, Tag
} from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  StockOutlined,
  PlusOutlined,
  MinusOutlined
} from '@ant-design/icons';

const { Header, Content, Sider } = Layout;

// API Configuration
const API_URL = 'https://inventory-management-backend-2-2h44.onrender.com/api';

// Dashboard Component
const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/analytics/summary`),
        axios.get(`${API_URL}/products`)
      ]);
      setSummary(summaryRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error:', error);
      message.error('Failed to load data. Make sure backend is running on port 8000');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Loading dashboard...</div>;

  if (!summary) return <div style={{ padding: 50, textAlign: 'center' }}>Error loading data. Please check backend connection.</div>;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Products"
              value={summary.total_products}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Inventory Value"
              value={summary.total_inventory_value}
              prefix="$"
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={summary.low_stock_count}
              prefix={<StockOutlined />}
              valueStyle={{ color: summary.low_stock_count > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {summary.low_stock_items?.length > 0 && (
        <Card title="⚠️ Low Stock Alerts" style={{ marginBottom: 24 }}>
          {summary.low_stock_items.map(item => (
            <Tag color="red" key={item.product_id} style={{ margin: 4 }}>
              {item.product_name}: {item.current_stock} left (Reorder at {item.reorder_level})
            </Tag>
          ))}
        </Card>
      )}

      <Card title="Recent Transactions" style={{ marginBottom: 24 }}>
        <Table
          dataSource={summary.recent_transactions}
          columns={[
            { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
            { title: 'Product ID', dataIndex: 'product_id', key: 'product_id', width: 100 },
            { 
              title: 'Type', 
              dataIndex: 'type', 
              key: 'type',
              render: (type) => (
                <Tag color={type === 'IN' ? 'green' : 'red'}>
                  {type === 'IN' ? 'Stock IN' : 'Stock OUT'}
                </Tag>
              )
            },
            { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
            { title: 'Date', dataIndex: 'date', key: 'date', render: (date) => new Date(date).toLocaleString() }
          ]}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Card title="Product List">
        <Table
          dataSource={products}
          columns={[
            { title: 'SKU', dataIndex: 'sku', key: 'sku' },
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Category', dataIndex: 'category', key: 'category' },
            { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `$${price}` },
            { 
              title: 'Stock', 
              dataIndex: 'stock', 
              key: 'stock',
              render: (stock, record) => (
                <Tag color={stock <= record.reorder_level ? 'red' : 'green'}>
                  {stock}
                </Tag>
              )
            }
          ]}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
};

// Products Management Component
const Products = () => {
  const [products, setProducts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      message.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (values) => {
    try {
      await axios.post(`${API_URL}/products`, values);
      message.success('Product created successfully');
      setModalVisible(false);
      form.resetFields();
      fetchProducts();
    } catch (error) {
      message.error('Failed to create product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`${API_URL}/products/${productId}`);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const columns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `$${price}` },
    { title: 'Stock', dataIndex: 'stock', key: 'stock' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button danger size="small" onClick={() => handleDeleteProduct(record.id)}>
          Delete
        </Button>
      )
    }
  ];

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setModalVisible(true)}
        style={{ marginBottom: 16 }}
      >
        Add Product
      </Button>

      <Table 
        dataSource={products} 
        columns={columns} 
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="Create New Product"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCreateProduct} layout="vertical">
          <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
            <Input placeholder="e.g., PROD001" />
          </Form.Item>
          <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Laptop" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Input placeholder="e.g., Electronics" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Product description" />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <InputNumber prefix="$" style={{ width: '100%' }} placeholder="0.00" />
          </Form.Item>
          <Form.Item name="stock" label="Initial Stock">
            <InputNumber style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="reorder_level" label="Reorder Level">
            <InputNumber style={{ width: '100%' }} placeholder="10" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Product
              </Button>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Transactions Component
const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/transactions`);
      setTransactions(response.data);
    } catch (error) {
      message.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async (values) => {
    try {
      await axios.post(`${API_URL}/transactions`, values);
      message.success('Transaction recorded successfully');
      setModalVisible(false);
      form.resetFields();
      fetchTransactions();
    } catch (error) {
      message.error(error.response?.data?.detail || 'Failed to record transaction');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Product ID', dataIndex: 'product_id', key: 'product_id', width: 100 },
    { 
      title: 'Type', 
      dataIndex: 'transaction_type', 
      key: 'type',
      render: (type) => (
        <Tag color={type === 'IN' ? 'green' : 'red'}>
          {type === 'IN' ? 'Stock IN' : 'Stock OUT'}
        </Tag>
      )
    },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Unit Price', dataIndex: 'unit_price', key: 'unit_price', render: (price) => `$${price}` },
    { title: 'Notes', dataIndex: 'notes', key: 'notes' },
    { title: 'Date', dataIndex: 'transaction_date', key: 'date', render: (date) => new Date(date).toLocaleString() }
  ];

  return (
    <div>
      <Button
        type="primary"
        icon={<StockOutlined />}
        onClick={() => setModalVisible(true)}
        style={{ marginBottom: 16 }}
      >
        Record Transaction
      </Button>

      <Table 
        dataSource={transactions} 
        columns={columns} 
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="Record Stock Transaction"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleCreateTransaction} layout="vertical">
          <Form.Item name="product_id" label="Product ID" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Enter product ID" />
          </Form.Item>
          <Form.Item name="transaction_type" label="Transaction Type" rules={[{ required: true }]}>
            <Input.Group compact>
              <Button 
                style={{ width: '50%' }} 
                onClick={() => form.setFieldsValue({ transaction_type: 'IN' })}
                type={form.getFieldValue('transaction_type') === 'IN' ? 'primary' : 'default'}
              >
                <PlusOutlined /> Stock IN
              </Button>
              <Button 
                style={{ width: '50%' }} 
                onClick={() => form.setFieldsValue({ transaction_type: 'OUT' })}
                type={form.getFieldValue('transaction_type') === 'OUT' ? 'primary' : 'default'}
                danger
              >
                <MinusOutlined /> Stock OUT
              </Button>
            </Input.Group>
          </Form.Item>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Enter quantity" />
          </Form.Item>
          <Form.Item name="unit_price" label="Unit Price" rules={[{ required: true }]}>
            <InputNumber prefix="$" style={{ width: '100%' }} placeholder="0.00" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Record Transaction
              </Button>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Main App Component
const App = () => {
  const [currentMenu, setCurrentMenu] = useState('dashboard');

  const renderContent = () => {
    switch(currentMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'transactions':
        return <Transactions />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ background: '#001529' }}>
        <div style={{ height: 32, margin: 16, color: '#fff', textAlign: 'center', fontSize: 18 }}>
          Inventory System
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentMenu]}
          onClick={({ key }) => setCurrentMenu(key)}
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: 'products', icon: <ShoppingOutlined />, label: 'Products' },
            { key: 'transactions', icon: <StockOutlined />, label: 'Transactions' }
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0, lineHeight: '64px' }}>Inventory Management System</h2>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 360 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
