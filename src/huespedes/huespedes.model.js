import { db } from "../config/firebase.config.js";

const collection = db.collection("HUESPEDES");

export const create = async (data) => {
  const docRef = await collection.add({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await docRef.get();
  return { id: docRef.id, ...created.data() };
};

export const getAll = async () => {
  const snapshot = await collection.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getById = async (id) => {
  const doc = await collection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

export const update = async (id, data) => {
  const ref = collection.doc(id);
  await ref.update({
    ...data,
    updatedAt: new Date(),
  });

  const updated = await ref.get();
  return { id, ...updated.data() };
};

export const remove = async (id) => {
  await collection.doc(id).delete();
};
