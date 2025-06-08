import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'react-feather';
import { useApp } from '../../contexts/AppContext';
import { CategoryDefinition, TransactionType } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { generateId } from '../../utils/helpers';

interface EditingCategory extends Omit<CategoryDefinition, 'id'> {
  id?: string;
}

const CategoryManager: React.FC = () => {
  const { user, updateUser } = useApp();
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubcategoryForm, setIsSubcategoryForm] = useState(false);

  const handleAddCategory = () => {
    setEditingCategory({
      name: '',
      type: 'expense',
      color: '#CBD5E1',
    });
    setIsSubcategoryForm(false);
    setShowForm(true);
  };

  const handleAddSubcategory = () => {
    setEditingCategory({
      name: '',
      type: 'expense',
      color: '#CBD5E1',
    });
    setIsSubcategoryForm(true);
    setShowForm(true);
  };

  const handleSaveCategory = () => {
    if (!editingCategory || !editingCategory.name) return;

    const newCategories = [...user.categories];
    
    if (editingCategory.id) {
      const index = newCategories.findIndex(c => c.id === editingCategory.id);
      if (index !== -1) {
        newCategories[index] = { ...editingCategory as CategoryDefinition };
      }
    } else {
      const newCategory = {
        ...editingCategory,
        id: generateId(),
      };

      if (isSubcategoryForm && editingCategory.parentId) {
        const parentCategory = user.categories.find(c => c.id === editingCategory.parentId);
        if (parentCategory) {
          newCategory.type = parentCategory.type;
        }
      }

      newCategories.push(newCategory);
    }

    updateUser({
      ...user,
      categories: newCategories,
    });

    setEditingCategory(null);
    setShowForm(false);
  };

  const handleDeleteCategory = (id: string) => {
    const hasSubCategories = user.categories.some(c => c.parentId === id);
    if (hasSubCategories) {
      alert('Please delete or reassign subcategories first');
      return;
    }

    const isUsedInTransactions = user.transactions.some(t => t.category === id);
    if (isUsedInTransactions) {
      alert('This category is used in transactions. Please reassign those transactions first');
      return;
    }

    const newCategories = user.categories.filter(c => c.id !== id);
    updateUser({
      ...user,
      categories: newCategories,
    });
  };

  const getAvailableParentCategories = () => {
    if (!editingCategory) return user.categories.filter(c => !c.parentId);
    
    // When editing an existing category, exclude itself and its subcategories
    return user.categories.filter(c => {
      // Exclude categories that already have a parent
      if (c.parentId) return false;
      
      // Exclude the category being edited
      if (c.id === editingCategory.id) return false;
      
      // Exclude categories that are subcategories of the editing category
      if (editingCategory.id && user.categories.some(sub => sub.parentId === editingCategory.id)) return false;
      
      return true;
    });
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Categories</h3>
          <div className="flex gap-2">
            <Button 
              onClick={handleAddCategory} 
              variant="primary" 
              size="sm" 
              icon={<Plus size={16} />}
            >
              Add Category
            </Button>
            <Button 
              onClick={handleAddSubcategory} 
              variant="outline" 
              size="sm" 
              icon={<Plus size={16} />}
            >
              Add Subcategory
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {editingCategory?.id ? 'Edit Category' : isSubcategoryForm ? 'New Subcategory' : 'New Category'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Name"
                value={editingCategory?.name || ''}
                onChange={(value) => setEditingCategory(prev => prev ? { ...prev, name: value } : null)}
                required
              />

              {!isSubcategoryForm && (
                <Select
                  label="Type"
                  value={editingCategory?.type || 'expense'}
                  onChange={(value) => setEditingCategory(prev => prev ? { ...prev, type: value as TransactionType } : null)}
                  options={[
                    { value: 'income', label: 'Income' },
                    { value: 'expense', label: 'Expense' },
                    { value: 'investment', label: 'Investment' },
                  ]}
                />
              )}

              <Input
                label="Color"
                type="color"
                value={editingCategory?.color || '#CBD5E1'}
                onChange={(value) => setEditingCategory(prev => prev ? { ...prev, color: value } : null)}
              />

              {isSubcategoryForm && (
                <Select
                  label="Parent Category"
                  value={editingCategory?.parentId || ''}
                  onChange={(value) => setEditingCategory(prev => prev ? { ...prev, parentId: value } : null)}
                  options={getAvailableParentCategories().map(c => ({
                    value: c.id,
                    label: c.name
                  }))}
                  required
                />
              )}

              <Input
                label="Description (Optional)"
                value={editingCategory?.description || ''}
                onChange={(value) => setEditingCategory(prev => prev ? { ...prev, description: value } : null)}
              />

              <Input
                label="Budget"
                type="number"
                value={editingCategory?.budget?.toString() || ''}
                onChange={(value) => setEditingCategory(prev => prev ? { ...prev, budget: value ? parseFloat(value) : undefined } : null)}
                min={0}
                step={0.01}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCategory(null);
                  setShowForm(false);
                }}
                icon={<X size={16} />}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCategory}
                icon={<Check size={16} />}
                disabled={isSubcategoryForm && !editingCategory?.parentId}
              >
                {editingCategory?.id ? 'Save Changes' : 'Add Category'}
              </Button>
            </div>
          </div>
        )}

        {/* Category List */}
        <ul className="space-y-2">
          {user.categories.filter(c => !c.parentId).map((category) => (
            <li key={category.id} className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                    )}
                    {category.budget && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Budget: ${category.budget.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(category);
                      setIsSubcategoryForm(false);
                      setShowForm(true);
                    }}
                    icon={<Edit2 size={16} />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    icon={<Trash2 size={16} />}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Subcategories */}
              {user.categories.filter(c => c.parentId === category.id).map((subcategory) => (
                <div
                  key={subcategory.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm ml-6 border-l-2"
                  style={{ borderLeftColor: category.color }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: subcategory.color }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{subcategory.name}</p>
                      {subcategory.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{subcategory.description}</p>
                      )}
                      {subcategory.budget && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Budget: ${subcategory.budget.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">                      <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(subcategory);
                        setIsSubcategoryForm(true);
                        setShowForm(true);
                      }}
                      icon={<Edit2 size={16} />}
                    >
                      Edit
                    </Button>                      <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(subcategory.id)}
                      icon={<Trash2 size={16} />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default CategoryManager;