import Result from 'antd/es/result';
import Button from 'antd/es/button';
import theme from 'antd/es/theme';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: token.colorBgLayout,
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在。"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    </div>
  );
}
