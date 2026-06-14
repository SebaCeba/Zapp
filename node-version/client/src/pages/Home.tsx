import { Button } from 'rsuite';
import type { FC } from 'react';
import MainLayout from '../layout/MainLayout';


const Home: FC = () => {
  return (
    <MainLayout>
      <div>
        {/* TEST RSuite - Remover después */}
        <div style={{ 
          padding: '1rem', 
          background: '#f0f8ff', 
          border: '2px dashed #2563eb',
          marginBottom: '1rem' 
        }}>
          <h3>✅ Test RSuite</h3>
          <Button appearance="primary">Botón RSuite Funciona!</Button>
          <Button appearance="subtle" style={{ marginLeft: '1rem' }}>Botón Subtle</Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
