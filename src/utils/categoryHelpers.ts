import categoriesData from '../data/categories.json';

interface CategoryNode {
  name: string;
  slug: string;
  children?: CategoryNode[];
}

// Flatten the categories for easier search
const flattenCategories = (nodes: CategoryNode[]): CategoryNode[] => {
  let flat: CategoryNode[] = [];
  for (const node of nodes) {
    flat.push({ name: node.name, slug: node.slug });
    if (node.children) {
      flat = flat.concat(flattenCategories(node.children));
    }
  }
  return flat;
};

const flatCategories = flattenCategories(categoriesData);

export const getCategorySlug = (nameOrId: string | number): string => {
  if (!nameOrId) return 'home';
  
  // If it's a string (name), try to find by name
  if (typeof nameOrId === 'string') {
    const found = flatCategories.find(c => c.name === nameOrId || c.slug === nameOrId);
    if (found) return found.slug;
  }
  
  // If we had IDs in categories.json we could search by ID, but we don't.
  // Assuming the API returns names that match categories.json names.
  
  return 'home';
};

export const getCategorySlugByName = (name: string): string => {
    const found = flatCategories.find(c => c.name === name);
    return found ? found.slug : 'home';
}
