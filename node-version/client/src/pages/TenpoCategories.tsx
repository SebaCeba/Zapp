import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Modal, Input, Panel, IconButton, FlexboxGrid, SelectPicker, Tag } from 'rsuite';
import MainLayout from '../layout/MainLayout';
import PageTitleSection from '../layout/PageTitleSection';
import TrashIcon from '@rsuite/icons/Trash';
import EditIcon from '@rsuite/icons/Edit';
import PlusIcon from '@rsuite/icons/Plus';
import '../styles/tenpo-tree.css';

interface Category {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  order: number;
  color: string | null;
  icon: string | null;
  isSystem: boolean;
  children?: Category[];
  _count?: {
    merchants: number;
    children: number;
  };
}

interface Merchant {
  name: string;
  category: Category | null;
}

export default function TenpoCategories() {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [uncategorizedMerchants, setUncategorizedMerchants] = useState<string[]>([]);
  const [allMerchants, setAllMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);
  const [newCategoryLevel, setNewCategoryLevel] = useState(1);
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3498db');
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  // Drag and Drop states
  const [draggedMerchant, setDraggedMerchant] = useState<string | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<number | null>(null);
  const [dragOverUncategorized, setDragOverUncategorized] = useState(false);
  
  // Expanded categories state
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Determinar página de origen para botón de regreso
  const returnPath = location.state?.from || '/tenpo';
  const returnLabel = returnPath.includes('actual') ? 'Tenpo Actual' : 'Tenpo Presupuesto';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, uncategorizedRes, merchantsRes] = await Promise.all([
        fetch('http://localhost:3000/api/tenpo/categories'),
        fetch('http://localhost:3000/api/tenpo/merchants/uncategorized'),
        fetch('http://localhost:3000/api/tenpo/merchants')
      ]);

      const categoriesData = await categoriesRes.json();
      const uncategorizedData = await uncategorizedRes.json();
      const merchantsData = await merchantsRes.json();

      setCategories(categoriesData);
      setUncategorizedMerchants(uncategorizedData);
      setAllMerchants(merchantsData);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/tenpo/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          parentId: newCategoryParentId,
          level: newCategoryLevel,
          icon: newCategoryIcon || null,
          color: newCategoryColor || null,
          order: 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear categoría');
      }

      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    try {
      const response = await fetch(`http://localhost:3000/api/tenpo/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          icon: newCategoryIcon || null,
          color: newCategoryColor || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar categoría');
      }

      setShowEditModal(false);
      setEditingCategory(null);
      resetForm();
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      const response = await fetch(`http://localhost:3000/api/tenpo/categories/${deletingCategory.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar categoría');
      }

      setShowDeleteModal(false);
      setDeletingCategory(null);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAssignMerchant = async () => {
    if (!selectedMerchant || !selectedCategoryId) {
      alert('Selecciona un comercio y una categoría');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/tenpo/merchants/${encodeURIComponent(selectedMerchant)}/category`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId: selectedCategoryId })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al asignar comercio');
      }

      setShowAssignModal(false);
      setSelectedMerchant('');
      setSelectedCategoryId(null);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryIcon(category.icon || '');
    setNewCategoryColor(category.color || '#3498db');
    setShowEditModal(true);
  };

  const openDeleteModal = (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  const openAddChildModal = (parent: Category) => {
    setNewCategoryParentId(parent.id);
    setNewCategoryLevel(parent.level + 1);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setNewCategoryName('');
    setNewCategoryParentId(null);
    setNewCategoryLevel(1);
    setNewCategoryIcon('');
    setNewCategoryColor('#3498db');
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, merchantName: string, sourceCategoryId: number | null = null) => {
    // Prevent drag if clicking on action buttons or expand icon
    if ((e.target as HTMLElement).closest('[data-no-drag]')) {
      e.preventDefault();
      return;
    }
    setDraggedMerchant(merchantName);
    e.dataTransfer.effectAllowed = 'move';
    // Pasar datos como JSON para incluir categoría de origen
    const dragData = JSON.stringify({ merchantName, sourceCategoryId });
    e.dataTransfer.setData('application/json', dragData);
    e.dataTransfer.setData('text/plain', merchantName); // Fallback
    // Añadir estilo visual inmediatamente
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
      e.currentTarget.style.transform = 'scale(0.95)';
    }
  };

  const handleCategoryDragStart = (e: React.DragEvent, category: Category) => {
    if (category.isSystem) {
      e.preventDefault();
      return;
    }
    // Prevent drag if clicking on action buttons or expand icon
    if ((e.target as HTMLElement).closest('[data-no-drag]')) {
      e.preventDefault();
      return;
    }
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
    const dragData = JSON.stringify({ categoryId: category.id, categoryName: category.name });
    e.dataTransfer.setData('application/json', dragData);
    e.dataTransfer.setData('text/plain', category.name);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.6';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedMerchant(null);
    setDraggedCategory(null);
    setDragOverCategoryId(null);
    setDragOverUncategorized(false);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.transform = 'scale(1)';
    }
  };

  const handleDragOver = (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Actualización inmediata del estado
    if (dragOverCategoryId !== categoryId) {
      setDragOverCategoryId(categoryId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Solo limpiar si realmente salimos del elemento
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverCategoryId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, categoryId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCategoryId(null);
    
    // Caso 1: Mover merchant a categoría
    if (draggedMerchant) {
      // Intentar parsear JSON primero, fallback a text/plain
      let merchantName: string;
      let sourceCategoryId: number | null = null;
      
      try {
        const jsonData = e.dataTransfer.getData('application/json');
        if (jsonData) {
          const parsed = JSON.parse(jsonData);
          merchantName = parsed.merchantName;
          sourceCategoryId = parsed.sourceCategoryId;
        } else {
          merchantName = e.dataTransfer.getData('text/plain');
        }
      } catch {
        merchantName = e.dataTransfer.getData('text/plain');
      }
      
      if (!merchantName || !categoryId) return;
      
      // No permitir drop en la misma categoría de origen
      if (sourceCategoryId === categoryId) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/tenpo/merchants/${encodeURIComponent(merchantName)}/category`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryId })
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al asignar comercio');
        }

        // Recargar datos para reflejar el cambio
        await loadData();
        
        // Auto-expandir la categoría donde se soltó
        setExpandedCategories(prev => new Set([...prev, categoryId]));
      } catch (error: any) {
        alert(error.message);
      }
    }
    // Caso 2: Mover categoría a otra categoría (cambiar jerarquía)
    else if (draggedCategory) {
      // No permitir mover categoría a sí misma
      if (draggedCategory.id === categoryId) return;
      
      // No permitir mover categoría a sus propios hijos (crearía ciclo)
      const isDescendant = (cat: Category, potentialParentId: number): boolean => {
        if (cat.id === potentialParentId) return true;
        if (cat.children) {
          return cat.children.some(child => isDescendant(child, potentialParentId));
        }
        return false;
      };
      
      if (isDescendant(draggedCategory, categoryId)) {
        alert('No puedes mover una categoría dentro de sus propias subcategorías');
        return;
      }
      
      // Validar nivel (la nueva categoría padre debe permitir este nivel)
      const targetCategory = flatCategories().find(c => c.id === categoryId);
      if (!targetCategory) return;
      
      const newLevel = targetCategory.level + 1;
      if (newLevel > 3) {
        alert('No se puede mover: se excedería el nivel máximo (3)');
        return;
      }
      
      try {
        const response = await fetch(
          `http://localhost:3000/api/tenpo/categories/${draggedCategory.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: draggedCategory.name,
              parentId: categoryId,
              level: newLevel,
              icon: draggedCategory.icon,
              color: draggedCategory.color
            })
          }
        );
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al mover categoría');
        }
        
        await loadData();
        setExpandedCategories(prev => new Set([...prev, categoryId]));
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleRemoveMerchant = async (merchantName: string) => {
    if (!confirm(`¿Remover "${merchantName}" de su categoría?`)) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/tenpo/merchants/${encodeURIComponent(merchantName)}/category`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al remover comercio');
      }

      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const toggleCategoryExpansion = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDropToUncategorized = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverUncategorized(false);

    // Intentar parsear JSON primero, fallback a text/plain
    let merchantName: string;
    let sourceCategoryId: number | null = null;
    
    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        const parsed = JSON.parse(jsonData);
        merchantName = parsed.merchantName;
        sourceCategoryId = parsed.sourceCategoryId;
      } else {
        merchantName = e.dataTransfer.getData('text/plain');
      }
    } catch {
      merchantName = e.dataTransfer.getData('text/plain');
    }
    
    if (!merchantName) return;
    
    // Si el merchant ya está sin categorizar, no hacer nada
    if (!sourceCategoryId) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/tenpo/merchants/${encodeURIComponent(merchantName)}/category`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al remover comercio de categoría');
      }

      await loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDragOverUncategorized = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragOverUncategorized) {
      setDragOverUncategorized(true);
    }
  };

  const handleDragLeaveUncategorized = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragOverUncategorized(false);
    }
  };

  const flatCategories = () => {
    const flatten = (cats: Category[]): Category[] => {
      return cats.reduce((acc, cat) => {
        acc.push(cat);
        if (cat.children) {
          acc.push(...flatten(cat.children));
        }
        return acc;
      }, [] as Category[]);
    };
    return flatten(categories);
  };

  /**
   * Transforma el catálogo de categorías jerárquico a formato TreeNode compatible con RSuite MultiCascadeTree
   * @param source - Array de categorías con estructura recursiva (children)
   * @returns Array de TreeNode con { label, value, children }
   */
  const toMultiCascadeTreeData = (source: Category[]): Array<{ label: string; value: number; children?: Array<{ label: string; value: number; children?: Array<{ label: string; value: number }> }> }> => {
    return source.map(category => {
      const node: { label: string; value: number; children?: Array<{ label: string; value: number; children?: Array<{ label: string; value: number }> }> } = {
        label: `${category.icon || ''} ${category.name}`.trim(),
        value: category.id
      };

      // Recursivamente agregar children si existen
      if (category.children && category.children.length > 0) {
        node.children = toMultiCascadeTreeData(category.children);
      }

      return node;
    });
  };

  /**
   * TreeRow Component - Renders a single category or merchant row
   */
  interface TreeRowProps {
    category: Category;
    isDragOver: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onToggleExpand: () => void;
    isExpanded: boolean;
  }

  const TreeRow: React.FC<TreeRowProps> = ({
    category,
    isDragOver,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    onToggleExpand,
    isExpanded
  }) => {
    const merchantCount = category._count?.merchants || 0;
    const hasChildren = category.children && category.children.length > 0;
    const isDragging = draggedCategory?.id === category.id;

    const rowClasses = [
      'tenpoTreeRow',
      isDragging && 'dragging',
      isDragOver && !category.isSystem && 'dragOver',
      category.isSystem && 'systemCategory'
    ].filter(Boolean).join(' ');

    return (
      <div
        className={rowClasses}
        draggable={!category.isSystem}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          paddingLeft: `${8 + (category.level - 1) * 14}px`
        }}
      >
        <div className="tenpoTreeLeft">
          {(hasChildren || merchantCount > 0) && (
            <span className="tenpoTreeExpandIcon" onClick={onToggleExpand} data-no-drag>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="tenpoTreeIcon">
            {category.icon || ''}
          </span>
          <span className="tenpoTreeName">{category.name}</span>
        </div>
        
        <div className="tenpoTreeRight">
          {merchantCount > 0 && (
            <Tag size="sm" color="blue" className="tenpoTreeMerchantCount">
              {merchantCount}
            </Tag>
          )}
          
          <div className="tenpoTreeActions" data-no-drag>
            {category.level < 3 && (
              <Button
                size="xs"
                appearance="ghost"
                onClick={() => openAddChildModal(category)}
                data-no-drag
              >
                <PlusIcon />
              </Button>
            )}
            {!category.isSystem && (
              <>
                <IconButton
                  icon={<EditIcon />}
                  size="xs"
                  appearance="subtle"
                  onClick={() => openEditModal(category)}
                  data-no-drag
                />
                <IconButton
                  icon={<TrashIcon />}
                  size="xs"
                  appearance="subtle"
                  color="red"
                  onClick={() => openDeleteModal(category)}
                  data-no-drag
                />
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * MerchantRow Component - Renders a merchant within a category
   */
  interface MerchantRowProps {
    merchantName: string;
    categoryLevel: number;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onRemove: () => void;
  }

  const MerchantRow: React.FC<MerchantRowProps> = ({
    merchantName,
    categoryLevel,
    onDragStart,
    onDragEnd,
    onRemove
  }) => {
    const isDragging = draggedMerchant === merchantName;

    return (
      <div
        className={`tenpoTreeRow tenpoTreeMerchantRow ${isDragging ? 'dragging' : ''}`}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{
          paddingLeft: `${8 + categoryLevel * 14 + 14}px`
        }}
      >
        <div className="tenpoTreeLeft">
          <span className="tenpoTreeIcon">📍</span>
          <span className="tenpoTreeName">{merchantName}</span>
        </div>
        
        <div className="tenpoTreeRight">
          <div className="tenpoTreeActions" data-no-drag>
            <IconButton
              icon={<TrashIcon />}
              size="xs"
              appearance="subtle"
              color="red"
              onClick={onRemove}
              data-no-drag
            />
          </div>
        </div>
      </div>
    );
  };

  /**
   * Recursively renders the category tree
   */
  const renderTreeRecursive = (cats: Category[]): JSX.Element[] => {
    const elements: JSX.Element[] = [];

    for (const category of cats) {
      const isExpanded = expandedCategories.has(category.id);
      const isDragOver = dragOverCategoryId === category.id;
      const canDrop = !category.isSystem;

      // Render category row
      elements.push(
        <TreeRow
          key={`cat-${category.id}`}
          category={category}
          isDragOver={isDragOver}
          onDragStart={(e) => handleCategoryDragStart(e, category)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => canDrop && handleDragOver(e, category.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => canDrop && handleDrop(e, category.id)}
          onToggleExpand={() => toggleCategoryExpansion(category.id)}
          isExpanded={isExpanded}
        />
      );

      // Render expanded merchants
      if (isExpanded) {
        const categoryMerchants = allMerchants.filter(m => m.category?.id === category.id);
        
        for (const merchant of categoryMerchants) {
          elements.push(
            <MerchantRow
              key={`merch-${category.id}-${merchant.name}`}
              merchantName={merchant.name}
              categoryLevel={category.level}
              onDragStart={(e) => handleDragStart(e, merchant.name, category.id)}
              onDragEnd={handleDragEnd}
              onRemove={() => handleRemoveMerchant(merchant.name)}
            />
          );
        }

        // Recursively render children categories
        if (category.children && category.children.length > 0) {
          elements.push(...renderTreeRecursive(category.children));
        }
      }
    }

    return elements;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container">
          <p>Cargando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        
        /* Smooth scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div className="container">
        <PageTitleSection
          title="🏷️ Gestión de Categorías"
          description="Organiza tus comercios de Tenpo en categorías jerárquicas"
          actions={
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button 
                appearance="default"
                onClick={() => navigate(returnPath)}
              >
                ← Volver a {returnLabel}
              </Button>
              <Button 
                appearance="primary" 
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                <PlusIcon /> Nueva Categoría Principal
              </Button>
            </div>
          }
        />

        <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '2rem', marginTop: '2rem' }}>
          {/* Panel izquierdo: Árbol de categorías */}
          <div>
            <h3 style={{ marginBottom: '0.5rem' }}>Árbol de Categorías</h3>
            {draggedMerchant ? (
              <p style={{ 
                fontSize: '0.9rem', 
                color: '#3b82f6', 
                marginBottom: '1rem',
                fontWeight: '600',
                backgroundColor: '#eff6ff',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #bfdbfe'
              }}>
                🎯 Suelta en cualquier categoría → Nivel 1, 2 o 3
              </p>
            ) : (
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#666', 
                marginBottom: '1rem',
                fontStyle: 'italic'
              }}>
                💡 Arrastra comercios a cualquier categoría (nivel 1, 2 o 3). Haz click para ver comercios asignados.
              </p>
            )}
            {categories.length === 0 ? (
              <Panel bordered>
                <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                  No hay categorías creadas. Crea una categoría principal para comenzar.
                </p>
              </Panel>
            ) : (
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                backgroundColor: 'white',
                minHeight: '400px',
                overflow: 'auto'
              }}>
                {renderTreeRecursive(categories)}
              </div>
            )}
          </div>

          {/* Panel derecho: Comercios sin categoría */}
          <div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              Comercios sin Categorizar ({uncategorizedMerchants.length})
            </h3>
            <Panel 
              bordered 
              style={{ 
                maxHeight: '600px', 
                overflow: 'auto',
                backgroundColor: dragOverUncategorized ? '#fef3c7' : 'white',
                border: dragOverUncategorized ? '2px dashed #f59e0b' : '1px solid #e5e7eb',
                transition: 'all 0.15s ease-out',
                boxShadow: dragOverUncategorized ? '0 4px 6px -1px rgba(245, 158, 11, 0.2)' : 'none'
              }}
              onDragOver={handleDragOverUncategorized}
              onDragLeave={handleDragLeaveUncategorized}
              onDrop={handleDropToUncategorized}
            >
              {uncategorizedMerchants.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '1rem', fontSize: '0.75rem' }}>
                  ✅ Todos los comercios están categorizados
                </p>
              ) : (
                <div>
                  <p style={{ 
                    padding: '0.375rem 0.5rem', 
                    fontSize: '0.7rem', 
                    color: dragOverUncategorized ? '#f59e0b' : '#666',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: dragOverUncategorized ? '#fef3c7' : '#f9fafb',
                    margin: 0,
                    fontWeight: dragOverUncategorized ? '700' : '400',
                    transition: 'all 0.15s ease-out',
                    lineHeight: '1.3'
                  }}>
                    {dragOverUncategorized ? (
                      <span>↓ Soltar aquí para remover</span>
                    ) : (
                      <span>💡 Arrastra hacia categorías o aquí para remover</span>
                    )}
                  </p>
                  {uncategorizedMerchants.map(merchant => (
                    <div 
                      key={merchant}
                      draggable
                      onDragStart={(e) => handleDragStart(e, merchant)}
                      onDragEnd={handleDragEnd}
                      style={{
                        padding: '0.375rem 0.5rem',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: draggedMerchant === merchant ? 'grabbing' : 'grab',
                        transition: 'all 0.15s ease-out',
                        backgroundColor: draggedMerchant === merchant ? '#dbeafe' : 'white',
                        transform: draggedMerchant === merchant ? 'scale(0.95)' : 'scale(1)',
                        boxShadow: draggedMerchant === merchant ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                        fontSize: '0.75rem'
                      }}
                      onMouseEnter={(e) => {
                        if (draggedMerchant !== merchant) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (draggedMerchant !== merchant) {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          color: draggedMerchant === merchant ? '#3b82f6' : '#999',
                          transition: 'color 0.15s ease'
                        }}>
                          ⋮⋮
                        </span>
                        <span style={{ 
                          fontWeight: draggedMerchant === merchant ? '600' : '400',
                          color: draggedMerchant === merchant ? '#1e40af' : 'inherit'
                        }}>
                          {merchant}
                        </span>
                      </div>
                      <Button
                        size="xs"
                        appearance="primary"
                        onClick={() => {
                          setSelectedMerchant(merchant);
                          setShowAssignModal(true);
                        }}
                      >
                        Asignar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
            
            <Button 
              block 
              appearance="ghost" 
              style={{ marginTop: '1rem' }}
              onClick={() => {
                setSelectedMerchant('');
                setShowAssignModal(true);
              }}
            >
              Buscar y asignar comercio...
            </Button>
          </div>
        </div>

        {/* Modal: Crear Categoría */}
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
          <Modal.Header>
            <Modal.Title>Nueva Categoría {newCategoryParentId ? '(Subcategoría)' : ''}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ marginBottom: '1rem' }}>
              <label>Nombre *</label>
              <Input 
                value={newCategoryName}
                onChange={setNewCategoryName}
                placeholder="Ej: Alimentos, Transportes, etc."
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Icono (emoji)</label>
              <Input 
                value={newCategoryIcon}
                onChange={setNewCategoryIcon}
                placeholder="Ej: 🍔, 🚗, 🏠"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Color</label>
              <input 
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                style={{ width: '100%', height: '40px', cursor: 'pointer' }}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleCreateCategory} appearance="primary">
              Crear
            </Button>
            <Button onClick={() => setShowAddModal(false)} appearance="subtle">
              Cancelar
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal: Editar Categoría */}
        <Modal open={showEditModal} onClose={() => setShowEditModal(false)}>
          <Modal.Header>
            <Modal.Title>Editar Categoría</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ marginBottom: '1rem' }}>
              <label>Nombre *</label>
              <Input 
                value={newCategoryName}
                onChange={setNewCategoryName}
                disabled={editingCategory?.isSystem}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Icono (emoji)</label>
              <Input 
                value={newCategoryIcon}
                onChange={setNewCategoryIcon}
                placeholder="Ej: 🍔, 🚗, 🏠"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Color</label>
              <input 
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                style={{ width: '100%', height: '40px', cursor: 'pointer' }}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleUpdateCategory} appearance="primary">
              Guardar
            </Button>
            <Button onClick={() => setShowEditModal(false)} appearance="subtle">
              Cancelar
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal: Eliminar Categoría */}
        <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <Modal.Header>
            <Modal.Title>Eliminar Categoría</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>¿Estás seguro de eliminar la categoría <strong>{deletingCategory?.name}</strong>?</p>
            {deletingCategory && deletingCategory._count && deletingCategory._count.children > 0 && (
              <p style={{ color: '#ff6b6b', marginTop: '1rem' }}>
                ⚠️ Esta categoría tiene {deletingCategory._count.children} subcategoría(s). 
                Se moverán al nivel superior.
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleDeleteCategory} appearance="primary" color="red">
              Eliminar
            </Button>
            <Button onClick={() => setShowDeleteModal(false)} appearance="subtle">
              Cancelar
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal: Asignar Comercio */}
        <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)}>
          <Modal.Header>
            <Modal.Title>Asignar Comercio a Categoría</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ marginBottom: '1rem' }}>
              <label>Comercio</label>
              <SelectPicker
                data={allMerchants.map(m => ({ label: m.name, value: m.name }))}
                value={selectedMerchant}
                onChange={(value) => setSelectedMerchant(value || '')}
                block
                searchable
                placeholder="Buscar comercio..."
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label>Categoría</label>
              <SelectPicker
                data={flatCategories()
                  .filter(c => !c.isSystem)
                  .map(c => ({ 
                    label: `${'  '.repeat(c.level - 1)}${c.icon || ''} ${c.name}`,
                    value: c.id 
                  }))}
                value={selectedCategoryId}
                onChange={(value) => setSelectedCategoryId(value || null)}
                block
                placeholder="Seleccionar categoría..."
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleAssignMerchant} appearance="primary">
              Asignar
            </Button>
            <Button onClick={() => setShowAssignModal(false)} appearance="subtle">
              Cancelar
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </MainLayout>
  );
}
