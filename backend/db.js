const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '../db');

// Data file path
const getFilePath = (collection) => path.join(dbDir, `${collection}.json`);

// Read data from file
const read = (collection) => {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${collection}:`, error);
    return [];
  }
};

// Write data to file
const write = (collection, data) => {
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Add data
const add = (collection, item) => {
  const data = read(collection);
  item.id = item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9);
  item.createdAt = item.createdAt || new Date().toISOString();
  data.push(item);
  write(collection, data);
  return item;
};

// Find data by ID
const findById = (collection, id) => {
  const data = read(collection);
  return data.find(item => item.id === id || item.id === parseInt(id));
};

// Find data by condition
const find = (collection, condition) => {
  const data = read(collection);
  if (!condition) return data;
  return data.filter(item => {
    for (let key in condition) {
      if (item[key] !== condition[key]) return false;
    }
    return true;
  });
};

// Find first item matching condition
const findOne = (collection, condition) => {
  return find(collection, condition)[0] || null;
};

// Update data by ID
const updateById = (collection, id, updates) => {
  const data = read(collection);
  const index = data.findIndex(item => item.id === id || item.id === parseInt(id));
  if (index === -1) return null;
  data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
  write(collection, data);
  return data[index];
};

// Update data by condition
const updateOne = (collection, condition, updates) => {
  const data = read(collection);
  const index = data.findIndex(item => {
    for (let key in condition) {
      if (item[key] !== condition[key]) return false;
    }
    return true;
  });
  if (index === -1) return null;
  data[index] = { ...data[index], ...updates, updatedAt: new Date().toISOString() };
  write(collection, data);
  return data[index];
};

// Delete data by ID
const deleteById = (collection, id) => {
  const data = read(collection);
  const index = data.findIndex(item => item.id === id || item.id === parseInt(id));
  if (index === -1) return null;
  const deleted = data.splice(index, 1);
  write(collection, data);
  return deleted[0];
};

// Get all data
const getAll = (collection) => {
  return read(collection);
};

module.exports = {
  read,
  write,
  add,
  findById,
  find,
  findOne,
  updateById,
  updateOne,
  deleteById,
  getAll,
};
