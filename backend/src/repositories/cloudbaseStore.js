const cloudbase = require('@cloudbase/node-sdk');

let database;

function getDatabase() {
  if (!database) {
    const envId = process.env.ENV_ID || process.env.TCB_ENV;
    const app = envId ? cloudbase.init({ env: envId }) : cloudbase.init();
    database = app.database();
  }
  return database;
}

function collection(name) {
  return getDatabase().collection(name);
}

async function list(name) {
  const result = await collection(name).limit(1000).get();
  return result.data || [];
}

async function add(name, data) {
  return collection(name).add(data);
}

async function update(name, documentId, data) {
  return collection(name).doc(documentId).update(data);
}

async function remove(name, documentId) {
  return collection(name).doc(documentId).remove();
}

module.exports = { list, add, update, remove };
