import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { X, Plus } from 'lucide-react';

interface TagInputProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
  selectedTags,
  onChange,
  className = ''
}) => {
  const { user, addTag } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const newTag = {
        name: newTagName.trim(),
        color: newTagColor
      };
      
      addTag(newTag);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setIsAdding(false);
    }
  };

  const handleTagSelect = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tags
      </label>
      
      <div className="flex flex-wrap gap-2">
        {user.tags.map(tag => (
          <button
            key={tag.id}
            onClick={() => handleTagSelect(tag.id)}
            className={`
              inline-flex items-center px-2 py-1 rounded-full text-sm
              ${selectedTags.includes(tag.id)
                ? 'bg-opacity-100 text-white'
                : 'bg-opacity-10 hover:bg-opacity-20'
              }
            `}
            style={{ backgroundColor: selectedTags.includes(tag.id) ? tag.color : undefined }}
          >
            <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: tag.color }} />
            {tag.name}
            {selectedTags.includes(tag.id) && (
              <X size={14} className="ml-1.5" />
            )}
          </button>
        ))}
        
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center px-2 py-1 rounded-full text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <Plus size={14} className="mr-1" />
          Add Tag
        </button>
      </div>

      {isAdding && (
        <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tag Name
              </label>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter tag name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tag Color
              </label>
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-full h-10 p-1 rounded-md cursor-pointer"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagInput;