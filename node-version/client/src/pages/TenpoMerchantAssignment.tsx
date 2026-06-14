import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { Panel, Button, Message, toaster, CheckPicker, Tree } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import '../styles/tenpo-merchant-assignment.css';

interface Category {
  id: number;
  name: string;
  icon: string | null;
  level: number;
  parentId: number | null;
  isSystem: boolean;
  parent?: { id: number; name: string } | null;
  _count?: { merchants: number };
}

interface TreeNode {
  value: string;
  label: string;
  children?: TreeNode[];
}

const TenpoMerchantAssignment: FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [uncategorizedMerchants, setUncategorizedMerchants] = useState<string[]>([]);
  const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar categorías (solo level 1 y 2)
  useEffect(() => {
    fetchCategories();
  }, []);

  // Cargar merchants sin categoría
  useEffect(() => {
    fetchUncategorizedMerchants();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/tenpo/categories?flat=true');
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data: Category[] = await response.json();
      
      // Filtrar todas las categorías (incluyendo level 3)
      setCategories(data);
    } catch (error: any) {
      toaster.push(
        <Message showIcon type="error" closable>
          Error al cargar categorías: {error.message}
        </Message>,
        { placement: 'topCenter', duration: 4000 }
      );
    }
  };

  const fetchUncategorizedMerchants = async () => {
    try {
      const response = await fetch('/api/tenpo/merchants/uncategorized');
      if (!response.ok) throw new Error('Error al cargar comercios');
      const data: string[] = await response.json();
      setUncategorizedMerchants(data);
    } catch (error: any) {
      toaster.push(
        <Message showIcon type="error" closable>
          Error al cargar comercios: {error.message}
        </Message>,
        { placement: 'topCenter', duration: 4000 }
      );
    }
  };

  // Construir árbol para RSuite Tree (Soporte hasta level 3)
  const buildTreeData = (): TreeNode[] => {
    const level1Categories = categories.filter(cat => cat.level === 1);
    
    return level1Categories.map(cat1 => {
      // Level 2 children
      const childrenLevel2 = categories
        .filter(cat2 => cat2.parentId === cat1.id && cat2.level === 2);

      const childrenNodesLevel2 = childrenLevel2.map(cat2 => {
        // Level 3 children
        const childrenLevel3 = categories
          .filter(cat3 => cat3.parentId === cat2.id && cat3.level === 3)
          .map(cat3 => ({
            value: cat3.id.toString(),
            label: `${cat3.icon || ''} ${cat3.name} (${cat3._count?.merchants || 0})`.trim()
          }));

        return {
          value: cat2.id.toString(),
          label: `${cat2.icon || ''} ${cat2.name} (${cat2._count?.merchants || 0})`.trim(),
          children: childrenLevel3.length > 0 ? childrenLevel3 : undefined
        };
      });

      return {
        value: cat1.id.toString(),
        label: `${cat1.icon || ''} ${cat1.name} (${cat1._count?.merchants || 0})`.trim(),
        children: childrenNodesLevel2.length > 0 ? childrenNodesLevel2 : undefined
      };
    });
  };

  const handleAssign = async () => {
    if (!selectedCategoryId) {
      toaster.push(
        <Message showIcon type="warning" closable>
          Selecciona una categoría destino
        </Message>,
        { placement: 'topCenter', duration: 3000 }
      );
      return;
    }

    if (selectedMerchants.length === 0) {
      toaster.push(
        <Message showIcon type="warning" closable>
          Selecciona al menos un comercio
        </Message>,
        { placement: 'topCenter', duration: 3000 }
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tenpo/merchants/batch-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantNames: selectedMerchants,
          categoryId: parseInt(selectedCategoryId)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al asignar comercios');
      }

      const result = await response.json();
      
      toaster.push(
        <Message showIcon type="success" closable>
          {result.message}
        </Message>,
        { placement: 'topCenter', duration: 4000 }
      );

      // Refrescar lista de uncategorized y limpiar selección
      setSelectedMerchants([]);
      setSelectedCategoryId(null);
      await fetchUncategorizedMerchants();
      await fetchCategories(); // Actualizar contadores

    } catch (error: any) {
      toaster.push(
        <Message showIcon type="error" closable>
          {error.message}
        </Message>,
        { placement: 'topCenter', duration: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  const treeData = buildTreeData();
  const merchantOptions = uncategorizedMerchants.map(name => ({
    label: name,
    value: name
  }));

  return (
    <div className="tenpo-merchant-assignment-container">
      <div className="assignment-header">
        <h2>📦 Asignación de Comercios a Categorías</h2>
        <Button 
          appearance="subtle" 
          onClick={() => navigate('/tenpo/categories')}
        >
          ← Volver a Gestión Categorías
        </Button>
      </div>

      <Panel bordered className="assignment-panel">
        <div className="assignment-instructions">
          <Message showIcon type="info">
            <strong>Instrucciones:</strong> Selecciona una categoría destino del árbol, 
            luego selecciona uno o más comercios sin categoría y presiona "Asignar".
          </Message>
        </div>

        {/* Árbol de Categorías */}
        <div className="form-section">
          <label className="form-label">
            🌳 Categoría Destino (Selecciona Nivel 1, 2 o 3)
          </label>
          <Tree
            data={treeData}
            value={selectedCategoryId}
            onChange={(value) => setSelectedCategoryId(value as string)}
            searchable
            style={{ width: '100%' }}
            height={300}
            virtualized
          />
        </div>

        {/* Selector de Comercios */}
        <div className="form-section">
          <label className="form-label">
            🏪 Comercios Sin Categoría ({uncategorizedMerchants.length})
          </label>
          <div className="help-text">
            💡 Usa <kbd>Ctrl+Click</kbd> para seleccionar múltiples comercios
          </div>
          <CheckPicker
            data={merchantOptions}
            value={selectedMerchants}
            onChange={(value) => setSelectedMerchants(value as string[])}
            searchable
            placeholder="Busca y selecciona comercios..."
            style={{ width: '100%' }}
            disabled={uncategorizedMerchants.length === 0}
            menuStyle={{ maxHeight: 400 }}
            countable
            sticky
          />
          {selectedMerchants.length > 0 && (
            <div className="selection-count">
              {selectedMerchants.length} comercio(s) seleccionado(s)
            </div>
          )}
        </div>

        {/* Botón de Asignación */}
        <div className="form-actions">
          <Button
            appearance="primary"
            size="lg"
            onClick={handleAssign}
            loading={loading}
            disabled={!selectedCategoryId || selectedMerchants.length === 0 || loading}
          >
            ✅ Asignar {selectedMerchants.length > 0 ? `(${selectedMerchants.length})` : ''}
          </Button>
          
          {selectedMerchants.length > 0 && (
            <Button
              appearance="subtle"
              onClick={() => setSelectedMerchants([])}
              disabled={loading}
            >
              Limpiar Selección
            </Button>
          )}
        </div>
      </Panel>

      {/* Estadísticas */}
      <Panel bordered className="stats-panel">
        <h4>📊 Estadísticas</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Categorías (L1-L2):</span>
            <span className="stat-value">{categories.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Comercios Sin Categoría:</span>
            <span className="stat-value">{uncategorizedMerchants.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Seleccionados:</span>
            <span className="stat-value">{selectedMerchants.length}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
};

export default TenpoMerchantAssignment;
